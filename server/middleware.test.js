import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { rateLimiter, requestLogger } from './middleware.js';
import { logger } from './logger.js';

const createResponse = () => {
  const handlers = {};
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    emitFinish: () => handlers.finish?.(),
    status: vi.fn(function status(code) {
      this.statusCode = code;
      return this;
    }),
    json: vi.fn(function json(body) {
      this.body = body;
      return this;
    }),
  };
};

describe('server middleware security behavior', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(logger, 'info').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('scopes rate limiters independently and does not leak internal counters', async () => {
    const req = { ip: '203.0.113.10', connection: {}, get: () => '' };
    const authLimiter = rateLimiter({ name: 'auth-test', windowMs: 60_000, maxRequests: 1 });
    const aiLimiter = rateLimiter({ name: 'ai-test', windowMs: 60_000, maxRequests: 1 });

    await authLimiter(req, createResponse(), vi.fn());

    const authLimited = createResponse();
    await authLimiter(req, authLimited, vi.fn());
    expect(authLimited.status).toHaveBeenCalledWith(429);
    expect(authLimited.body).toEqual({
      error: 'Rate limit exceeded. Please retry shortly.',
      retryAfterMs: 60_000,
    });

    const aiAllowedNext = vi.fn();
    await aiLimiter(req, createResponse(), aiAllowedNext);
    expect(aiAllowedNext).toHaveBeenCalledOnce();
  });

  it('logs request paths without query-string parameters', () => {
    const logSpy = logger.info;
    logSpy.mockClear();
    const req = {
      requestId: 'req-1',
      method: 'GET',
      originalUrl: '/api/session?token=secret',
      path: '/api/session',
      ip: '203.0.113.10',
      connection: {},
      get: () => 'vitest',
    };
    const res = createResponse();

    requestLogger(req, res, vi.fn());
    res.emitFinish();

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({ path: '/api/session' }),
      'request_finished'
    );
    expect(logSpy.mock.calls[0][0]).not.toHaveProperty('url');
  });
});
