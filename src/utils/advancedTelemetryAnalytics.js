import { buildEdgeLocalLiveInsight } from '../services/edgeLocalInferenceService';

const clamp = (value, min, max) => {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
};

const round = (value, digits = 1) => {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const avg = (values = []) => {
  const nums = values.filter((v) => Number.isFinite(v));
  if (!nums.length) return 0;
  return nums.reduce((sum, v) => sum + v, 0) / nums.length;
};

const getSnapshot = (sessionData, id) => {
  return sessionData?.[id] || null;
};

const ANALYSIS_WEIGHTS = {
  coverage: 0.42,
  duration: 0.2,
  reliability: 0.24,
  webcam: 0.14,
};

export function analyzeDemoTelemetry(sessionData = {}, activities = []) {
  const totalActivities = activities.length;
  const completedActivities = activities.filter((a) => a.status === 'completed').length;

  const perGame = activities.map((activity) => {
    const snap = getSnapshot(sessionData, activity.id);
    const liveInsight = snap ? buildEdgeLocalLiveInsight(snap) : null;
    const durationMs = Number.isFinite(snap?.duration) ? snap.duration : 0;
    const cursorEvents = snap?.mouseMovements?.length || 0;
    const clickEvents = snap?.clicks?.length || 0;
    const trialEvents = snap?.trialEvents?.length || 0;
    const webcamFrames = snap?.webcamFrames?.length || 0;
    const qualityFlags = snap?.qualityFlags?.length || 0;
    const hesitationCount = snap?.cursorMetrics?.hesitationCount || 0;
    const avgVelocity = snap?.cursorMetrics?.avgVelocity || 0;
    const webcamQuality = Number.isFinite(snap?.webcamQualityScore) ? snap.webcamQualityScore : null;

    const dataPoints = cursorEvents + clickEvents + trialEvents + webcamFrames;
    const gameCoverage = clamp((dataPoints / 120) * 100, 0, 100);
    const reliabilityPenalty = clamp((qualityFlags * 10) + (hesitationCount * 1.2), 0, 60);
    const durationTargetScore = activity.est
      ? clamp(100 - (Math.abs(durationMs / 1000 - activity.est) / activity.est) * 100, 0, 100)
      : 70;
    const reliabilityScore = clamp(100 - reliabilityPenalty, 0, 100);
    const webcamScore = webcamQuality !== null ? webcamQuality : 42;
    const coverageScore = Number.isFinite(liveInsight?.coverageScore) ? liveInsight.coverageScore : gameCoverage;
    const stabilityScore = Number.isFinite(liveInsight?.stabilityScore)
      ? liveInsight.stabilityScore
      : clamp(
        (reliabilityScore * 0.4)
        + (durationTargetScore * 0.25)
        + (gameCoverage * 0.2)
        + (webcamScore * 0.15),
        0,
        100
      );
    const fatigueScore = Number.isFinite(liveInsight?.fatigueScore)
      ? liveInsight.fatigueScore
      : clamp(
        ((100 - durationTargetScore) * 0.32)
        + ((100 - reliabilityScore) * 0.28)
        + (hesitationCount * 1.35)
        + (activity.order ? (activity.order - 1) * 3.5 : 0),
        0,
        100
      );
    const readinessScore = Number.isFinite(liveInsight?.readinessScore)
      ? liveInsight.readinessScore
      : clamp(
        (coverageScore * 0.35)
        + (stabilityScore * 0.45)
        + ((100 - fatigueScore) * 0.2),
        0,
        100
      );
    const gameConfidence = clamp(
      (coverageScore * ANALYSIS_WEIGHTS.coverage)
      + (durationTargetScore * ANALYSIS_WEIGHTS.duration)
      + (reliabilityScore * ANALYSIS_WEIGHTS.reliability)
      + (webcamScore * ANALYSIS_WEIGHTS.webcam),
      0,
      100
    );

    return {
      id: activity.id,
      order: activity.order,
      status: activity.status,
      hasTelemetry: Boolean(snap),
      durationSec: round(durationMs / 1000, 1),
      durationTargetScore: round(durationTargetScore, 1),
      telemetry: {
        cursorEvents,
        clickEvents,
        trialEvents,
        webcamFrames,
        qualityFlags,
        hesitationCount,
        avgVelocity: round(avgVelocity, 1),
        webcamQuality: webcamQuality !== null ? round(webcamQuality, 1) : null,
        liveSignals: Array.isArray(liveInsight?.signals) ? liveInsight.signals : [],
      },
      gameCoverage: round(coverageScore, 1),
      confidence: round(gameConfidence, 1),
      reliability: round(reliabilityScore, 1),
      readinessScore: round(readinessScore, 1),
      stabilityScore: round(stabilityScore, 1),
      fatigueScore: round(fatigueScore, 1),
    };
  });

  const withTelemetry = perGame.filter((g) => g.hasTelemetry);
  const totals = withTelemetry.reduce(
    (acc, game) => {
      acc.cursorEvents += game.telemetry.cursorEvents;
      acc.clickEvents += game.telemetry.clickEvents;
      acc.trialEvents += game.telemetry.trialEvents;
      acc.webcamFrames += game.telemetry.webcamFrames;
      acc.qualityFlags += game.telemetry.qualityFlags;
      acc.hesitationCount += game.telemetry.hesitationCount;
      return acc;
    },
    {
      cursorEvents: 0,
      clickEvents: 0,
      trialEvents: 0,
      webcamFrames: 0,
      qualityFlags: 0,
      hesitationCount: 0,
    }
  );

  const captureCoverage = totalActivities > 0 ? (withTelemetry.length / totalActivities) * 100 : 0;
  const completionRate = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;
  const avgGameCoverage = avg(withTelemetry.map((g) => g.gameCoverage));
  const avgConfidence = avg(withTelemetry.map((g) => g.confidence));
  const avgStability = avg(withTelemetry.map((g) => g.stabilityScore));
  const avgFatigue = avg(withTelemetry.map((g) => g.fatigueScore));
  const avgReadiness = avg(withTelemetry.map((g) => g.readinessScore));
  const avgWebcamQuality = avg(withTelemetry.map((g) => g.telemetry.webcamQuality));
  const attentionStability = clamp(100 - avg(withTelemetry.map((g) => g.telemetry.hesitationCount)) * 2.4, 0, 100);
  const liveSignals = Array.from(new Set(withTelemetry.flatMap((g) => g.telemetry.liveSignals || [])));

  const signals = [];
  if (captureCoverage < 60) {
    signals.push('Low telemetry capture coverage across selected demo games');
  }
  if (avgWebcamQuality > 0 && avgWebcamQuality < 60) {
    signals.push('Webcam quality was low; biometric attention features may be less reliable');
  }
  if (totals.qualityFlags > 4) {
    signals.push('Multiple quality flags detected; environment stability should be improved');
  }
  if (attentionStability < 55) {
    signals.push('High hesitation pattern detected during interaction flow');
  }
  if (avgReadiness > 0 && avgReadiness < 55) {
    signals.push('Live readiness trended low during the demo sequence');
  }
  signals.push(...liveSignals);

  return {
    totals,
    captureCoverage: round(captureCoverage, 1),
    completionRate: round(completionRate, 1),
    avgGameCoverage: round(avgGameCoverage, 1),
    avgConfidence: round(avgConfidence, 1),
    avgReliability: round(avg(withTelemetry.map((g) => g.reliability)), 1),
    avgStability: round(avgStability, 1),
    avgFatigue: round(avgFatigue, 1),
    avgReadiness: round(avgReadiness, 1),
    avgWebcamQuality: round(avgWebcamQuality, 1),
    attentionStability: round(attentionStability, 1),
    perGame,
    signals: Array.from(new Set(signals)),
  };
}
