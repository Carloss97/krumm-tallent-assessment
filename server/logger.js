import pino from 'pino';

const level = process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info');
const logger = pino({ level, base: { pid: false } });

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
