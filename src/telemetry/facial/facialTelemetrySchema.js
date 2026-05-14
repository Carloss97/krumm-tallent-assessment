export const FACIAL_TELEMETRY_SCHEMA_VERSION = '1.0.0';
export const FACIAL_WINDOW_TYPE = 'facial_window_v1';

export const DEFAULT_FACIAL_PRIVACY_GUARD = Object.freeze({
  rawVideoStored: false,
  rawFramesStored: false,
  landmarksStored: false,
  audioCaptured: false,
});

export const PROHIBITED_FACIAL_PAYLOAD_KEYS = Object.freeze([
  'imageData',
  'imageBytes',
  'pixelData',
  'pixels',
  'canvas',
  'canvasData',
  'canvasBlob',
  'base64',
  'blob',
  'blobs',
  'frame',
  'frames',
  'frameData',
  'rawFrame',
  'rawFrames',
  'videoFrame',
  'videoFrames',
  'webcamFrame',
  'webcamFrames',
  'cameraFrame',
  'cameraFrames',
  'rawVideo',
  'rawVideos',
  'videoData',
  'videoBlob',
  'srcObject',
  'faceLandmarks',
  'facialLandmarks',
  'normalizedLandmarks',
  'rawLandmarks',
  'landmarks',
]);

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

const defaultQuality = () => ({
  facePresenceRatio: 0,
  meanDetectionConfidence: 0,
  meanIlluminationScore: 0,
  signalQualityScore: 0,
  multipleFaceRatio: 0,
  flags: [],
});

const defaultFacialSignals = () => ({
  blinkRatePerMin: 0,
  blinkAsymmetryMean: 0,
  headPose: {
    yawMeanDeg: 0,
    pitchMeanDeg: 0,
    rollMeanDeg: 0,
    yawStdDeg: 0,
    pitchStdDeg: 0,
    rollStdDeg: 0,
  },
  visualStabilityScore: 0,
  offScreenOrFaceAwayRatio: 0,
});

const defaultDerivedProxies = () => ({
  attentionStabilityProxy: null,
  cognitiveLoadProxy: null,
  fatigueProxy: null,
});

const defaultConfidence = () => ({
  windowConfidence: 0,
  interpretationAllowed: false,
  reasonIfLowConfidence: 'insufficient_samples',
});

const normalizeQuality = (quality = {}) => ({
  ...defaultQuality(),
  ...quality,
  facePresenceRatio: round(clamp(quality.facePresenceRatio ?? 0, 0, 1)),
  meanDetectionConfidence: round(clamp(quality.meanDetectionConfidence ?? 0, 0, 1)),
  meanIlluminationScore: round(clamp(quality.meanIlluminationScore ?? 0, 0, 1)),
  signalQualityScore: Math.round(clamp(quality.signalQualityScore ?? 0, 0, 100)),
  multipleFaceRatio: round(clamp(quality.multipleFaceRatio ?? 0, 0, 1)),
  flags: Array.isArray(quality.flags) ? Array.from(new Set(quality.flags.filter(Boolean))) : [],
});

const normalizeFacialSignals = (facialSignals = {}) => ({
  ...defaultFacialSignals(),
  ...facialSignals,
  blinkRatePerMin: Math.round(clamp(facialSignals.blinkRatePerMin ?? 0, 0, 120)),
  blinkAsymmetryMean: round(clamp(facialSignals.blinkAsymmetryMean ?? 0, 0, 1)),
  headPose: {
    ...defaultFacialSignals().headPose,
    ...(facialSignals.headPose || {}),
  },
  visualStabilityScore: Math.round(clamp(facialSignals.visualStabilityScore ?? 0, 0, 100)),
  offScreenOrFaceAwayRatio: round(clamp(facialSignals.offScreenOrFaceAwayRatio ?? 0, 0, 1)),
});

const normalizeConfidence = (confidence = {}) => ({
  ...defaultConfidence(),
  ...confidence,
  windowConfidence: round(clamp(confidence.windowConfidence ?? 0, 0, 1)),
  interpretationAllowed: Boolean(confidence.interpretationAllowed),
  reasonIfLowConfidence: confidence.reasonIfLowConfidence ?? null,
});

function stripProhibitedPayloadKeys(value) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    return value.map(stripProhibitedPayloadKeys);
  }

  const prohibited = new Set(PROHIBITED_FACIAL_PAYLOAD_KEYS.map((key) => key.toLowerCase()));
  return Object.entries(value).reduce((safe, [key, child]) => {
    if (prohibited.has(String(key).toLowerCase())) return safe;
    if (typeof child === 'string' && /data:(image|video|application\/octet-stream)[^,]*,|base64,/i.test(child)) return safe;
    safe[key] = stripProhibitedPayloadKeys(child);
    return safe;
  }, {});
}

