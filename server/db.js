import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'app.db');
const db = new Database(dbPath);

// Create tables if not exist
const createTables = () => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      payload TEXT
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

export const saveSession = (payload) => {
  const insert = db.prepare(`INSERT INTO sessions (payload) VALUES (?)`);
  const result = insert.run(JSON.stringify(payload));
  const sessionId = result.lastInsertRowid;

  const insertMetrics = db.prepare(`
    INSERT INTO session_metrics (session_id, game_id, score, errors, metrics)
    VALUES (?, ?, ?, ?, ?)
  `);

  Object.entries(payload).forEach(([gameId, gameData]) => {
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
