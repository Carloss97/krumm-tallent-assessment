// Dummy data generator for testing the report system with the v2 battery + legacy data.
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

  return {
    ospan_game_1: {
      score: 82,
      errors: 4,
      duration: 392000,
      details: { operationAccuracy: 86, recallAccuracy: 79, workingMemorySpan: 5 },
      cursorMetrics: { hesitationCount: 6, avgVelocity: 138, avgJerk: 920 },
      mouseMovements: mkMoves(140),
      clicks: mkClicks(22),
      trialEvents: mkTrials(48),
      webcamFrames: mkWebcam(95, 76),
      webcamQualityScore: 76,
      qualityFlags: [],
    },
    sst_game_2: {
      score: 78,
      errors: 5,
      duration: 286000,
      details: { correctGo: 49, correctStop: 23, accuracy: 80 },
      cursorMetrics: { hesitationCount: 8, avgVelocity: 162, avgJerk: 1100 },
      mouseMovements: mkMoves(132),
      clicks: mkClicks(26),
      trialEvents: mkTrials(52),
      webcamFrames: mkWebcam(88, 73),
      webcamQualityScore: 73,
      qualityFlags: [],
    },
    tsw_game_3: {
      score: 74,
      errors: 7,
      duration: 338000,
      details: { accuracy: 76 },
      cursorMetrics: { hesitationCount: 10, avgVelocity: 151, avgJerk: 980 },
      mouseMovements: mkMoves(126),
      clicks: mkClicks(24),
      trialEvents: mkTrials(45),
      webcamFrames: mkWebcam(84, 72),
      webcamQualityScore: 72,
      qualityFlags: [],
    },
    cpt_game_4: {
      score: 80,
      errors: 3,
      duration: 241000,
      details: { blocksCompleted: 5 },
      cursorMetrics: { hesitationCount: 5, avgVelocity: 129, avgJerk: 840 },
      mouseMovements: mkMoves(118),
      clicks: mkClicks(20),
      trialEvents: mkTrials(40),
      webcamFrames: mkWebcam(74, 75),
      webcamQualityScore: 75,
      qualityFlags: [],
    },
    dec_game_5: {
      score: 71,
      errors: 6,
      duration: 318000,
      details: { scenariosCompleted: 8 },
      cursorMetrics: { hesitationCount: 9, avgVelocity: 143, avgJerk: 960 },
      mouseMovements: mkMoves(124),
      clicks: mkClicks(23),
      trialEvents: mkTrials(36),
      webcamFrames: mkWebcam(68, 70),
      webcamQualityScore: 70,
      qualityFlags: [],
    },
    rsh_game_6: {
      score: 76,
      errors: 4,
      duration: 272000,
      details: { blocksCompleted: 3 },
      cursorMetrics: { hesitationCount: 7, avgVelocity: 147, avgJerk: 910 },
      mouseMovements: mkMoves(115),
      clicks: mkClicks(18),
      trialEvents: mkTrials(33),
      webcamFrames: mkWebcam(66, 71),
      webcamQualityScore: 71,
      qualityFlags: [],
    },
    sjt_game_7: {
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
    futureModules: {
      metacognitive: [
        { confidence: 80, correct: true },
        { confidence: 70, correct: true },
        { confidence: 55, correct: false },
        { confidence: 65, correct: true },
      ],
      prioritization: [
        { expectedPriority: 'high', assignedPriority: 'high', completedWithinMs: 4200, deadlineMs: 6000 },
        { expectedPriority: 'medium', assignedPriority: 'medium', completedWithinMs: 7000, deadlineMs: 9000 },
        { expectedPriority: 'low', assignedPriority: 'medium', completedWithinMs: 8400, deadlineMs: 7000 },
      ],
      learningAgility: [
        { accuracy: 58, adaptationMs: 2100 },
        { accuracy: 64, adaptationMs: 1950 },
        { accuracy: 71, adaptationMs: 1720 },
        { accuracy: 77, adaptationMs: 1540 },
      ],
    },
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