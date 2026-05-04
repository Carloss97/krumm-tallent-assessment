# 🚀 Deployment Checklist - Phases 1-6

**Status:** ✅ All prerequisites completed  
**Current:** npm ci ✅ | npm run dev ✅ | Health check ✅  
**Next:** Execute phases 1-6 sequentially

---

## ⏱️ Time Estimates

| Phase | Task | Platform | Time | Status |
|-------|------|----------|------|--------|
| 1 | Database Setup | Neon | 5-10 min | ⏳ TODO |
| 2 | Cache Setup | Upstash | 5 min | ⏳ TODO |
| 3 | Backend Deploy | Render | 10-15 min | ⏳ TODO |
| 4 | Frontend Deploy | Vercel | 10-15 min | ⏳ TODO |
| 5 | Testing & Validation | Both | 15-30 min | ⏳ TODO |
| 6 | DNS & Cutover | Custom Domain | 5 min | ⏳ TODO |
| **TOTAL** | **Complete Migration** | **All** | **50-80 min** | |

---

# 🗄️ PHASE 1: Database Setup (Neon)

**Goal:** Create PostgreSQL database and get connection string  
**Platform:** https://neon.tech  
**Time:** 5-10 minutes

## Step 1.1: Create Neon Account & Project

```
1. Go to https://neon.tech
2. Sign up (free tier)
3. Create project:
   - Project name: "krumm-production"
   - Database name: "krumm_db"
   - Region: Select nearest to your users
4. Click "Create project"
```

## Step 1.2: Get Pooled Connection String

```
1. Open Neon console for your project
2. Go to "Connection Details" (right panel)
3. Change from "Direct" to "Pooled Connection" ⚠️ IMPORTANT!
4. Copy the full connection string (starts with "postgresql://")
5. Save it somewhere safe - you'll need it in Phase 3
```

