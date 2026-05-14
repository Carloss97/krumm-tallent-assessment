import { ASSESSMENT_TELEMETRY_SCHEMA } from '../../utils/assessmentTelemetry';

export const ASSESSMENT_FEATURE_VECTOR_TYPE = 'assessment_feature_vector_v1';
export const ASSESSMENT_FEATURE_VECTOR_VERSION = '1.0.0';

const LEGACY_GAME_ID_MAP = {
  game1: 'ospan_game_1',
  game2: 'sst_game_2',
  game3: 'tsw_game_3',
  game4: 'cpt_game_4',
  game5: 'dec_game_5',
  game6: 'rsh_game_6',
  game7: 'sjt_game_7',
};

const CANONICAL_TO_LEGACY_GAME_ID = Object.fromEntries(
  Object.entries(LEGACY_GAME_ID_MAP).map(([legacyId, gameId]) => [gameId, legacyId]),
);

const KNOWN_GAME_IDS = new Set(Object.keys(ASSESSMENT_TELEMETRY_SCHEMA.games));

const round = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const average = (values, decimals = 1) => {
  const finite = values.filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length, decimals);
};

const clampPercent = (value) => round(Math.max(0, Math.min(100, Number(value) || 0)), 1);

const unique = (values) => Array.from(new Set((values || []).filter(Boolean)));

const normalizeRatioToPercent = (value) => {
  if (!Number.isFinite(value)) return 0;
  return clampPercent(value <= 1 ? value * 100 : value);
};

const getCanonicalGameId = (key, snapshot = {}) => {
  const candidate = snapshot.gameId || key;
  if (KNOWN_GAME_IDS.has(candidate)) return candidate;
  return LEGACY_GAME_ID_MAP[key] || candidate;
};

const getGameDefinition = (gameId) => ASSESSMENT_TELEMETRY_SCHEMA.games[gameId] || {
  gameId,
  name: gameId,
  talentDomain: 'unknown',
  primaryConstruct: 'unknown',
  secondaryConstructs: [],
  coreMetrics: [],
};

const getDurationMs = (snapshot = {}) => {
  if (Number.isFinite(snapshot.durationMs)) return snapshot.durationMs;
  if (Number.isFinite(snapshot.duration)) return snapshot.duration;
  return 0;
};

const summarizeTrialEvents = (trialEvents = []) => {
  const reactionTimes = trialEvents
    .map((event) => event?.reactionTimeMs ?? event?.metrics?.reactionTimeMs)
    .filter(Number.isFinite);
  const correctness = trialEvents
    .map((event) => event?.isCorrect)
    .filter((value) => typeof value === 'boolean');

  return {
    trialEventCount: trialEvents.length,
    reactionTimeMsMean: average(reactionTimes, 1),
    accuracyProxy: correctness.length > 0
      ? clampPercent((correctness.filter(Boolean).length / correctness.length) * 100)
      : null,
  };
};

const getHeadPoseVariability = (window = {}) => {
  const pose = window?.facialSignals?.headPose || {};
  return average([
    pose.yawStdDeg,
    pose.pitchStdDeg,
    pose.rollStdDeg,
  ].filter(Number.isFinite), 1);
};

const getMicroGestureActivity = (window = {}) => {
  const explicitScore = window?.facialSignals?.microGestureActivityScore;
  if (Number.isFinite(explicitScore)) return clampPercent(explicitScore);

  const blinkAsymmetry = Number.isFinite(window?.facialSignals?.blinkAsymmetryMean)
    ? window.facialSignals.blinkAsymmetryMean * 100
    : null;
  const headPoseVariability = getHeadPoseVariability(window);
  return average([blinkAsymmetry, headPoseVariability].filter(Number.isFinite), 1);
};

