import { assertFacialWindowPrivacySafe, createFacialWindow } from './facialTelemetrySchema';

const clamp = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const round = (value, decimals = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
};

const average = (values) => {
  const finite = values.map(Number).filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
};

const stddev = (values) => {
  const finite = values.map(Number).filter(Number.isFinite);
  if (finite.length <= 1) return 0;
  const mean = average(finite);
  const variance = finite.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / finite.length;
  return Math.sqrt(variance);
};

const toFinite = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const sanitizeSample = (sample) => ({
  timestampMs: toFinite(sample?.timestampMs, Date.now()),
  source: sample?.source || 'mediapipe_face_landmarker',
  facePresent: Boolean(sample?.facePresent),
  faceCount: Math.max(0, Math.round(toFinite(sample?.faceCount, sample?.facePresent ? 1 : 0))),
  detectionConfidence: clamp(sample?.detectionConfidence, 0, 1),
  illuminationScore: clamp(sample?.illuminationScore ?? 1, 0, 1),
  blinkDetected: Boolean(sample?.blinkDetected),
  blinkScore: clamp(sample?.blinkScore ?? 0, 0, 1),
  blinkAsymmetry: clamp(sample?.blinkAsymmetry ?? 0, 0, 1),
  headPose: sample?.headPose && typeof sample.headPose === 'object'
    ? {
        yawDeg: toFinite(sample.headPose.yawDeg, 0),
        pitchDeg: toFinite(sample.headPose.pitchDeg, 0),
        rollDeg: toFinite(sample.headPose.rollDeg, 0),
      }
    : null,
});

const buildQualityFlags = ({ sampleCount, minSamples, facePresenceRatio, meanDetectionConfidence, meanIlluminationScore, multipleFaceRatio }) => {
  const flags = [];
  if (sampleCount < minSamples) flags.push('insufficient_samples');
  if (facePresenceRatio < 0.7) flags.push('insufficient_facial_coverage');
  if (meanDetectionConfidence < 0.6) flags.push('low_detection_confidence');
  if (meanIlluminationScore < 0.45) flags.push('low_light');
  if (multipleFaceRatio > 0.05) flags.push('multiple_faces_detected');
  return flags;
};

const reasonFromFlags = (flags) => {
  if (flags.includes('insufficient_samples')) return 'insufficient samples for facial telemetry interpretation';
  if (flags.includes('insufficient_facial_coverage')) return 'facial coverage below threshold';
  if (flags.includes('low_detection_confidence')) return 'low facial detection confidence';
  if (flags.includes('low_light')) return 'low illumination quality';
  if (flags.includes('multiple_faces_detected')) return 'multiple faces detected during window';
  return null;
};

