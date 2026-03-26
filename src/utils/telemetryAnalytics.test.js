import { describe, it, expect } from 'vitest';
import { analyzeTelemetry, buildTelemetryRiskSignals } from './telemetryAnalytics';

describe('telemetryAnalytics', () => {
  it('computes telemetry aggregates and quality metrics', () => {
    const sessionData = {
      ospan_game_1: {
        mouseMovements: [{}, {}, {}],
        clicks: [{}, {}],
        trialEvents: [{}, {}, {}, {}],
        webcamFrames: [{}, {}],
        webcamQualityScore: 72,
        qualityFlags: [],
        cursorMetrics: { hesitationCount: 3, avgVelocity: 120 },
      },
      sjt_game_7: {
        mouseMovements: [{}, {}],
        clicks: [{}],
        trialEvents: [{}, {}],
        webcamFrames: [{}],
        webcamQualityScore: 68,
        qualityFlags: ['noisy-signal'],
        cursorMetrics: { hesitationCount: 2, avgVelocity: 105 },
      },
    };

    const result = analyzeTelemetry(sessionData);
    expect(result.completedGames).toBe(2);
    expect(result.cursorEvents).toBe(5);
    expect(result.clickEvents).toBe(3);
    expect(result.webcamFrames).toBe(3);
    expect(result.avgWebcamQuality).toBe(70);
    expect(result.avgCursorVelocity).toBe(112.5);
  });

  it('builds risk signals from weak telemetry conditions', () => {
    const signals = buildTelemetryRiskSignals({
      completedGames: 2,
      completionRate: 28,
      avgWebcamQuality: 50,
      hesitationCount: 40,
      qualityFlags: 6,
    });

    expect(signals.length).toBeGreaterThan(2);
  });
});
