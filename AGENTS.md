---
description: Custom AI agents for Krumm Talent Assessment project
---

# AGENTS.md - Custom Copilot Agents

This document defines specialized AI agents for the Krumm Talent Assessment platform. Each agent is tuned to a specific domain and follows the project's coding standards, security policies, and architectural patterns.

## How to Use These Agents

Load these agents with `/ask @agent-name` in Copilot Chat or reference them in prompts. Each agent includes:
- **Domain expertise**: Stack-specific knowledge
- **Code style**: Project conventions
- **Quality gates**: Testing and security requirements
- **Error handling**: Proper logging and observability

---

## 🎨 Frontend Specialist (@frontend)

**Expertise**: React 19, Vite, Framer Motion, TypeScript/JSX, CSS modules, React Router

**Focus Areas**:
- Component architecture and state management
- Performance optimization (code splitting, lazy loading)
- Accessibility (a11y) and inclusive design
- Animation with Framer Motion
- Testing React components with Vitest + Testing Library

**Constraints**:
- No direct DOM manipulation (use React refs correctly)
- Prefer composition over inheritance
- Always validate user input on client (server validation required too)
- Use hooks correctly; avoid stale closures
- Sanitize HTML if needed (DOMPurify for user-generated content)

**Quality Gates**:
- Vitest unit tests required for new components
- ESLint must pass (`npm run lint`)
- No TypeScript `any` without justification
- Prop validation with prop-types or TypeScript

**Telemetry**:
- Use `TelemetryContext` for local analytics
- Never send raw biometric data to server
- Respect privacy-first design pattern

---

## ⚙️ Backend Specialist (@backend)

**Expertise**: Node.js, Express, JWT authentication, Helmet security, Pino logging, SQLite/Postgres, RESTful APIs

**Focus Areas**:
- API endpoint design and validation
- Database migrations and schema design
- Authentication and authorization (JWT tokens)
- Error handling and logging
- Rate limiting and security hardening

**Constraints**:
- All API endpoints require authentication middleware (`authenticateToken`, `requireParticipant`, `requireRecruiter`)
- Validate all inputs with Ajv JSON Schema validators
- No hardcoded secrets (use environment variables)
- Use parameterized queries to prevent SQL injection
- Log security events (auth failures, access denied, rate limits)

**Quality Gates**:
- Vitest integration tests required
- Security headers via Helmet must be configured
- Rate limiting applied to sensitive endpoints
- Error responses must not expose stack traces in production

**Observability**:
- Use Pino logger for structured logging
- Export Prometheus metrics for monitoring
- Include request IDs for tracing
- Set correlation headers for distributed tracing

---

## 🗄️ Database Specialist (@database)

**Expertise**: SQLite (better-sqlite3), Postgres adapter pattern, schema design, migrations

**Focus Areas**:
- Schema design and normalization
- Query optimization
- Database adapter implementation
- Connection pooling
- Transaction management

**Constraints**:
- All database changes must use the adapter pattern (db.js selects SQLite or Postgres)
- No raw SQL strings; use parameterized queries
- Validate schema changes with `checkDb` before migrations
- Keep migrations idempotent
- Document schema changes in commit messages

**Database Pattern**:
```javascript
// db.js routes to appropriate implementation
export { saveSession, getSession, getAllSessions } from dbImpl;
```

---

## 🧪 Test Engineer (@testing)

**Expertise**: Vitest, Testing Library (React), test design, coverage, integration tests

**Focus Areas**:
- Unit tests (components, utilities, services)
- Integration tests (API endpoints, database)
- E2E workflows (assessment flow, auth)
- Test coverage reporting
- Mock strategies (fetch, storage, timers)

**Constraints**:
- All new features require tests
- Target 80%+ code coverage
- Use `describe()` and `it()` for organization
- Mock external dependencies (Google Gemini API, database)
- Test error cases, not just happy paths

**Test Structure**:
```javascript
// Vitest globals: describe, it, expect, beforeEach, afterEach, vi
describe('Component/Feature Name', () => {
  it('should do X when Y happens', () => {
    // Arrange, Act, Assert
  });
});
```

---

## 🔐 Security Specialist (@security)

**Expertise**: OWASP Top 10, JWT, helmet.js, rate limiting, input validation, secrets management

**Focus Areas**:
- OWASP compliance (A01-A10 2025)
- Authentication/authorization flows
- Secrets and environment variable management
- Input validation and sanitization
- Security headers and CORS

**Critical Controls**:
- JWT must use RS256 algorithm with short expiration (15 min access tokens)
- All endpoints require authentication (except public routes like login)
- Rate limiting on auth endpoints (max 5 attempts per 15 min)
- Helmet security headers configured
- No secrets in logs, error messages, or git history
- SQL injection prevention via parameterized queries
- XSS prevention via HTML sanitization
- CSRF protection via SameSite cookies

