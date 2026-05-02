---
description: Copilot coding standards and conventions for Krumm Talent Assessment
---

# copilot-instructions.md

Coding standards and best practices for GitHub Copilot when working on the Krumm Talent Assessment platform.

---

## Project Overview

**Tech Stack**:
- Frontend: React 19, Vite 8, Framer Motion, Recharts, React Router
- Backend: Node.js, Express, JWT, Helmet, Pino logging, better-sqlite3
- Testing: Vitest, Testing Library, jsdom
- Security: OWASP 2025 compliance, Helmet, rate limiting, input validation

**Key Characteristics**:
- Privacy-first telemetry (local analytics only)
- Microservices-ready (SQLite/Postgres adapter pattern)
- Comprehensive test coverage (target 80%+)
- Production-ready security controls
- Real-time performance tracking

---

## Frontend Standards (React 19 + Vite)

### Component Structure

```javascript
// Good component structure
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styles from './MyComponent.module.css';

/**
 * MyComponent - Brief description of what it does
 * 
 * @param {Object} props - Component props
 * @param {string} props.title - The title to display
 * @param {Function} props.onSubmit - Callback when submitted
 * @returns {JSX.Element} The component
 */
export function MyComponent({ title, onSubmit }) {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Side effects here
  }, []);

  const handleClick = () => {
    // Event handlers
  };

  return (
    <div className={styles.container}>
      <h1>{title}</h1>
      <button onClick={handleClick}>Submit</button>
    </div>
  );
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

MyComponent.defaultProps = {
  // Default values if needed
};
```

### React Hooks Rules

✅ **Do**:
- Call hooks at the top level of functions
- Extract complex logic into custom hooks
- Use `useCallback` and `useMemo` to prevent unnecessary re-renders
- Use `useRef` for DOM access, timers, focus
- Manage related state together in a reducer

❌ **Don't**:
- Call hooks inside loops, conditions, or nested functions
- Create hooks dynamically
- Use stale closures in event handlers
- Over-memoize (only optimize when necessary)

### Component Size
- **Small**: < 100 lines (pure presentational)
- **Medium**: 100-300 lines (with some logic)
- **Large**: 300-500 lines (complex state/effects)
- **Refactor**: > 500 lines (split into sub-components)

### CSS & Styling
- Use CSS modules for component-scoped styles
- Use Framer Motion for animations
- Use Recharts for charts and visualizations
- Avoid inline styles unless absolutely necessary
- Use utility classes for common patterns

### Performance

```javascript
// Code splitting for large routes
const HeavyComponent = lazy(() => import('./HeavyComponent'));

// Memoization for expensive computations
const MemoComponent = memo(({ data }) => {
  return <div>{data}</div>;
});

// useCallback for event handlers passed to children
const handleChange = useCallback((e) => {
  setSomething(e.target.value);
}, []);

// useMemo for expensive calculations
const sortedData = useMemo(() => {
  return data.sort((a, b) => a.value - b.value);
}, [data]);
```

### Error Handling

```javascript
// Use Error Boundary for component errors
<ErrorBoundary>
  <GameShell />
</ErrorBoundary>

// Use try-catch for async operations
useEffect(() => {
  const loadData = async () => {
    try {
      const response = await fetch('/api/data');
      const data = await response.json();
      setState(data);
    } catch (error) {
      logger.error('Failed to load data', error);
      setError('Failed to load data. Please try again.');
    }
  };
  loadData();
}, []);
```

### Telemetry Integration

```javascript
// Use TelemetryContext for analytics
import { useTelemetry } from '../TelemetryContext';

export function GameComponent() {
  const { recordEvent } = useTelemetry();

  const handleGameStart = () => {
    recordEvent('game_started', {
      gameId: 'memory_game',
      timestamp: Date.now(),
    });
  };

  // Never send raw biometric data to server
  // Only derived metrics (coverage, confidence, reliability, attention stability)
}
```

---

## Backend Standards (Node.js + Express)

### API Endpoint Design