**Format (don't copy this, use the one from Neon):**
```
postgresql://user:password@hostname.neon.tech/dbname?sslmode=require
```

## Step 1.3: Verify Connection (Optional)

You don't need to do anything here - the backend will auto-create tables on first connection.

---

## Status: ✅ Phase 1 Complete When:
- [ ] You have a Neon project created
- [ ] You have the pooled connection string copied
- [ ] Connection string starts with `postgresql://` and ends with `?sslmode=require`

**Save this for Phase 3:** `DATABASE_URL = <your_neon_url>`

---

# 🔴 PHASE 2: Cache Setup (Upstash)

**Goal:** Create Redis database for rate limiting  
**Platform:** https://upstash.com  
**Time:** 5 minutes

## Step 2.1: Create Upstash Account & Database

```
1. Go to https://upstash.com
2. Sign up (free tier)
3. Click "Create Database" or "New Database"
4. Configure:
   - Name: "krumm-rate-limit"
   - Region: Same as Neon if possible (e.g., us-west-2)
   - Type: Redis
   - Tier: Free
5. Click "Create"
```

## Step 2.2: Get REST API Credentials

```
1. Click your database name in the list
2. Go to "REST API" section (may be on Details tab)
3. Copy TWO things:
   - UPSTASH_REDIS_REST_URL (starts with https://...upstash.io)
   - UPSTASH_REDIS_REST_TOKEN (starts with "Bearer")
4. Save both - you'll need them in Phase 3
```

**Example (don't copy - get your own from Upstash):**
```
UPSTASH_REDIS_REST_URL=https://my-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=Bearer AXZhc2Rf...
```

---

## Status: ✅ Phase 2 Complete When:
- [ ] You have an Upstash Redis database created
- [ ] You have UPSTASH_REDIS_REST_URL copied
- [ ] You have UPSTASH_REDIS_REST_TOKEN copied
- [ ] Token starts with "Bearer"

**Save these for Phase 3:**
```
UPSTASH_REDIS_REST_URL = <your_url>
UPSTASH_REDIS_REST_TOKEN = <your_token>
```

---

# ⚙️ PHASE 3: Backend Deployment (Render)

**Goal:** Deploy Express backend to Render  
**Platform:** https://render.com  
**Time:** 10-15 minutes  
**Requirements:** Neon URL + Upstash credentials + GitHub access

## Step 3.1: Connect GitHub to Render

```
1. Go to https://render.com
2. Sign up with GitHub account (authorize)
3. Click "New +" button (top right)
4. Select "Web Service"
5. Click "GitHub" as source
6. Authorize and select repo:
   - Repository: Carloss97/krumm-tallent-assessment
   - Branch: main
7. Click "Connect"
```

## Step 3.2: Configure Render Settings

```
1. Fill in basic settings:
   - Name: krumm-backend (auto-filled, can change)
   - Region: Select same as Neon (e.g., Oregon)
   - Branch: main
   - Build Command: npm install
   - Start Command: node server/index.js
   
2. Runtime settings:
   - Select "Node"
   - Node version: Latest available
   
3. Click "Create Web Service" (bottom)
```

Render will start building. Wait for the build to complete (2-3 minutes).

## Step 3.3: Add Environment Variables

**Before deployment starts, you should add env vars:**

When the form is open (before clicking "Create"), scroll down to "Environment" section.

**Add these environment variables:**

| Variable | Value | Source |
|----------|-------|--------|
| `DB_CLIENT` | `pg` | (type this) |
| `DATABASE_URL` | Paste from Phase 1 | Neon pooled URL |
| `UPSTASH_REDIS_REST_URL` | Paste from Phase 2 | Upstash REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Paste from Phase 2 | Upstash token (with "Bearer") |
| `GEMINI_API_KEY` | Your Google API key | Your Gemini API |
| `JWT_SECRET_KEY` | Generate with command below | Run locally: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ALLOWED_ORIGINS` | Will update in Phase 4 | Start with `http://localhost:5174` |
| `LOG_LEVEL` | `info` | (type this) |
| `ENABLE_HERO_DEMO` | `false` | (type this) |
| `NODE_ENV` | `production` | (type this) |

**Generate JWT_SECRET_KEY:**
```bash
# Run this in your local terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Copy the output and paste as JWT_SECRET_KEY value
```

## Step 3.4: Wait for Deployment

```
1. After clicking "Create Web Service", Render starts building
2. Watch the "Logs" tab for progress
3. Should see:
   - "Building..."
   - "npm install" running
   - "node server/index.js" starting
4. When you see "Server running on http://0.0.0.0:4000"
   - Deployment is complete!
5. Render will assign a URL: https://krumm-backend.onrender.com
   - (exact name may differ)
```

## Step 3.5: Test Backend Health

```
Open in browser or terminal:
https://krumm-backend.onrender.com/health

Should see response like:
{
  "status": "ok",
  "uptime": "1.234s",
  "database": "connected",
  ...
}
```

If health check fails:
- Check Render "Logs" tab for error messages
- Verify all environment variables are set correctly
- Verify DATABASE_URL format is correct (starts with postgresql://)
- Try refreshing the health endpoint after 1 minute

---

## Status: ✅ Phase 3 Complete When:
- [ ] Backend deployed to Render (green checkmark)
- [ ] Service URL is visible: `https://krumm-backend.onrender.com` (or similar)
- [ ] Health endpoint responds with `"status": "ok"`
- [ ] All environment variables are set

**Save this for Phase 4:**
```
BACKEND_URL = https://krumm-backend.onrender.com
(use the actual URL shown in Render console)
```

---

# 🎨 PHASE 4: Frontend Deployment (Vercel)

**Goal:** Deploy React frontend to Vercel  
**Platform:** https://vercel.com  
**Time:** 10-15 minutes  
**Requirements:** GitHub access + Render backend URL from Phase 3

## Step 4.1: Connect GitHub to Vercel

```
1. Go to https://vercel.com
2. Sign up with GitHub account (authorize)
3. Click "Add New" (or "New Project")
4. Select "Project"
5. Click GitHub to authorize and select repo
6. Select repository: Carloss97/krumm-tallent-assessment
7. Select branch: main
8. Click "Import" or "Continue"
```

## Step 4.2: Configure Build Settings

Vercel should auto-detect Vite, but verify:

```
Build Settings should show:
- Framework: Vite (auto-detected)
- Build Command: npm run build
- Output Directory: dist
- Install Command: npm install

These should be pre-filled. If not, set them manually.
```

## Step 4.3: Add Environment Variables

In the project settings form (before deploying), scroll to "Environment Variables" section.

**Add these variables:**

| Variable | Value |
|----------|-------|
| `VITE_API_BASE_URL` | `https://krumm-backend.onrender.com` (from Phase 3) |
| `VITE_USE_BACKEND_GEMINI_PROXY` | `true` |
| `VITE_GEMINI_MODEL` | `gemini-2.5-flash` |
| `VITE_BASE_PATH` | `/` |

## Step 4.4: Deploy Frontend

```
1. Click "Deploy" button
2. Vercel will:
   - Build with Vite → dist/ folder
   - Deploy to CDN
   - Takes 2-5 minutes
3. When complete, you'll see:
   - "Deployment Successful"
   - Production URL: https://yourproject.vercel.app
   - (exact name depends on repo settings)
```

## Step 4.5: Test Frontend

```
1. Open the Vercel production URL in browser
2. You should see:
   - Landing page loads
   - Styling is correct
   - No console errors (check DevTools > Console)
3. Try clicking around:
   - Navigate between pages
   - Check Network tab to verify API calls go to Render backend
   - URLs should be: https://krumm-backend.onrender.com/api/*
```

If frontend doesn't load:
- Check browser console (F12 > Console tab) for errors
- Verify `VITE_API_BASE_URL` is correct in Vercel Settings
- Redeploy if needed

---

## Status: ✅ Phase 4 Complete When:
- [ ] Frontend deployed to Vercel (green checkmark)
- [ ] Production URL is visible: `https://yourproject.vercel.app`
- [ ] Frontend loads in browser
- [ ] Network tab shows API calls going to Render backend

**Save this for Phase 3.5 (update Render CORS):**
```
FRONTEND_URL = https://yourproject.vercel.app
```

---

## 🔄 PHASE 3.5: Update Render CORS (Return to Phase 3)

Now that you have the Vercel URL, update Render's CORS setting:

```
1. Go back to Render dashboard
2. Open your krumm-backend service
3. Go to Settings > Environment
4. Find ALLOWED_ORIGINS variable
5. Change from "http://localhost:5174" to:
   https://yourproject.vercel.app
   (use the exact URL from Vercel)
6. Click "Save"
7. Render auto-redeploys (watch logs)
8. Wait for "Server running..." message
```

---

# 🧪 PHASE 5: Testing & Validation

**Goal:** Verify everything works end-to-end  
**Time:** 15-30 minutes

## Test 5.1: Backend Health Check

```
In browser, open:
https://krumm-backend.onrender.com/health

Expected response:
✅ "status": "ok"
✅ "database": "connected"
✅ "uptime": (shows seconds)
```

## Test 5.2: Frontend Loads

```
1. Open https://yourproject.vercel.app
2. Page should load and be styled correctly
3. Open DevTools (F12)
4. Go to Console tab - should have NO red errors
5. Go to Network tab - should see requests to:
   - https://krumm-backend.onrender.com/api/*
```

## Test 5.3: Authentication Flow

```
1. On landing page, click "Log In" (participant)
2. Enter test credentials:
   - Email: test@example.com
   - Token: any text (for testing)
3. Should authenticate and show dashboard
4. No network errors in console
```

## Test 5.4: Database Connectivity

```
In browser console (F12 > Console):
fetch('https://krumm-backend.onrender.com/health')
  .then(r => r.json())
  .then(d => console.log(d.database))

Should output:
✅ "connected"
```

## Test 5.5: Rate Limiting

```
Run rapidly (in browser console):
for(let i=0; i<50; i++) {
  fetch('https://krumm-backend.onrender.com/api/feature-flags')
}

Check Network tab - after ~50 requests, should start getting 429 status codes.
This means rate limiting is working!
```

## Test 5.6: AI Integration

```
1. Start a game/assessment in frontend
2. Generate a report
3. Should call Gemini API via backend
4. Report should generate without errors
5. Check browser console - no red errors
```

---

## Status: ✅ Phase 5 Complete When:
- [ ] Backend health check returns "ok"
- [ ] Frontend loads without errors
- [ ] API calls reach Render backend
- [ ] Rate limiting triggers after ~50 requests
- [ ] AI report generation works

---

# 🌐 PHASE 6: DNS & Cutover

**Goal:** Switch custom domain to production  
**Time:** 5 minutes  
**Prerequisites:** Custom domain (if using one)

## Step 6.1: If Using Custom Domain

### Add domain to Vercel:

```
1. Vercel dashboard > Settings > Domains
2. Add your domain: example.com
3. Vercel shows DNS records to add
4. Go to your domain registrar (GoDaddy, Namecheap, etc.)
5. Add Vercel's CNAME records
6. Wait 24-48 hours for DNS propagation
```

### Add domain to Render:

```
1. Render dashboard > krumm-backend > Settings > Custom Domain
2. Add your API domain: api.example.com
3. Add Render's CNAME record to registrar
4. Wait for propagation
```

### Update ALLOWED_ORIGINS in Render:

```
If using custom domain, update in Render Settings > Environment:

ALLOWED_ORIGINS = https://example.com,https://www.example.com,https://yourproject.vercel.app
(include both custom domain and Vercel backup domain)
```

## Step 6.2: If Not Using Custom Domain

You're already done! Your services are:
- **Frontend:** https://yourproject.vercel.app
- **Backend:** https://krumm-backend.onrender.com

Vercel provides automatic HTTPS and CDN.

---

## Status: ✅ Phase 6 Complete When:
- [ ] Custom domain points to production (if applicable)
- [ ] All DNS records are set (if applicable)
- [ ] Both frontend and backend are live
- [ ] Everything works with custom domain

---

## 🎉 DEPLOYMENT COMPLETE!

```
✅ Database:      Neon PostgreSQL
✅ Cache:         Upstash Redis
✅ Backend:       Render (https://krumm-backend.onrender.com)
✅ Frontend:      Vercel (https://yourproject.vercel.app)
✅ DNS:           Custom domain (optional)
```

### What happens now?

1. **Every Git push** to `main` auto-deploys to both Render and Vercel
2. **Updates are automatic** - no manual deployments needed
3. **Scaling is independent** - increase resources individually
4. **Cost is predictable** - all free tier, pay as you grow

### If something breaks:

See [MIGRATION.md > Troubleshooting](#troubleshooting) for solutions.

---

## 📊 Free Tier Limits

| Service | Free Tier | Your Usage | Status |
|---------|-----------|-----------|--------|
| **Vercel** | Unlimited bandwidth | ~50K requests/month | ✅ Safe |
| **Render** | 750 hours/month | 720 hours (one month) | ✅ At capacity |
| **Neon** | 5 GB storage | ~10 MB | ✅ Safe |
| **Upstash** | 10K commands/day | ~100 commands/day | ✅ Safe |

**Note:** You can upgrade individual services anytime if limits are exceeded.

---

## ❓ Quick Help

| Problem | Solution |
|---------|----------|
| Backend not responding | Check Render logs; verify DATABASE_URL is set |
| CORS errors | Update `ALLOWED_ORIGINS` in Render settings |
| Database errors | Check Neon connection status; verify pooled endpoint |
| Rate limiting not working | Check Upstash REST token is correct |
| Frontend shows loading spinner forever | Check `VITE_API_BASE_URL` in Vercel settings |
| AI report fails | Verify `GEMINI_API_KEY` is valid and set in Render |

For more help, see [MIGRATION.md > Troubleshooting](#troubleshooting).
