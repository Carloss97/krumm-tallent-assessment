# 🌍 Environment Variables Guide

Complete reference for environment variables used in the Krumm Talent Assessment platform across all deployment targets.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Variable Reference](#variable-reference)
3. [Deployment Checklists](#deployment-checklists)
4. [Security Best Practices](#security-best-practices)

---

## Quick Start

### For Local Development

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` with your Gemini API key:
   ```bash
   GEMINI_API_KEY=your-key-here
   ```

3. Run the app:
   ```bash
   npm run dev           # Starts both frontend (Vite) and backend (Express)
   ```

### For Production Deployment

See the [Deployment Checklists](#deployment-checklists) section below for Render and Vercel.

---

## Variable Reference

### 🔴 Core Application

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `NODE_ENV` | string | Yes | — | `development` \| `production` \| `test` |

### 🔌 Backend Server (Express)

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `PORT` | number | Yes | `4000` | Express server listen port |
| `JWT_SECRET_KEY` | string | Yes | `dev-secret-key-change-in-production` | Secret key for JWT signing (⚠️ must be 32+ chars in production) |
| `RECRUITER_EMAIL` | string | Optional | — | Email for recruiter login (if empty, disables recruiter auth) |
| `RECRUITER_PASSWORD` | string | Optional | — | Password for recruiter login |
| `ALLOWED_ORIGINS` | string (CSV) | Yes | `http://localhost:3000` | CORS origins (comma-separated: `http://localhost:3000,https://app.example.com`) |

### 🗄️ Database

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `DB_CLIENT` | string | No | `sqlite` | Database client: `sqlite` \| `pg` |
| `DATABASE_URL` | string | No | — | PostgreSQL connection string (format: `postgresql://[REDACTED]`) |

**How it works:**
- If `DATABASE_URL` is set → uses `pg` (Postgres) automatically
- If `DB_CLIENT=pg` is set → requires `DATABASE_URL`
- Otherwise → uses SQLite at `data/krumm.db`

### 🤖 AI & Generative AI (Google Gemini)

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `GEMINI_API_KEY` | string | Yes | — | Google Generative AI API key (backend only, never expose in frontend) |
| `GEMINI_MODEL` | string | No | `gemini-2.5-flash` | Primary model (fallback: `gemini-2.0-flash`) |

**Security Note:** The backend exposes a proxy endpoint `/api/ai/analyze` so frontend doesn't need the API key directly.

### 📊 Logging & Observability

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `LOG_LEVEL` | string | No | `debug` (dev) / `info` (prod) | Log level: `trace` \| `debug` \| `info` \| `warn` \| `error` \| `fatal` |
| `LOG_COLLECTOR_URL` | string | Optional | — | External log collector URL (e.g., Datadog, Loggly) |
| `LOG_COLLECTOR_API_KEY` | string | Optional | — | API key for log collector |

### 🚦 Rate Limiting

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `RATE_LIMIT_WINDOW_MS` | number | No | `60000` | Time window for rate limiting (milliseconds) |
| `RATE_LIMIT_GLOBAL_MAX_REQUESTS` | number | No | `180` | Max requests per window across all endpoints |
| `RATE_LIMIT_AI_WINDOW_MS` | number | No | `60000` | Time window for AI-specific rate limiting |
| `RATE_LIMIT_AI_MAX_REQUESTS` | number | No | `20` | Max AI requests per window (protects Gemini quota) |

**Important:** In-memory rate limiting only works on single instances. Use Redis (Upstash) for multi-instance deployments.

### 🔌 Redis (Upstash for Distributed Rate Limiting)

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `UPSTASH_REDIS_REST_URL` | string | Optional | — | Upstash Redis REST API endpoint |
| `UPSTASH_REDIS_REST_TOKEN` | string | Optional | — | Upstash Redis REST API token |

**How to obtain:**
1. Create account at [upstash.com](https://upstash.com)
2. Create Redis database (free tier: 10,000 commands/day)
3. Copy "Rest API" URL and token from console

**Fallback:** If not set, uses in-memory rate limiting (only for single-instance development).

### 🛡️ AI Circuit Breaker (Protects Gemini API)

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `AI_CIRCUIT_WINDOW_MS` | number | No | `60000` | Rolling window for counting failures (ms) |
| `AI_CIRCUIT_THRESHOLD` | number | No | `5` | Number of failures before opening circuit |
| `AI_CIRCUIT_OPEN_MS` | number | No | `300000` | Duration circuit stays open (5 minutes) |

**Purpose:** Prevents cascading failures when Gemini API is experiencing issues.

### 🎯 Feature Flags

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `ENABLE_HERO_DEMO` | boolean | No | `true` | Enable hero demo game |
| `HERO_DEMO_PERCENTAGE` | number | No | `100` | Percentage of participants to show demo (0-100) |

### 🎨 Frontend (React/Vite)

| Variable | Type | Required | Default | Purpose |
|----------|------|----------|---------|---------|
| `VITE_API_BASE_URL` | string | Yes | `http://localhost:4000` | Backend API endpoint for frontend requests |
| `VITE_GEMINI_MODEL` | string | No | `gemini-2.5-flash` | Model selection (mirrors backend) |
| `VITE_USE_BACKEND_GEMINI_PROXY` | boolean | No | `true` | Use backend proxy (recommended) |
| `VITE_ALLOW_BROWSER_GEMINI_FALLBACK` | boolean | No | `false` | Allow direct Gemini API if backend proxy fails |
| `VITE_GEMINI_API_KEY` | string | Optional | — | **DO NOT USE IN PRODUCTION.** Only for fallback when backend is unavailable. |
| `VITE_BASE_PATH` | string | No | `/` | Base path for app routing (e.g., `/app` for subdirectory deployment) |

**Security Note:** Frontend environment variables are embedded in the built JavaScript. Never put secrets in frontend variables. Use `VITE_` prefix only for public configuration.

---

## Deployment Checklists

### ✅ Local Development Setup

```bash
# 1. Copy template
cp .env.local.example .env.local

# 2. Edit .env.local
# - Set GEMINI_API_KEY (get from Google Cloud)
# - Optionally set RECRUITER_EMAIL and RECRUITER_PASSWORD

# 3. Install dependencies
npm ci

# 4. Start development servers (frontend + backend)
npm run dev

# 5. Verify
# Frontend: http://localhost:5173
# Backend: http://localhost:4000
# Health: curl http://localhost:4000/health
```

### ✅ Render Backend Deployment

#### Step 1: Prepare Environment Variables

From `.env.render.example`, gather:
- `JWT_SECRET_KEY` (generate secure 32-char key)
- `RECRUITER_EMAIL` and `RECRUITER_PASSWORD`
- `ALLOWED_ORIGINS` (your Vercel frontend URL)
- `DATABASE_URL` (from Neon, step below)
- `GEMINI_API_KEY` (from Google Cloud)
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` (from Upstash)

#### Step 2: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech)
2. Create account and new project
3. Copy **Connection String** (pooled endpoint):
   ```
   postgresql://[REDACTED]
   ```
4. This is your `DATABASE_URL`

#### Step 3: Set Up Upstash Redis

1. Go to [upstash.com](https://upstash.com)
2. Create Redis database (free tier)
3. Copy **Rest URL** → `UPSTASH_REDIS_REST_URL`
4. Copy **Rest Token** → `UPSTASH_REDIS_REST_TOKEN`

#### Step 4: Deploy to Render

1. Connect GitHub repo to [render.com](https://render.com)
2. Create new **Web Service** with:
   - **Build Command:** `npm install`
   - **Start Command:** `node server/index.js`
3. Go to **Environment** tab, add all variables from `.env.render.example`
4. Click **Create Web Service**
5. Render will auto-deploy; copy the service URL (e.g., `https://krumm-backend.onrender.com`)

### ✅ Vercel Frontend Deployment

#### Step 1: Prepare Environment Variables

From `.env.vercel.example`:
- `VITE_API_BASE_URL` = Render backend URL (from previous step)
- `VITE_GEMINI_MODEL` = `gemini-2.5-flash`
- `VITE_USE_BACKEND_GEMINI_PROXY` = `true`

#### Step 2: Deploy to Vercel

1. Connect GitHub repo to [vercel.com](https://vercel.com)
2. Create new project (Vercel auto-detects Vite)
3. Go to **Settings > Environment Variables**
4. Add `VITE_API_BASE_URL=https://krumm-backend.onrender.com` (your Render URL)
5. Click **Deploy**
6. Vercel will:
   - Run `npm install`
   - Run `npm run build` (Vite build)
   - Deploy `dist/` folder to CDN

---

## Security Best Practices

### 🔐 Secret Management

| Variable | Backend | Frontend | Notes |
|----------|---------|----------|-------|
| `JWT_SECRET_KEY` | ✅ Server only | ❌ Never | Needed for JWT signing |
| `GEMINI_API_KEY` | ✅ Server only | ❌ Never | Backend proxy prevents frontend exposure |
| `RECRUITER_PASSWORD` | ✅ Server only | ❌ Never | Basic auth for admin endpoints |
| `UPSTASH_REDIS_REST_TOKEN` | ✅ Server only | ❌ Never | Rate limiting backend only |

### ✨ Public Configuration (Safe in Frontend)

These can be set as `VITE_*` variables:
- `VITE_API_BASE_URL` — Backend endpoint
- `VITE_GEMINI_MODEL` — Model name
- `VITE_USE_BACKEND_GEMINI_PROXY` — Feature flag
- `VITE_BASE_PATH` — Routing base path

### 📝 Never Commit

- `.env` files (use `.env.example` templates only)
- Actual API keys or passwords
- Private connection strings (use templates with placeholders)

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
*.pem
*.key
```

### 🔄 Rotating Secrets

When you need to rotate `JWT_SECRET_KEY`:
1. Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Update in Render environment
3. Old JWTs will become invalid; participants must re-authenticate

---

## FAQ

**Q: Can I use the same JWT_SECRET_KEY in development and production?**
A: No. Development key is fine for testing, but production needs a secure 32+ character key. Never use dev keys in production.

**Q: What if I forget GEMINI_API_KEY?**
A: Backend will throw error on first AI request. Renders will show 503 error until key is added.

**Q: Can frontend access Gemini API directly?**
A: Only if `VITE_GEMINI_API_KEY` is set AND `VITE_USE_BACKEND_GEMINI_PROXY=false`. Not recommended for production (exposes API key).

**Q: Do I need Redis for local development?**
A: No. In-memory rate limiting works for single instance. Leave `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` empty for local dev.

**Q: How often do I need to rotate `UPSTASH_REDIS_REST_TOKEN`?**
A: Only if you suspect compromise. Upstash allows token rotation in console.

---

## Next Steps

1. **For local development:** Copy `.env.local.example` → `.env.local` and fill in GEMINI_API_KEY
2. **For production:** Follow the [Deployment Checklists](#deployment-checklists) in order
3. **For security audit:** Run `npm audit` and review logs for any exposed secrets

Last updated: May 3, 2026
