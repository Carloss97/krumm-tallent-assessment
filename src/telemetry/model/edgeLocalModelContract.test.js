import { describe, expect, it } from 'vitest';
import { createFacialWindow, assertTelemetryPayloadPrivacySafe } from '../facial/facialTelemetrySchema';
import { buildAssessmentFeatureVectorV1 } from '../features/assessmentFeatureVector';
import {
  EDGE_LOCAL_MODEL_FEATURE_ORDER,
  EDGE_LOCAL_MODEL_INPUT_TYPE,
  EDGE_LOCAL_MODEL_OUTPUT_TYPE,
  buildEdgeLocalModelInputV1,
  createEdgeLocalModelOutputV1,
} from './edgeLocalModelContract';

const makeVector = () => buildAssessmentFeatureVectorV1({
  game1: {
    score: 88,
    errors: 1,
    duration: 60_000,
    cursorMetrics: { avgVelocity: 140, hesitationCount: 2 },
    trialEvents: [
      { event: 'trial_response', reactionTimeMs: 420, isCorrect: true },
      { event: 'trial_response', reactionTimeMs: 520, isCorrect: false },
    ],
    facialWindows: [createFacialWindow({
      gameId: 'ospan_game_1',
      durationMs: 5000,
      sampleCount: 12,
      quality: {
        facePresenceRatio: 0.8,
        meanDetectionConfidence: 0.86,
        meanIlluminationScore: 0.78,
        signalQualityScore: 84,
        flags: [],
      },
      facialSignals: {
        blinkRatePerMin: 18,
        blinkAsymmetryMean: 0.16,
        microGestureActivityScore: 37,
        visualStabilityScore: 82,
        offScreenOrFaceAwayRatio: 0.1,
        headPose: {
          yawMeanDeg: 1,
          pitchMeanDeg: 2,
          rollMeanDeg: 0,
          yawStdDeg: 4,
          pitchStdDeg: 3,
          rollStdDeg: 2,
        },
      },
      derivedProxies: {
        attentionStabilityProxy: 79,
        cognitiveLoadProxy: 45,
        fatigueProxy: 22,
      },
      confidence: {
        windowConfidence: 0.82,
        interpretationAllowed: true,
      },
    })],
  },
}, { sessionId: 'session-edge', participantId: 'candidate-edge', generatedAtMs: 123 });

describe('edge-local model metadata-only contract', () => {
  it('builds an ordered browser-local model input from aggregate assessment features', () => {
    const modelInput = buildEdgeLocalModelInputV1(makeVector(), { generatedAtMs: 456 });

    expect(modelInput.type).toBe(EDGE_LOCAL_MODEL_INPUT_TYPE);
    expect(modelInput.version).toBe('1.0.0');
    expect(modelInput.featureOrder).toEqual(EDGE_LOCAL_MODEL_FEATURE_ORDER);
    expect(modelInput.featureArray).toHaveLength(EDGE_LOCAL_MODEL_FEATURE_ORDER.length);
    expect(modelInput.featureVector).toMatchObject({
      type: 'assessment_feature_vector_v1',
      version: '1.0.0',
    });
    expect(modelInput.features).toMatchObject({
      completedGameCount: 1,
      meanScore: 88,
      totalTrialEvents: 2,
      meanReactionTimeMs: 470,
      meanAccuracyProxy: 50,
      meanDurationSec: 60,
      meanCursorVelocity: 140,
      totalHesitationCount: 2,
      meanFacialCoverage: 80,
      meanWebcamSignalQuality: 84,
      meanFacialConfidence: 82,
      meanBlinkRatePerMin: 18,
      meanVisualStability: 82,
      meanOffScreenOrFaceAwayPercent: 10,
      meanHeadPoseVariability: 3,
      meanMicroGestureActivity: 37,
      meanAttentionStabilityProxy: 79,
      meanCognitiveLoadProxy: 45,
      meanFatigueProxy: 22,
    });
    expect(modelInput.privacy).toMatchObject({
      source: 'aggregate_metadata_only',
      rawVideoStored: false,
      rawFramesStored: false,
      landmarksStored: false,
      audioCaptured: false,
    });
    expect(modelInput.calibrationStatus).toBe('baseline_not_validated');
    expect(modelInput.prohibitedClaims).toEqual(expect.arrayContaining([
      'lie_detection',
      'mental_health_diagnosis',
      'automatic_hiring_decision',
    ]));
    expect(() => assertTelemetryPayloadPrivacySafe(modelInput)).not.toThrow();
    expect(JSON.stringify(modelInput)).not.toMatch(/"rawFrame"|"faceLandmarks"|"normalizedLandmarks"|data:image|base64/i);
  });

  it('creates bounded metadata-only model outputs with caveats and no automatic hiring decision', () => {
    const output = createEdgeLocalModelOutputV1({
      scorePercent: 92,
      confidenceScore: 81,
      latencyMs: 18,
      qualityFlags: ['low_light'],
      caveats: ['Low lighting reduced facial signal quality.'],
    }, { generatedAtMs: 789 });

    expect(output).toMatchObject({
      type: EDGE_LOCAL_MODEL_OUTPUT_TYPE,
      version: '1.0.0',
      scorePercent: 92,
      confidenceScore: 81,
      interpretationAllowed: true,
      decisionPolicy: 'human_review_only',
      qualityFlags: ['low_light'],
      caveats: ['Low lighting reduced facial signal quality.'],
      runtime: expect.objectContaining({ latencyMs: 18 }),
    });
    expect(output).not.toHaveProperty('hireDecision');
    expect(output).not.toHaveProperty('emotion');
    expect(output).not.toHaveProperty('personality');
    expect(() => assertTelemetryPayloadPrivacySafe(output)).not.toThrow();
  });
});
