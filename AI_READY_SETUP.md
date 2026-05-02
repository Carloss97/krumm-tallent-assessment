---
description: Summary of AI-ready files generated for the Krumm Talent Assessment project
---

# 🤖 AI-Ready Setup Summary

This document outlines all the AI-ready files generated for the **Krumm Talent Assessment** platform.

**Generated**: May 1, 2026  
**Stack**: React 19 + Vite + Node.js/Express + SQLite/Postgres + Vitest

---

## 📋 Generated Files

### 1. 🎯 **AGENTS.md** (Root)
**Location**: `./AGENTS.md`

Defines specialized AI agents tailored to specific domains:
- **@frontend** - React 19, Vite, component architecture
- **@backend** - Node.js, Express, REST APIs
- **@database** - SQLite/Postgres, schema design
- **@testing** - Vitest, Testing Library, coverage
- **@security** - OWASP compliance, auth, secrets
- **@telemetry** - Privacy-first analytics, metrics
- **@devops** - CI/CD, GitHub Actions, deployment
- **@reviewer** - Code review standards, quality gates

**When to use**: Reference when starting new work to get domain-specific guidance and best practices.

---

### 2. 📖 **copilot-instructions.md** (Root)
**Location**: `./copilot-instructions.md`

Comprehensive project coding standards covering:
- ✅ React/JSX best practices (hooks, performance, error handling)
- ✅ Backend patterns (API design, authentication, logging)
- ✅ Testing standards (unit, integration, coverage targets)
- ✅ Security controls (input validation, XSS/SQL injection prevention)
- ✅ Code style (naming conventions, imports, comments)
- ✅ Git conventions (commits, branches, PRs)
- ✅ Common patterns (custom hooks, API hooks, etc.)

**When to use**: Reference for coding questions, style guidance, and implementation patterns.

---

### 3. ⚙️ **.github/workflows/ai-ready-ci.yml**
**Location**: `./.github/workflows/ai-ready-ci.yml`

GitHub Actions CI/CD pipeline with jobs:
- **Lint** - ESLint checks, secret detection
- **Test** - Vitest unit tests, coverage reports
- **Build** - Vite production build
- **Security** - npm audit, vulnerability scanning
- **Integration Test** - API and database integration tests
- **Deploy Preview** - Automated staging deployment
- **Quality Gate** - Enforces all checks pass

**Features**:
- Matrix strategy for Node.js versions
- Automatic coverage comments on PRs
- Security audit results in PR comments
- Build artifact uploads
- Weekly security audit schedule

**When to use**: Automatically runs on push and PR events; provides quality assurance before merge.

---

### 4. 🔐 **.github/CODEOWNERS**
**Location**: `./.github/CODEOWNERS`

Defines code ownership and review requirements:
- `src/components/` → @sarlo
- `src/hooks/` → @sarlo
- `server/` → @sarlo
- `.github/workflows/` → @sarlo
- And more...

**When to use**: GitHub automatically requests reviews from code owners on PRs.

---

### 5. 🐛 **.github/ISSUE_TEMPLATE/bug_report.md**
**Location**: `./.github/ISSUE_TEMPLATE/bug_report.md`

Bug report form template with sections:
- Bug description and reproduction steps
- Expected vs. actual behavior
- Environment details (OS, browser, version)
- Screenshots and logs
- AI-friendly sections for faster resolution

**When to use**: Users click "New Issue" → "Bug Report" to file bugs with guided structure.

---

### 6. ✨ **.github/ISSUE_TEMPLATE/feature_request.md**
**Location**: `./.github/ISSUE_TEMPLATE/feature_request.md`

Feature request form template with sections:
- Feature description and motivation
- Problem statement and proposed solution
- Acceptance criteria
- Alternatives considered
- AI implementation notes (frontend/backend impact, testing strategy)
- Priority and effort estimation

**When to use**: Users click "New Issue" → "Feature Request" to propose enhancements.

---

### 7. 📝 **.github/PULL_REQUEST_TEMPLATE.md**
**Location**: `./.github/PULL_REQUEST_TEMPLATE.md`

