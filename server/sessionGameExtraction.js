const RESERVED_SESSION_KEYS = new Set([
  'startedAt',
  'completedAt',
  'participantId',
  'telemetry',
  'report',
  'demoSummary',
  'assessmentFeatureVector',
  'edgeLocalModelOutput',
  'metadata',
  'futureModules',
]);

const GAME_ID_PATTERN = /^(game\d+|[a-z]+_game_\d+)$/i;

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const hasGameMetrics = (value) => isObject(value) && (
  Number.isFinite(value.score)
  || Number.isFinite(value.errors)
  || Number.isFinite(value.duration)
  || Number.isFinite(value.durationMs)
  || Array.isArray(value.trialEvents)
  || Array.isArray(value.facialWindows)
);

const looksLikeGameEntry = (key, value) => {
  if (!isObject(value)) return false;
  if (RESERVED_SESSION_KEYS.has(key)) return false;
  return GAME_ID_PATTERN.test(key) || hasGameMetrics(value);
};

const getPrimaryGameSource = (payload) => {
  if (isObject(payload?.sessionData?.telemetry)) return payload.sessionData.telemetry;
  if (isObject(payload?.sessionData)) return payload.sessionData;
  if (isObject(payload)) return payload;
  return {};
};

export const extractGamesFromSessionPayload = (payload) => (
  Object.entries(getPrimaryGameSource(payload)).filter(([key, value]) => looksLikeGameEntry(key, value))
);

export default extractGamesFromSessionPayload;
