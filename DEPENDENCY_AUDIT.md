# Dependency Audit — Native / Incompatible Modules

This file lists dependencies in the project that are problematic for Cloudflare Pages/Workers or other serverless targets and offers concrete alternatives.

Frontend dependencies (safe for static hosting)
-
- `react`, `react-dom`, `react-router-dom`, `framer-motion`, `recharts`, `lucide-react`, `classnames`.
- These are browser-side only and are suitable for Cloudflare Pages.

Backend dependencies (Node/runtime specific)
-
- `express`, `cors`, `helmet`, `compression`, `dotenv`, `jsonwebtoken`, `pino`, `prom-client`, `uuid`, `@google/generative-ai`.
- These belong to the API/runtime layer and should not be shipped as part of a purely static frontend deployment.

Problematic dependencies
-
- `better-sqlite3` (dependency) — native C++ addon. Requires Node with native module support. Incompatible with Cloudflare Pages/Workers and most serverless JS runtimes that don't support arbitrary native modules.
- `sharp` (devDependency) — native image processing library. Requires native binaries; cannot run in Workers/Pages Functions.
- `png-to-ico` (devDependency) — may rely on native bindings or external binaries depending on environment; treat as potentially incompatible.

Other environment-sensitive packages (dev only)
- `playwright` — downloads browser binaries and is heavy; OK for CI but not for lightweight serverless environments.

Impact summary
-
- These native modules prevent running the backend in Cloudflare Pages/Workers. If you wish to keep Cloudflare Pages for the frontend, the backend must be hosted in a Node environment that supports native modules (Render, Fly, Railway, VM, Cloud Run), or the DB/storage layer must be rewritten to a serverless-compatible approach.

Concrete alternatives and recommendations
-
- Database (`better-sqlite3`):
  - Recommended: migrate to a managed Postgres database (Neon, Supabase, Render Postgres, AWS RDS). Pros: scalable, serverless-compatible, widely supported client libraries (`pg`).
  - If you want to stay within Cloudflare: evaluate Cloudflare D1 (SQLite-compatible SQL), but note API differences and size/latency constraints; you'll still need to rewrite DB access code.

- Image processing (`sharp`, `png-to-ico`):
  - Option A: Move image processing to a build step (CI) so runtime doesn't need `sharp`.
  - Option B: Use a cloud image service (Imgix, Cloudinary) or a server-side function in a proper Node host that supports `sharp`.

- If you must run entirely under Cloudflare Workers:
  - Remove native modules and replace local DB with external API (managed Postgres, Supabase, Neon) or Cloudflare D1.
  - Replace filesystem writes (telemetry) with R2 or external logging service.

Practical migration notes
-
- Add `pg` (or `knex`) to `dependencies` and implement a `server/db.pg.js` that mirrors existing `server/db.js` behavior using `jsonb` for payloads.
- If preserving historical SQLite data, write a small migration script that reads rows from `server/app.db` and inserts into Postgres.

Security & operational notes
-
- Keep API keys out of the repo; store them in host-provided environment variables.
- Configure connection pooling and sensible `PG` timeouts for serverless environments.

If you want, I can generate a starter `server/db.pg.js` (using `pg`) that implements the same exported functions as `server/db.js` to accelerate migration.
