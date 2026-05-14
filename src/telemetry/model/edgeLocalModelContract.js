import { assertTelemetryPayloadPrivacySafe } from '../facial/facialTelemetrySchema';

export const EDGE_LOCAL_MODEL_INPUT_TYPE = 'edge_local_model_input_v1';
export const EDGE_LOCAL_MODEL_OUTPUT_TYPE = 'edge_local_model_output_v1';
export const EDGE_LOCAL_MODEL_CONTRACT_VERSION = '1.0.0';
export const EDGE_LOCAL_MODEL_NAME = 'edge-local-report';
export const EDGE_LOCAL_MODEL_VERSION = '2026-05-14.contract-v1';
export const EDGE_LOCAL_MODEL_SIZE_MB = 0.018;
export const EDGE_LOCAL_CALIBRATION_STATUS = 'baseline_not_validated';

export const EDGE_LOCAL_MODEL_FEATURE_ORDER = Object.freeze([
  'completedGameCount',
  'meanScore',
  'totalTrialEvents',
  'meanReactionTimeMs',
  'meanAccuracyProxy',
  'meanDurationSec',
  'meanCursorVelocity',
  'totalHesitationCount',
  'meanFacialCoverage',
  'meanWebcamSignalQuality',
  'meanFacialConfidence',
  'meanBlinkRatePerMin',
  'meanVisualStability',
  'meanOffScreenOrFaceAwayPercent',
  'meanHeadPoseVariability',
  'meanMicroGestureActivity',
  'meanAttentionStabilityProxy',
  'meanCognitiveLoadProxy',
  'meanFatigueProxy',
]);

export const EDGE_LOCAL_ALLOWED_SIGNAL_GROUPS = Object.freeze([
  'game_results',
  'trial_timing_accuracy',
  'cursor_interaction_aggregates',
  'facial_signal_quality_aggregates',
  'microgesture_aggregate_blendshape_groups',
  'model_quality_flags',
]);

export const EDGE_LOCAL_PROHIBITED_CLAIMS = Object.freeze([
  'lie_detection',
  'true_emotion_detection',
  'personality_inference',
  'mental_health_diagnosis',
  'innate_intelligence_claim',
  'automatic_hiring_decision',
]);

const clamp = (value, min, max) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return min;
  return Math.max(min, Math.min(max, numeric));
};

const round = (value, decimals = 1) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const finite = (values) => values.map(Number).filter(Number.isFinite);

const average = (values, decimals = 1) => {
  const safeValues = finite(values);
  if (safeValues.length === 0) return 0;
  return round(safeValues.reduce((sum, value) => sum + value, 0) / safeValues.length, decimals);
};

const sum = (values) => finite(values).reduce((total, value) => total + value, 0);
const percent = (value) => round(clamp(value, 0, 100), 1);

const buildFeatureMap = (assessmentFeatureVector = {}) => {
  const games = Array.isArray(assessmentFeatureVector.games) ? assessmentFeatureVector.games : [];
  const aggregate = assessmentFeatureVector.aggregate || {};

  return {
    completedGameCount: Math.round(clamp(aggregate.completedGameCount ?? games.length, 0, 100)),
    meanScore: percent(aggregate.meanScore ?? average(games.map((game) => game.score), 1)),
    totalTrialEvents: Math.round(clamp(aggregate.totalTrialEvents ?? sum(games.map((game) => game.trialEventCount)), 0, 10000)),
    meanReactionTimeMs: round(average(games.map((game) => game.reactionTimeMsMean), 1), 1),
    meanAccuracyProxy: percent(average(games.map((game) => game.accuracyProxy), 1)),
    meanDurationSec: round(average(games.map((game) => game.durationMs / 1000), 1), 1),
    meanCursorVelocity: round(average(games.map((game) => game.cursor?.avgVelocity), 1), 1),
    totalHesitationCount: Math.round(clamp(sum(games.map((game) => game.cursor?.hesitationCount)), 0, 10000)),
    meanFacialCoverage: percent(aggregate.meanFacialCoverage ?? average(games.map((game) => game.facial?.coverageMean), 1)),
    meanWebcamSignalQuality: percent(aggregate.meanWebcamSignalQuality ?? average(games.map((game) => game.facial?.signalQualityMean), 1)),
    meanFacialConfidence: percent(average(games.map((game) => game.facial?.confidenceMean), 1)),
    meanBlinkRatePerMin: round(average(games.map((game) => game.facial?.blinkRatePerMinMean), 1), 1),
    meanVisualStability: percent(average(games.map((game) => game.facial?.visualStabilityMean), 1)),
    meanOffScreenOrFaceAwayPercent: percent(average(games.map((game) => game.facial?.offScreenOrFaceAwayPercentMean), 1)),
    meanHeadPoseVariability: round(average(games.map((game) => game.facial?.headPoseVariabilityMean), 1), 1),
    meanMicroGestureActivity: percent(average(games.map((game) => game.facial?.microGestureActivityMean), 1)),
    meanAttentionStabilityProxy: percent(average(games.map((game) => game.facial?.attentionStabilityProxyMean), 1)),
    meanCognitiveLoadProxy: percent(average(games.map((game) => game.facial?.cognitiveLoadProxyMean), 1)),
    meanFatigueProxy: percent(average(games.map((game) => game.facial?.fatigueProxyMean), 1)),
  };
};