PR template with comprehensive checklist:
- **Code Quality**: Lint, self-review, comments
- **Testing**: Unit tests, coverage, edge cases
- **Security**: No hardcoded secrets, input validation, auth checks
- **Documentation**: Updated docs and comments
- **Database**: Migration scripts, backward compatibility
- **Frontend**: Re-render optimization, a11y, responsive design
- **Backend**: Error handling, logging, rate limiting
- **Deployment**: Breaking changes, migrations, env vars
- **AI Notes**: Design decisions, limitations, migration path

**When to use**: Automatically appears when creating a PR; ensures comprehensive review before merge.

---

### 8. 📋 **.github/ISSUE_TEMPLATE/config.yml**
**Location**: `./.github/ISSUE_TEMPLATE/config.yml`

GitHub issue template configuration.

**When to use**: Provides friendly issue selection UI on GitHub.

---

## 🚀 Quick Start

### For First-Time Setup

1. **Review AGENTS.md**
   ```bash
   cat ./AGENTS.md
   ```
   Understand the specialized agents and their domains.

2. **Review copilot-instructions.md**
   ```bash
   cat ./copilot-instructions.md
   ```
   Get familiar with coding standards and patterns.

3. **Enable GitHub Actions**
   - Go to repository settings
   - Navigate to "Actions" → "General"
   - Enable "Allow all actions and reusable workflows"

4. **Create `.env.example`** (if not exists)
   ```bash
   cp .env .env.example
   # Remove secrets from .env.example
   git add .env.example
   ```

### For Daily Development

1. **Use @agents in Copilot Chat**
   ```
   /ask @frontend How should I structure this component?
   /ask @backend How do I add rate limiting to this endpoint?
   /ask @security Is this input validation sufficient?
   ```

2. **Follow the checklist when creating a PR**
   - The PR template automatically loads
   - Check off each item before submitting
   - This ensures quality gates pass

3. **Run quality checks locally**
   ```bash
   npm run lint        # ESLint
   npm test            # Vitest
   npm run security:audit  # npm audit
   npm run build       # Vite build
   ```

4. **Monitor CI/CD on GitHub**
   - Check "Actions" tab after pushing
   - Review PR checks before merging
   - Fix any failing jobs before merge

---

## 📊 CI/CD Pipeline Overview

```
┌─────────────────────────────────────────────────────────┐
│ GitHub Push / PR Created                                 │
└──────────────────┬──────────────────────────────────────┘
                   │
       ┌───────────┼───────────┬────────────┬──────────────┐
       │           │           │            │              │
       ▼           ▼           ▼            ▼              ▼
    Lint       Test       Build        Security       Integration
     ✓           ✓          ✓             ✓               ✓
       │           │           │            │              │
       └───────────┼───────────┴────────────┴──────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │   Quality Gate      │
         │   (all must pass)    │
         └──────────┬──────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
     ✅ PASS              ❌ FAIL
         │                     │
         ▼                     ▼
      Approve         Fix & Retry
      for Merge          Issues
```

---

## 🔒 Security Posture

### Automated Controls
- ✅ ESLint for code quality
- ✅ npm audit for dependency vulnerabilities
- ✅ Input validation with Ajv
- ✅ Secret detection in code
- ✅ Security headers via Helmet
- ✅ Rate limiting on sensitive endpoints
- ✅ JWT authentication with RS256
- ✅ Parameterized database queries

### Manual Controls
- 🔍 Code review by code owners
- 📋 OWASP compliance checklist in PR template
- 📚 Security guidelines in copilot-instructions.md
- 🚨 Urgent security issues bypass normal process

---

## 📈 Testing & Coverage Strategy

### Coverage Targets (via CI/CD)
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 85%+
- **Lines**: 80%+

### Test Types
- **Unit**: Components, utilities, hooks
- **Integration**: API endpoints, database
- **E2E**: Critical user flows

### Running Tests
```bash
npm test                # Run once
npm run test:watch     # Watch mode
npm run test:coverage  # Coverage report
```

---

## 📦 Artifact Management

### Build Artifacts
- Generated by `npm run build`
- Uploaded to GitHub Actions for 7 days
- Used for staging/preview deployment

