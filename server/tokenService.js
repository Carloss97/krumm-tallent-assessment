/**
 * JWT Token Service - Server-side
 * Generates and validates JWT tokens for participant sessions
 */


import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';

const MIN_SECRET_LENGTH = 32;
const DEV_SECRET_KEY = crypto.randomBytes(32).toString('hex');
const TOKEN_EXPIRATION = process.env.JWT_PARTICIPANT_EXPIRES_IN || '15m';
const RECRUITER_TOKEN_EXPIRATION = process.env.JWT_RECRUITER_EXPIRES_IN || '8h';

export const getJwtSecretKey = () => {
  const configuredSecret = process.env.JWT_SECRET_KEY;
  if (configuredSecret && configuredSecret.length >= MIN_SECRET_LENGTH) {
    return configuredSecret;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET_KEY must be configured and at least 32 characters in production.');
  }

  return DEV_SECRET_KEY;
};

/**
 * Generate JWT token for authenticated participant
 */
export const generateParticipantToken = (participantId, email) => {
  const payload = {
    participantId,
    email,
    type: 'participant',
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(payload, getJwtSecretKey(), {
    expiresIn: TOKEN_EXPIRATION,
    algorithm: 'HS256'
  });

  return {
    token,
    expiresIn: TOKEN_EXPIRATION,
    participantId
  };
};

/**
 * Generate JWT token for recruiter access (dashboard)
 */
export const generateRecruiterToken = (recruiterId, company) => {
  const payload = {
    recruiterId,
    company,
    type: 'recruiter',
    iat: Math.floor(Date.now() / 1000)
  };

  const token = jwt.sign(payload, getJwtSecretKey(), {
    expiresIn: RECRUITER_TOKEN_EXPIRATION,
    algorithm: 'HS256'
  });

  return {
    token,
    expiresIn: RECRUITER_TOKEN_EXPIRATION,
    recruiterId
  };
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, getJwtSecretKey(), {
      algorithms: ['HS256']
    });
    return {
      valid: true,
      payload: decoded
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
};

/**
 * Express middleware to protect routes
 */
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer token

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const verification = verifyToken(token);

  if (!verification.valid) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = verification.payload;
  next();
};

/**
 * Middleware to require participant role
 */
export const requireParticipant = (req, res, next) => {
  if (req.user?.type !== 'participant') {
    return res.status(403).json({ error: 'Participant access required' });
  }
  next();
};

/**
 * Middleware to require recruiter role
 */
export const requireRecruiter = (req, res, next) => {
  if (req.user?.type !== 'recruiter') {
    return res.status(403).json({ error: 'Recruiter access required' });
  }
  next();
};

export default {
  generateParticipantToken,
  generateRecruiterToken,
  verifyToken,
  getJwtSecretKey,
  authenticateToken,
  requireParticipant,
  requireRecruiter
};