const makePrivacyGuard = () => ({
  source: 'aggregate_metadata_only',
  rawVideoStored: false,
  rawFramesStored: false,
  landmarksStored: false,
  audioCaptured: false,
});

export function buildEdgeLocalModelInputV1(assessmentFeatureVector = {}, options = {}) {
  const features = buildFeatureMap(assessmentFeatureVector);
  const modelInput = {
    type: EDGE_LOCAL_MODEL_INPUT_TYPE,
    version: EDGE_LOCAL_MODEL_CONTRACT_VERSION,
    generatedAtMs: Number.isFinite(options.generatedAtMs) ? options.generatedAtMs : Date.now(),
    model: {
      name: EDGE_LOCAL_MODEL_NAME,
      version: EDGE_LOCAL_MODEL_VERSION,
      expectedRuntime: 'onnxruntime-web-worker',
      sizeMb: EDGE_LOCAL_MODEL_SIZE_MB,
    },
    featureVector: {
      type: assessmentFeatureVector.type || null,
      version: assessmentFeatureVector.version || null,
    },
    featureOrder: [...EDGE_LOCAL_MODEL_FEATURE_ORDER],
    featureArray: EDGE_LOCAL_MODEL_FEATURE_ORDER.map((featureName) => features[featureName] ?? 0),
    features,
    allowedSignalGroups: [...EDGE_LOCAL_ALLOWED_SIGNAL_GROUPS],
    prohibitedClaims: [...EDGE_LOCAL_PROHIBITED_CLAIMS],
    calibrationStatus: options.calibrationStatus || EDGE_LOCAL_CALIBRATION_STATUS,
    qualityFlags: [...new Set(assessmentFeatureVector.aggregate?.qualityFlags || assessmentFeatureVector.session?.qualityFlags || [])],
    caveats: Array.isArray(assessmentFeatureVector.caveats) ? [...assessmentFeatureVector.caveats] : [],
    privacy: makePrivacyGuard(),
  };

  assertTelemetryPayloadPrivacySafe(modelInput);
  return modelInput;
}

export function createEdgeLocalModelOutputV1(result = {}, options = {}) {
  const qualityFlags = Array.isArray(result.qualityFlags) ? [...new Set(result.qualityFlags.filter(Boolean))] : [];
  const caveats = Array.isArray(result.caveats) ? [...new Set(result.caveats.filter(Boolean))] : [];
  const confidenceScore = percent(result.confidenceScore ?? result.confidence ?? 0);
  const scorePercent = percent(result.scorePercent ?? 0);

  const output = {
    type: EDGE_LOCAL_MODEL_OUTPUT_TYPE,
    version: EDGE_LOCAL_MODEL_CONTRACT_VERSION,
    generatedAtMs: Number.isFinite(options.generatedAtMs) ? options.generatedAtMs : Date.now(),
    model: {
      name: result.modelName || EDGE_LOCAL_MODEL_NAME,
      version: result.modelVersion || EDGE_LOCAL_MODEL_VERSION,
      calibrationStatus: result.calibrationStatus || EDGE_LOCAL_CALIBRATION_STATUS,
    },
    scorePercent,
    confidenceScore,
    interpretationAllowed: result.interpretationAllowed !== false && confidenceScore >= 30,
    decisionPolicy: 'human_review_only',
    qualityFlags,
    caveats,
    prohibitedClaims: [...EDGE_LOCAL_PROHIBITED_CLAIMS],
    runtime: {
      runtime: result.runtime || 'onnxruntime-web-worker',
      latencyMs: Math.round(clamp(result.latencyMs ?? 0, 0, 60000)),
      modelLoaded: Boolean(result.modelLoaded),
    },
    privacy: makePrivacyGuard(),
  };

  assertTelemetryPayloadPrivacySafe(output);
  return output;
}
