import { logger, sendToCollector } from './logger.js';

// In-memory fallback for rate limiting (development only)
const requestBuckets = new Map();

// Redis client (optional, for production)
let redisClient = null;

/**
 * Initialize Redis client if Upstash credentials are available
 * Falls back to in-memory rate limiting if Redis is not configured
 */
const initializeRedis = async () => {
  if (redisClient) return; // Already initialized
  
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  
  if (!redisUrl || !redisToken) {
    console.log('[Middleware] Redis not configured. Using in-memory rate limiting (single instance only).');
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
    console.log('[Middleware] Redis (Upstash) initialized successfully');
  } catch (err) {
    console.error('[Middleware] Failed to initialize Redis:', err.message);
    console.log('[Middleware] Falling back to in-memory rate limiting');
    redisClient = null;
  }
};

/**
 * Request logger middleware - logs HTTP requests to pino and external collectors
 */
export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const rid = req.requestId || null;

    const log = {
      event: 'http_request',
      requestId: rid,
      method: req.method,
      url: req.originalUrl,
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
export const rateLimiter = ({ windowMs = 60_000, maxRequests = 120 } = {}) => {
  return async (req, res, next) => {
    try {
      // Initialize Redis on first request if available
      if (redisClient === undefined) {
        await initializeRedis();
      }

      const now = Date.now();
      const ip = req.ip || req.connection?.remoteAddress || 'unknown';
      const windowKey = Math.floor(now / windowMs);
      const redisKey = `rate_limit:${ip}:${windowKey}`;

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
          console.error('[Middleware] Redis error:', err.message);
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
          currentRequests: requestCount,
          maxRequests,
        });
      }

      next();
    } catch (err) {
      console.error('[Middleware] Rate limiter error:', err);
      // Fail open - allow request on unexpected errors
      next();
    }
  };
};