```javascript
import express from 'express';
import { authenticateToken, requireParticipant, requireRecruiter } from './tokenService.js';
import { validateSession } from './validators.js';
import { logger } from './logger.js';

const router = express.Router();

/**
 * POST /api/sessions - Create a new game session
 * 
 * Authentication: Participant token required
 * Body: { gameId, participantId, ... }
 * Response: { sessionId, startedAt, ... }
 */
router.post(
  '/api/sessions',
  authenticateToken,
  requireParticipant,
  rateLimiter({ windowMs: 60_000, maxRequests: 10 }),
  async (req, res, next) => {
    try {
      // Validate input with Ajv
      const valid = validateSession(req.body);
      if (!valid) {
        return res.status(400).json({ error: 'Invalid input', details: validateSession.errors });
      }

      // Business logic
      const session = await saveSession(req.body);

      // Log success
      logger.info({ sessionId: session.id, participantId: req.user.id }, 'session_created');

      // Return result
      res.status(201).json(session);
    } catch (error) {
      next(error); // Pass to error handler
    }
  }
);

export default router;
```

### Authentication & Authorization

✅ **Do**:
- Use JWT with RS256 algorithm
- Set short expiration times (15 min for access tokens)
- Implement refresh tokens with rotation
- Require re-authentication for sensitive operations
- Use role-based access control (RBAC)
- Validate token algorithm on verify

❌ **Don't**:
- Use weak algorithms (HS256, none)
- Store tokens in local storage on server
- Accept tokens without expiration
- Skip authorization checks on sensitive endpoints
- Hard-code secrets in code

### Input Validation

```javascript
// Use Ajv JSON Schema validation
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

const sessionSchema = {
  type: 'object',
  properties: {
    gameId: { type: 'string', minLength: 1 },
    participantId: { type: 'string', format: 'uuid' },
    startTime: { type: 'integer', minimum: 0 },
  },
  required: ['gameId', 'participantId'],
  additionalProperties: false,
};

const validateSession = ajv.compile(sessionSchema);

// In route handler
if (!validateSession(req.body)) {
  return res.status(400).json({ error: 'Invalid input', details: validateSession.errors });
}
```

### Error Handling

```javascript
// Generic error handler - don't expose internals in production
app.use((err, req, res, next) => {
  const isDev = process.env.NODE_ENV === 'development';
  const status = err.status || 500;

  logger.error({
    error: err.message,
    status,
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  res.status(status).json({
    error: isDev ? err.message : 'Internal Server Error',
    ...(isDev && { stack: err.stack }),
  });
});
```

### Logging

```javascript
// Use Pino for structured logging
import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  redact: ['req.headers.authorization', 'req.body.password', 'user.email'],
});

// Usage
logger.info({ sessionId, userId }, 'session_created');
logger.error({ error: err.message, stack: err.stack }, 'operation_failed');
logger.warn({ deprecated: true }, 'legacy_endpoint_used');
```

### Database Queries

```javascript
// Use parameterized queries to prevent SQL injection
// SQLite example
import Database from 'better-sqlite3';
const db = new Database('app.db');

const stmt = db.prepare('SELECT * FROM sessions WHERE id = ? AND participant_id = ?');
const session = stmt.get(sessionId, participantId);

// Never do this:
// const session = db.exec(`SELECT * FROM sessions WHERE id = ${sessionId}`);
```

### Rate Limiting

```javascript
// Apply rate limiting to sensitive endpoints
import { rateLimiter } from './middleware.js';

// Strict limit on auth endpoints
router.post('/api/auth/login', rateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 }), loginHandler);

// Moderate limit on general APIs
router.get('/api/data', rateLimiter({ windowMs: 60 * 1000, maxRequests: 120 }), dataHandler);
```

### Prometheus Metrics

```javascript
import { collectDefaultMetrics, Histogram, Counter } from 'prom-client';

// Collect default Node.js metrics
collectDefaultMetrics();

// Create custom metrics
const httpRequestDuration = new Histogram({
  name: 'http_request_duration_ms',
  help: 'Duration of HTTP requests in ms',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 5, 15, 50, 100, 500, 1000, 2500, 5000],
});

// Use in middleware
const start = Date.now();
res.on('finish', () => {
  const duration = Date.now() - start;
  httpRequestDuration
    .labels(req.method, req.route?.path || req.path, res.statusCode)
    .observe(duration);
});
```

