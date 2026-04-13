const requestBuckets = new Map();

import { logger, sendToCollector } from './logger.js';

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

export const rateLimiter = ({ windowMs = 60_000, maxRequests = 120 } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const key = `${ip}:${Math.floor(now / windowMs)}`;

    const bucket = requestBuckets.get(key) || { count: 0, createdAt: now };
    bucket.count += 1;
    requestBuckets.set(key, bucket);

    if (bucket.count > maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded. Please retry shortly.',
        retryAfterMs: windowMs,
      });
    }

    // Opportunistic cleanup to avoid unbounded map growth.
    if (requestBuckets.size > 5000) {
      const cutoff = now - (windowMs * 2);
      for (const [bucketKey, data] of requestBuckets.entries()) {
        if (data.createdAt < cutoff) {
          requestBuckets.delete(bucketKey);
        }
      }
    }

    next();
  };
};
