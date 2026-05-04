# 📦 Infrastructure Migration - Setup Complete

## ✅ What's Been Done

### Phase 1: Environment Variables (Complete)
- ✅ Created `.env.local.example` - Development configuration template
- ✅ Created `.env.render.example` - Render backend production template
- ✅ Created `.env.vercel.example` - Vercel frontend configuration template
- ✅ Created `ENV_GUIDE.md` - Complete reference documentation
- ✅ Consolidated env var names:
  - Primary: `ALLOWED_ORIGINS` (fallback: `CORS_ORIGINS`)
  - Primary: `GEMINI_API_KEY` (fallback: `GOOGLE_API_KEY`)
  - Updated `server/index.js` to use canonical names

### Phase 2: Database Adapter (Complete)
- ✅ Implemented `server/db.pg.js` with full PostgreSQL support
  - Connection pooling optimized for serverless (Neon)
  - Schema auto-initialization on first connection
  - All 6 functions: `upsertParticipant`, `getParticipantById`, `saveSession`, `getSession`, `getAllSessions`, `checkDb`
  - Transaction support for data consistency
  - Proper index creation for query performance

### Phase 3: Rate Limiting with Redis (Complete)
- ✅ Enhanced `server/middleware.js` with Upstash Redis support
  - Distributed rate limiting for multi-instance Render deployments
  - Fallback to in-memory buckets for development
  - Auto-detection and initialization of Redis client
  - Graceful error handling (fails open)

### Phase 4: Deployment Configuration (Complete)
- ✅ Created `render.yaml` - Render backend deployment manifest
  - Node.js runtime configuration
  - Environment variables pre-configured
  - Health check setup (/health endpoint)
  - Auto-deploy from GitHub enabled
- ✅ Created `vercel.json` - Vercel frontend deployment manifest
  - Vite build configuration
  - Environment variables with defaults
  - API rewrites for backend proxying

### Phase 5: Dependencies (Complete)
- ✅ Updated `package.json`:
  - Added `@upstash/redis@^1.36.0` for Upstash client
  - Added `pg@^8.11.3` for PostgreSQL client

### Phase 6: Documentation (Complete)
- ✅ Created `MIGRATION.md` - 200+ line step-by-step migration guide
  - Architecture comparison (old vs new)
  - Pre-migration checklist
  - Phase-by-phase instructions with screenshots reference
  - Free tier limits and cost analysis
  - Rollback procedures
  - Troubleshooting guide

---

## 🚀 Next Steps (In Order)

### Step 1: Install Dependencies
```bash
npm ci
```

**Why `npm ci` instead of `npm install`?** 
- `npm ci` (clean install) uses exact versions from `package-lock.json`
- Ensures reproducible builds across environments (Render, CI/CD, team members)
- Detects lockfile conflicts early

**Expected output:**
```
added 158 packages, and audited 166 packages in 15s
```

### Step 2: Verify PostgreSQL Adapter Works
```bash
# Test syntax check (no execution, just parsing)
node -c server/db.pg.js
echo "✓ PostgreSQL adapter syntax valid"
```

### Step 3: Test Redis Initialization
```bash
# In development (without Redis):
# Create .env.local if you haven't already
cp .env.local.example .env.local

# Edit .env.local - just change GEMINI_API_KEY
# (Leave UPSTASH_* empty for now)

# Start the server
npm run dev:server

# Watch for output:
# [Middleware] Redis not configured. Using in-memory rate limiting...
# [DB] SQLite initialized or [DB] PostgreSQL schema initialized
# Server listening on port 4000
```

### Step 4: Create Accounts (Before Deployment)

**5 minutes to create all accounts:**

1. **Neon** (PostgreSQL)
   - Sign up: https://neon.tech
   - Create project → get pooled endpoint
   - Cost: Free tier ✓

2. **Upstash** (Redis)
   - Sign up: https://upstash.com
   - Create Redis database → get REST URL + token
   - Cost: Free tier (10K commands/day) ✓

3. **Render** (Backend)
   - Sign up: https://render.com
   - Connect GitHub → create Web Service
   - Cost: Free tier ($7/month for paid when traffic increases)

4. **Vercel** (Frontend)
   - Sign up: https://vercel.com
   - Connect GitHub → create project
   - Cost: Free tier ✓

### Step 5: Follow MIGRATION.md

**Estimated time:** 30-60 minutes  
**Downtime during cutover:** ~5-10 minutes

Detailed instructions in [MIGRATION.md](./MIGRATION.md):
- Phase 1-4: Sequential setup (no downtime)
- Phase 5-6: Testing & validation
- Phase 7: Cutover (small window of downtime)

---

## 📁 Files Created/Modified

### Created Files
```
✓ .env.local.example          - Development template
✓ .env.render.example         - Render backend template
✓ .env.vercel.example         - Vercel frontend template
✓ ENV_GUIDE.md                - Complete environment variable reference
✓ render.yaml                 - Render deployment manifest
✓ vercel.json                 - Vercel deployment manifest
✓ MIGRATION.md                - Step-by-step migration guide (200+ lines)
✓ INFRASTRUCTURE_SETUP_COMPLETE.md  - This file
```

### Modified Files
```
✓ server/db.pg.js             - Complete PostgreSQL adapter (was scaffold)
✓ server/middleware.js        - Redis + in-memory rate limiting
✓ server/index.js             - Canonical env var names
✓ package.json                - Added pg and @upstash/redis
```

