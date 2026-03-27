
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { saveSession, getSession, getAllSessions, upsertParticipant, getParticipantById } from './db.js';
import {
  generateParticipantToken,
  generateRecruiterToken,
  authenticateToken,
  requireParticipant,
  requireRecruiter
} from './tokenService.js';
import { rateLimiter, requestLogger } from './middleware.js';

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

// Middleware
app.use(cors());
app.use(express.json());
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
app.use(rateLimiter({ windowMs: 60_000, maxRequests: 180 }));

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

// Tighten AI endpoint rate to reduce bursty retries hitting Gemini quotas.
app.use('/api/ai', rateLimiter({ windowMs: 60_000, maxRequests: 20 }));

app.get('/api/ai/health', async (req, res) => {
  try {
    const preferredModel = typeof req.query.model === 'string' ? req.query.model : undefined;
    const result = await runGeminiGeneration({
      prompt: 'Respond with valid JSON only: {"ok":true}',
      preferredModel,
      generationConfig: { temperature: 0 },
    });

    return res.status(result.ok ? 200 : getHttpStatusFromGeminiCode(result.code)).json({
      ok: result.ok,
      code: result.code,
      message: result.ok ? `Gemini connection healthy (${result.model}).` : result.message,
      model: result.model,
      attempts: result.attempts || [],
    });
  } catch (error) {
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
    const result = await runGeminiGeneration({
      prompt,
      preferredModel,
      generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
    });

    if (!result.ok) {
      return res.status(getHttpStatusFromGeminiCode(result.code)).json({
        ok: false,
        code: result.code,
        message: result.message,
        model: result.model,
        attempts: result.attempts || [],
      });
    }

    return res.status(200).json({
      ok: true,
      code: 'OK',
      message: 'Generation succeeded.',
      model: result.model,
      text: result.text,
      attempts: result.attempts || [],
    });
  } catch (error) {
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
    console.error('Error authenticating participant:', error.message);
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
    console.error('Error authenticating recruiter:', error.message);
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

  // Verify participant owns this session
  if (payload.participant?.participantId !== req.user.participantId) {
    return res.status(403).json({ error: 'Unauthorized: participant mismatch' });
  }

  try {
    const sessionId = saveSession(payload);
    return res.status(201).json({
      sessionId,
      message: 'Session saved securely',
      participantId: req.user.participantId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error saving session:', error.message);
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
    console.error('Error retrieving session:', error.message);
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
    console.error('Error retrieving sessions:', error.message);
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
    console.error('Error retrieving participant:', error.message);
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
    console.error('Error retrieving recruiter sessions:', error.message);
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
    console.error('Error retrieving recruiter analytics:', error.message);
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
    console.error('Error retrieving recruiter analytics v2:', error.message);
    return res.status(500).json({
      error: 'Failed to retrieve recruiter analytics v2',
      details: error.message,
    });
  }
});

// Global error handler middleware
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
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
app.listen(PORT, () => {
  console.log(`✓ Backend API server running at http://localhost:${PORT}`);
  console.log(`✓ Health check: GET /health`);
  console.log(`✓ Authentication: POST /api/auth/participant`);
  console.log(`✓ Recruiter auth: POST /api/auth/recruiter`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
});