function buildWindow(samples, options, windowIndex) {
  const sampleCount = samples.length;
  const startedAtMs = samples[0]?.timestampMs ?? 0;
  const endedAtMs = samples[samples.length - 1]?.timestampMs ?? startedAtMs;
  const durationMs = Math.max(options.windowMs, endedAtMs - startedAtMs);
  const facePresentSamples = samples.filter((sample) => sample.facePresent);
  const facePresenceRatio = sampleCount > 0 ? facePresentSamples.length / sampleCount : 0;
  const meanDetectionConfidence = average(samples.map((sample) => sample.detectionConfidence));
  const meanIlluminationScore = average(samples.map((sample) => sample.illuminationScore));
  const multipleFaceRatio = sampleCount > 0 ? samples.filter((sample) => sample.faceCount > 1).length / sampleCount : 0;
  const flags = buildQualityFlags({
    sampleCount,
    minSamples: options.minSamples,
    facePresenceRatio,
    meanDetectionConfidence,
    meanIlluminationScore,
    multipleFaceRatio,
  });

  const headPoseSamples = facePresentSamples.filter((sample) => sample.headPose);
  const yawValues = headPoseSamples.map((sample) => sample.headPose.yawDeg);
  const pitchValues = headPoseSamples.map((sample) => sample.headPose.pitchDeg);
  const rollValues = headPoseSamples.map((sample) => sample.headPose.rollDeg);
  const yawStdDeg = stddev(yawValues);
  const pitchStdDeg = stddev(pitchValues);
  const rollStdDeg = stddev(rollValues);
  const poseStdMean = (yawStdDeg + pitchStdDeg + rollStdDeg) / 3;
  const visualStabilityScore = Math.round(clamp(100 - (poseStdMean * 8), 0, 100));
  const blinkCount = samples.filter((sample) => sample.blinkDetected).length;
  const blinkRatePerMin = durationMs > 0 ? Math.round((blinkCount / durationMs) * 60000) : 0;
  const blinkAsymmetryMean = average(samples.map((sample) => sample.blinkAsymmetry));
  const offScreenOrFaceAwayRatio = sampleCount > 0
    ? samples.filter((sample) => {
        if (!sample.facePresent || !sample.headPose) return true;
        return Math.abs(sample.headPose.yawDeg) > 25 || Math.abs(sample.headPose.pitchDeg) > 20;
      }).length / sampleCount
    : 1;
  const signalQualityScore = Math.round(clamp(
    (facePresenceRatio * 45)
      + (meanDetectionConfidence * 25)
      + (meanIlluminationScore * 15)
      + (visualStabilityScore * 0.15),
    0,
    100,
  ));
  const windowConfidence = clamp(
    (facePresenceRatio * 0.4)
      + (meanDetectionConfidence * 0.25)
      + ((signalQualityScore / 100) * 0.25)
      + ((sampleCount >= options.minSamples ? 1 : 0) * 0.1),
    0,
    1,
  );
  const reasonIfLowConfidence = reasonFromFlags(flags);

  const window = createFacialWindow({
    sessionId: options.sessionId,
    gameId: options.gameId,
    windowIndex,
    startedAtMs,
    endedAtMs,
    durationMs,
    sampleCount,
    source: options.source,
    quality: {
      facePresenceRatio,
      meanDetectionConfidence,
      meanIlluminationScore,
      signalQualityScore,
      multipleFaceRatio,
      flags,
    },
    facialSignals: {
      blinkRatePerMin,
      blinkAsymmetryMean,
      headPose: {
        yawMeanDeg: round(average(yawValues), 2),
        pitchMeanDeg: round(average(pitchValues), 2),
        rollMeanDeg: round(average(rollValues), 2),
        yawStdDeg: round(yawStdDeg, 2),
        pitchStdDeg: round(pitchStdDeg, 2),
        rollStdDeg: round(rollStdDeg, 2),
      },
      visualStabilityScore,
      offScreenOrFaceAwayRatio,
    },
    derivedProxies: {
      attentionStabilityProxy: Math.round(clamp((visualStabilityScore * 0.6) + (signalQualityScore * 0.4), 0, 100)),
      cognitiveLoadProxy: null,
      fatigueProxy: null,
    },
    confidence: {
      windowConfidence,
      interpretationAllowed: !reasonIfLowConfidence,
      reasonIfLowConfidence,
    },
  });

  assertFacialWindowPrivacySafe(window);
  return window;
}

export function createFacialWindowAggregator(options = {}) {
  const state = {
    samples: [],
    emitted: [],
    nextWindowIndex: 0,
    windowStartMs: null,
  };
  const config = {
    sessionId: options.sessionId ?? null,
    gameId: options.gameId ?? null,
    source: options.source || 'mediapipe_face_landmarker',
    windowMs: Math.max(1000, Number(options.windowMs) || 5000),
    minSamples: Math.max(1, Number(options.minSamples) || 3),
  };

  const emitCurrentWindow = () => {
    if (state.samples.length === 0) return null;
    const window = buildWindow(state.samples, config, state.nextWindowIndex);
    state.nextWindowIndex += 1;
    state.samples = [];
    state.windowStartMs = null;
    state.emitted.push(window);
    return window;
  };

  return {
    addSample(sample) {
      const safeSample = sanitizeSample(sample);
      if (state.windowStartMs === null) {
        state.windowStartMs = safeSample.timestampMs;
      }
      state.samples.push(safeSample);

      if (safeSample.timestampMs - state.windowStartMs >= config.windowMs) {
        return emitCurrentWindow();
      }
      return null;
    },

    flush() {
      if (state.samples.length > 0) {
        emitCurrentWindow();
      }
      const output = [...state.emitted];
      state.emitted = [];
      return output;
    },

    reset() {
      state.samples = [];
      state.emitted = [];
      state.nextWindowIndex = 0;
      state.windowStartMs = null;
    },

    getPendingSampleCount() {
      return state.samples.length;
    },
  };
}