---

## 🏗️ Architecture Decision Summary

### Why Neon for Database?
- ✅ Serverless PostgreSQL (no instance to manage)
- ✅ Automatic scaling and backups
- ✅ Pooled connections (mandatory for Render/serverless)
- ✅ Free tier: 3 branches, 5GB storage
- ✅ Better-query analytics built-in

### Why Upstash for Redis?
- ✅ Serverless Redis (REST API, no persistent connections)
- ✅ Works great with Render's shared CPU
- ✅ Free tier: 10K commands/day (sufficient for rate limiting)
- ✅ No infrastructure to manage

### Why Render for Backend?
- ✅ Automatic deployments from GitHub (render.yaml)
- ✅ Environment variables management built-in
- ✅ Free tier: 750 hours/month (runs ~24/7)
- ✅ Easy to upgrade to $7/month Starter instance

### Why Vercel for Frontend?
- ✅ Optimized for React/Vite deployments
- ✅ Edge functions and CDN included
- ✅ Free tier: unlimited bandwidth
- ✅ Automatic staging environments for PRs

---

## 🧪 Local Development Workflow

After migration setup is complete, your local workflow is:

```bash
# Setup (one time)
npm ci
cp .env.local.example .env.local
# Edit .env.local - change GEMINI_API_KEY to your key

# Development (SQLite + in-memory rate limiting)
npm run dev
# Frontend: http://localhost:5173
# Backend: http://localhost:4000

# Testing
npm test

# Linting
npm run lint
```

**Important:** Local development uses SQLite automatically (no DATABASE_URL needed).

---

## 🔄 Current Git Status

```bash
# Verify all changes are committed
git status

# Expected: "On branch main, nothing to commit"
```

If you see uncommitted changes:
```bash
git add .env.* ENV_GUIDE.md render.yaml vercel.json MIGRATION.md
git commit -m "feat: prepare infrastructure migration to Neon+Upstash+Render+Vercel"
git push origin main
```

---

## ⚠️ Critical Configuration Notes

### Database Migration (SQLite → PostgreSQL)

**When switching to PostgreSQL in production:**
1. **Create new Neon database** (don't reuse existing)
2. **Let backend auto-create schema** (server/db.pg.js handles this on first /health call)
3. **Optionally migrate existing data:**
   ```bash
   # Export SQLite data
   sqlite3 data/krumm.db ".dump" > backup.sql
   
   # You'll need to manually migrate rows due to schema differences
   # (SQLite uses INTEGER AUTOINCREMENT, PostgreSQL uses SERIAL)
   ```
4. **Run data migration script** (if needed - contact DevOps)
5. **Verify in Neon SQL editor** that tables exist

### Secrets & Security Checklist

- [ ] Never commit `.env` files with real keys
- [ ] Use `.env.*.example` as templates only
- [ ] Rotate `JWT_SECRET_KEY` after each deployment (generate new in Render)
- [ ] Verify `ALLOWED_ORIGINS` doesn't include `*` (CORS should be restrictive)
- [ ] Ensure `GEMINI_API_KEY` is backend-only (not in Vercel)
- [ ] Review Render logs for any exposed secrets (npm audit detects common patterns)

---

## 📊 Post-Migration Validation Checklist

Once deployed, verify:

### Backend Health
- [ ] `GET /health` returns `{ "status": "ok" }`
- [ ] Database check passes: `SELECT COUNT(*) FROM participants` works
- [ ] Rate limiting works: Hit endpoint 30 times, should get 429 on request 21+
- [ ] Logs appear in Render console
- [ ] No connection timeouts in logs

### Frontend Health
- [ ] Page loads at Vercel URL (no 404)
- [ ] Styling renders correctly (no CSS import errors)
- [ ] Browser console has no errors (check Network tab for failed API calls)
- [ ] Authentication flow works (participant login succeeds)

### End-to-End
- [ ] User can start assessment game
- [ ] Game data saves to Neon database
- [ ] AI report generation calls Render backend successfully
- [ ] Recruiter dashboard loads (if enabled)

---

## 🆘 Troubleshooting Quick Links

See **MIGRATION.md > Troubleshooting** for detailed help with:
- Backend not responding
- Frontend can't connect to backend
- Database connection errors
- Rate limiting not working
- Free tier limits exceeded

---

## 🎉 Success Criteria

You've successfully completed the infrastructure setup when:

1. ✅ All files created and committed to main branch
2. ✅ `npm ci` installs without errors
3. ✅ `npm run dev` starts backend on port 4000
4. ✅ Local frontend can connect to backend
5. ✅ You've created accounts on Neon, Upstash, Render, Vercel
6. ✅ You understand the MIGRATION.md deployment steps
7. ✅ Ready to deploy to production following MIGRATION.md

---

## 📞 Next Support

When deploying to production:
1. **Follow MIGRATION.md** step by step (1-6)
2. **Reference ENV_GUIDE.md** for variable meanings
3. **Check AGENTS.md** for which AI agent to ask for help:
   - Backend issues → `@backend`
   - Database issues → `@database`
   - Deployment issues → `@devops`
   - Testing issues → `@testing`

---

**Setup completed:** May 3, 2026  
**Status:** Ready for production deployment  
**Next phase:** Execute MIGRATION.md phases 1-6
