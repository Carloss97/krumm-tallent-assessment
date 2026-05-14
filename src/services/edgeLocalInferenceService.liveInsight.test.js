import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildEdgeLocalLiveInsight, generateEdgeLocalReport } from './edgeLocalInferenceService';
import { createFacialWindow } from '../telemetry/facial/facialTelemetrySchema';

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
  });
});