const summarizeFacialWindows = (facialWindows = []) => {
  const qualityFlags = unique(facialWindows.flatMap((window) => window?.quality?.flags || []));
  const coverageMean = average(
    facialWindows.map((window) => normalizeRatioToPercent(window?.quality?.facePresenceRatio)),
    1,
  );
  const signalQualityMean = average(
    facialWindows.map((window) => window?.quality?.signalQualityScore).filter(Number.isFinite),
    1,
  );
  const confidenceMean = average(
    facialWindows.map((window) => normalizeRatioToPercent(window?.confidence?.windowConfidence)),
    1,
  );
  const blinkRatePerMinMean = average(
    facialWindows.map((window) => window?.facialSignals?.blinkRatePerMin).filter(Number.isFinite),
    1,
  );
  const visualStabilityMean = average(
    facialWindows.map((window) => window?.facialSignals?.visualStabilityScore).filter(Number.isFinite),
    1,
  );
  const offScreenOrFaceAwayPercentMean = average(
    facialWindows.map((window) => normalizeRatioToPercent(window?.facialSignals?.offScreenOrFaceAwayRatio)),
    1,
  );
  const headPoseVariabilityMean = average(facialWindows.map(getHeadPoseVariability), 1);
  const microGestureActivityMean = average(facialWindows.map(getMicroGestureActivity), 1);
  const attentionStabilityProxyMean = average(
    facialWindows.map((window) => window?.derivedProxies?.attentionStabilityProxy).filter(Number.isFinite),
    1,
  );
  const cognitiveLoadProxyMean = average(
    facialWindows.map((window) => window?.derivedProxies?.cognitiveLoadProxy).filter(Number.isFinite),
    1,
  );
  const fatigueProxyMean = average(
    facialWindows.map((window) => window?.derivedProxies?.fatigueProxy).filter(Number.isFinite),
    1,
  );
  const interpretationAllowed = facialWindows.length > 0
    && facialWindows.every((window) => window?.confidence?.interpretationAllowed !== false)
    && coverageMean >= 60
    && !qualityFlags.includes('no_webcam_consent')
    && !qualityFlags.includes('camera_denied')
    && !qualityFlags.includes('facial_model_unavailable');

  return {
    windowCount: facialWindows.length,
    coverageMean,
    signalQualityMean,
    confidenceMean,
    blinkRatePerMinMean,
    visualStabilityMean,
    offScreenOrFaceAwayPercentMean,
    headPoseVariabilityMean,
    microGestureActivityMean,
    attentionStabilityProxyMean,
    cognitiveLoadProxyMean,
    fatigueProxyMean,
    qualityFlags,
    interpretationAllowed,
  };
};

const buildGameFeatureVector = ([sourceKey, snapshot]) => {
  const gameId = getCanonicalGameId(sourceKey, snapshot);
  const definition = getGameDefinition(gameId);
  const facialWindows = Array.isArray(snapshot?.facialWindows) ? snapshot.facialWindows : [];
  const facial = summarizeFacialWindows(facialWindows);
  const trialSummary = summarizeTrialEvents(Array.isArray(snapshot?.trialEvents) ? snapshot.trialEvents : []);
  const qualityFlags = unique([...(snapshot?.qualityFlags || []), ...facial.qualityFlags]);
  const score = Number.isFinite(snapshot?.score) ? snapshot.score : 0;

  return {
    gameId,
    legacyGameId: CANONICAL_TO_LEGACY_GAME_ID[gameId] || (sourceKey.startsWith('game') ? sourceKey : null),
    sourceKey,
    name: definition.name,
    talentDomain: definition.talentDomain,
    primaryConstruct: definition.primaryConstruct,
    secondaryConstructs: definition.secondaryConstructs || [],
    coreMetrics: definition.coreMetrics || [],
    score,
    normalizedScore: clampPercent(score),
    errors: Number.isFinite(snapshot?.errors) ? snapshot.errors : 0,
    durationMs: getDurationMs(snapshot),
    ...trialSummary,
    cursor: {
      movementCount: Array.isArray(snapshot?.mouseMovements) ? snapshot.mouseMovements.length : 0,
      clickCount: Array.isArray(snapshot?.clicks) ? snapshot.clicks.length : 0,
      avgVelocity: Number.isFinite(snapshot?.cursorMetrics?.avgVelocity)
        ? round(snapshot.cursorMetrics.avgVelocity, 1)
        : 0,
      hesitationCount: Number.isFinite(snapshot?.cursorMetrics?.hesitationCount)
        ? snapshot.cursorMetrics.hesitationCount
        : 0,
    },
    facial: {
      windowCount: facial.windowCount,
      coverageMean: facial.coverageMean,
      signalQualityMean: facial.signalQualityMean,
      confidenceMean: facial.confidenceMean,
      blinkRatePerMinMean: facial.blinkRatePerMinMean,
      visualStabilityMean: facial.visualStabilityMean,
      offScreenOrFaceAwayPercentMean: facial.offScreenOrFaceAwayPercentMean,
      headPoseVariabilityMean: facial.headPoseVariabilityMean,
      microGestureActivityMean: facial.microGestureActivityMean,
      attentionStabilityProxyMean: facial.attentionStabilityProxyMean,
      cognitiveLoadProxyMean: facial.cognitiveLoadProxyMean,
      fatigueProxyMean: facial.fatigueProxyMean,
    },
    quality: {
      interpretationAllowed: facial.interpretationAllowed && !qualityFlags.includes('insufficient_facial_coverage'),
      flags: qualityFlags,
    },
  };
};

