import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createDevAccessSession,
  DEV_ACCESS_SESSION_TTL_MS,
  getDevAccessSession,
  isDevAccessAllowedHost,
  setDevAccessSession,
  verifyDevAccessPassword,
} from './devAccess';

const CAMERA_SECRET_SHA256 = '6311eb28fd635243bd89c8c58c7a408636c0bc32c759cbc146d480c63f538fbc';

describe('dev access utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('validates a password against a configured SHA-256 hash without storing the plain password', async () => {
    await expect(verifyDevAccessPassword('camera-secret', CAMERA_SECRET_SHA256)).resolves.toBe(true);
    await expect(verifyDevAccessPassword('wrong-secret', CAMERA_SECRET_SHA256)).resolves.toBe(false);
  });

  it('only allows the development lab on explicit development hosts', () => {
    expect(isDevAccessAllowedHost('dev.krumm.cl')).toBe(true);
    expect(isDevAccessAllowedHost('localhost')).toBe(true);
    expect(isDevAccessAllowedHost('127.0.0.1')).toBe(true);
    expect(isDevAccessAllowedHost('krumm.cl')).toBe(false);
    expect(isDevAccessAllowedHost('evil-dev.krumm.cl.attacker.test')).toBe(false);
  });

  it('stores a bounded browser session that expires automatically', () => {
    const now = 1_800_000_000_000;
    const session = createDevAccessSession({ now, ttlMs: DEV_ACCESS_SESSION_TTL_MS });

    setDevAccessSession(session, localStorage);

    expect(getDevAccessSession(localStorage, () => now + 1000)).toEqual(session);
    expect(getDevAccessSession(localStorage, () => now + DEV_ACCESS_SESSION_TTL_MS + 1)).toBeNull();
  });
});
