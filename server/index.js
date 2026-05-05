import 'dotenv/config';
import crypto from 'node:crypto';
import compression from 'compression';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { serverConfig } from './config.js';
import { logger } from './logger.js';
import { requestLogger, rateLimiter } from './middleware.js';
import { validateSession } from './validators.js';
import {
	upsertParticipant,
	saveSession,
	getAllSessions,
	checkDb,
} from './db.js';
import {
	generateParticipantToken,
	generateRecruiterToken,
	authenticateToken,
	requireParticipant,
	requireRecruiter,
} from './tokenService.js';

const app = express();
const isProd = process.env.NODE_ENV === 'production';

const parseCsv = (value, fallback = []) => {
	if (typeof value !== 'string') return fallback;
	const entries = value
		.split(',')
		.map((item) => item.trim())
		.filter(Boolean);
	return entries.length > 0 ? entries : fallback;
};

const parseBoolean = (value, fallback = false) => {
	if (typeof value !== 'string') return fallback;
	const normalized = value.trim().toLowerCase();
	if (normalized === 'true') return true;
	if (normalized === 'false') return false;
	return fallback;
};

const parseInteger = (value, fallback) => {
	const parsed = Number.parseInt(value ?? '', 10);
	return Number.isFinite(parsed) ? parsed : fallback;
};

const allowedOrigins = parseCsv(
	process.env.ALLOWED_ORIGINS,
	isProd ? [] : ['http://localhost:5173', 'http://localhost:5174']
);
const allowAllOrigins = allowedOrigins.length === 0;

if (isProd && allowAllOrigins) {
	logger.warn({ event: 'cors', detail: 'ALLOWED_ORIGINS not configured; allowing all origins.' });
}

app.set('trust proxy', 1);
app.disable('x-powered-by');
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: '1mb' }));

app.use((req, res, next) => {
	const requestId = crypto.randomUUID();
	req.requestId = requestId;
	res.setHeader('x-request-id', requestId);
	next();
});

app.use(requestLogger);

app.use(cors({
	origin: (origin, callback) => {
		if (!origin || allowAllOrigins) return callback(null, true);
		if (allowedOrigins.includes(origin)) return callback(null, true);
		return callback(new Error('Not allowed by CORS'));
	},
	methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: false,
}));

const globalLimiter = rateLimiter(serverConfig.rateLimit.global);
const aiLimiter = rateLimiter(serverConfig.rateLimit.ai);

app.use('/api', (req, res, next) => {
	const fullPath = `${req.baseUrl}${req.path}`;
	const bypass = serverConfig.rateLimit.bypassPaths.some((path) => path === req.path || path === fullPath);
	if (bypass) return next();
	return globalLimiter(req, res, next);
});

const mapGeminiFailure = (error) => {
	const message = String(error?.message || '').toLowerCase();
	if (message.includes('reported as leaked') || message.includes('leaked')) {
		return { code: 'KEY_LEAKED', status: 400, message: 'Gemini API key was reported as leaked.' };
	}
	if (message.includes('expired') || message.includes('invalid') || message.includes('api_key_invalid')) {
		return { code: 'KEY_INVALID', status: 400, message: 'Gemini API key is invalid or expired.' };
	}
	if (message.includes('permission') || message.includes('permission_denied') || message.includes('403')) {
		return { code: 'PERMISSION_DENIED', status: 403, message: 'Gemini key lacks required permissions.' };
	}
	if (message.includes('not found') || message.includes('404')) {
		return { code: 'MODEL_NOT_FOUND', status: 404, message: 'Gemini model not found or not available.' };
	}
	if (message.includes('quota') || message.includes('429') || message.includes('rate limit')) {
		return { code: 'QUOTA_EXCEEDED', status: 429, message: 'Gemini quota or rate limit reached.' };
	}
	if (message.includes('bad request') || message.includes('400')) {
		return { code: 'BAD_REQUEST', status: 400, message: 'Gemini request rejected.' };
	}
	return { code: 'UNKNOWN', status: 502, message: 'Gemini request failed.' };
};

const getGeminiClient = () => {
	const key = process.env.GEMINI_API_KEY;
	if (!key) return undefined;
	return new GoogleGenerativeAI(key);
};

