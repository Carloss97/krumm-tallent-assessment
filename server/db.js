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

const implementation = getDbClientName() === 'pg'
  ? await import('./db.pg.js')
  : await import('./db.sqlite.js');

export const upsertParticipant = implementation.upsertParticipant;
export const getParticipantById = implementation.getParticipantById;
export const saveSession = implementation.saveSession;
export const getSession = implementation.getSession;
export const getAllSessions = implementation.getAllSessions;
export const checkDb = implementation.checkDb;
