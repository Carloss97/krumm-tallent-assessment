
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import { collectDefaultMetrics, Histogram, Gauge, Counter, register } from 'prom-client';
import { v4 as uuidv4 } from 'uuid';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveSession, getSession, getAllSessions, upsertParticipant, getParticipantById, checkDb } from './db.js';
import { validateSession } from './validators.js';
import {
  generateParticipantToken,
  generateRecruiterToken,
  authenticateToken,
  requireParticipant,
  requireRecruiter
} from './tokenService.js';
import { rateLimiter, requestLogger } from './middleware.js';
import { httpLogger, logger } from './logger.js';
import { serverConfig } from './config.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const calibrationDir = path.join(__dirname, '..', 'data', 'calibration');
const DEFAULT_GEMINI_MODEL = process.env.GEMINI_MODEL || process.env.VITE_GEMINI_MODEL || 'gemini-2.5-flash';
const GEMINI_FALLBACK_MODELS = [
  'gemini-2.5-flash',
  'gemini-2.5-pro',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite'
];

// Middleware / security
app.set('trust proxy', true);
app.use(helmet());
app.use(compression());

// Configure CORS with optional whitelist from env var `CORS_ORIGINS` or `ALLOWED_ORIGINS`
// Accept either name for backward compatibility. Values are comma-separated origins.
const corsOriginsEnv = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || '';
const allowedCorsOrigins = corsOriginsEnv.split(',').map(s => s.trim()).filter(Boolean);
if (allowedCorsOrigins.length > 0) {
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedCorsOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('CORS not allowed'), false);
    }
  }));
} else {
  app.use(cors());
}

app.use(express.json());

// Prevent intermediaries (including Cloudflare) from caching API responses
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, private, must-revalidate');
  next();
});

// Assign or propagate a request id for tracing
app.use((req, res, next) => {
  try {
    const incoming = req.get('X-Request-ID') || req.get('x-request-id');
    const rid = incoming || uuidv4();
    req.requestId = rid;
    res.setHeader('X-Request-ID', rid);
  } catch {
    // ignore
  }
  return next();
});

// Attach pino-http middleware so requests are logged in structured JSON
app.use(httpLogger);

app.use((error, req, res, next) => {
  if (error?.type === 'entity.parse.failed' || error instanceof SyntaxError) {
    return res.status(400).json({
      error: 'Invalid JSON payload',
      details: 'Request body must be valid JSON',
    });
  }
  return next(error);
});

app.use(requestLogger);

// Prometheus metrics: collect defaults and track HTTP request durations
collectDefaultMetrics({ timeout: 5000 });

const httpRequestDurationSeconds = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.3, 0.5, 1, 2.5, 5]
});

// AI circuit metrics
const aiCircuitOpenGauge = new Gauge({
  name: 'ai_circuit_open',
  help: '1 if AI circuit is open (blocking requests), 0 otherwise',
});

const aiCircuitFailuresGauge = new Gauge({
  name: 'ai_circuit_failures',
  help: 'Number of recent AI failures counted by the circuit',
});

const aiCircuitRetryAfterSecondsGauge = new Gauge({
  name: 'ai_circuit_retry_after_seconds',
  help: 'Seconds remaining until the AI circuit may close (0 when closed)',
});

const aiCircuitTriggersTotal = new Counter({
  name: 'ai_circuit_triggers_total',
  help: 'Total times the AI circuit has opened',
});

// Session metrics
const sessionValidationErrorsTotal = new Counter({
  name: 'session_validation_errors_total',
  help: 'Total invalid session payloads received',
});

const sessionsSavedTotal = new Counter({
  name: 'sessions_saved_total',
  help: 'Total sessions successfully saved',
});

app.use((req, res, next) => {
  const start = process.hrtime();
  res.on('finish', () => {
    try {
      const diff = process.hrtime(start);
      const durationInSeconds = diff[0] + diff[1] / 1e9;
      const route = (req.route && req.route.path) ? req.route.path : req.path;
      httpRequestDurationSeconds.labels(req.method, route, String(res.statusCode)).observe(durationInSeconds);
    } catch {
      // don't let metrics failures break the request
    }
  });
  next();
});