const collectGameSnapshots = (sessionData = {}) => {
  const seen = new Set();
  return Object.entries(sessionData)
    .filter(([, snapshot]) => snapshot && typeof snapshot === 'object' && !Array.isArray(snapshot))
    .map(([key, snapshot]) => [key, snapshot, getCanonicalGameId(key, snapshot)])
    .filter(([, snapshot, gameId]) => {
      const looksLikeGame = KNOWN_GAME_IDS.has(gameId)
        || Object.prototype.hasOwnProperty.call(LEGACY_GAME_ID_MAP, gameId)
        || Number.isFinite(snapshot?.score)
        || Number.isFinite(snapshot?.duration)
        || Number.isFinite(snapshot?.durationMs)
        || Array.isArray(snapshot?.trialEvents)
        || Array.isArray(snapshot?.facialWindows);
      if (!looksLikeGame || seen.has(gameId)) return false;
      seen.add(gameId);
      return true;
    })
    .map(([key, snapshot]) => [key, snapshot]);
};

const buildCaveats = (games) => {
  const caveats = [];
  if (games.some((game) => game.facial.windowCount === 0 || game.quality.flags.includes('no_webcam_consent'))) {
    caveats.push('Facial telemetry unavailable for at least one game; feature vector remains valid with reduced visual-signal confidence.');
  }
  if (games.some((game) => game.quality.flags.includes('insufficient_facial_coverage'))) {
    caveats.push('Some facial telemetry windows had insufficient coverage; interpret visual-signal proxies cautiously.');
  }
  if (games.some((game) => game.quality.flags.includes('camera_denied') || game.quality.flags.includes('facial_model_unavailable'))) {
    caveats.push('Camera or local facial model was unavailable for part of the session; do not compare visual-signal features against full-coverage sessions.');
  }
  return caveats;
};

export function buildAssessmentFeatureVectorV1(sessionData = {}, options = {}) {
  const games = collectGameSnapshots(sessionData).map(buildGameFeatureVector);
  const qualityFlags = unique(games.flatMap((game) => game.quality.flags));

  return {
    type: ASSESSMENT_FEATURE_VECTOR_TYPE,
    version: ASSESSMENT_FEATURE_VECTOR_VERSION,
    generatedAtMs: Number.isFinite(options.generatedAtMs) ? options.generatedAtMs : Date.now(),
    session: {
      sessionId: options.sessionId ?? null,
      participantId: options.participantId ?? null,
      completedGameCount: games.length,
      totalDurationMs: games.reduce((sum, game) => sum + game.durationMs, 0),
      qualityFlags,
    },
    privacy: {
      source: 'aggregate_metadata_only',
      rawVideoStored: false,
      rawFramesStored: false,
      landmarksStored: false,
      audioCaptured: false,
    },
    games,
    aggregate: {
      completedGameCount: games.length,
      totalTrialEvents: games.reduce((sum, game) => sum + game.trialEventCount, 0),
      meanScore: average(games.map((game) => game.score), 1),
      meanFacialCoverage: average(games.map((game) => game.facial.coverageMean), 1),
      meanWebcamSignalQuality: average(games.map((game) => game.facial.signalQualityMean), 1),
      qualityFlags,
    },
    caveats: buildCaveats(games),
  };
}
