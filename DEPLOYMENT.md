# Deployment and Hosting Guide

This file covers deployment options and steps for both frontend and backend, and highlights compatibility concerns for Cloudflare Pages.

Frontend (recommended: Cloudflare Pages or any static host)
-
- Build the frontend assets:

```bash
npm install
npm run build
```

- The output is in `dist/`. Deploy `dist/` to Cloudflare Pages, Netlify, Vercel (static), S3 + CDN, or similar.

- If you deploy to Pages, configure environment variables used at build-time (Vite `VITE_*` vars) in the Pages build settings.

Backend (requires Node environment)
-
- Current backend requires native modules (`better-sqlite3`) and writable disk. Cloudflare Pages/Workers are incompatible with these requirements.

Recommended hosting options for the backend:
- Render / Fly / Railway / Heroku / Cloud Run / a small VM — these support Node and native modules and provide persistent storage or managed DB connectivity.

If you want a serverless approach (Cloudflare Workers)
-
- You must remove native modules and persistent local storage. Replace local SQLite with a hosted DB (Postgres via Neon/Supabase) or Cloudflare D1 (note: D1 has API differences).
- Replace disk writes (telemetry and health probe files) with object storage or logging endpoints (Cloudflare R2, S3, GCS) or external logging (Datadog/Logflare).

Environment variables (important)
-
- `PORT` — backend port (default `4000`)
- `GOOGLE_API_KEY` / `GEMINI_API_KEY` — required for Gemini usage
- `RECRUITER_EMAIL` / `RECRUITER_PASSWORD` — simple demo credentials used in `POST /api/auth/recruiter`
- `CORS_ORIGINS` or `ALLOWED_ORIGINS` — comma-separated origins allowed for CORS
- `VITE_*` env vars — used by Vite during frontend build (set them in Pages or CI)

Local development (recommended)
-
- Start both frontend and backend together (concurrently):

```bash
npm install
npm run dev
```

- Notes about ports:
  - `npm run dev` launches the frontend on port `5174` (script uses `vite --port 5174`) and backend on `4000` by default. Vite proxy (development) points to `http://localhost:4000`.
  - `npm run dev:full` runs `vite` (default port) and the backend; behavior differs slightly because `dev:frontend` doesn't set a fixed port.

DB migration notes
-
- If you choose Postgres (recommended):
  - Create a managed Postgres DB (Neon, Supabase, AWS RDS).
  - Update `server/db.js` to use a Postgres client (`pg` or `knex`) and implement the same logical operations: `upsertParticipant`, `saveSession`, `getSession`, `getAllSessions`, `checkDb`.
  - Migrate existing `server/app.db` if you need historical data. A simple export/import script (read SQLite rows and INSERT into Postgres) will suffice.

Telemetry and logs
-
- Current code appends telemetry to disk (`.runtime/share/telemetry.log`). For cloud deployment replace that with:
  - Logging service (Datadog, Logflare, Papertrail) or
  - Object storage (R2/S3) with periodic batch uploads or
  - An internal telemetry ingestion endpoint that writes to the managed DB.

Quick checklist to switch to Cloudflare Pages (frontend) + managed backend
-
- [ ] Build and publish `dist/` to Pages.
- [ ] Deploy backend to Node host and point Vite proxy / production frontend API base to its public URL.
- [ ] Migrate DB to managed Postgres and update `server/db.js`.
- [ ] Replace local telemetry writes with cloud logging.
- [ ] Secure environment variables on both hosts (keys and secrets).
