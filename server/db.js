const getDbClientName = () => {
  const configured = String(process.env.DB_CLIENT || '').trim().toLowerCase();
  if (configured === 'pg' || configured === 'postgres' || configured === 'postgresql') {
    return 'pg';
  }

  if (process.env.DATABASE_URL) {
    return 'pg';
  }

  return 'sqlite';
};

let implementation;
try {
  implementation = getDbClientName() === 'pg'
    ? await import('./db.pg.js')
    : await import('./db.sqlite.js');
} catch (err) {
  // If native bindings fail (better-sqlite3) or other import errors, fall back to in-memory adapter
  // This avoids crashing the dev server for common local issues (missing native build, incompatible Node ABI)
  // Log a warning for visibility
  console.warn('DB adapter import failed, falling back to in-memory adapter:', err?.message || err);
  implementation = await import('./db.memory.js');
}

export const upsertParticipant = implementation.upsertParticipant;
export const getParticipantById = implementation.getParticipantById;
export const saveSession = implementation.saveSession;
export const getSession = implementation.getSession;
export const getAllSessions = implementation.getAllSessions;
export const checkDb = implementation.checkDb;
