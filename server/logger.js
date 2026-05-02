import pino from 'pino';
import pinoHttp from 'pino-http';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');

// Redact common sensitive fields from JSON logs to reduce accidental secret leaks
const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'req.body.password',
  'req.body.token',
  'req.body.secret',
  'authorization',
  'password',
  'token'
];

const logger = pino({ level, base: { pid: false }, redact: { paths: redactPaths, remove: true } });

// Export an express-compatible pino-http middleware configured to reuse
// any request id already assigned on the request (X-Request-ID).
export const httpLogger = pinoHttp({
  logger,
  genReqId: (req) => {
    // Prefer an existing request id (set earlier by middleware) to keep tracing stable
    return req.requestId || req.headers['x-request-id'] || req.headers['X-Request-ID'] || undefined;
  },
  serializers: {
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res
  }
});

const COLLECTOR_URL = process.env.LOG_COLLECTOR_URL || '';
const COLLECTOR_API_KEY = process.env.LOG_COLLECTOR_API_KEY || '';

export const sendToCollector = (logObject) => {
  if (!COLLECTOR_URL) return;
  try {
    // fire-and-forget async post to log collector; don't block request lifecycle
    setImmediate(async () => {
      try {
        await fetch(COLLECTOR_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(COLLECTOR_API_KEY ? { Authorization: `Bearer ${COLLECTOR_API_KEY}` } : {}),
          },
          body: JSON.stringify(logObject),
          keepalive: true,
        });
      } catch (err) {
        // Silently ignore collector errors to avoid affecting main app
        logger.debug({ err: String(err) }, 'log_collector_error');
      }
    });
  } catch {
    // ignore
  }
};

export { logger };
export default logger;