export function createFacialWindow(input = {}) {
  const {
    type: _ignoredType,
    version: _ignoredVersion,
    sessionId,
    gameId,
    windowIndex,
    startedAtMs,
    endedAtMs,
    durationMs,
    sampleCount,
    source,
    privacy,
    quality,
    facialSignals,
    derivedProxies,
    confidence,
    ...rest
  } = input;

  const safeRest = stripProhibitedPayloadKeys(rest);
  const normalizedStartedAtMs = Number.isFinite(startedAtMs) ? startedAtMs : 0;
  const normalizedEndedAtMs = Number.isFinite(endedAtMs) ? endedAtMs : 0;

  return {
    ...safeRest,
    type: FACIAL_WINDOW_TYPE,
    version: FACIAL_TELEMETRY_SCHEMA_VERSION,
    sessionId: sessionId ?? null,
    gameId: gameId ?? null,
    windowIndex: Number.isFinite(windowIndex) ? windowIndex : 0,
    startedAtMs: normalizedStartedAtMs,
    endedAtMs: normalizedEndedAtMs,
    durationMs: Number.isFinite(durationMs)
      ? durationMs
      : Math.max(0, normalizedEndedAtMs - normalizedStartedAtMs),
    sampleCount: Number.isFinite(sampleCount) ? sampleCount : 0,
    source: source || 'mediapipe_face_landmarker',
    privacy: {
      ...DEFAULT_FACIAL_PRIVACY_GUARD,
      ...(privacy || {}),
      rawVideoStored: false,
      rawFramesStored: false,
      landmarksStored: false,
      audioCaptured: false,
    },
    quality: normalizeQuality(quality),
    facialSignals: normalizeFacialSignals(facialSignals),
    derivedProxies: {
      ...defaultDerivedProxies(),
      ...(derivedProxies || {}),
    },
    confidence: normalizeConfidence(confidence),
  };
}

function walkPayload(value, visitor, path = []) {
  if (!value || typeof value !== 'object') return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkPayload(item, visitor, [...path, String(index)]));
    return;
  }
  Object.entries(value).forEach(([key, child]) => {
    visitor(key, child, path);
    walkPayload(child, visitor, [...path, key]);
  });
}

export function assertFacialWindowPrivacySafe(window) {
  if (!window || typeof window !== 'object') {
    throw new Error('facial window must be an object');
  }

  const prohibited = new Set(PROHIBITED_FACIAL_PAYLOAD_KEYS.map((key) => key.toLowerCase()));
  walkPayload(window, (key, value, path) => {
    if (key === 'landmarksStored') return;
    if (prohibited.has(String(key).toLowerCase())) {
      throw new Error(`Unsafe facial telemetry field detected: ${[...path, key].join('.')}`);
    }
    if (typeof value === 'string' && /data:(image|video|application\/octet-stream)[^,]*,|base64,/i.test(value)) {
      throw new Error(`Unsafe facial telemetry value detected at: ${[...path, key].join('.')}`);
    }
  });

  if (window.privacy?.rawVideoStored !== false) {
    throw new Error('Unsafe facial telemetry privacy flag: rawVideoStored');
  }
  if (window.privacy?.rawFramesStored !== false) {
    throw new Error('Unsafe facial telemetry privacy flag: rawFramesStored');
  }
  if (window.privacy?.landmarksStored !== false) {
    throw new Error('Unsafe facial telemetry privacy flag: landmarksStored');
  }
  if (window.privacy?.audioCaptured !== false) {
    throw new Error('Unsafe facial telemetry privacy flag: audioCaptured');
  }

  return true;
}

export function assertTelemetryPayloadPrivacySafe(payload) {
  const prohibited = new Set(PROHIBITED_FACIAL_PAYLOAD_KEYS.map((key) => key.toLowerCase()));
  walkPayload(payload, (key, value, path) => {
    const normalizedKey = String(key).toLowerCase();
    if (key === 'landmarksStored') return;
    if (prohibited.has(normalizedKey)) {
      throw new Error(`Unsafe telemetry payload field detected: ${[...path, key].join('.')}`);
    }
    if (typeof value === 'string' && /data:(image|video|application\/octet-stream)[^,]*,|base64,/i.test(value)) {
      throw new Error(`Unsafe telemetry payload value detected at: ${[...path, key].join('.')}`);
    }
  });
  return true;
}

export function isFacialWindow(value) {
  return value?.type === FACIAL_WINDOW_TYPE && value?.version === FACIAL_TELEMETRY_SCHEMA_VERSION;
}
