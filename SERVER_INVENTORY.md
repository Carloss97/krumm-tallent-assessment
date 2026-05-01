# Server Inventory & Migration Notes

This file summarizes the exact endpoints and the DB functions in `server/db.js`, plus concrete migration guidance.

Endpoints (from `server/index.js`)
-
- `GET /health` — simple health check (no auth)
- `GET /ready` — readiness probe (DB health, Gemini key, disk write test)
- `GET /metrics` — Prometheus metrics
- `GET /api/feature-flags` — runtime feature flags
- `POST /api/telemetry` — append telemetry to a local log file (disk write)
- `GET /api/ai/health` — AI connectivity check
- `POST /api/ai/generate` — Gemini generation (rate-limited + circuit-breaker)
- `POST /api/auth/participant` — participant auth, upsert participant, return JWT
- `POST /api/auth/recruiter` — recruiter auth (env-based credentials)
- `POST /api/session` — save assessment session (requires participant JWT)
- `GET /api/session/:id` — get session by id (participant JWT)
- `GET /api/sessions` — list participant sessions
- `GET /api/participant/:id` — participant profile
- `GET /api/recruiter/sessions` — inbox/list sessions (recruiter JWT)
- `GET /api/recruiter/analytics` — recruiter analytics
- `GET /api/recruiter/analytics/v2` — extended analytics (reads calibration files)

Key DB functions (from `server/db.js`)
- `upsertParticipant({ participantId, fullName, email, authenticatedAt })` — inserts or updates `participants` table
- `getParticipantById(participantId)` — returns participant row
- `saveSession(payload)` — inserts into `sessions` (payload JSON) and writes rows to `session_metrics` for each game
- `getSession(id)` — returns session row plus `session_metrics` rows
- `getAllSessions()` — returns all sessions (payload parsed)
- `checkDb()` — executes trivial query to validate DB responsiveness

Suggested Postgres schema mapping (conceptual)
- `participants`:
  - `participant_id` TEXT PRIMARY KEY
  - `full_name` TEXT
  - `email` TEXT
  - `last_auth_at` TIMESTAMP
  - `created_at` TIMESTAMP

- `sessions`:
  - `id` SERIAL PRIMARY KEY
  - `created_at` TIMESTAMP
  - `updated_at` TIMESTAMP
  - `payload` JSONB
  - `participant_id` TEXT (FK -> participants)
  - `participant_email` TEXT

- `session_metrics`:
  - `session_id` INTEGER REFERENCES sessions(id)
  - `game_id` TEXT
  - `score` INTEGER
  - `errors` INTEGER
  - `metrics` JSONB

Migration approach
-
1. Provision a Postgres instance (Neon, Supabase, Cloud SQL).
2. Add `pg` (or `knex`) to the backend and implement a `server/db.pg.js` shim exporting the same functions used by the server.
3. Create the Postgres schema.
4. Export existing SQLite rows and insert them into Postgres (small Node script can read `server/app.db` and write to Postgres). Convert `payload` TEXT -> JSONB.
5. Update `server/index.js` to import the new DB module or make the DB module choose implementation based on `DB_CLIENT` env var.

Edge cases & considerations
-
- Sessions can include large `payload` JSON; consider compression or truncation policy for old rows.
- `POST /api/telemetry` currently writes to a local file — replace with a logging service or write telemetry rows to the managed DB/analytics pipeline.

If you want, I can scaffold `server/db.pg.js` implementing the same exports using `pg` and a simple migration script to copy SQLite -> Postgres.
