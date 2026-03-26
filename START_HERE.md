# Cognitive Assessment Platform - Quick Start

## 📋 Prerequisites

- **Node.js** 18+ 
- **npm** 8+
- **.env file** configured (see below)

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:

```env
# Google Gemini API (Required)
VITE_GOOGLE_API_KEY=YOUR_API_KEY_HERE

# Frontend Configuration
VITE_API_BASE_URL=http://localhost:4000
VITE_LLM_FALLBACK=true
VITE_GEMINI_MODEL=gemini-1.5-flash

# Backend Configuration
PORT=4000
NODE_ENV=development
DB_PATH=./assessments.db
```

See `.env.example` for full list of available options.

### 3. Start Development Environment

**Option A: Frontend Only** (via Vite, includes API proxy)
```bash
npm run dev
# Opens http://127.0.0.1:5180
```

**Option B: Full Stack** (Frontend + Backend)
```bash
npm run dev:full
# Frontend: http://127.0.0.1:5180
# Backend: http://localhost:4000
# Health: http://localhost:4000/health
```

**Option C: Backend Only**
```bash
npm run dev:server
# Backend: http://localhost:4000
```

## 🧪 Testing

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm test:watch
```

### Generate Coverage Report
```bash
npm test:coverage
```

## 🏗️ Building for Production

```bash
npm run build
# Output: dist/ directory
```

## 📚 API Endpoints

### Health Check (No Auth Required)
```
GET /health
```
Response:
```json
{
  "status": "ok",
  "timestamp": "2026-03-26T16:30:00.000Z",
  "uptime": 123.456
}
```

### Authentication
```
POST /api/auth/participant
Content-Type: application/json

{
  "participantId": "user123",
  "fullName": "John Doe",
  "email": "john@example.com",
  "accessCode": "ABCD1234"
}
```

Response:
```json
{
  "participant": {
    "participantId": "user123",
    "fullName": "John Doe",
    "email": "john@example.com"
  },
  "participantToken": "eyJhbGc...",
  "expiresIn": 3600,
  "message": "Participant authenticated"
}
```

### Save Session (Requires JWT Token)
```
POST /api/session
Authorization: Bearer <participantToken>
Content-Type: application/json

{
  "participant": { "participantId": "user123" },
  "games": [...],
  "report": {...},
  "telemetry": {...}
}
```

### Retrieve Sessions (Requires JWT Token)
```
GET /api/sessions
Authorization: Bearer <participantToken>
```

## 📊 Project Structure

```
├── src/
│   ├── components/          # React components
│   ├── games/              # Assessment game implementations
│   ├── services/           # Business logic (AI, telemetry, backend)
│   ├── utils/              # Utilities (gameFlow, scoring, etc.)
│   └── hooks/              # Custom React hooks
├── server/
│   ├── index.js            # Express server, API endpoints
│   ├── db.js               # SQLite database operations
│   └── tokenService.js     # JWT token generation/validation
├── public/                 # Static assets
├── dist/                   # Production build (generated)
└── package.json
```

## 🎯 Assessment Games (7 Core)

1. **OSPAN** - Working Memory & Dual-Task Management
2. **Stop-Signal Task** - Response Inhibition
3. **Task Switching** - Cognitive Flexibility & Learning Agility
4. **Continuous Performance Test** - Sustained Attention
5. **Decision Under Pressure** - Judgment & Speed-Quality Tradeoff
6. **Rule Shift** - Adaptation & Exception Handling
7. **Situational Judgment Test** - Workplace Judgment

## 📈 Reporting Architecture

### Scoring Algorithm v2.0
- **Normalization**: 7 different game scales → unified 0-10 scale
- **Weighting**: Learning agility (1.2×) and adaptation (1.3×) weighted highest
- **Thresholds**:
  - 8.0+ → STRONG ALIGNMENT
  - 6.5-8.0 → SOLID ALIGNMENT WITH COACHING
  - 4.5-6.5 → CONDITIONAL ALIGNMENT
  - <4.5 → EXPLORATORY FIT - NEEDS MORE DATA

See [SCORING_ALGORITHM_REFERENCE.md](./SCORING_ALGORITHM_REFERENCE.md) for detailed formulas.

## 🔐 Security Notes

- JWT tokens expire in 1 hour (configurable)
- Participants can only access their own sessions
- API requires Bearer token in Authorization header
- Email validation enforced
- Production: Ensure HTTPS, configure CORS properly, add rate limiting

## 🐛 Troubleshooting

### "Cannot find module '@google/generative-ai'"
```bash
npm install @google/generative-ai
```

### "API_BASE_URL is undefined"
Ensure `VITE_API_BASE_URL` is in `.env` file and restart dev server.

### "Backend 401 Unauthorized"
- Token may be expired (max 1 hour)
- Ensure JWT token is in Authorization header: `Authorization: Bearer <token>`

### "Tests fail after changes"
```bash
npm test -- --run           # Run once
npm test:watch             # Or watch for changes
```

## 📖 Documentation

- **[SCORING_ALGORITHM_REFERENCE.md](./SCORING_ALGORITHM_REFERENCE.md)** - Detailed scoring formulas and thresholds
- **[PREDICTIVE_VALIDITY_IMPROVEMENTS.md](./PREDICTIVE_VALIDITY_IMPROVEMENTS.md)** - Algorithm v2.0 enhancements
- **[.env.example](./.env.example)** - All environment variables explained

## 🚦 Status

- ✅ Frontend: React 19 + Vite, fully functional
- ✅ Backend: Express server with JWT auth
- ✅ Database: SQLite with participant & session storage
- ✅ Tests: 34/34 passing (11 test files)
- ✅ Build: Optimized production bundle ready
- ✅ Scoring: Normalized algorithm with evidence-based weighting

## 📞 Support

For questions on:
- **Scoring algorithm**: See SCORING_ALGORITHM_REFERENCE.md
- **API usage**: Check /health endpoint or POST /api/auth/participant
- **Testing**: Run `npm test -- --run`
- **Deployment**: See vite.config.js for build configuration

---

**Last Updated**: March 26, 2026  
**Version**: 2.0 (Normalized Scoring, Production-Ready)