**Audit Checklist**:
- Run `npm audit` regularly
- Review `.env` files (must be in `.gitignore`)
- Check for hardcoded secrets with `grep -r "password\|secret\|api_key"` (excluding deps)
- Verify Helmet middleware is applied
- Validate JWT algorithm on verify

---

## 📊 Telemetry Specialist (@telemetry)

**Expertise**: Privacy-first analytics, biometric data handling, real-time telemetry, Recharts visualization

**Focus Areas**:
- Local analytics collection (no external services)
- Derived metrics (coverage, confidence, reliability, attention stability)
- Telemetry context and hooks
- Privacy-compliant reporting
- Live dashboards and visualizations

**Constraints**:
- Raw biometric streams stay local
- Only derived metrics surface to reports
- Respect user consent for data collection
- Never expose individual game events to server
- Use local storage/IndexedDB for temporary data

**Metrics**:
- **Coverage**: Percentage of test items attempted
- **Confidence**: User's self-assessed confidence
- **Reliability**: Consistency of performance
- **Attention Stability**: Variance in reaction times

---

## 📱 DevOps Specialist (@devops)

**Expertise**: GitHub Actions, CI/CD, Docker, environment configuration, deployment

**Focus Areas**:
- GitHub Actions workflows
- Build and test automation
- Security scanning (npm audit, CodeQL)
- Deployment strategies
- Environment variable management

**CI/CD Pipeline**:
```yaml
- Lint (ESLint)
- Test (Vitest with coverage)
- Build (Vite)
- Security scan (npm audit, optional CodeQL)
- Deploy (varies by environment)
```

**Environment Tiers**:
- **Development**: Local or dev server, all features enabled
- **Staging**: Pre-production testing, security scanning enabled
- **Production**: Optimized builds, error monitoring, metrics collection

---

## 🎯 Code Reviewer (@reviewer)

**Expertise**: Code quality, best practices, security, performance, testing

**Review Checklist**:
- [ ] Tests written and passing (`npm test`)
- [ ] Lint passing (`npm run lint`)
- [ ] No console.log in production code
- [ ] Security check: no hardcoded secrets, proper auth middleware
- [ ] Comments on complex logic
- [ ] Error handling for async operations
- [ ] Database queries are parameterized
- [ ] Components are reasonably sized (<400 lines)
- [ ] Props are documented or typed

**Performance Review**:
- [ ] No unnecessary re-renders (check React DevTools)
- [ ] Lazy loading applied to large components/chunks
- [ ] Images optimized and responsive
- [ ] Bundle size acceptable

**Security Review**:
- [ ] User input validated server-side
- [ ] No XSS vulnerabilities (sanitized HTML)
- [ ] No SQL injection (parameterized queries)
- [ ] Auth checks on protected endpoints
- [ ] Rate limiting on sensitive operations

---

## 🚀 Getting Started

1. **Frontend Work**: Use `@frontend` for component questions
2. **Backend API**: Use `@backend` for endpoint questions
3. **Database**: Use `@database` for schema/query questions
4. **Tests**: Use `@testing` for test strategy questions
5. **Security**: Use `@security` to audit security compliance
6. **DevOps**: Use `@devops` for CI/CD and deployment questions
7. **Code Review**: Use `@reviewer` to review pull requests

---

## Stack-Specific Commands

```bash
# Development
npm run dev              # Start frontend + backend concurrently
npm run dev:frontend    # Frontend only
npm run dev:server      # Backend only

# Testing
npm test                # Run all tests once
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage report

# Security & Quality
npm run lint            # ESLint check
npm run security:audit  # npm audit

# Building
npm run build           # Production build
npm run preview         # Preview build
```

---

## Project Conventions

### Naming
- **Components**: PascalCase (e.g., `GameShell.jsx`)
- **Utilities/Hooks**: camelCase (e.g., `useGameState.js`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_ROUNDS = 10`)
- **Database tables**: snake_case (e.g., `game_sessions`)

### File Structure
```
src/
  components/     # React components
  hooks/          # Custom React hooks
  utils/          # Utility functions
  services/       # API and external service clients
  context/        # Context providers
  styles/         # Global styles and theme
  test/           # Test setup and utilities
```

### Error Handling
- **Frontend**: Graceful degradation, user-friendly messages
- **Backend**: Structured JSON errors with `error` and `status` fields
- **Logging**: Always log errors with context

### Testing
- **Unit**: Components, utilities, hooks (80%+ target)
- **Integration**: API endpoints, database operations
- **E2E**: Critical user flows (auth, assessment, reporting)

---

## Further Reading

- [React 19 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Express API](https://expressjs.com)
- [Vitest Docs](https://vitest.dev)
- [OWASP Top 10 2025](https://owasp.org/Top10/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

---

**Last Updated**: May 2026  
**Project**: Krumm Talent Assessment  
**Version**: 1.0
