export const DEV_ACCESS_STORAGE_KEY = 'krumm.dev.access.v1';
export const DEV_ACCESS_SESSION_TTL_MS = 12 * 60 * 60 * 1000;

const DEFAULT_ALLOWED_HOSTS = 'localhost,127.0.0.1,::1,dev.krumm.cl';

const getEnv = () => (typeof import.meta !== 'undefined' ? import.meta.env || {} : {});

export function normalizeSha256(value = '') {
  return String(value || '').trim().toLowerCase();
}

export function getConfiguredDevAccessHash() {
  return normalizeSha256(getEnv().VITE_DEV_LAB_PASSWORD_SHA256 || '');
}

export function getConfiguredDevAccessHosts() {
  return String(getEnv().VITE_DEV_LAB_ALLOWED_HOSTS || DEFAULT_ALLOWED_HOSTS);
}

export function isDevLabEnabled() {
  const env = getEnv();
  return env.DEV === true || env.VITE_ENABLE_DEV_LAB === 'true';
}

export function isDevAccessConfigured(expectedHash = getConfiguredDevAccessHash()) {
  return normalizeSha256(expectedHash).length === 64;
}

const splitHosts = (rawAllowedHosts = DEFAULT_ALLOWED_HOSTS) => String(rawAllowedHosts || DEFAULT_ALLOWED_HOSTS)
  .split(',')
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean);

export function isDevAccessAllowedHost(hostname, rawAllowedHosts = getConfiguredDevAccessHosts()) {
  const host = String(
    hostname || (typeof window !== 'undefined' ? window.location.hostname : ''),
  ).trim().toLowerCase();

  if (!host) return false;

  return splitHosts(rawAllowedHosts).some((allowed) => {
    if (allowed === host) return true;
    if (!allowed.startsWith('*.')) return false;
    const suffix = allowed.slice(1); // keep leading dot
    return host.endsWith(suffix) && host.length > suffix.length;
  });
}

export async function sha256Hex(text) {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    throw new Error('Web Crypto SHA-256 is not available in this browser');
  }

  const encoded = new TextEncoder().encode(String(text || ''));
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyDevAccessPassword(password, expectedHash = getConfiguredDevAccessHash()) {
  const normalizedExpectedHash = normalizeSha256(expectedHash);
  if (!isDevAccessConfigured(normalizedExpectedHash)) return false;
  if (!password) return false;

  const candidateHash = await sha256Hex(password);
  return candidateHash === normalizedExpectedHash;
}

export function createDevAccessSession({ now = Date.now(), ttlMs = DEV_ACCESS_SESSION_TTL_MS } = {}) {
  const authenticatedAt = Number(now);
  return {
    authenticatedAt,
    expiresAt: authenticatedAt + Number(ttlMs || DEV_ACCESS_SESSION_TTL_MS),
  };
}

const getDefaultStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage || null;
};

export function getDevAccessSession(storage = getDefaultStorage(), now = Date.now) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(DEV_ACCESS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    const expiresAt = Number(parsed?.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt <= now()) {
      storage.removeItem(DEV_ACCESS_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    storage.removeItem(DEV_ACCESS_STORAGE_KEY);
    return null;
  }
}

export function setDevAccessSession(session = createDevAccessSession(), storage = getDefaultStorage()) {
  if (!storage) return;
  storage.setItem(DEV_ACCESS_STORAGE_KEY, JSON.stringify(session));
}

export function clearDevAccessSession(storage = getDefaultStorage()) {
  if (!storage) return;
  storage.removeItem(DEV_ACCESS_STORAGE_KEY);
}