// Expose Prometheus metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    res.setHeader('Content-Type', register.contentType);
    const metrics = await register.metrics();
    return res.send(metrics);
  } catch (err) {
    logger.error({ err: String(err) }, 'metrics_endpoint_error');
    return res.status(500).send('metrics_error');
  }
});
const globalLimiter = rateLimiter(serverConfig.rateLimit.global);
const bypassedRateLimitPaths = new Set(serverConfig.rateLimit.bypassPaths);
app.use((req, res, next) => {
  // Keep health-style probes always available so monitoring remains reliable under traffic spikes.
  if (bypassedRateLimitPaths.has(req.path)) {
    return next();
  }
  return globalLimiter(req, res, next);
});

// Serve static build (if present) with sensible cache headers for hashed assets.
const buildDir = path.join(__dirname, '..', 'dist');
if (fs.existsSync(buildDir)) {
  app.use(express.static(buildDir, {
    index: false,
    setHeaders: (res, filePath) => {
      const lower = String(filePath || '').toLowerCase();
      const hashedAsset = /\.[0-9a-f]{8,}\.[^.]+$/i.test(filePath);

      if (lower.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return;
      }

      if (hashedAsset || lower.includes(`${path.sep}assets${path.sep}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return;
      }

      // default: 1 day for other static assets
      res.setHeader('Cache-Control', 'public, max-age=86400');
    }
  }));

  app.get(/.*/, (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    const indexPath = path.join(buildDir, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      return res.sendFile(indexPath);
    }
    return next();
  });
}

// ===== UTILITIES =====
const isEmail = (value) => {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
};

const validateParticipantCredentials = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Invalid auth payload';
  }

  const participantId = payload.participantId?.trim();
  const email = payload.email?.trim();
  const accessCode = payload.accessCode?.trim();

  if (!participantId || participantId.length < 3) {
    return 'participantId is required and must contain at least 3 characters';
  }

  if (!email || !isEmail(email)) {
    return 'A valid email is required';
  }

  if (!accessCode || accessCode.length < 4) {
    return 'accessCode is required and must contain at least 4 characters';
  }

  return null;
};

const validateRecruiterCredentials = (payload) => {
  if (!payload || typeof payload !== 'object') {
    return 'Invalid recruiter auth payload';
  }

  const email = payload.email?.trim();
  const password = payload.password?.trim();

  if (!email || !isEmail(email)) {
    return 'A valid recruiter email is required';
  }

  if (!password || password.length < 6) {
    return 'A valid recruiter password is required';
  }

  return null;
};

const readJsonSafe = (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      return null;
    }
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
};

const readQualityAlertSummary = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const lines = raw.split('\n');
  const summaryLine = lines.find((line) => line.startsWith('- Global status:'));
  const sourceLine = lines.find((line) => line.startsWith('Outcome source:'));
  const syntheticLine = lines.find((line) => line.startsWith('Synthetic outcomes:'));

  return {
    status: summaryLine ? summaryLine.replace('- Global status:', '').trim() : 'UNKNOWN',
    outcomeSource: sourceLine ? sourceLine.replace('Outcome source:', '').trim() : 'unknown',
    syntheticOutcomes: syntheticLine ? syntheticLine.toLowerCase().includes('yes') : null,
  };
};

const getGeminiApiKey = () => {
  const key = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY || '';
  return String(key).trim();
};

const getModelCandidates = (preferredModel) => {
  return Array.from(new Set([preferredModel || DEFAULT_GEMINI_MODEL, ...GEMINI_FALLBACK_MODELS]));
};

const inferStatusFromMessage = (text) => {
  const msg = String(text || '').toLowerCase();
  if (msg.includes('429') || msg.includes('quota') || msg.includes('too many requests')) return 429;
  if (msg.includes('404') || msg.includes('not found') || msg.includes('not supported')) return 404;
  if (msg.includes('403') || msg.includes('permission_denied') || msg.includes('permission')) return 403;
  if (msg.includes('400') || msg.includes('api_key_invalid') || msg.includes('expired')) return 400;
  return 0;
};

const mapGeminiFailure = (responseText, statusCode) => {
  const raw = String(responseText || '').toLowerCase();
  if (raw.includes('reported as leaked') || raw.includes('leaked')) {
    return { code: 'KEY_LEAKED', message: 'Gemini API key was reported as leaked. Rotate to a new key.' };
  }
  if (raw.includes('expired') || raw.includes('api_key_invalid')) {
    return { code: 'KEY_INVALID', message: 'Gemini API key is invalid or expired.' };
  }
  if (statusCode === 403 || raw.includes('permission_denied') || raw.includes('permission')) {
    return { code: 'PERMISSION_DENIED', message: 'Gemini key lacks required permissions for this project.' };
  }
  if (statusCode === 404 || raw.includes('not found') || raw.includes('not supported')) {
    return { code: 'MODEL_NOT_FOUND', message: 'Selected Gemini model is not available for this endpoint/version.' };
  }
  if (statusCode === 429 || raw.includes('quota') || raw.includes('rate limit')) {
    return { code: 'QUOTA_EXCEEDED', message: 'Gemini quota/rate limit reached for this project.' };
  }
  if (statusCode === 400) {
    return { code: 'BAD_REQUEST', message: 'Gemini request was rejected (bad request/configuration).' };
  }
  return { code: 'UNKNOWN', message: 'Unknown Gemini API error.' };
};

const getHttpStatusFromGeminiCode = (code) => {
  if (code === 'MISSING_KEY') return 503;
  if (code === 'KEY_INVALID' || code === 'BAD_REQUEST') return 400;
  if (code === 'KEY_LEAKED' || code === 'PERMISSION_DENIED') return 403;
  if (code === 'MODEL_NOT_FOUND') return 404;
  if (code === 'QUOTA_EXCEEDED') return 429;
  return 502;
};

const runGeminiGeneration = async ({ prompt, preferredModel, generationConfig = {} }) => {
  const key = getGeminiApiKey();
  if (!key) {
    return {
      ok: false,
      code: 'MISSING_KEY',
      message: 'Missing GOOGLE_API_KEY/GEMINI_API_KEY on server. Configure one of these in .env and restart the backend.',
      model: preferredModel || DEFAULT_GEMINI_MODEL,
      attempts: [],
    };
  }

  const client = new GoogleGenerativeAI(key);
  const modelCandidates = getModelCandidates(preferredModel || DEFAULT_GEMINI_MODEL);
  const attempts = [];

  for (const modelName of modelCandidates) {
    try {
      const model = client.getGenerativeModel({
        model: modelName,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
          ...generationConfig,
        },
      });

      const result = await model.generateContent(prompt);
      const responseText = result?.response?.text?.() || '';
      attempts.push({ stage: 'generate:content', model: modelName, status: 200, code: 'OK', message: 'Generation succeeded.' });
      return {
        ok: true,
        code: 'OK',
        message: 'Generation succeeded.',
        model: modelName,
        text: responseText,
        attempts,
      };
    } catch (error) {
      const raw = error?.message || String(error);
      const status = inferStatusFromMessage(raw);
      const mapped = mapGeminiFailure(raw, status);
      attempts.push({ stage: 'generate:content', model: modelName, status: status || null, code: mapped.code, message: mapped.message });

      const isGlobalFailure = mapped.code === 'KEY_INVALID' || mapped.code === 'KEY_LEAKED' || mapped.code === 'PERMISSION_DENIED' || mapped.code === 'QUOTA_EXCEEDED';
      if (isGlobalFailure) {
        return {
          ok: false,
          code: mapped.code,
          message: mapped.message,
          model: modelName,
          attempts,
        };
      }
    }
  }

  const lastAttempt = attempts[attempts.length - 1] || { code: 'UNKNOWN', message: 'Unknown Gemini API error.', model: preferredModel || DEFAULT_GEMINI_MODEL };
  return {
    ok: false,
    code: lastAttempt.code,
    message: lastAttempt.message,
    model: lastAttempt.model,
    attempts,
  };
};

// ===== HEALTH CHECK (No Auth Required) =====
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Readiness probe: checks DB, Gemini key presence and disk writability
app.get('/ready', async (req, res) => {
  const checks = {};
  try {
    checks.db = checkDb() ? 'ok' : 'fail';
  } catch {
    checks.db = 'fail';
  }

  try {
    checks.gemini_key = getGeminiApiKey() ? 'ok' : 'missing';
  } catch {
    checks.gemini_key = 'fail';
  }

  try {
    const testDir = path.join(__dirname, '..', '.runtime', 'health');
    fs.mkdirSync(testDir, { recursive: true });
    const tmp = path.join(testDir, `probe-${Date.now()}.tmp`);
    fs.writeFileSync(tmp, 'ok');
    fs.unlinkSync(tmp);
    checks.disk = 'ok';
  } catch {
    checks.disk = 'fail';
  }

  const healthy = Object.values(checks).every(v => v === 'ok');
  return res.status(healthy ? 200 : 503).json({ ok: healthy, checks });
});

// Prometheus metrics endpoint (no auth)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    return res.send(metrics);
  } catch {
    return res.status(500).send('failed_to_collect_metrics');
  }
});

// Runtime feature flags endpoint (no auth) - return simple rollout controls
app.get('/api/feature-flags', (req, res) => {
  const enableHeroDemo = String(process.env.ENABLE_HERO_DEMO || process.env.VITE_ENABLE_HERO_DEMO || 'false').toLowerCase() === 'true';
  const heroDemoPercentage = Number(process.env.HERO_DEMO_PERCENTAGE || process.env.VITE_HERO_DEMO_PERCENTAGE || process.env.HERO_DEMO_PERCENT || 0) || 0;

  return res.json({
    ok: true,
    enableHeroDemo,
    heroDemoPercentage
  });
});

// Lightweight telemetry collector for demo monitoring (no auth)
app.post('/api/telemetry', (req, res) => {
  try {
    const payload = req.body || {};
    const logDir = path.join(__dirname, '..', '.runtime', 'share');
    fs.mkdirSync(logDir, { recursive: true });
    const logPath = path.join(logDir, 'telemetry.log');
    const entry = JSON.stringify({ receivedAt: new Date().toISOString(), payload }) + '\n';
    fs.appendFileSync(logPath, entry, 'utf8');
    logger.info({ event: payload.event || payload }, 'telemetry_event_received');
    return res.json({ ok: true, saved: true });
  } catch (err) {
    logger.error({ err: err?.message || err }, 'failed_to_save_telemetry');
    return res.status(500).json({ ok: false, error: 'failed_to_save' });
  }
});

// Tighten AI endpoint rate to reduce bursty retries hitting Gemini quotas.
// Simple in-memory circuit breaker for AI backend to avoid repeated failing calls
const aiCircuit = {
  failures: 0,
  firstFailureAt: 0,
  openUntil: 0,
  failureWindowMs: Number(process.env.AI_CIRCUIT_WINDOW_MS) || 60_000,
  failureThreshold: Number(process.env.AI_CIRCUIT_THRESHOLD) || 5,
  openMs: Number(process.env.AI_CIRCUIT_OPEN_MS) || 5 * 60_000,
  isOpen() { return Date.now() < this.openUntil; },
  timeLeftSec() { return Math.max(0, Math.ceil((this.openUntil - Date.now()) / 1000)); },
  recordFailure(code) {
    this.lastFailureCode = code;
    const now = Date.now();
    if (!this.firstFailureAt || now - this.firstFailureAt > this.failureWindowMs) {
      this.firstFailureAt = now;
      this.failures = 1;
    } else {
      this.failures += 1;
    }
    this.lastFailureAt = now;

    const wasOpen = this.isOpen();
    if (this.failures >= this.failureThreshold) {
      this.openUntil = now + this.openMs;
    }

    // Update Prometheus metrics
    try {
      aiCircuitFailuresGauge.set(this.failures);
      const isOpenNow = this.isOpen();
      aiCircuitOpenGauge.set(isOpenNow ? 1 : 0);
      aiCircuitRetryAfterSecondsGauge.set(isOpenNow ? this.timeLeftSec() : 0);
      if (!wasOpen && this.isOpen()) {
        aiCircuitTriggersTotal.inc();
      }
    } catch {
      // ignore metric failures
    }
  },
  recordSuccess() {
    this.failures = 0;
    this.firstFailureAt = 0;
    this.openUntil = 0;
    try {
      aiCircuitFailuresGauge.set(0);
      aiCircuitOpenGauge.set(0);
      aiCircuitRetryAfterSecondsGauge.set(0);
    } catch {
      // ignore
    }
  }
};

const aiCircuitMiddleware = (req, res, next) => {
  if (aiCircuit.isOpen()) {
    const retryAfter = aiCircuit.timeLeftSec();
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(503).json({
      ok: false,
      code: 'AI_CIRCUIT_OPEN',
      message: 'AI backend temporarily disabled due to repeated failures',
      retryAfterSeconds: retryAfter
    });
  }
  return next();
};

app.use('/api/ai', aiCircuitMiddleware, rateLimiter(serverConfig.rateLimit.ai));

// Helper: attempt generation with simple exponential backoff retries for transient failures
async function attemptGeminiWithRetries({ prompt, preferredModel, generationConfig = {} }, maxRetries = 2, baseDelayMs = 200) {
  const nonRetryable = new Set(['KEY_LEAKED', 'KEY_INVALID', 'PERMISSION_DENIED', 'MODEL_NOT_FOUND', 'BAD_REQUEST']);
  let attempt = 0;
  while (true) {
    attempt += 1;
    try {
      const result = await runGeminiGeneration({ prompt, preferredModel, generationConfig });
      if (result.ok) return result;
      if (nonRetryable.has(result.code) || attempt > maxRetries) return result;
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    } catch (err) {
      if (attempt > maxRetries) {
        return { ok: false, code: 'SERVER_ERROR', message: String(err), attempts: [] };
      }
      const delay = baseDelayMs * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delay));
      continue;
    }
  }
}

app.get('/api/ai/health', async (req, res) => {
  try {
    const preferredModel = typeof req.query.model === 'string' ? req.query.model : undefined;
    const result = await attemptGeminiWithRetries({
      prompt: 'Respond with valid JSON only: {"ok":true}',
      preferredModel,
      generationConfig: { temperature: 0 },
    });

    if (result.ok) {
      aiCircuit.recordSuccess();
    } else {
      aiCircuit.recordFailure(result.code || 'unknown');
    }

    if (aiCircuit.isOpen()) {
      return res.status(503).json({ ok: false, code: 'AI_CIRCUIT_OPEN', message: 'AI backend temporarily disabled', retryAfterSeconds: aiCircuit.timeLeftSec() });
    }

    return res.status(result.ok ? 200 : getHttpStatusFromGeminiCode(result.code)).json({
      ok: result.ok,
      code: result.code,
      message: result.ok ? `Gemini connection healthy (${result.model}).` : result.message,
      model: result.model,
      attempts: result.attempts || [],
    });
  } catch (error) {
    aiCircuit.recordFailure('SERVER_ERROR');
    if (aiCircuit.isOpen()) {
      return res.status(503).json({ ok: false, code: 'AI_CIRCUIT_OPEN', message: 'AI backend temporarily disabled', retryAfterSeconds: aiCircuit.timeLeftSec() });
    }
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Server error while checking Gemini health.',
      details: error?.message || String(error),
      attempts: [],
    });
  }
});

app.post('/api/ai/generate', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const preferredModel = typeof req.body?.preferredModel === 'string' ? req.body.preferredModel.trim() : undefined;

  if (!prompt || prompt.length < 12) {
    return res.status(400).json({
      ok: false,
      code: 'BAD_REQUEST',
      message: 'Prompt is required and must contain at least 12 characters.',
      attempts: [],
    });
  }

  try {
    const result = await attemptGeminiWithRetries({
      prompt,
      preferredModel,
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    });

    if (result.ok) {
      aiCircuit.recordSuccess();
      return res.status(200).json({
        ok: true,
        code: 'OK',
        message: 'Generation succeeded.',
        model: result.model,
        text: result.text,
        attempts: result.attempts || [],
      });
    }

    aiCircuit.recordFailure(result.code || 'unknown');
    if (aiCircuit.isOpen()) {
      return res.status(503).json({ ok: false, code: 'AI_CIRCUIT_OPEN', message: 'AI backend temporarily disabled', retryAfterSeconds: aiCircuit.timeLeftSec() });
    }

    return res.status(getHttpStatusFromGeminiCode(result.code)).json({
      ok: false,
      code: result.code,
      message: result.message,
      model: result.model,
      attempts: result.attempts || [],
    });
  } catch (error) {
    aiCircuit.recordFailure('SERVER_ERROR');
    if (aiCircuit.isOpen()) {
      return res.status(503).json({ ok: false, code: 'AI_CIRCUIT_OPEN', message: 'AI backend temporarily disabled', retryAfterSeconds: aiCircuit.timeLeftSec() });
    }
    return res.status(500).json({
      ok: false,
      code: 'SERVER_ERROR',
      message: 'Server error while generating Gemini content.',
      details: error?.message || String(error),
      attempts: [],
    });
  }
});

// ===== AUTHENTICATION ENDPOINTS =====
/**
 * POST /api/auth/participant
 * Authenticate a participant with credentials and return JWT token
 */
app.post('/api/auth/participant', (req, res) => {
  const validationError = validateParticipantCredentials(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const participant = {
    participantId: req.body.participantId.trim(),
    fullName: req.body.fullName?.trim() || '',
    email: req.body.email.trim(),
    authenticatedAt: new Date().toISOString()
  };

  try {
    upsertParticipant(participant);
    const storedParticipant = getParticipantById(participant.participantId);
    
    // Generate JWT token for this participant
    const tokenData = generateParticipantToken(storedParticipant.participant_id, storedParticipant.email);
    
    return res.status(200).json({
      participant: {
        participantId: storedParticipant.participant_id,
        fullName: storedParticipant.full_name || '',
        email: storedParticipant.email
      },
      participantToken: tokenData.token,
      expiresIn: tokenData.expiresIn,
      authenticatedAt: participant.authenticatedAt,
      message: 'Participant authenticated'
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_authenticating_participant');
    return res.status(500).json({
      error: 'Authentication failed',
      details: error.message
    });
  }
});

/**
 * POST /api/auth/recruiter
 * Authenticate recruiter and return JWT token
 */
app.post('/api/auth/recruiter', (req, res) => {
  const validationError = validateRecruiterCredentials(req.body);
  if (validationError) {
    return res.status(400).json({ error: validationError });
  }

  const recruiterEmail = req.body.email.trim().toLowerCase();
  const recruiterPassword = req.body.password.trim();
  const allowedEmail = (process.env.RECRUITER_EMAIL || 'recruiter@krumm.io').toLowerCase();
  const allowedPassword = process.env.RECRUITER_PASSWORD || 'demo-password';

  if (recruiterEmail !== allowedEmail || recruiterPassword !== allowedPassword) {
    return res.status(401).json({ error: 'Invalid recruiter credentials' });
  }

  try {
    const tokenData = generateRecruiterToken(recruiterEmail, 'Krumm');

    return res.status(200).json({
      recruiter: {
        recruiterId: tokenData.recruiterId,
        email: recruiterEmail,
        company: 'Krumm'
      },
      recruiterToken: tokenData.token,
      expiresIn: tokenData.expiresIn,
      authenticatedAt: new Date().toISOString(),
      message: 'Recruiter authenticated'
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_authenticating_recruiter');
    return res.status(500).json({
      error: 'Recruiter authentication failed',
      details: error.message
    });
  }
});

// ===== SESSION ENDPOINTS (Require Auth) =====
/**
 * POST /api/session
 * Save assessment session (requires JWT token)
 */
app.post('/api/session', authenticateToken, requireParticipant, (req, res) => {
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Empty session payload' });
  }

  // Normalizations / enrichments (prevent PII leaking to storage, enforce shapes)
  try {
    if (payload.participant && typeof payload.participant === 'object') {
      if (payload.participant.email) {
        payload.participant.email = String(payload.participant.email).trim().toLowerCase();
      }
      if (payload.participant.participantId) {
        payload.participant.participantId = String(payload.participant.participantId).trim();
      }
      if (payload.participant.fullName) {
        payload.participant.fullName = String(payload.participant.fullName).trim();
      }
      // Remove obvious sensitive fields if accidentally present
      ['ssn', 'nationalId', 'creditCard', 'cardNumber'].forEach((f) => {
        if (f in payload.participant) delete payload.participant[f];
      });
    }

    if (!payload.sessionData || typeof payload.sessionData !== 'object') {
      payload.sessionData = {};
    }
    if (!payload.sessionData.startedAt) {
      payload.sessionData.startedAt = new Date().toISOString();
    }
    if (!Array.isArray(payload.sessionData.events)) {
      payload.sessionData.events = [];
    }
    const MAX_EVENTS = Number(process.env.SESSION_MAX_EVENTS) || 5000;
    if (payload.sessionData.events.length > MAX_EVENTS) {
      payload.sessionData.events = payload.sessionData.events.slice(0, MAX_EVENTS);
    }
  } catch (err) {
    // normalization errors should not block saving; log and continue
    logger.warn({ err: err?.message || err }, 'session_normalization_failed');
  }

  // Validate session payload shape
  try {
    const valid = validateSession(payload);
    if (!valid) {
      try { sessionValidationErrorsTotal.inc(); } catch { void 0; }
      return res.status(400).json({ error: 'Invalid session payload', details: validateSession.errors });
    }
  } catch (err) {
    try { sessionValidationErrorsTotal.inc(); } catch { void 0; }
    return res.status(400).json({ error: 'Invalid session payload', details: String(err) });
  }

  // Verify participant owns this session
  if (payload.participant?.participantId !== req.user.participantId) {
    return res.status(403).json({ error: 'Unauthorized: participant mismatch' });
  }

  try {
    const sessionId = saveSession(payload);
    try { sessionsSavedTotal.inc(); } catch { void 0; }
    return res.status(201).json({
      sessionId,
      message: 'Session saved securely',
      participantId: req.user.participantId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_saving_session');
    return res.status(500).json({
      error: 'Failed to save session',
      details: error.message
    });
  }
});

/**
 * GET /api/session/:id
 * Retrieve a specific session (with auth)
 */
app.get('/api/session/:id', authenticateToken, requireParticipant, (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ error: 'Invalid session id' });
  }

  try {
    const session = getSession(id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Verify participant owns this session
    if (session.participant_id && session.participant_id !== req.user.participantId) {
      return res.status(403).json({ error: 'Unauthorized: cannot access other participants sessions' });
    }

    return res.json(session);
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_retrieving_session');
    return res.status(500).json({
      error: 'Failed to retrieve session',
      details: error.message
    });
  }
});

/**
 * GET /api/sessions
 * Retrieve all sessions for authenticated participant
 */
app.get('/api/sessions', authenticateToken, requireParticipant, (req, res) => {
  try {
    const allSessions = getAllSessions();
    
    // Return only sessions belonging to this participant
    const userSessions = allSessions.filter(s => s.participant_id === req.user.participantId);
    
    return res.json({
      count: userSessions.length,
      sessions: userSessions,
      participantId: req.user.participantId
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_retrieving_sessions');
    return res.status(500).json({
      error: 'Failed to retrieve sessions',
      details: error.message
    });
  }
});

/**
 * GET /api/participant/:id
 * Retrieve participant profile (if authorized)
 */
app.get('/api/participant/:id', authenticateToken, requireParticipant, (req, res) => {
  const participantId = req.params.id;

  // Participants can only access their own data
  if (participantId !== req.user.participantId) {
    return res.status(403).json({ error: 'Unauthorized: cannot access other participants' });
  }

  try {
    const participant = getParticipantById(participantId);
    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    return res.json({
      participantId: participant.participant_id,
      fullName: participant.full_name || '',
      email: participant.email,
      createdAt: participant.created_at,
      lastAuthenticated: participant.last_authenticated
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_retrieving_participant');
    return res.status(500).json({
      error: 'Failed to retrieve participant',
      details: error.message
    });
  }
});

/**
 * GET /api/recruiter/sessions
 * Recruiter analytics endpoint (no raw biometric payload exposed)
 */
app.get('/api/recruiter/sessions', authenticateToken, requireRecruiter, (req, res) => {
  try {
    const sessions = getAllSessions();
    return res.json({
      count: sessions.length,
      sessions
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_retrieving_recruiter_sessions');
    return res.status(500).json({
      error: 'Failed to retrieve recruiter sessions',
      details: error.message
    });
  }
});

/**
 * GET /api/recruiter/analytics
 * Recruiter analytics summary endpoint
 */
app.get('/api/recruiter/analytics', authenticateToken, requireRecruiter, (req, res) => {
  try {
    const sessions = getAllSessions();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentSessions = sessions.filter((session) => {
      const createdAt = new Date(session.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= oneDayAgo;
    });

    const recommendationDistribution = sessions.reduce((acc, session) => {
      const recommendation = session.payload?.report?.recommendation || 'UNKNOWN';
      acc[recommendation] = (acc[recommendation] || 0) + 1;
      return acc;
    }, {});

    return res.json({
      totalSessions: sessions.length,
      last24hSessions: recentSessions.length,
      recommendationDistribution,
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_retrieving_recruiter_analytics');
    return res.status(500).json({
      error: 'Failed to retrieve recruiter analytics',
      details: error.message
    });
  }
});

/**
 * GET /api/recruiter/analytics/v2
 * Extended recruiter analytics including KPI and quality status snapshots
 */
app.get('/api/recruiter/analytics/v2', authenticateToken, requireRecruiter, (req, res) => {
  try {
    const sessions = getAllSessions();
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);

    const recentSessions = sessions.filter((session) => {
      const createdAt = new Date(session.created_at).getTime();
      return Number.isFinite(createdAt) && createdAt >= oneDayAgo;
    });

    const recommendationDistribution = sessions.reduce((acc, session) => {
      const recommendation = session.payload?.report?.recommendation || 'UNKNOWN';
      acc[recommendation] = (acc[recommendation] || 0) + 1;
      return acc;
    }, {});

    const calibration = readJsonSafe(path.join(calibrationDir, 'latest-calibration.json'));
    const kpi = readJsonSafe(path.join(calibrationDir, 'latest-kpis.json'));
    const qualitySummary = readQualityAlertSummary(path.join(calibrationDir, 'quality-alerts.md'));

    return res.json({
      totalSessions: sessions.length,
      last24hSessions: recentSessions.length,
      recommendationDistribution,
      quality: qualitySummary,
      calibration: calibration
        ? {
          generatedAt: calibration.generatedAt,
          outcomeSource: calibration.input?.outcomeSource || 'unknown',
          syntheticOutcomes: calibration.input?.syntheticOutcomes ?? null,
          thresholdsScale0to10: calibration.thresholdsScale0to10 || null,
        }
        : null,
      kpiSnapshot: kpi?.kpis || null,
    });
  } catch (error) {
    logger.error({ err: error?.message || error }, 'error_retrieving_recruiter_analytics_v2');
    return res.status(500).json({
      error: 'Failed to retrieve recruiter analytics v2',
      details: error.message,
    });
  }
});

// Global error handler middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error({ err }, 'unhandled_error');
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    path: req.path,
    method: req.method
  });
});

// ===== SERVER STARTUP =====
const server = app.listen(PORT, () => {
  logger.info({ url: `http://localhost:${PORT}` }, 'server_started');
  logger.info({ endpoints: ['/health', '/ready', '/metrics', '/api/auth/participant', '/api/auth/recruiter'] }, 'server_info');
  logger.info({ environment: process.env.NODE_ENV || 'development' }, 'environment');
  try {
    const routes = (app._router && app._router.stack) ? app._router.stack.filter(r => r.route).map(r => {
      const methods = Object.keys(r.route.methods || {}).join(',').toUpperCase();
      return `${methods} ${r.route.path}`;
    }) : [];
    logger.debug({ routes }, 'registered_routes');
  } catch {
    // ignore
  }
});

const shutdown = (signal) => {
  logger.info({ signal }, 'shutdown_initiated');
  server.close(() => {
    logger.info('server_closed', 'Server closed.');
    process.exit(0);
  });
  // force exit after timeout
  setTimeout(() => {
    logger.error('forcing_shutdown', 'Forcing shutdown after timeout.');
    process.exit(1);
  }, 10000).unref();
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));


