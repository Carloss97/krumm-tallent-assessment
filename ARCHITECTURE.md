# System Architecture & Data Flow

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT BROWSER                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  React App (Vite)                                       │   │
│  │  ├─ Intro.jsx (game selection)                         │   │
│  │  ├─ GameLayout (game wrapper)                          │   │
│  │  ├─ 7 Games (OSPAN, StopSignal, TaskSwitch, CPT,      │   │
│  │  │           Decision, RuleShift, SJT)                │   │
│  │  ├─ TelemetryContext (cursor, webcam, trial events)   │   │
│  │  ├─ Report.jsx (AI + heuristic report)                │   │
│  │  └─ ConsentModal (GDPR compliance)                    │   │
│  └─────────────────────────────────────────────────────────┘   │
│       │                                      │                   │
│       │ JWT Auth                             │ API Calls        │
│       ▼                                      ▼                   │
└─────────────────────────────────────────────────────────────────┘
        │           HTTP/JSON                │
        │  ┌────────────────────────────┐   │
        │  │                            │   │
        └─►│  EXPRESS BACKEND           │◄──┘
           │  (http://localhost:4000)   │
           │                            │
           │  POST /api/auth/*          │
           │  POST /api/session         │
           │  GET  /api/sessions        │
           │  GET  /health              │
           └────────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │   SQLite Database    │
           │   assessments.db     │
           │                      │
           │ ├─ participants      │
           │ ├─ sessions          │
           │ └─ reports           │
           └──────────────────────┘
```

## 🔄 User Journey & Data Flow

### 1️⃣ **Authentication Flow**

```
User Input (participantId, email, accessCode)
    ↓
AuthPage → POST /api/auth/participant
    ↓
Server: validateParticipantCredentials()
    ↓
Server: upsertParticipant() → DB
    ↓
Server: generateParticipantToken() → JWT
    ↓
Response: { participantToken, expiresIn }
    ↓
Frontend: Store token in sessionStorage
    ↓
✅ Redirect to Intro (now authenticated)
```

### 2️⃣ **Game Assessment Flow**

```
User starts assessment
    ↓
Intro.jsx → dynamically loads GAME_FLOW (7 games)
    ↓
GameLayout wraps each game + TelemetryContext
    ↓
Game runs locally:
  - Records trial events (start, response, score, errors)
  - Captures cursor data (position, velocity, hesitation)
  - Captures webcam data (blinks, head pose, quality)
  - Validates consent (per-game check)
    ↓
User completes all 7 games
    ↓
sessionData accumulated in browser memory with:
  - game scores/errors/duration per game
  - trial-level telemetry (cursor, webcam, events)
  - consentState (which data user allowed)
    ↓
✅ All games complete → Proceed to Report
```

### 3️⃣ **Report Generation Flow**

```
Report.jsx receives sessionData
    ↓
1. TRY: Call Gemini AI
   POST /api/generateAIReport (future enhancement)
   → Generative AI fallback chain (1.5-flash → 2.0-flash → 2.5-lite)
   → Parse JSON response
   ✓ Success: Use AI report
   ✗ Fail: Fall back to heuristic
    ↓
2. Heuristic Fallback (always works):
   - normalizeGameScores() → 0-10 per game
   - calculateOverallScore() → weighted composite
   - generateHeuristicReport() → fill template
     - Identify top 3 strengths
     - Identify development areas
     - Match to career profiles
     - Set confidence score (55-80%)
     - Set recommendation tier
    ↓
3. UI Rendering:
   - Display scores heatmap
   - Show strengths panel
   - Show recommendations
   - Dev telemetry panel (if demo mode)
    ↓
4. User can:
   - Review report
   - Toggle demo telemetry view
   - Download report (future)
   - Save to database (if permitted)
```

### 4️⃣ **Data Persistence Flow (When Saving)**

```
User clicks "Save Assessment"
    ↓
Frontend: Show ConsentModal if not yet shown
    ↓
User grants consent: POST /api/session
  Headers: { Authorization: Bearer <JWT> }
  Body: {
    participant: { participantId, fullName, email },
    games: [...],
    report: { summary, strengths, recommendation, ... },
    telemetry: { cursor: [...], webcam: [...], events: [...] },
    consentState: { cursor: true, webcam: true, ... }
  }
    ↓
Server: authenticateToken() → Validate JWT
    ↓
Server: requireParticipant() → Check ownership
    ↓
Server: saveSession(payload) → DB transaction
    ↓
Database: INSERT INTO sessions (participant_id, data_json, created_at)
    ↓
Response: { sessionId, timestamp }
    ↓
✅ Frontend: Show "Saved! Session ID: 123"
```

## 🔐 Security Layers

### Token-Based Auth
```
1. POST /api/auth/participant
   → Server generates JWT token
   → Token stored in sessionStorage (browser)

2. All protected endpoints require:
   Authorization: Bearer <token>

3. Server validates:
   - Token signature
   - Token expiration (1 hour)
   - Participant ownership (user can only access own data)

4. Invalid/expired token:
   → 401 Unauthorized
   → Frontend: Clear token, redirect to login
```

### Data Isolation
```
- Participants can only read/write their own sessions
- No participant A can access participant B's data
- Email validation prevents duplicate/invalid accounts
- Database constraints enforce referential integrity
```

## 📊 Database Schema (SQLite)

### Participants Table
```sql
CREATE TABLE participants (
  participant_id TEXT PRIMARY KEY,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_authenticated TIMESTAMP
);
```

### Sessions Table
```sql
CREATE TABLE sessions (
  session_id INTEGER PRIMARY KEY AUTOINCREMENT,
  participant_id TEXT NOT NULL,
  data_json TEXT NOT NULL,        -- Full JSON (games, report, telemetry)
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (participant_id) REFERENCES participants(participant_id)
);
```

## 🎯 Key Component Connections

### TelemetryContext
```
┌──────────────────────────────┐
│  TelemetryContext            │
│  (App.jsx wrapping)          │
├──────────────────────────────┤
│ ├─ consentState              │ (cursor, webcam, timestamp)
│ ├─ cursorData []             │ (x, y, speed, hesitation)
│ ├─ webcamData []             │ (blinks, headPose, quality)
│ ├─ eventLog []               │ (trial start, response, score)
│ └─ methods:                  │
│    - recordEvent()           │
│    - updateCursor()          │
│    - captureBlink()          │
│    - getFullTelemetry()      │
└──────────────────────────────┘
        ▲
        │ useContext(TelemetryContext)
        │
        └─ Used by all 7 games
        └─ Used by Report.jsx (to aggregate)
```

### GameFlow (Single Source of Truth)
```
export const GAME_FLOW = [
  {
    id: 1,
    path: '/game/1',
    name: 'OSPAN',
    component: OSPANGame,
    instruction: { title: '...', description: '...' },
    nextPath: '/game/2'
  },
  ... (6 more games)
  {
    id: 7,
    path: '/game/7',
    name: 'SJT',
    component: SJTGame,
    nextPath: '/report'
  }
];
```

Used by:
- **Intro.jsx**: Maps GAME_FLOW to display game list
- **GlobalProgressBar.jsx**: Calculates totalSteps = GAME_FLOW.length
- **App.jsx**: Routes to each game dynamically
- **Scoring**: 7 games → 7 normalized scores

## 🚀 Deployment Considerations

### Frontend (Vite Build)
```
npm run build
  → dist/ folder
  → Deploy to: Vercel, Netlify, S3, or static hosting
  → Set VITE_API_BASE_URL to production backend URL
  → Keep .env (with real API_BASE_URL) secure
```

### Backend (Node.js)
```
Node server/index.js --env=production
  → Ensure PORT env var set
  → Create DB_PATH directory
  → Add HTTPS in reverse proxy (nginx, Caddy)
  → Add rate limiting middleware
  → Add proper CORS configuration
  → Use process manager (PM2, systemd)
```

### Database
```
SQLite file: assessments.db
  → Should be in persistent storage (not ephemeral)
  → Backup regularly
  → For scale: Migrate to PostgreSQL/MySQL
```

## ✅ Health Checks

Frontend can verify backend readiness:
```javascript
fetch('http://localhost:4000/health')
  .then(r => r.json())
  .then(data => console.log('Backend OK:', data))
  .catch(() => console.error('Backend down'));
```

## 📈 Future Enhancement Hooks

### Documented but not yet implemented:
1. **6 complementary games** (ideation complete, design pending)
   - Metacognitive calibration
   - Operational prioritization
   - Learning agility monitoring
   - Social coordination
   - Cognitive resilience
   - Risk assessment

2. **Advanced analytics** (telemetry captured but not analyzed)
   - Cursor pattern analysis (hesitation detection)
   - Webcam pattern analysis (attention fatigue)
   - Reaction time distributional analysis
   - Trial-by-trial learning curves

3. **Admin dashboard** (data exists in DB, no UI yet)
   - View aggregate statistics
   - Generate cohort reports
   - Track assessment completion rates
   - Monitor API health

---

**Architecture Version**: 2.0  
**Last Updated**: March 26, 2026  
**Status**: Production-Ready (MVP + Enhanced Scoring)
