import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  buildEdgeLocalLiveInsight,
  buildEdgeLocalWorkerInferencePayload,
  generateEdgeLocalReport,
} from './edgeLocalInferenceService';
import { createFacialWindow } from '../telemetry/facial/facialTelemetrySchema';
import {
  EDGE_LOCAL_MODEL_FEATURE_ORDER,
  EDGE_LOCAL_MODEL_INPUT_TYPE,
  EDGE_LOCAL_MODEL_OUTPUT_TYPE,
} from '../telemetry/model/edgeLocalModelContract';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('buildEdgeLocalLiveInsight', () => {
  it('returns null when telemetry has no start time', () => {
    expect(buildEdgeLocalLiveInsight({})).toBeNull();
  });

  it('computes bounded live metrics and quality signals', () => {
    vi.spyOn(Date, 'now').mockReturnValue(120000);

    const insight = buildEdgeLocalLiveInsight({
      startTime: 100000,
      mouseMovements: Array.from({ length: 120 }, (_, i) => ({ x: i, y: i, timestamp: 100000 + i * 50 })),
      clicks: Array.from({ length: 20 }, (_, i) => ({ x: i * 2, y: i * 3, timestamp: 100000 + i * 100 })),
      trialEvents: Array.from({ length: 40 }, (_, i) => ({ event: `t_${i}`, timestamp: 100000 + i * 120 })),
      webcamFrames: Array.from({ length: 18 }, () => ({ faceDetected: true })),
      qualityFlags: ['insufficient_webcam_signal', 'unstable_pose'],
      cursorMetrics: {
        hesitationCount: 9,
        avgVelocity: 180,
      },
      webcamQualityScore: 48,
    });

    expect(insight).not.toBeNull();
    expect(insight.elapsedSec).toBe(20);
    expect(insight.coverageScore).toBeGreaterThan(0);
    expect(insight.coverageScore).toBeLessThanOrEqual(100);
    expect(insight.readinessScore).toBeGreaterThanOrEqual(0);
    expect(insight.readinessScore).toBeLessThanOrEqual(100);
    expect(insight.signals).toContain('Quality flags active');
    expect(insight.signals).toContain('Webcam quality is low');
    expect(insight.signals).toContain('Hesitation is increasing');
  });

  it('summarizes aggregated facial windows for audit-only HUD signals', () => {
    vi.spyOn(Date, 'now').mockReturnValue(130000);

    const window = createFacialWindow({
      gameId: 'sst_game_2',
      durationMs: 5000,
      sampleCount: 15,
      quality: {
        facePresenceRatio: 0.42,
        meanDetectionConfidence: 0.52,
        meanIlluminationScore: 0.4,
        signalQualityScore: 38,
        flags: ['insufficient_facial_coverage', 'low_light'],
      },
      facialSignals: {
        blinkRatePerMin: 16,
        visualStabilityScore: 61,
        offScreenOrFaceAwayRatio: 0.33,
      },
      confidence: {
        windowConfidence: 0.44,
        interpretationAllowed: false,
        reasonIfLowConfidence: 'facial coverage below threshold',
      },
    });

    const insight = buildEdgeLocalLiveInsight({
      startTime: 100000,
      mouseMovements: [],
      clicks: [],
      trialEvents: [],
      webcamFrames: [],
      facialWindows: [window],
    });

    expect(insight.facialWindowCount).toBe(1);
    expect(insight.facePresencePercent).toBe(42);
    expect(insight.facialSignalQuality).toBe(38);
    expect(insight.visualStabilityScore).toBe(61);
    expect(insight.blinkRatePerMin).toBe(16);
    expect(insight.signals).toContain('Facial coverage is low');
    expect(insight.signals).toContain('Facial telemetry confidence is low');
  });
});

