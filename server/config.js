const parsePositiveInt = (value, fallback) => {
  const parsed = Number.parseInt(value ?? '', 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }
  return parsed;
};

const parseCsv = (value, fallback = []) => {
  if (typeof value !== 'string') {
    return fallback;
  }
  const entries = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  return entries.length > 0 ? entries : fallback;
};

export const serverConfig = {
  rateLimit: {
    global: {
      windowMs: parsePositiveInt(process.env.RATE_LIMIT_WINDOW_MS, 60_000),
      maxRequests: parsePositiveInt(process.env.RATE_LIMIT_GLOBAL_MAX_REQUESTS, 180),
    },
    ai: {
      windowMs: parsePositiveInt(process.env.RATE_LIMIT_AI_WINDOW_MS, 60_000),
      maxRequests: parsePositiveInt(process.env.RATE_LIMIT_AI_MAX_REQUESTS, 20),
    },
    bypassPaths: parseCsv(process.env.RATE_LIMIT_BYPASS_PATHS, ['/health', '/api/feature-flags']),
  },
};