const selectGeminiModels = (preferredModel) => {
	const candidates = [preferredModel, process.env.GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-1.5-flash'];
	return Array.from(new Set(candidates.filter(Boolean)));
};

app.get('/health', async (req, res) => {
	const dbOk = await checkDb();
	res.json({
		status: 'ok',
		uptimeSec: Math.round(process.uptime()),
		database: dbOk ? 'connected' : 'unhealthy',
		timestamp: new Date().toISOString(),
	});
});

app.get('/api/feature-flags', (req, res) => {
	const enableHeroDemo = parseBoolean(process.env.ENABLE_HERO_DEMO, false);
	const heroDemoPercentage = parseInteger(process.env.HERO_DEMO_PERCENTAGE, 0);

	res.json({
		enableHeroDemo,
		heroDemoPercentage,
	});
});

app.post('/api/telemetry', (req, res) => {
	const event = String(req.body?.event || '').slice(0, 120);
	logger.info({ event: 'telemetry', name: event, requestId: req.requestId }, 'telemetry_event');
	res.status(204).end();
});

app.post('/api/auth/participant', async (req, res) => {
	const participantId = String(req.body?.participantId || '').trim();
	const accessCode = String(req.body?.accessCode || '').trim();
	const email = typeof req.body?.email === 'string' ? req.body.email.trim() : undefined;
	const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : undefined;

	if (!participantId || !accessCode) {
		return res.status(400).json({ error: 'participantId and accessCode are required.' });
	}

	const authenticatedAt = new Date().toISOString();

	let participantRecord = undefined;
	try {
		participantRecord = await upsertParticipant({
			participantId,
			fullName,
			email,
			authenticatedAt,
		});
	} catch (error) {
		logger.error({ err: error?.message, requestId: req.requestId }, 'participant_upsert_failed');
	}

	const tokenInfo = generateParticipantToken(participantId, email);

	return res.json({
		participant: participantRecord || { participantId, fullName, email },
		participantToken: tokenInfo.token,
		expiresIn: tokenInfo.expiresIn,
		authenticatedAt,
	});
});

app.post('/api/auth/recruiter', (req, res) => {
	const configuredEmail = process.env.RECRUITER_EMAIL;
	const configuredPassword = process.env.RECRUITER_PASSWORD;

	if (!configuredEmail || !configuredPassword) {
		return res.status(503).json({ error: 'Recruiter authentication is not configured.' });
	}

	const email = String(req.body?.email || '').trim();
	const password = String(req.body?.password || '').trim();

	if (email !== configuredEmail || password !== configuredPassword) {
		return res.status(401).json({ error: 'Invalid recruiter credentials.' });
	}

	const tokenInfo = generateRecruiterToken(configuredEmail, 'krumm');

	return res.json({
		recruiterToken: tokenInfo.token,
		expiresIn: tokenInfo.expiresIn,
		recruiterId: tokenInfo.recruiterId,
	});
});

app.post('/api/session', authenticateToken, requireParticipant, async (req, res) => {
	const payload = req.body;
	if (!payload || typeof payload !== 'object') {
		return res.status(400).json({ error: 'Invalid session payload.' });
	}

	const valid = validateSession(payload);
	if (!valid) {
		const detail = isProd ? undefined : validateSession.errors;
		return res.status(400).json({ error: 'Session validation failed.', detail });
	}

	try {
		const sessionId = await saveSession(payload);
		return res.json({ sessionId });
	} catch (error) {
		logger.error({ err: error?.message, requestId: req.requestId }, 'save_session_failed');
		return res.status(500).json({ error: 'Unable to save session.' });
	}
});

app.get('/api/recruiter/sessions', authenticateToken, requireRecruiter, async (req, res) => {
	try {
		const sessions = await getAllSessions();
		res.json({ sessions });
	} catch (error) {
		logger.error({ err: error?.message, requestId: req.requestId }, 'get_sessions_failed');
		res.status(500).json({ error: 'Unable to fetch sessions.' });
	}
});

app.get('/api/recruiter/analytics', authenticateToken, requireRecruiter, async (req, res) => {
	try {
		const sessions = await getAllSessions();
		res.json({
			totalSessions: sessions.length,
		});
	} catch (error) {
		logger.error({ err: error?.message, requestId: req.requestId }, 'get_analytics_failed');
		res.status(500).json({ error: 'Unable to fetch analytics.' });
	}
});

app.get('/api/recruiter/analytics/v2', authenticateToken, requireRecruiter, async (req, res) => {
	try {
		const sessions = await getAllSessions();
		const now = Date.now();
		const last24hSessions = sessions.filter((session) => {
			const ts = new Date(session.created_at).getTime();
			return Number.isFinite(ts) && now - ts <= 24 * 60 * 60 * 1000;
		}).length;

		const distribution = {};
		sessions.forEach((session) => {
			const payload = session?.payload || {};
			const recommendation = payload?.report?.recommendation
				|| payload?.aiReport?.recommendation
				|| payload?.metadata?.recommendation;
			if (recommendation) {
				distribution[recommendation] = (distribution[recommendation] || 0) + 1;
			}
		});

		res.json({
			totalSessions: sessions.length,
			last24hSessions,
			recommendationDistribution: distribution,
			quality: {
				status: sessions.length > 0 ? 'OK' : 'EMPTY',
				syntheticOutcomes: false,
				outcomeSource: 'session_payload',
			},
			calibration: {
				generatedAt: new Date().toISOString(),
				outcomeSource: 'session_payload',
				thresholdsScale0to10: {
					strong: 8,
					solid: 6,
					conditional: 4,
				},
			},
			kpiSnapshot: {
				primary: {
					rocAuc: undefined,
					prAucLift: undefined,
					brier: undefined,
				},
				fairness: {
					selectionRateRatio: undefined,
				},
			},
		});
	} catch (error) {
		logger.error({ err: error?.message, requestId: req.requestId }, 'get_analytics_v2_failed');
		res.status(500).json({ error: 'Unable to fetch analytics.' });
	}
});

app.get('/api/ai/health', aiLimiter, async (req, res) => {
	const preferredModel = typeof req.query?.model === 'string' ? req.query.model : undefined;
	const genAI = getGeminiClient();
	if (!genAI) {
		return res.status(400).json({
			ok: false,
			code: 'MISSING_KEY',
			message: 'GEMINI_API_KEY is not configured.',
			model: preferredModel || process.env.GEMINI_MODEL,
		});
	}

	const models = selectGeminiModels(preferredModel);
	const attempts = [];

	for (const modelName of models) {
		try {
			const model = genAI.getGenerativeModel({
				model: modelName,
				generationConfig: {
					temperature: 0,
					responseMimeType: 'application/json',
				},
			});
			await model.generateContent('Respond with valid JSON: {"ok":true}');
			attempts.push({ stage: 'health', model: modelName, status: 200, code: 'OK', message: 'Health probe succeeded.' });
			return res.json({
				ok: true,
				code: 'OK',
				message: `Gemini health check succeeded (${modelName}).`,
				model: modelName,
				attempts,
			});
		} catch (error) {
			const mapped = mapGeminiFailure(error);
			attempts.push({ stage: 'health', model: modelName, status: mapped.status, code: mapped.code, message: mapped.message });
			if (['KEY_LEAKED', 'KEY_INVALID', 'PERMISSION_DENIED', 'QUOTA_EXCEEDED'].includes(mapped.code)) {
				return res.status(mapped.status).json({
					ok: false,
					code: mapped.code,
					message: mapped.message,
					model: modelName,
					attempts,
				});
			}
		}
	}

	return res.status(502).json({
		ok: false,
		code: 'MODEL_NOT_FOUND',
		message: 'Gemini health check failed for all models.',
		attempts,
	});
});

app.post('/api/ai/generate', aiLimiter, async (req, res) => {
	const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt : '';
	const preferredModel = typeof req.body?.preferredModel === 'string' ? req.body.preferredModel : undefined;
	const genAI = getGeminiClient();

	if (!genAI) {
		return res.status(400).json({
			ok: false,
			code: 'MISSING_KEY',
			message: 'GEMINI_API_KEY is not configured.',
		});
	}

	if (!prompt || prompt.length < 4) {
		return res.status(400).json({
			ok: false,
			code: 'BAD_REQUEST',
			message: 'Prompt is required.',
		});
	}

	if (prompt.length > 20000) {
		return res.status(413).json({
			ok: false,
			code: 'PAYLOAD_TOO_LARGE',
			message: 'Prompt exceeds maximum length.',
		});
	}

	const models = selectGeminiModels(preferredModel);
	const attempts = [];

	for (const modelName of models) {
		try {
			const model = genAI.getGenerativeModel({
				model: modelName,
				generationConfig: {
					temperature: 0.2,
					responseMimeType: 'application/json',
				},
			});
			const result = await model.generateContent(prompt);
			const text = result.response.text();
			attempts.push({ stage: 'generate', model: modelName, status: 200, code: 'OK', message: 'Generation succeeded.' });
			return res.json({
				ok: true,
				code: 'OK',
				text,
				model: modelName,
				attempts,
			});
		} catch (error) {
			const mapped = mapGeminiFailure(error);
			attempts.push({ stage: 'generate', model: modelName, status: mapped.status, code: mapped.code, message: mapped.message });
			if (['KEY_LEAKED', 'KEY_INVALID', 'PERMISSION_DENIED', 'QUOTA_EXCEEDED'].includes(mapped.code)) {
				return res.status(mapped.status).json({
					ok: false,
					code: mapped.code,
					message: mapped.message,
					attempts,
				});
			}
		}
	}

	return res.status(502).json({
		ok: false,
		code: 'MODEL_NOT_FOUND',
		message: 'Gemini generate failed for all models.',
		attempts,
	});
});

app.use((req, res) => {
	res.status(404).json({ error: 'Route not found.' });
});

app.use((err, req, res, next) => {
	logger.error({ err: err?.message, requestId: req.requestId }, 'unhandled_error');
	if (res.headersSent) return next(err);
	return res.status(500).json({ error: 'Internal Server Error' });
});

const port = parseInteger(process.env.PORT, 4000);
app.listen(port, '0.0.0.0', () => {
	if (!process.env.JWT_SECRET_KEY || process.env.JWT_SECRET_KEY.length < 32) {
		logger.warn({ event: 'jwt', detail: 'JWT_SECRET_KEY is missing or too short for production.' });
	}
	logger.info({ event: 'startup', port }, `Server running on port ${port}`);
});
