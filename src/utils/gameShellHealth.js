const GAME_SHELL_HEALTH_KEY = 'krumm-gameshell-health-v1';
const MAX_RECENT_ERRORS = 80;
const HEALTH_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const TREND_WINDOW_MS = 24 * 60 * 60 * 1000;

const getBaseState = () => ({
  updatedAt: null,
  totalRuntimeErrors: 0,
  totalRecoveries: 0,
  totalExits: 0,
  exitsBySource: {},
  errorsByGameId: {},
  recentErrors: [],
  recentRecoveries: [],
});

const pruneState = (state) => {
  const now = Date.now();
  const minAllowedTs = now - HEALTH_TTL_MS;
  const recentErrors = (Array.isArray(state.recentErrors) ? state.recentErrors : [])
    .filter((item) => Number.isFinite(item?.timestamp) && item.timestamp >= minAllowedTs)
    .slice(0, MAX_RECENT_ERRORS);

  const recentRecoveries = (Array.isArray(state.recentRecoveries) ? state.recentRecoveries : [])
    .filter((item) => Number.isFinite(item?.timestamp) && item.timestamp >= minAllowedTs)
    .slice(0, MAX_RECENT_ERRORS);

  return {
    ...getBaseState(),
    ...state,
    recentErrors,
    recentRecoveries,
  };
};

const readState = () => {
  try {
    if (typeof window === 'undefined') return getBaseState();
    const raw = window.localStorage.getItem(GAME_SHELL_HEALTH_KEY);
    if (!raw) return getBaseState();
    const parsed = JSON.parse(raw);
    return pruneState(parsed);
  } catch {
    return getBaseState();
  }
};

const writeState = (state) => {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(GAME_SHELL_HEALTH_KEY, JSON.stringify(pruneState(state)));
  } catch {
    // no-op
  }
};

export const recordGameShellRuntimeError = ({ gameId, message, deduped = false }) => {
  const state = readState();
  const gameKey = String(gameId || 'unknown');
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
    totalRuntimeErrors: state.totalRuntimeErrors + (deduped ? 0 : 1),
    errorsByGameId: {
      ...state.errorsByGameId,
      [gameKey]: (state.errorsByGameId[gameKey] || 0) + (deduped ? 0 : 1),
    },
    recentErrors: [
      {
        gameId: gameKey,
        message,
        deduped,
        timestamp: Date.now(),
      },
      ...state.recentErrors,
    ].slice(0, MAX_RECENT_ERRORS),
  };
  writeState(next);
  return next;
};

export const recordGameShellRecovery = ({ gameId }) => {
  const state = readState();
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
    totalRecoveries: state.totalRecoveries + 1,
    recentRecoveries: [
      {
        gameId: String(gameId || 'unknown'),
        timestamp: Date.now(),
      },
      ...state.recentRecoveries,
    ].slice(0, MAX_RECENT_ERRORS),
    lastRecovery: {
      gameId: String(gameId || 'unknown'),
      timestamp: Date.now(),
    },
  };
  writeState(next);
  return next;
};

export const recordGameShellExit = ({ gameId, source = 'unknown' }) => {
  const state = readState();
  const next = {
    ...state,
    updatedAt: new Date().toISOString(),
    totalExits: state.totalExits + 1,
    exitsBySource: {
      ...state.exitsBySource,
      [source]: (state.exitsBySource[source] || 0) + 1,
    },
    lastExit: {
      gameId: String(gameId || 'unknown'),
      source,
      timestamp: Date.now(),
    },
  };
  writeState(next);
  return next;
};

export const getGameShellHealthSnapshot = () => readState();

export const resetGameShellHealth = () => {
  const state = getBaseState();
  writeState(state);
  return state;
};

export const getGameShellErrorTrend24h = (snapshot = null) => {
  const state = snapshot ? pruneState(snapshot) : readState();
  const now = Date.now();
  const minAllowedTs = now - TREND_WINDOW_MS;
  const buckets = {};

  state.recentErrors.forEach((item) => {
    const ts = item?.timestamp;
    if (!Number.isFinite(ts) || ts < minAllowedTs) return;
    const date = new Date(ts);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const trend = [];
  for (let i = 23; i >= 0; i -= 1) {
    const date = new Date(now - i * 60 * 60 * 1000);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    const hourLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    trend.push({
      hourLabel,
      count: buckets[key] || 0,
    });
  }

  return trend;
};

export const getGameShellRecoveryTrend24h = (snapshot = null) => {
  const state = snapshot ? pruneState(snapshot) : readState();
  const now = Date.now();
  const minAllowedTs = now - TREND_WINDOW_MS;
  const buckets = {};

  state.recentRecoveries.forEach((item) => {
    const ts = item?.timestamp;
    if (!Number.isFinite(ts) || ts < minAllowedTs) return;
    const date = new Date(ts);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    buckets[key] = (buckets[key] || 0) + 1;
  });

  const trend = [];
  for (let i = 23; i >= 0; i -= 1) {
    const date = new Date(now - i * 60 * 60 * 1000);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
    const hourLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    trend.push({
      hourLabel,
      count: buckets[key] || 0,
    });
  }

  return trend;
};
