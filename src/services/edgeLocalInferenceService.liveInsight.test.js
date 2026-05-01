import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildEdgeLocalLiveInsight } from './edgeLocalInferenceService';

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
});
