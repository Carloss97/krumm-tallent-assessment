import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  generateParticipantToken,
  generateRecruiterToken,
  getJwtSecretKey,
  verifyToken,
} from './tokenService.js';

const ORIGINAL_ENV = { ...process.env };

describe('tokenService security defaults', () => {
  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    process.env.NODE_ENV = 'test';
    delete process.env.JWT_SECRET_KEY;
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  it('uses a non-public development fallback secret instead of the old hardcoded string', () => {
    expect(getJwtSecretKey()).not.toBe('dev-secret-key-change-in-production');
    expect(getJwtSecretKey()).toHaveLength(64);
  });

  it('rejects missing or short JWT secrets in production', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.JWT_SECRET_KEY;

    expect(() => getJwtSecretKey()).toThrow(/JWT_SECRET_KEY/);

    process.env.JWT_SECRET_KEY = 'too-short';
    expect(() => generateParticipantToken('participant-1', 'person@example.com')).toThrow(/JWT_SECRET_KEY/);
  });

  it('generates and verifies short-lived participant and recruiter tokens with a configured secret', () => {
    process.env.JWT_SECRET_KEY = '0123456789abcdef0123456789abcdef';

    const participant = generateParticipantToken('participant-1', 'person@example.com');
    const recruiter = generateRecruiterToken('recruiter@example.com', 'krumm');

    expect(participant.expiresIn).toBe('15m');
    expect(recruiter.expiresIn).toBe('8h');
    expect(verifyToken(participant.token).payload).toMatchObject({
      participantId: 'participant-1',
      type: 'participant',
    });
    expect(verifyToken(recruiter.token).payload).toMatchObject({
      recruiterId: 'recruiter@example.com',
      type: 'recruiter',
    });
  });
});