### Database
- SQLite: `server/app.db` (development)
- Postgres: Via `DATABASE_URL` env var (production)
- Migrations: Idempotent scripts in `server/db.*.js`

---

## 🌍 Environment Management

### Development
```
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
DATABASE_URL=file:./app.db
```

### Staging
```
NODE_ENV=staging
PORT=4000
LOG_LEVEL=info
DATABASE_URL=postgresql://...
```

### Production
```
NODE_ENV=production
PORT=4000
LOG_LEVEL=warn
DATABASE_URL=postgresql://...
JWT_PUBLIC_KEY=...
```

**⚠️ Rules**:
- Never commit `.env` files
- Use `.env.example` for documentation
- All secrets via environment variables
- Frontend: Prefix with `VITE_` for client access

---

## 🤖 Using AI Agents with Copilot

### Examples

```
# Frontend question
@frontend Should I use useState or useContext for this shared state?

# Backend API design
@backend How should I structure the response for a paginated endpoint?

# Security audit
@security Is this authentication flow secure? Here's my code...

# Database query
@database What's the best index strategy for this query?

# Test coverage
@testing How do I test this async component behavior?

# Performance
@frontend How can I optimize this component's re-renders?

# Code review
@reviewer Can you review this PR for quality and security?
```

---

## 📚 Technology Stack Reference

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.2.4 |
| **Build** | Vite | 8.x |
| **Animations** | Framer Motion | 12.38.0 |
| **Charts** | Recharts | 3.8.0 |
| **Backend** | Express | 5.2.1 |
| **Database** | SQLite/Postgres | better-sqlite3 12.8.0 |
| **Testing** | Vitest | 4.1.0 |
| **Testing Library** | React Testing Library | 16.3.2 |
| **Security** | Helmet | 8.1.0 |
| **Auth** | jsonwebtoken | 9.0.3 |
| **Logging** | Pino | 8.18.0 |
| **Metrics** | prom-client | 14.1.0 |
| **Validation** | Ajv | 8.12.0 |

---

## 🚨 Important Notes

### Code Owners
- Currently set to `@sarlo` for all areas
- Update `.github/CODEOWNERS` as team grows
- Code owner reviews are required before merge

### Breaking Changes
- Any breaking changes must be documented in PR
- Database migrations must be backward compatible
- API versioning strategy: none yet (single version)

### Deployment Strategy
- Main branch: Production ready
- Develop branch: Staging testing
- Feature branches: PR-based staging deploys
- Release branches: Pre-production validation

### Monitoring & Observability
- Prometheus metrics exported at `/metrics`
- Pino structured logging with request IDs
- Error tracking via application logs
- No external telemetry (privacy-first design)

---

## ✅ Checklist for Team Onboarding

- [ ] Read AGENTS.md to understand specialized agents
- [ ] Read copilot-instructions.md for coding standards
- [ ] Enable GitHub Actions in repository settings
- [ ] Review .env.example for environment variables
- [ ] Run `npm install && npm test` locally
- [ ] Create a test PR to verify CI/CD works
- [ ] Review CODEOWNERS and update as needed
- [ ] Add team members to appropriate code owner groups
- [ ] Set up secrets in GitHub Actions settings
- [ ] Configure deployment targets (staging, production)
- [ ] Document any project-specific conventions

---

## 🔗 Quick Links

- **Repository**: [Krumm Talent Assessment](https://github.com/sarlo/krumm-talent-assessment)
- **GitHub Actions**: `.github/workflows/ai-ready-ci.yml`
- **Code Owners**: `.github/CODEOWNERS`
- **Issue Templates**: `.github/ISSUE_TEMPLATE/`
- **PR Template**: `.github/PULL_REQUEST_TEMPLATE.md`

---

## 📞 Support

For questions about:
- **Code standards**: See `copilot-instructions.md`
- **AI agents**: See `AGENTS.md`
- **CI/CD pipeline**: See `.github/workflows/ai-ready-ci.yml`
- **Security**: See the OWASP section in `copilot-instructions.md`
- **Testing**: See the Testing Standards section in `copilot-instructions.md`

---

**Version**: 1.0  
**Last Updated**: May 2026  
**Maintained By**: @sarlo