---

## Testing Standards (Vitest + Testing Library)

### Unit Tests

```javascript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  let mockOnSubmit;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
  });

  it('should render the title', () => {
    render(<MyComponent title="Test Title" onSubmit={mockOnSubmit} />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should call onSubmit when button is clicked', async () => {
    const user = userEvent.setup();
    render(<MyComponent title="Test" onSubmit={mockOnSubmit} />);
    
    await user.click(screen.getByRole('button', { name: /submit/i }));
    
    expect(mockOnSubmit).toHaveBeenCalledOnce();
  });

  it('should handle edge cases gracefully', () => {
    render(<MyComponent title="" onSubmit={mockOnSubmit} />);
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
  });
});
```

### Integration Tests

```javascript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import app from '../server/index.js';

describe('POST /api/sessions', () => {
  let token;

  beforeEach(async () => {
    // Generate test token
    token = generateParticipantToken({ userId: 'test-user' });
  });

  afterEach(async () => {
    // Clean up test data
    db.exec('DELETE FROM sessions WHERE participant_id = ?');
  });

  it('should create a session with valid data', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        gameId: 'memory_game',
        participantId: 'test-user',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('sessionId');
  });

  it('should return 400 for invalid data', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Missing required fields

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('error');
  });

  it('should return 401 without token', async () => {
    const response = await request(app)
      .post('/api/sessions')
      .send({ gameId: 'memory_game', participantId: 'test-user' });

    expect(response.status).toBe(401);
  });
});
```

### Coverage Targets

- **Overall**: 80%+
- **Statements**: 80%+
- **Branches**: 75%+
- **Functions**: 85%+
- **Lines**: 80%+

### Test Naming

- ✅ `should render title when title prop is provided`
- ✅ `should call onSubmit with correct data when form is submitted`
- ❌ `test button click`
- ❌ `render test`

---

## Security Standards (OWASP 2025)

### Critical Controls

1. **Input Validation**
   - Validate all user input server-side (not just client-side)
   - Use Ajv JSON Schema for API inputs
   - Whitelist allowed values, blacklist is insufficient
   - Reject invalid data with 400 status

2. **SQL Injection Prevention**
   - Always use parameterized queries
   - Never concatenate user input into SQL
   - Use prepared statements

3. **XSS Prevention**
   - Don't render raw HTML from user input
   - Use DOMPurify if HTML rendering is necessary
   - Use text interpolation when possible
   - Sanitize on server-side too

4. **Authentication**
   - JWT with RS256 algorithm only
   - Short expiration times (15 min access)
   - Refresh token rotation
   - Secure cookie flags (httpOnly, Secure, SameSite=Strict)

5. **Authorization**
   - Check auth on every protected endpoint
   - Implement ownership checks (prevent IDOR)
   - Use role-based access control
   - Re-authenticate for sensitive operations

6. **Secrets Management**
   - Never commit `.env` files
   - Use environment variables
   - Rotate secrets regularly
   - Never log secrets or PII
   - Use Helmet to set security headers

### Security Checklist

- [ ] No hardcoded secrets in code
- [ ] `.env` in `.gitignore`
- [ ] All endpoints authenticated (except public routes)
- [ ] Rate limiting on auth/form endpoints
- [ ] Input validation with Ajv
- [ ] Parameterized database queries
- [ ] Helmet security headers configured
- [ ] CORS restricted to known origins
- [ ] Error messages don't expose internals
- [ ] Sensitive data not in logs
- [ ] npm audit passing (no high/critical)

---

## Code Style & Formatting

### JavaScript/JSX

```javascript
// ✅ Good
const handleSubmit = (e) => {
  e.preventDefault();
  const trimmed = value.trim();
  if (trimmed.length > 0) {
    onSubmit(trimmed);
  }
};

// ❌ Bad
const handleSubmit = e => { e.preventDefault(); if (value) onSubmit(value); };
```

### Naming Conventions

