# 🚀 Infrastructure Migration Guide

Migrate from **Cloudflare Pages** (monolithic) to **Neon + Upstash + Render + Vercel** (scalable, free tier friendly).

**Duration:** 2-4 hours  
**Downtime:** ~5-10 minutes during final cutover  
**Rollback:** Available via DNS switching

---

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Pre-Migration Checklist](#pre-migration-checklist)
3. [Phase 1: Database Setup (Neon)](#phase-1-database-setup-neon)
4. [Phase 2: Cache Setup (Upstash)](#phase-2-cache-setup-upstash)
5. [Phase 3: Backend Deployment (Render)](#phase-3-backend-deployment-render)
6. [Phase 4: Frontend Deployment (Vercel)](#phase-4-frontend-deployment-vercel)
7. [Phase 5: Testing & Validation](#phase-5-testing--validation)
8. [Phase 6: DNS & Cutover](#phase-6-dns--cutover)
9. [Rollback Procedures](#rollback-procedures)

---

## 🏗️ Architecture Overview

### Current Architecture (Cloudflare Pages)
```
┌─────────────────────────┐
│   Cloudflare Pages      │
│  ├─ Frontend (React)    │
│  └─ Backend (Express)   │  ← Same origin, tight coupling
└─────────────────────────┘
         │
         └─→ SQLite (local file storage)
```

**Problems:**
- Cannot scale independently
- Difficult to separate concerns
- SQLite not suitable for production
- No distributed rate limiting

### New Architecture (Neon + Upstash + Render + Vercel)
```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │     │    Render    │     │ Neon + Query │
│  (Frontend)  │────▶│  (Backend)   │────▶│     Pool     │
│   React      │     │   Express    │     │   PostgreSQL │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            └──────────┐
                                       │
                    ┌──────────────────▼──┐
                    │  Upstash Redis      │
                    │  (Rate Limiting)    │
                    └─────────────────────┘
```

**Benefits:**
- ✅ Frontend and backend scale independently
- ✅ Production-grade PostgreSQL (Neon)
- ✅ Distributed rate limiting (Upstash)
- ✅ Separation of concerns
- ✅ Free tier supports 1M+ requests/month
- ✅ Easy to upgrade individual components

---

## ✅ Pre-Migration Checklist

Before starting, ensure you have:

- [ ] GitHub account (for deployment)
- [ ] Render account (free tier: https://render.com)
- [ ] Vercel account (free tier: https://vercel.com)
- [ ] Neon account (free tier: https://neon.tech)
- [ ] Upstash account (free tier: https://upstash.com)
- [ ] Current environment variables documented
- [ ] Backup of current database (export from Cloudflare)
- [ ] DNS access (if using custom domain)
- [ ] Code pushed to GitHub main branch

**Total signup time:** ~15 minutes (all free)

---

## 🗄️ Phase 1: Database Setup (Neon)

### Step 1a: Create Neon Project

1. Go to **[neon.tech](https://neon.tech)** → Sign up (free tier)
2. Create new project:
   - **Project name:** `krumm-production`
   - **Database name:** `krumm_db`
   - **Region:** Select closest to your users (e.g., `us-west-2`)
3. Click **Create project**

### Step 1b: Get Connection String

1. In Neon console, go to **Connection Details**
2. Switch to **Pooled Connection** (important for serverless!)
   - Format: `postgresql://[REDACTED]`
3. Copy the **Pooled endpoint** URL
4. Store in a secure location (will use in Render config)

**⚠️ Important:** Use **pooled endpoint**, not direct endpoint. Pooling is required for serverless.

### Step 1c: Initialize Schema (Optional)

If you want to pre-populate schema before backend deployment:

1. Click **SQL Editor** in Neon console
2. Run schema creation SQL (already handled by `server/db.pg.js` on first connection)
3. Or: Skip this; backend will auto-create tables on first health check

---

## 🔴 Phase 2: Cache Setup (Upstash)

### Step 2a: Create Upstash Redis Database

1. Go to **[upstash.com](https://upstash.com)** → Sign up (free tier)
2. Create new Redis database:
   - **Name:** `krumm-rate-limit`
   - **Region:** Same as Neon if possible (e.g., `us-west-2`)
   - **Tier:** Free
3. Click **Create**

### Step 2b: Get REST API Credentials

1. Click on your database → **Details**
2. Scroll to **REST API** section
3. Copy:
   - **Rest URL:** `https://...upstash.io`
   - **Rest Token:** `Bearer ...`
4. Store both (will use in Render config)

**Why REST API?** Works in serverless without persistent connections. Upstash REST client is async-friendly.

---

## ⚙️ Phase 3: Backend Deployment (Render)

### Step 3a: Connect GitHub Repository

1. Go to **[render.com](https://render.com)** → Sign up (free tier)
2. Click **New +** → **Web Service**
3. Select **GitHub** and authorize
4. Select repository: `Carloss97/krumm-tallent-assessment`
5. Choose branch: `main`

### Step 3b: Configure Build & Start

Render auto-detects from `package.json`, but verify:

- **Build Command:** `npm install`
- **Start Command:** `node server/index.js`
- **Environment:** `Node`
- **Node version:** Latest (18+)

### Step 3c: Add Environment Variables

In Render dashboard, go to **Environment** tab and add all from `.env.render.example`:

**Critical (Required):**
- `JWT_SECRET_KEY` = Generate secure 32-char key:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- `DATABASE_URL` = Neon pooled endpoint (from Phase 1)
- `GEMINI_API_KEY` = Your Google Gemini API key
- `ALLOWED_ORIGINS` = Will set in Phase 4 after Vercel URL is known

**Important:**
- `UPSTASH_REDIS_REST_URL` = From Phase 2
- `UPSTASH_REDIS_REST_TOKEN` = From Phase 2
- `DB_CLIENT=pg`

**Optional:**
- `RECRUITER_EMAIL` and `RECRUITER_PASSWORD` (admin login)
- `LOG_LEVEL=info` (production)
- Feature flags: `ENABLE_HERO_DEMO=false`, `HERO_DEMO_PERCENTAGE=0`

### Step 3d: Deploy

1. Click **Create Web Service**
2. Render will:
   - Clone repo
   - Run `npm install`
   - Run `npm run build` (if exists; Express doesn't need build)
   - Start `node server/index.js`
3. Wait for build to complete (~2-3 minutes)
4. When deployment is **Live**, you'll see a green checkmark
5. Note the **Service URL**: `https://krumm-backend.onrender.com`

### Step 3e: Test Backend

```bash
# From your local machine:
curl https://krumm-backend.onrender.com/health

# Expected response:
# { "status": "ok", "uptime": "..." }
```

If health check fails:
- Check logs in Render dashboard: **Logs** tab
- Verify DATABASE_URL is set and accessible
- Verify GEMINI_API_KEY is valid

---

## 🎨 Phase 4: Frontend Deployment (Vercel)

### Step 4a: Connect GitHub Repository

1. Go to **[vercel.com](https://vercel.com)** → Sign up (free tier)
2. Click **Add New** → **Project**
3. Select GitHub → Authorize → Select repo
4. Select branch: `main`

### Step 4b: Configure Build Settings

Vercel auto-detects Vite, but verify:

- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Framework:** Vite (auto-detected)

### Step 4c: Add Environment Variables

Go to **Settings > Environment Variables** and add:

**Critical:**
- `VITE_API_BASE_URL` = Render service URL (from Phase 3)
  - Example: `https://krumm-backend.onrender.com`

**Recommended:**
- `VITE_USE_BACKEND_GEMINI_PROXY=true` (security best practice)
- `VITE_GEMINI_MODEL=gemini-2.5-flash`
- `VITE_ALLOW_BROWSER_GEMINI_FALLBACK=false`
- `VITE_BASE_PATH=/`

### Step 4d: Deploy

1. Click **Deploy**
2. Vercel will:
   - Clone repo
   - Run `npm install`
   - Run `npm run build` (Vite build to `dist/`)
   - Deploy `dist/` to CDN
3. Wait for deployment (~3-5 minutes)
4. When **Deployment completed**, note the **Production URL**: `https://yourproject.vercel.app`

### Step 4e: Update Backend CORS

Now that Vercel URL is known, update Render environment:

1. Go back to **Render dashboard** → Your app → **Settings > Environment**
2. Find `ALLOWED_ORIGINS` variable
3. Set to: `https://yourproject.vercel.app,https://www.yourapp.com`
   - Include custom domain if you have one
   - Vercel auto-redirects all subdomains to main domain
4. Click **Save**
5. Render auto-redeploys with new env vars

---

## 🧪 Phase 5: Testing & Validation

### Test Backend

```bash
# Health check
curl https://krumm-backend.onrender.com/health

# Database connectivity
curl https://krumm-backend.onrender.com/health | jq .database

# Rate limiting (hit endpoint 50 times quickly)
for i in {1..50}; do
  curl https://krumm-backend.onrender.com/api/feature-flags \
    -H "Authorization: Bearer test" &
done
wait
```

### Test Frontend

1. Go to `https://yourproject.vercel.app`
2. Verify page loads and styling is correct
3. Try authentication flow:
   - Participant login (should work via backend)
   - Check browser console for errors
   - Verify API calls go to Render backend (check Network tab)
4. Run assessment game:
   - Complete a game
   - Should see telemetry data in console
   - Verify Gemini AI integration works (test report generation)
5. Check recruiter login (if enabled)

### Test Database

```bash
# From Neon console or via backend:
# Backend auto-creates schema on first /health call

# Verify tables exist by running query in Neon SQL editor:
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

# Should see: participants, sessions, session_metrics
```

### Test Rate Limiting

```bash
# Hit rate-limited endpoint (e.g., /api/ai/analyze) 20+ times
for i in {1..25}; do
  curl -X POST https://krumm-backend.onrender.com/api/ai/analyze \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer test" \
    -d '{}' &
done
wait

# After ~20 requests, should see 429 responses:
# { "error": "Rate limit exceeded...", "retryAfterMs": 60000 }
```

---

## 🔄 Phase 6: DNS & Cutover

If using a custom domain (e.g., `app.krumm.cl`):

### Option A: Use Vercel + Render (Recommended)

1. **Vercel Domain:**
   - Go to **Vercel > Settings > Domains**
   - Add your domain (e.g., `app.krumm.cl`)
   - Vercel will show DNS records to add

2. **Render Domain:**
   - Backend runs at `krumm-backend.onrender.com` (no custom domain needed)
   - Update Vercel's `VITE_API_BASE_URL` to point to Render

3. **DNS Changes:**
   - Update your domain provider (e.g., Cloudflare DNS) to point to Vercel
   - Vercel handles automatic SSL/TLS (Let's Encrypt)
   - Takes effect immediately (~5 min propagation)

### Option B: Keep Current Domain on Cloudflare (Migration)

If currently using `krumm.cl` on Cloudflare Pages:

1. Update Cloudflare DNS to point frontend CNAME to Vercel
2. Backend can stay on Render (customers won't see this URL directly)
3. Cutover is seamless once DNS updates propagate

### Verification After Cutover

```bash
# Verify domain points to Vercel
nslookup app.krumm.cl
# Should show Vercel IP addresses

# Test full flow
curl https://app.krumm.cl
# Should load frontend
# Frontend should call backend at https://krumm-backend.onrender.com/api/*
```

---

## 🔄 Rollback Procedures

If something goes wrong, you have multiple escape routes:

### Rollback Option 1: DNS Switch (Fastest)

If domain is hosted on Cloudflare/Route53:
- Change DNS to point back to Cloudflare Pages
- Takes effect in 5-15 minutes
- **Downtime:** ~5 minutes

### Rollback Option 2: Keep Both Running

- Keep Cloudflare Pages deployment live during validation
- Switch back to Cloudflare if issues arise
- Costs: Both deployments run simultaneously
- **Downtime:** None (seamless switch)

### Rollback Option 3: Restore Previous Backend

- Render keeps deployment history
- Click **Previous Deployments** → select last working version
- Takes ~1 minute to restore
- Database (Neon) remains intact

### Data Safety

- ✅ Neon database is safe (separate from deployments)
- ✅ Use transaction rollback if data corruption occurs
- ⚠️ Upstash data is ephemeral (rate limiting counters) — safe to lose
- ⚠️ No data loss in any scenario (rate limiting resets, DB persists)

---

## 📊 Free Tier Limits

| Service | Free Tier | Notes |
|---------|-----------|-------|
| **Neon** | 3 branches, 5GB storage, unlimited APIs | Enough for 100K+ users |
| **Upstash** | 10,000 commands/day, 1 database | ~1 command per session for rate limiting |
| **Render** | 750 hours/month, shared CPU, 0.5GB RAM | Runs continuously; scales to paid on demand |
| **Vercel** | Unlimited bandwidth, 100GB/month | Static sites (frontend only) |

**Estimate for 1M requests/month:**
- Neon: Handles easily (1M queries/month is nothing)
- Upstash: 10K commands/day = 300K/month (could exceed; consider upgrade)
- Render: $7/month for 1 Starter instance (free tier auto-sleeps if unused)
- **Vercel:** Covered by free tier (CDN + edge functions)

---

## 📝 Post-Migration Tasks

### Immediate (Day 1)

- [ ] Monitor backend logs in Render
- [ ] Check Neon slow query logs
- [ ] Verify rate limiting works (Upstash dashboard)
- [ ] Alert team to test staging URLs

### Short Term (Week 1)

- [ ] Set up monitoring alerts (Render + Neon metrics)
- [ ] Document new deployment process
- [ ] Train team on how to access each service dashboard
- [ ] Update documentation with new URLs

### Medium Term (Month 1)

- [ ] Review costs and optimize if needed
- [ ] Plan for vertical scaling if traffic exceeds free tiers
- [ ] Set up automated backups (Neon snapshots)
- [ ] Consider adding staging environment (optional)

---

## 🆘 Troubleshooting

### Backend not responding

1. Check Render logs: **Logs** tab
2. Verify DATABASE_URL is set and correct
3. Test: `curl https://krumm-backend.onrender.com/health`
4. If logs show connection timeout: DATABASE_URL likely wrong

### Frontend can't connect to backend

1. Check browser Network tab for failed requests
2. Verify `VITE_API_BASE_URL` is set in Vercel
3. Verify backend CORS includes frontend URL
4. Render logs should show CORS error if issue

### Database too full (Neon free tier)

1. Neon free tier: 5GB storage
2. Check: Neon console > **Storage** tab
3. If > 5GB: Upgrade to paid or clean old data

### Rate limiting not working

1. Check if Redis is active: `curl https://krumm-backend.onrender.com/health`
2. If using Upstash, verify tokens are correct
3. Render logs should show `[Middleware] Redis initialized`
4. If not shown, falls back to in-memory (single instance only)

---

## 📞 Support

- **Neon:** https://neon.tech/docs
- **Upstash:** https://upstash.com/docs
- **Render:** https://render.com/docs
- **Vercel:** https://vercel.com/docs
- **This Repo:** See ENV_GUIDE.md for variable reference

---

**Last Updated:** May 3, 2026  
**Migration Version:** 1.0  
**Stack:** Neon + Upstash + Render + Vercel
