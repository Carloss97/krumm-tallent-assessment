import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'app.db');
const db = new Database(dbPath);

const hasColumn = (tableName, columnName) => {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return columns.some((column) => column.name === columnName);
};

const extractGamesFromPayload = (payload) => {
  const source = payload && payload.sessionData ? payload.sessionData : payload;
  if (!source || typeof source !== 'object') {
    return [];
  }

  return Object.entries(source).filter(([key, value]) => {
    const looksLikeGameId = /^game\d+$/i.test(key);
    const hasNumericMetrics = value && typeof value === 'object' && (
      typeof value.score === 'number' ||
      typeof value.errors === 'number' ||
      typeof value.duration === 'number'
    );
    return looksLikeGameId || hasNumericMetrics;
  });
};

// Create tables if not exist
const createTables = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      payload TEXT,
      participant_id TEXT,
      participant_email TEXT
    )
  `).run();

  if (!hasColumn('sessions', 'participant_id')) {
    db.prepare('ALTER TABLE sessions ADD COLUMN participant_id TEXT').run();
  }

  if (!hasColumn('sessions', 'participant_email')) {
    db.prepare('ALTER TABLE sessions ADD COLUMN participant_email TEXT').run();
  }

  db.prepare(`
    CREATE TABLE IF NOT EXISTS participants (
      participant_id TEXT PRIMARY KEY,
      full_name TEXT,
      email TEXT,
      last_auth_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS session_metrics (
      session_id INTEGER,
      game_id TEXT,
      score INTEGER,
      errors INTEGER,
      metrics TEXT,
      FOREIGN KEY(session_id) REFERENCES sessions(id)
    )
  `).run();
};

createTables();

export const upsertParticipant = ({ participantId, fullName, email, authenticatedAt }) => {
  db.prepare(`
    INSERT INTO participants (participant_id, full_name, email, last_auth_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    ON CONFLICT(participant_id) DO UPDATE SET
      full_name = excluded.full_name,
      email = excluded.email,
      last_auth_at = excluded.last_auth_at,
      updated_at = CURRENT_TIMESTAMP
  `).run(participantId, fullName || null, email || null, authenticatedAt || new Date().toISOString());
};

export const getParticipantById = (participantId) => {
  return db.prepare('SELECT * FROM participants WHERE participant_id = ?').get(participantId);
};

export const saveSession = (payload) => {
  const participant = payload?.participant || null;
  const insert = db.prepare(`INSERT INTO sessions (payload, participant_id, participant_email) VALUES (?, ?, ?)`);
  const result = insert.run(
    JSON.stringify(payload),
    participant?.participantId || null,
    participant?.email || null
  );
  const sessionId = result.lastInsertRowid;

  const insertMetrics = db.prepare(`
    INSERT INTO session_metrics (session_id, game_id, score, errors, metrics)
    VALUES (?, ?, ?, ?, ?)
  `);

  extractGamesFromPayload(payload).forEach(([gameId, gameData]) => {
    if (!gameData) return;
    insertMetrics.run(
      sessionId,
      gameId,
      gameData.score || 0,
      gameData.errors || 0,
      JSON.stringify(gameData)
    );
  });

  return sessionId;
};

export const getSession = (id) => {
  const session = db.prepare(`SELECT * FROM sessions WHERE id = ?`).get(id);
  if (!session) return null;

  const metrics = db.prepare(`SELECT * FROM session_metrics WHERE session_id = ?`).all(id);
  return {
    ...session,
    payload: JSON.parse(session.payload),
    metrics
  };
};

export const getAllSessions = () => {
  const sessions = db.prepare(`SELECT * FROM sessions ORDER BY created_at DESC`).all();
  return sessions.map(s => ({ ...s, payload: JSON.parse(s.payload) }));
};

// Simple DB health check: run a lightweight query to ensure DB is responsive
export const checkDb = () => {
  try {
    // run a trivial query; if this throws, DB is not healthy
    const row = db.prepare('SELECT 1 as ok').get();
    return row && row.ok === 1;
  } catch (e) {
    console.error('DB health check failed', e);
    return false;
  }
};