- **Components**: `PascalCase` (e.g., `GameShell`, `ErrorBoundary`)
- **Hooks**: `camelCase` starting with `use` (e.g., `useGameState`, `useTelemetry`)
- **Variables/Functions**: `camelCase` (e.g., `sessionId`, `handleSubmit`)
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_ROUNDS`, `DEFAULT_TIMEOUT`)
- **Database columns**: `snake_case` (e.g., `participant_id`, `created_at`)
- **Routes**: `kebab-case` (e.g., `/api/game-sessions`)

### Comments

✅ **Good comments**:
- Explain *why*, not *what* (code shows what)
- Complex algorithms
- Non-obvious side effects
- Workarounds for bugs or limitations

❌ **Bad comments**:
- Obvious comments (`// increment counter`)
- Outdated comments (worse than no comments)
- Disabled code (use git history instead)

### Imports

```javascript
// Group imports: standard library, third-party, local
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

import { useGameState } from '../hooks/useGameState';
import styles from './GameShell.module.css';
```

---

## Git & Version Control

### Commit Messages

Follow Conventional Commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `security`

**Examples**:
- `feat(auth): add JWT refresh token rotation`
- `fix(api): prevent SQL injection in session query`
- `test(components): add GameShell unit tests`
- `docs(readme): update installation instructions`
- `security: update helmet to 8.1.0`

### Branch Naming

- Feature: `feature/auth-token-rotation`
- Bug fix: `fix/sql-injection-in-sessions`
- Docs: `docs/api-endpoint-documentation`
- Release: `release/v1.0.0`

### Pull Requests

Before creating a PR:
- [ ] Tests pass (`npm test`)
- [ ] Lint passes (`npm run lint`)
- [ ] Security check passes (`npm audit`)
- [ ] Changes follow code style
- [ ] Documentation updated (if needed)
- [ ] Commit messages follow convention

---

## Running Development Commands

```bash
# Start development (frontend + backend)
npm run dev

# Frontend only
npm run dev:frontend

# Backend only
npm run dev:server

# Run tests
npm test               # Once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage

# Linting
npm run lint

# Build for production
npm run build

# Security audit
npm run security:audit
```

---

## Environment Variables

### Frontend (Vite)

Prefix with `VITE_` to be accessible in client code:
```
VITE_API_BASE_URL=http://localhost:4000
VITE_GOOGLE_GEMINI_API_KEY=***
```

### Backend (Node.js)

All env vars are accessible via `process.env`:
```
NODE_ENV=development
PORT=4000
LOG_LEVEL=debug
DATABASE_URL=file:./app.db
JWT_PRIVATE_KEY=***
JWT_PUBLIC_KEY=***
GOOGLE_GEMINI_API_KEY=***
```

### Never commit `.env` files

Create `.env.example` for documentation:
```
NODE_ENV=development
PORT=4000
GOOGLE_GEMINI_API_KEY=<your-api-key>
```

---

## Common Patterns

### Custom React Hook

```javascript
// src/hooks/useGameState.js
import { useState, useCallback } from 'react';

export function useGameState(gameId) {
  const [state, setState] = useState({
    score: 0,
    round: 0,
    isActive: false,
  });

  const startGame = useCallback(() => {
    setState(prev => ({ ...prev, isActive: true, round: 1 }));
  }, []);

  const recordScore = useCallback((points) => {
    setState(prev => ({ ...prev, score: prev.score + points }));
  }, []);

  return { state, startGame, recordScore };
}
```

### Custom API Hook

```javascript
// src/hooks/useApi.js
import { useState, useEffect } from 'react';

export function useApi(url, token) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url, token]);

  return { data, error, loading };
}
```

---

## Resources

- [React 19 Docs](https://react.dev)
- [Vite Guide](https://vitejs.dev)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [JWT Handbook](https://auth0.com/e-books/jwt-handbook)
- [OWASP Top 10 2025](https://owasp.org/Top10/)
- [Vitest Documentation](https://vitest.dev)
- [Testing Library Best Practices](https://testing-library.com/docs/)

---

**Last Updated**: May 2026  
**Project**: Krumm Talent Assessment  
**Version**: 1.0
