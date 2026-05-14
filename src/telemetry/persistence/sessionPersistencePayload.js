import { assertTelemetryPayloadPrivacySafe } from '../facial/facialTelemetrySchema';
import { buildAssessmentFeatureVectorV1 } from '../features/assessmentFeatureVector';

const nowIso = () => new Date().toISOString();
const isPlainObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const finiteNumbers = (values) => values.filter(Number.isFinite);
const round = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
const average = (values) => {
  const finite = finiteNumbers(values);
  if (finite.length === 0) return 0;
  return round(finite.reduce((sum, value) => sum + value, 0) / finite.length, 1);
};
const toScalarId = (value) => (typeof value === 'string' && value.trim() ? value : null);

const summarizeLegacyWebcamFrames = (frames) => {
  if (!Array.isArray(frames)) {
    throw new Error('Unsafe telemetry payload field detected: webcamFrames');
  }

  frames.forEach((frame) => assertTelemetryPayloadPrivacySafe(frame));
  const faceDetectedValues = frames
    .map((frame) => frame?.faceDetected)
    .filter((value) => typeof value === 'boolean');
  const qualityScores = frames
    .map((frame) => Number(frame?.qualityScore))
    .filter(Number.isFinite);

  return {
    sampleCount: frames.length,
    faceDetectedRatio: faceDetectedValues.length > 0
      ? round((faceDetectedValues.filter(Boolean).length / faceDetectedValues.length) * 100, 1)
      : 0,
    meanQualityScore: average(qualityScores),
  };
};

const sanitizeTelemetryForPersistence = (value) => {
  if (Array.isArray(value)) {
    return value.map(sanitizeTelemetryForPersistence);
  }
  if (!isPlainObject(value)) return value;

  return Object.entries(value).reduce((safe, [key, child]) => {
    if (key === 'webcamFrames') {
      safe.webcamFrameSummary = summarizeLegacyWebcamFrames(child);
      return safe;
    }
    safe[key] = sanitizeTelemetryForPersistence(child);
    return safe;
  }, {});
};

export function buildSessionPersistencePayload({
  participant,
  telemetry,
  reportData,
  demoSummary = null,
  metadata,
  completedAt,
  generatedAtMs,
  edgeLocalModelOutput = null,
} = {}) {
  const safeMetadata = metadata && typeof metadata === 'object'
    ? metadata
    : { timestamp: nowIso() };
  const participantId = participant?.participantId;
  const startedAt = safeMetadata.startedAt || safeMetadata.timestamp || nowIso();
  const completedAtValue = completedAt || nowIso();
  const sanitizedTelemetry = sanitizeTelemetryForPersistence(telemetry || {});
  const sanitizedReportData = sanitizeTelemetryForPersistence(reportData || {});
  const sanitizedEdgeLocalModelOutput = edgeLocalModelOutput
    ? sanitizeTelemetryForPersistence(edgeLocalModelOutput)
    : null;
  const assessmentFeatureVector = buildAssessmentFeatureVectorV1(sanitizedTelemetry, {
    participantId: participantId ?? null,
    sessionId: toScalarId(safeMetadata.sessionId),
    generatedAtMs,
  });

  const sessionPayload = {
    participant,
    sessionData: {
      startedAt,
      completedAt: completedAtValue,
      participantId,
      telemetry: sanitizedTelemetry,
      report: sanitizedReportData,
      demoSummary,
      assessmentFeatureVector,
      edgeLocalModelOutput: sanitizedEdgeLocalModelOutput,
    },
    metadata: safeMetadata,
  };

  assertTelemetryPayloadPrivacySafe(sessionPayload);
  return sessionPayload;
}
