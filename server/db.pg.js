import pg from 'pg';

const { Pool } = pg;

let pool = null;

// Initialize connection pool with Neon (or any PostgreSQL) connection string
const getPool = () => {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error(
        'DATABASE_URL environment variable is required for PostgreSQL. ' +
        'Get it from Neon console: Settings > Connection string > Pooled endpoint'
      );
    }

    pool = new Pool({
      connectionString,
      // Connection pooling settings optimized for serverless (Render, Neon)
      max: 20,                           // Max connections in pool
      idleTimeoutMillis: 30000,         // Close idle connections after 30s
      connectionTimeoutMillis: 5000,    // Timeout after 5s if can't get connection
      allowExitOnIdle: true,            // Allow graceful shutdown
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  return pool;
};

// Graceful shutdown
export const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
  }
};

// Initialize database schema
const createTables = async () => {
  const client = await getPool().connect();
  try {
    // Create participants table
    await client.query(`
      CREATE TABLE IF NOT EXISTS participants (
        participant_id TEXT PRIMARY KEY,
        full_name TEXT,
        email TEXT,
        last_auth_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create sessions table
    await client.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        payload JSONB,
        participant_id TEXT,
        participant_email TEXT,
        FOREIGN KEY(participant_id) REFERENCES participants(participant_id) ON DELETE SET NULL
      )
    `);

    // Create indexes for common queries
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_participant_id 
      ON sessions(participant_id) 
      WHERE participant_id IS NOT NULL
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_sessions_created_at 
      ON sessions(created_at DESC)
    `);

    // Create session_metrics table
    await client.query(`
      CREATE TABLE IF NOT EXISTS session_metrics (
        id SERIAL PRIMARY KEY,
        session_id INTEGER NOT NULL,
        game_id TEXT,
        score INTEGER,
        errors INTEGER,
        metrics JSONB,
        FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
      )
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_session_metrics_session_id 
      ON session_metrics(session_id)
    `);

  } catch (err) {
    console.error('[DB] Error initializing PostgreSQL schema:', err.message);
    throw err;
  } finally {
    client.release();
  }
};

// Initialize on first connection
let schemaInitialized = false;
const ensureSchema = async () => {
  if (!schemaInitialized) {
    await createTables();
    schemaInitialized = true;
  }
};

// Helper to extract game data from payload (same logic as SQLite)
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

/**
 * Upsert participant record
 */
export const upsertParticipant = async ({ participantId, fullName, email, authenticatedAt }) => {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const query = `
      INSERT INTO participants (participant_id, full_name, email, last_auth_at, created_at, updated_at)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(participant_id) DO UPDATE SET
        full_name = COALESCE(EXCLUDED.full_name, participants.full_name),
        email = COALESCE(EXCLUDED.email, participants.email),
        last_auth_at = EXCLUDED.last_auth_at,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;
    
    const result = await client.query(query, [
      participantId,
      fullName || null,
      email || null,
      authenticatedAt || new Date().toISOString()
    ]);
    
    return result.rows[0];
  } finally {
    client.release();
  }
};

/**
 * Get participant by ID
 */
export const getParticipantById = async (participantId) => {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM participants WHERE participant_id = $1',
      [participantId]
    );
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

/**
 * Save session and associated game metrics
 */
export const saveSession = async (payload) => {
  await ensureSchema();
  const client = await getPool().connect();
  
  try {
    await client.query('BEGIN');

    const participant = payload?.participant || null;
    
    // Insert session
    const sessionResult = await client.query(
      `INSERT INTO sessions (payload, participant_id, participant_email)
       VALUES ($1, $2, $3)
       RETURNING id`,
      [
        JSON.stringify(payload),
        participant?.participantId || null,
        participant?.email || null
      ]
    );

    const sessionId = sessionResult.rows[0].id;

    // Insert game metrics
    const games = extractGamesFromPayload(payload);
    if (games.length > 0) {
      const metricsQuery = `
        INSERT INTO session_metrics (session_id, game_id, score, errors, metrics)
        VALUES ($1, $2, $3, $4, $5)
      `;

      for (const [gameId, gameData] of games) {
        if (!gameData) continue;
        await client.query(metricsQuery, [
          sessionId,
          gameId,
          gameData.score || 0,
          gameData.errors || 0,
          JSON.stringify(gameData)
        ]);
      }
    }

    await client.query('COMMIT');
    return sessionId;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get session with metrics
 */
export const getSession = async (id) => {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const sessionResult = await client.query(
      'SELECT * FROM sessions WHERE id = $1',
      [id]
    );

    if (sessionResult.rows.length === 0) return null;

    const session = sessionResult.rows[0];
    
    const metricsResult = await client.query(
      'SELECT * FROM session_metrics WHERE session_id = $1',
      [id]
    );

    return {
      ...session,
      payload: session.payload, // Already JSONB in PostgreSQL
      metrics: metricsResult.rows
    };
  } finally {
    client.release();
  }
};

/**
 * Get all sessions (ordered by creation date descending)
 */
export const getAllSessions = async () => {
  await ensureSchema();
  const client = await getPool().connect();
  try {
    const result = await client.query(
      'SELECT * FROM sessions ORDER BY created_at DESC'
    );
    return result.rows.map(s => ({
      ...s,
      payload: s.payload  // Already JSONB
    }));
  } finally {
    client.release();
  }
};

/**
 * Health check - verify database connectivity
 */
export const checkDb = async () => {
  try {
    await ensureSchema();
    const client = await getPool().connect();
    try {
      const result = await client.query('SELECT 1 as health');
      return result.rows[0].health === 1;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[DB] PostgreSQL health check failed:', err.message);
    return false;
  }
};
