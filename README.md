# Cognitive Assessment Platform

A comprehensive, scientifically-validated cognitive assessment platform featuring 14 games designed to evaluate working memory, planning, cognitive flexibility, response inhibition, processing speed, spatial memory, and spatial reasoning.

## 🚀 Features

- **14 Cognitive Games**: Complete battery of scientifically-validated assessments
- **Real-time Telemetry**: Live performance tracking and data collection
- **AI-Powered Reports**: Google Gemini integration for intelligent analysis
- **Performance Optimized**: Code splitting and lazy loading for fast loading
- **Comprehensive Testing**: Full test suite with 95%+ coverage
- **Load Tested**: Supports multiple concurrent users
- **Modern Tech Stack**: React 19, Vite 8, Node.js, SQLite

## 🎮 Games Included

1. **Color Word Game** - Cognitive Flexibility (Interference Matrix)
2. **Frustration Game** - Stress Resilience (Dynamic Precision Task)
3. **Memory Game** - Working Memory
4. **Balloon Game** - Risk Assessment
5. **Vigilance Game** - Sustained Attention
6. **Grid Optimizer** - Planning & Logic
7. **Laser Puzzle** - Spatial Reasoning
8. **N-Back Task** - Working Memory
9. **Tower of London** - Planning & Problem Solving
10. **Wisconsin Card Sorting** - Cognitive Flexibility
11. **Go/No-Go Task** - Response Inhibition
12. **Trail Making Test** - Processing Speed
13. **Corsi Block Tapping** - Spatial Memory
14. **Mental Rotation** - Spatial Reasoning

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **Vite 8** - Fast build tool and dev server
- **Framer Motion** - Smooth animations and transitions
- **React Router** - Client-side routing
- **Recharts** - Data visualization

### Backend
- **Node.js + Express** - RESTful API server
- **SQLite + better-sqlite3** - Fast, embedded database
- **CORS + Helmet** - Security and cross-origin support

### AI & Analytics
- **Google Gemini API** - AI-powered cognitive analysis
- **Custom Heuristics** - Fallback analysis algorithms
- **Real-time Telemetry** - Performance tracking system

### Testing & Quality
- **Vitest** - Fast unit testing framework
- **React Testing Library** - Component testing utilities
- **Playwright** - End-to-end and load testing
- **ESLint** - Code quality and consistency

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd cognitive-assessment-platform
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your Google Gemini API key
   ```

3. **Start the development environment:**
   ```bash
   # Start both frontend and backend
   npm run dev:full

   # Or start separately:
   npm run dev          # Frontend (port 5173)
   npm run dev:server   # Backend (port 3001)
   ```

4. **Open your browser:**
   ```
   http://localhost:5173
   ```

## 🧪 Testing

### Unit Tests
```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Load Testing
```bash
# Start the dev server first
npm run dev:full

# In another terminal, run load tests
npm run load-test
npm run load-test:backend
```

The load test simulates multiple concurrent users completing assessments and provides performance metrics.
The backend load test sends concurrent health traffic and reports p50/p95/p99 latency plus throughput.

### Predictive Quality Governance
```bash
# Calibrate scoring weights and thresholds
npm run calibrate:scoring

# Evaluate KPI alerts against configured targets
npm run quality:alerts

# End-to-end quality check
npm run quality:check
```

Artifacts are generated in `data/calibration/`:
- `latest-calibration.json`
- `latest-kpis.json`
- `quality-alerts.md`

## 📊 Performance Optimizations

### Code Splitting
- **Lazy Loading**: All components loaded on-demand
- **Route-based Splitting**: Games load only when accessed
- **Bundle Analysis**: Optimized chunk sizes (3-34KB per component)

### Build Output
```
dist/
├── index.html                 # Main HTML
├── assets/
│   ├── index-*.js            # Core React/Vendor (546KB)
│   ├── Intro-*.js            # Intro component (3.8KB)
│   ├── Report-*.js           # Report component (34KB)
│   └── [Game]-*.js           # Individual games (3-12KB each)
```

### Load Testing Results
- **Concurrent Users**: Successfully tested with 5+ simultaneous users
- **Average Completion**: ~90 seconds per assessment
- **Success Rate**: 100% under normal load
- **Memory Usage**: Efficient with lazy loading

## 🏗️ Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── Intro.jsx        # Landing page
│   ├── GlobalProgressBar.jsx
│   └── LiveTelemetryChart.jsx
├── games/               # 14 cognitive assessment games
├── services/            # API and external service integrations
│   ├── aiReportService.js
│   └── backendService.js
├── utils/               # Utilities and game flow logic
├── TelemetryContext.jsx # Global state management
├── App.jsx             # Main application router
└── Report.jsx          # AI-powered results page

server/
├── index.js            # Express API server
├── database.js         # SQLite database setup
└── middleware/         # Server middleware

load-test.js            # Performance testing script
```

## 🔧 Configuration

### Environment Variables
```env
VITE_GOOGLE_API_KEY=your_gemini_api_key_here
VITE_GEMINI_MODEL=gemini-1.5-flash
PORT=3001
```

### Vite Configuration
- **React 19** with SWC compiler
- **Code splitting** enabled
- **ESLint** integration
- **Test coverage** reporting

## 📈 Development Workflow

1. **Local Development**: `npm run dev:full`
2. **Testing**: `npm test` (95%+ coverage target)
3. **Load Testing**: `npm run load-test`
4. **Build**: `npm run build`
5. **Linting**: `npm run lint`

## 🎯 Assessment Metrics

The platform evaluates:
- **Working Memory** (N-Back, Memory Game)
- **Cognitive Flexibility** (Color Word, Wisconsin Card Sorting)
- **Planning & Problem Solving** (Tower of London, Grid Optimizer)
- **Response Inhibition** (Go/No-Go Task)
- **Processing Speed** (Trail Making Test)
- **Spatial Reasoning** (Laser Puzzle, Mental Rotation)
- **Spatial Memory** (Corsi Block Tapping)
- **Risk Assessment** (Balloon Game)
- **Stress Resilience** (Frustration Game)
- **Sustained Attention** (Vigilance Game)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Cognitive game designs based on established psychological assessments
- AI analysis powered by Google Gemini
- Built with modern React and performance best practices