describe('buildEdgeLocalWorkerInferencePayload', () => {
  it('bridges session telemetry to the contract feature array for worker inference', () => {
    const facialWindow = createFacialWindow({
      gameId: 'ospan_game_1',
      durationMs: 5000,
      sampleCount: 10,
      quality: {
        facePresenceRatio: 0.9,
        meanDetectionConfidence: 0.84,
        signalQualityScore: 82,
        flags: [],
      },
      facialSignals: {
        blinkRatePerMin: 18,
        visualStabilityScore: 80,
        offScreenOrFaceAwayRatio: 0.08,
        headPose: { yawStdDeg: 4, pitchStdDeg: 3, rollStdDeg: 2 },
        microGestureActivityScore: 31,
      },
      derivedProxies: {
        attentionStabilityProxy: 77,
        cognitiveLoadProxy: 44,
        fatigueProxy: 20,
      },
      confidence: {
        windowConfidence: 0.8,
        interpretationAllowed: true,
      },
    });

    const payload = buildEdgeLocalWorkerInferencePayload({
      game1: {
        score: 88,
        duration: 60000,
        cursorMetrics: { avgVelocity: 140, hesitationCount: 2 },
        trialEvents: [
          { reactionTimeMs: 410, isCorrect: true },
          { reactionTimeMs: 520, isCorrect: false },
        ],
        facialWindows: [facialWindow],
      },
    }, 'en', { generatedAtMs: 999 });

    expect(payload.modelInput.type).toBe(EDGE_LOCAL_MODEL_INPUT_TYPE);
    expect(payload.featureOrder).toEqual(EDGE_LOCAL_MODEL_FEATURE_ORDER);
    expect(payload.featureArray).toEqual(payload.modelInput.featureArray);
    expect(payload.features).toEqual(payload.modelInput.features);
    expect(payload.features).toMatchObject({
      completedGameCount: 1,
      meanScore: 88,
      totalTrialEvents: 2,
      meanFacialCoverage: 90,
      meanWebcamSignalQuality: 82,
      meanMicroGestureActivity: 31,
    });
    expect(JSON.stringify(payload)).not.toMatch(/"rawFrame"|"faceLandmarks"|"normalizedLandmarks"|data:image|base64/i);
  });
});

describe('generateEdgeLocalReport facial signal audit', () => {
  it('derives biometric signal quality from aggregate facial windows', () => {
    const sessionData = {
      game1: {
        score: 72,
        facialWindows: [createFacialWindow({
          quality: { facePresenceRatio: 0.9, signalQualityScore: 80, flags: [] },
          confidence: { windowConfidence: 0.8, interpretationAllowed: true },
        })],
      },
      game2: {
        score: 68,
        facialWindows: [createFacialWindow({
          quality: { facePresenceRatio: 0.8, signalQualityScore: 70, flags: ['low_light'] },
          confidence: { windowConfidence: 0.7, interpretationAllowed: true },
        })],
      },
      game3: {
        score: 64,
        facialWindows: [createFacialWindow({
          quality: { facePresenceRatio: 0.7, signalQualityScore: 60, flags: ['insufficient_facial_coverage'] },
          confidence: { windowConfidence: 0.6, interpretationAllowed: false },
        })],
      },
    };

    const report = generateEdgeLocalReport(sessionData, 'en');

    expect(report.signalAudit.biometricSignalQualityScore).toBe(70);
    expect(report.signalAudit.facialCoverageScore).toBe(80);
    expect(report.signalAudit.facialWindowCount).toBe(3);
    expect(report.signalAudit.qualityFlags).toEqual(['low_light', 'insufficient_facial_coverage']);
    expect(report.signalAudit.caveats).toContain('Facial telemetry has low-confidence windows; interpret observable signals cautiously.');
    expect(report.assessmentFeatureVector).toMatchObject({
      type: 'assessment_feature_vector_v1',
      aggregate: {
        completedGameCount: 3,
        meanWebcamSignalQuality: 70,
        meanFacialCoverage: 80,
      },
    });
    expect(report.edgeLocalModelOutput).toMatchObject({
      type: EDGE_LOCAL_MODEL_OUTPUT_TYPE,
      decisionPolicy: 'human_review_only',
      model: expect.objectContaining({ calibrationStatus: 'baseline_not_validated' }),
      privacy: expect.objectContaining({ rawVideoStored: false, rawFramesStored: false }),
    });
    expect(report.edgeLocalModelOutput).not.toHaveProperty('hireDecision');
  });

  it('surfaces camera and local model failures as explicit interpretation caveats', () => {
    const unavailableWindow = createFacialWindow({
      gameId: 'ospan_game_1',
      durationMs: 0,
      sampleCount: 0,
      quality: {
        facePresenceRatio: 0,
        meanDetectionConfidence: 0,
        signalQualityScore: 0,
        flags: ['camera_denied', 'facial_model_unavailable'],
      },
      confidence: {
        windowConfidence: 0,
        interpretationAllowed: false,
        reasonIfLowConfidence: 'webcam capture unavailable',
      },
    });

    const report = generateEdgeLocalReport({
      game1: { score: 72, duration: 60000, facialWindows: [unavailableWindow] },
      game2: { score: 68, duration: 60000, facialWindows: [unavailableWindow] },
      game3: { score: 64, duration: 60000, facialWindows: [unavailableWindow] },
    }, 'en');

    expect(report.signalAudit.qualityFlags).toEqual(expect.arrayContaining([
      'camera_denied',
      'facial_model_unavailable',
    ]));
    expect(report.signalAudit.caveats).toContain(
      'Camera or the local facial model was unavailable; do not compare visual signals against full-coverage sessions.',
    );
    expect(report.assessmentFeatureVector.caveats).toContain(
      'Camera or local facial model was unavailable for part of the session; do not compare visual-signal features against full-coverage sessions.',
    );
  });
});
