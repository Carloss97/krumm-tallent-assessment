const GAME_KEYS = [
  { id: 'ospan_game_1', legacyId: 'game1' },
  { id: 'sst_game_2', legacyId: 'game2' },
  { id: 'tsw_game_3', legacyId: 'game3' },
  { id: 'cpt_game_4', legacyId: 'game4' },
  { id: 'dec_game_5', legacyId: 'game5' },
  { id: 'rsh_game_6', legacyId: 'game6' },
  { id: 'sjt_game_7', legacyId: 'game7' },
];

const getSnapshot = (sessionData, keyDef) => sessionData?.[keyDef.id] || sessionData?.[keyDef.legacyId] || null;

const round = (value, digits = 2) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function analyzeTelemetry(sessionData = {}) {
  const snapshots = GAME_KEYS
    .map((keyDef) => getSnapshot(sessionData, keyDef))
    .filter(Boolean);

  const totals = snapshots.reduce((acc, snap) => {
    acc.cursorEvents += snap.mouseMovements?.length || 0;
    acc.clickEvents += snap.clicks?.length || 0;
    acc.trialEvents += snap.trialEvents?.length || 0;
    acc.webcamFrames += snap.webcamFrames?.length || 0;
    acc.hesitationCount += snap.cursorMetrics?.hesitationCount || 0;
    acc.qualityFlags += snap.qualityFlags?.length || 0;
    return acc;
  }, {
    cursorEvents: 0,
    clickEvents: 0,
    trialEvents: 0,
    webcamFrames: 0,
    hesitationCount: 0,
    qualityFlags: 0,
  });

  const allQualityScores = snapshots
    .map((snap) => snap.webcamQualityScore)
    .filter((score) => Number.isFinite(score));
  const avgWebcamQuality = allQualityScores.length
    ? round(allQualityScores.reduce((sum, value) => sum + value, 0) / allQualityScores.length, 1)
    : 0;

  const allVelocities = snapshots
    .map((snap) => snap.cursorMetrics?.avgVelocity)
    .filter((value) => Number.isFinite(value));
  const avgCursorVelocity = allVelocities.length
    ? round(allVelocities.reduce((sum, value) => sum + value, 0) / allVelocities.length, 1)
    : 0;

  const completionRate = GAME_KEYS.length > 0 ? round((snapshots.length / GAME_KEYS.length) * 100, 1) : 0;
  const telemetryDensity = totals.trialEvents > 0
    ? round((totals.cursorEvents + totals.clickEvents + totals.webcamFrames) / totals.trialEvents, 2)
    : 0;

  const attentionStabilityScore = Math.max(0, Math.min(100,
    round((avgWebcamQuality * 0.5) + ((100 - Math.min(totals.hesitationCount * 2, 100)) * 0.5), 1)
  ));

  return {
    ...totals,
    completedGames: snapshots.length,
    completionRate,
    avgWebcamQuality,
    avgCursorVelocity,
    telemetryDensity,
    attentionStabilityScore,
  };
}

export function buildTelemetryRiskSignals(analytics) {
  const signals = [];

  if (!analytics || analytics.completedGames === 0) {
    return ['Insufficient telemetry coverage for high-confidence behavioral inference'];
  }

  if (analytics.completionRate < 85) {
    signals.push('Partial assessment completion may reduce predictive confidence');
  }

  if (analytics.avgWebcamQuality > 0 && analytics.avgWebcamQuality < 60) {
    signals.push('Webcam signal quality was low; visual attention features should be interpreted cautiously');
  }

  if (analytics.hesitationCount > 35) {
    signals.push('Frequent hesitation markers detected in cursor behavior under time pressure');
  }

  if (analytics.qualityFlags > 5) {
    signals.push('Multiple telemetry quality flags suggest unstable capture conditions');
  }

  return signals;
}
