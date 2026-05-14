const BLINK_LEFT = 'eyeBlinkLeft';
const BLINK_RIGHT = 'eyeBlinkRight';
const DEFAULT_BLINK_THRESHOLD = 0.55;

const clamp = (value, min = 0, max = 1) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const round = (value, decimals = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const toBlendshapeMap = (faceBlendshapes) => {
  const firstFace = Array.isArray(faceBlendshapes) ? faceBlendshapes[0] : null;
  const categories = Array.isArray(firstFace?.categories) ? firstFace.categories : [];
  return categories.reduce((acc, category) => {
    const name = category?.categoryName || category?.displayName || category?.name;
    if (!name) return acc;
    acc[name] = round(clamp(category.score, 0, 1));
    return acc;
  }, {});
};

const matrixDataFromResult = (facialTransformationMatrixes) => {
  const first = Array.isArray(facialTransformationMatrixes) ? facialTransformationMatrixes[0] : null;
  if (Array.isArray(first?.data)) return first.data;
  if (first?.data && typeof first.data.length === 'number') return Array.from(first.data);
  if (Array.isArray(first)) return first;
  return null;
};

export function estimateHeadPoseFromMatrix(matrix) {
  if (!Array.isArray(matrix) || matrix.length < 16) return null;

  // MediaPipe exposes a 4x4 facial transformation matrix. We only keep coarse
  // Euler angles as non-reconstructive aggregate-ready features.
  const m00 = Number(matrix[0]);
  const m01 = Number(matrix[1]);
  const m02 = Number(matrix[2]);
  const m10 = Number(matrix[4]);
  const m11 = Number(matrix[5]);
  const m12 = Number(matrix[6]);
  const m20 = Number(matrix[8]);
  const m21 = Number(matrix[9]);
  const m22 = Number(matrix[10]);

  if (![m00, m01, m02, m10, m11, m12, m20, m21, m22].every(Number.isFinite)) {
    return null;
  }

  const yaw = Math.atan2(m20, m22);
  const pitch = Math.atan2(-m21, Math.sqrt((m20 * m20) + (m22 * m22)));
  const roll = Math.atan2(m10, m00);
  const toDeg = (rad) => round((rad * 180) / Math.PI, 2);

  return {
    yawDeg: toDeg(yaw),
    pitchDeg: toDeg(pitch),
    rollDeg: toDeg(roll),
  };
}

export function extractFacialFrameFeatures(result = {}, options = {}) {
  const faceLandmarks = Array.isArray(result?.faceLandmarks) ? result.faceLandmarks : [];
  const faceCount = faceLandmarks.length;
  const facePresent = faceCount > 0;
  const detectionConfidence = facePresent
    ? clamp(options.detectionConfidence ?? result.detectionConfidence ?? result.faceDetectionConfidence ?? 1, 0, 1)
    : 0;
  const blendshapes = facePresent ? toBlendshapeMap(result.faceBlendshapes) : {};
  const blinkLeft = blendshapes[BLINK_LEFT] ?? 0;
  const blinkRight = blendshapes[BLINK_RIGHT] ?? 0;
  const blinkScore = round((blinkLeft + blinkRight) / 2);
  const blinkThreshold = clamp(options.blinkThreshold ?? DEFAULT_BLINK_THRESHOLD, 0, 1);
  const matrix = matrixDataFromResult(result.facialTransformationMatrixes);

  return {
    type: 'facial_frame_features_v1',
    timestampMs: Number.isFinite(options.timestampMs) ? options.timestampMs : Date.now(),
    source: options.source || 'mediapipe_face_landmarker',
    facePresent,
    faceCount,
    detectionConfidence: round(detectionConfidence),
    illuminationScore: round(clamp(options.illuminationScore ?? result.illuminationScore ?? 1, 0, 1)),
    blinkDetected: facePresent && blinkScore >= blinkThreshold,
    blinkScore,
    blinkAsymmetry: round(Math.abs(blinkLeft - blinkRight)),
    blendshapes,
    headPose: facePresent ? estimateHeadPoseFromMatrix(matrix) : null,
  };
}
