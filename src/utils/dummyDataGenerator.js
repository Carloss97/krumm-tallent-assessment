// Dummy data generator for testing the report system with complete battery coverage.
export const generateDummyReportData = () => {
  const mkMoves = (n) => Array.from({ length: n }, (_, i) => ({
    x: 120 + i * 3,
    y: 220 + (i % 5) * 2,
    timestamp: Date.now() - (n - i) * 50,
  }));

  const mkClicks = (n) => Array.from({ length: n }, (_, i) => ({
    x: 180 + i * 8,
    y: 260 + i * 5,
    timestamp: Date.now() - (n - i) * 180,
  }));

  const mkTrials = (n) => Array.from({ length: n }, (_, i) => ({
    trial: i + 1,
    event: 'response',
    timestamp: Date.now() - (n - i) * 300,
  }));

  const mkWebcam = (n, quality = 74) => Array.from({ length: n }, (_, i) => ({
    timestamp: Date.now() - (n - i) * 120,
    qualityScore: quality + ((i % 4) - 2),
    faceDetected: true,
    blinkDetected: i % 10 === 0,
    headPose: { yaw: (i % 5) - 2, pitch: (i % 3) - 1, roll: 0 },
  }));

  const mkGamePayload = ({
    score,
    errors,
    duration,
    details,
    hesitationCount,
    avgVelocity,
    avgJerk,
    moves,
    clicks,
    trials,
    webcamFrames,
    webcamQuality,
  }) => ({
    score,
    errors,
    duration,
    details,
    cursorMetrics: { hesitationCount, avgVelocity, avgJerk },
    mouseMovements: mkMoves(moves),
    clicks: mkClicks(clicks),
    trialEvents: mkTrials(trials),
    webcamFrames: mkWebcam(webcamFrames, webcamQuality),
    webcamQualityScore: webcamQuality,
    qualityFlags: [],
  });

  return {
    ospan_game_1: mkGamePayload({
      score: 82,
      errors: 4,
      duration: 392000,
      details: { operationAccuracy: 86, recallAccuracy: 79, workingMemorySpan: 5 },
      hesitationCount: 6,
      avgVelocity: 138,
      avgJerk: 920,
      moves: 140,
      clicks: 22,
      trials: 48,
      webcamFrames: 95,
      webcamQuality: 76,
    }),
    sst_game_2: mkGamePayload({
      score: 78,
      errors: 5,
      duration: 286000,
      details: { correctGo: 49, correctStop: 23, accuracy: 80 },
      hesitationCount: 8,
      avgVelocity: 162,
      avgJerk: 1100,
      moves: 132,
      clicks: 26,
      trials: 52,
      webcamFrames: 88,
      webcamQuality: 73,
    }),
    tsw_game_3: mkGamePayload({
      score: 74,
      errors: 7,
      duration: 338000,
      details: { accuracy: 76 },
      hesitationCount: 10,
      avgVelocity: 151,
      avgJerk: 980,
      moves: 126,
      clicks: 24,
      trials: 45,
      webcamFrames: 84,
      webcamQuality: 72,
    }),
    cpt_game_4: mkGamePayload({
      score: 80,
      errors: 3,
      duration: 241000,
      details: { blocksCompleted: 5 },
      hesitationCount: 5,
      avgVelocity: 129,
      avgJerk: 840,
      moves: 118,
      clicks: 20,
      trials: 40,
      webcamFrames: 74,
      webcamQuality: 75,
    }),
    dec_game_5: mkGamePayload({
      score: 71,
      errors: 6,
      duration: 318000,
      details: { scenariosCompleted: 8 },
      hesitationCount: 9,
      avgVelocity: 143,
      avgJerk: 960,
      moves: 124,
      clicks: 23,
      trials: 36,
      webcamFrames: 68,
      webcamQuality: 70,
    }),
    rsh_game_6: mkGamePayload({
      score: 76,
      errors: 4,
      duration: 272000,
      details: { blocksCompleted: 3 },
      hesitationCount: 7,
      avgVelocity: 147,
      avgJerk: 910,
      moves: 115,
      clicks: 18,
      trials: 33,
      webcamFrames: 66,
      webcamQuality: 71,
    }),
    sjt_game_7: mkGamePayload({
      score: 79,
      errors: 3,
      duration: 233000,
      details: { scenariosCompleted: 10, accuracy: 84 },
      cursorMetrics: { hesitationCount: 5, avgVelocity: 122, avgJerk: 780 },
      mouseMovements: mkMoves(102),
      clicks: mkClicks(16),
      trialEvents: mkTrials(31),
      webcamFrames: mkWebcam(60, 74),
      webcamQualityScore: 74,
      qualityFlags: [],
    },
    // Keep a small legacy tail for backward compatibility checks in report/testing paths
    game8: { score: 66, errors: 8, duration: 90000, details: { nBackLevel: 2 } },
    game9: { score: 61, errors: 10, duration: 108000, details: { efficiency: 3.1 } },
  };
};

// Function to simulate adding dummy data to telemetry context
export const populateDummyData = (telemetryContext) => {
  const dummyData = generateDummyReportData();

  // Simulate the telemetry data structure
  Object.entries(dummyData).forEach(([gameId, game]) => {
    // This would normally be called during actual gameplay
    telemetryContext.recordGameData(gameId, game.score, game.errors, game.details || {});
  });

  return dummyData;
};