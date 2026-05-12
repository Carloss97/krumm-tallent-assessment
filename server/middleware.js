import { logger, sendToCollector } from './logger.js';

// In-memory fallback for rate limiting (development only)
const requestBuckets = new Map();

// Redis client (optional, for production)
let redisClient;

/**
 * Initialize Redis client if Upstash credentials are available
 * Falls back to in-memory rate limiting if Redis is not configured
 */
const initializeRedis = async () => {
  if (redisClient !== undefined) return; // Already attempted
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    logger.info({ event: 'rate_limit', backend: 'memory' }, 'Redis not configured; using in-memory rate limiting')
    redisClient = false;
    return;
  }

  try {
    // Upstash REST client (async, works in serverless)
    const { Redis } = await import('@upstash/redis');
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    });
    
    // Test connection
    await redisClient.ping();
    logger.info({ event: 'rate_limit', backend: 'redis' }, 'Redis rate limiter initialized')
  } catch (err) {
    logger.warn({ err: err?.message }, 'Redis rate limiter initialization failed; falling back to memory')
    redisClient = false;
  }
};

/**
 * Request logger middleware - logs HTTP requests to pino and external collectors
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const rid = req.requestId || undefined;

    const log = {
      event: 'http_request',
      requestId: rid,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      durationMs,
      ip: req.ip || req.connection?.remoteAddress || 'unknown',
      userAgent: req.get('user-agent') || '',
    };

    logger.info(log, 'request_finished');
    try { sendToCollector(log); } catch { /* don't fail requests on logging errors */ }
  });
  next();
};

/**
 * Rate limiter middleware
 * - Uses Redis (Upstash) if available for distributed rate limiting
 * - Falls back to in-memory buckets for development/single-instance
 */
export const rateLimiter = ({ name = 'global', windowMs = 60_000, maxRequests = 120 } = {}) => {
  const scope = String(name).replace(/[^a-z0-9:_-]/gi, '_') || 'global';
  return async (req, res, next) => {
    try {
      // Initialize Redis on first request if available
      if (redisClient === undefined) {
        await initializeRedis();
      }

      const now = Date.now();
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const windowKey = Math.floor(now / windowMs);
      const redisKey = `rate_limit:${scope}:${ip}:${windowKey}`;

      let requestCount = 0;

      if (redisClient) {
        // Use Redis for distributed rate limiting
        try {
          const count = await redisClient.incr(redisKey);
          
          // Set TTL on first increment
          if (count === 1) {
            await redisClient.expire(redisKey, Math.ceil(windowMs / 1000) + 1);
          }
          
          requestCount = count;
        } catch (err) {
          logger.warn({ err: err?.message, scope }, 'Redis rate limiter error; allowing request')
          // Fail open - allow request if Redis fails
          return next();
        }
      } else {
        // Fall back to in-memory rate limiting
        const bucket = requestBuckets.get(redisKey) || { count: 0, createdAt: now };
        bucket.count += 1;
        requestBuckets.set(redisKey, bucket);
        requestCount = bucket.count;

        // Opportunistic cleanup
        if (requestBuckets.size > 5000) {
          const cutoff = now - (windowMs * 2);
          for (const [key, data] of requestBuckets.entries()) {
            if (data.createdAt < cutoff) {
              requestBuckets.delete(key);
            }
          }
        }
      }

      // Check rate limit
      if (requestCount > maxRequests) {
        return res.status(429).json({
          error: 'Rate limit exceeded. Please retry shortly.',
          retryAfterMs: windowMs,
        });
      }

      next();
    } catch (err) {
      logger.warn({ err: err?.message, scope }, 'Rate limiter error; allowing request')
      // Fail open - allow request on unexpected errors
      next();
    }
  };
};
