/* global process */

import express from 'express';
import cors from 'cors';
import { saveSession, getSession, getAllSessions, upsertParticipant, getParticipantById } from './db.js';
import {
  generateParticipantToken,
  generateRecruiterToken,
  authenticateToken,
  requireParticipant,
  requireRecruiter
} from './tokenService.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Global error handler middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

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

// ===== HEALTH CHECK (No Auth Required) =====
app.get('/health', (req, res) => {
  return res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
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
