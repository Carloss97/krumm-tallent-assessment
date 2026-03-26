const requestBuckets = new Map();

export const requestLogger = (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    // Lightweight structured log for local observability.
    console.log(`[api] ${req.method} ${req.originalUrl} ${res.statusCode} ${durationMs}ms`);
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
