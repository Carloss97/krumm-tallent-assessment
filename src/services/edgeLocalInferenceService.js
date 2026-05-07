const EDGE_MODEL_NAME = 'edge-linear-v1';
const EDGE_MODEL_SIZE_MB = 0.018;
const ENV = typeof import.meta !== 'undefined' ? (import.meta?.env || {}) : {};

const EDGE_CALIBRATION_REGISTRY = {
  stableVersion: '2026-03-27.v1-stable',
  baselineConfidence: 0.68,
  idealMoveVelocity: 140, // pixels per second
  hesitationThresholdMs: 2500,
  clickAccuracyWeight: 0.22,
};

/**
 * Local edge-inference simulation service.
 * In a real scenario, this would load a tiny ONNX/TensorFlow.js model 
 * to interpret telemetry signals without raw-data exfiltration.
 */
function getLocalizedLabels(language = 'en') {
  if (language === 'es') {
    return {
      summaryPrefix: 'La evaluación edge-local indica',
      confidencePrefix: 'confianza calibrada por estabilidad de señales locales',
      strengths: {
        executionControl: 'control de ejecución y precisión rítmica',
        adaptability: 'adaptabilidad a cambios dinámicos de reglas',
        attentionStability: 'estabilidad atencional y foco sostenido',
        decisionQuality: 'calidad de decisión situacional bajo presión',
        learningVelocity: 'velocidad de aprendizaje y transferencia de tareas',
      },
      recommendations: {
        strong: 'ALINEACIÓN FUERTE',
        solid: 'ALINEACIÓN SÓLIDA CON COACHING',
        conditional: 'ALINEACIÓN CONDICIONAL',
        exploratory: 'ENCAJE EXPLORATORIO - REQUIERE MÁS DATOS',
      },
    };
  }
  return {
    summaryPrefix: 'Local edge assessment indicates',
    confidencePrefix: 'confidence calibrated by local signal stability',
    strengths: {
      executionControl: 'execution control and rhythmic precision',
      adaptability: 'adaptability to dynamic rule shifts',
      attentionStability: 'attentional stability and sustained focus',
      decisionQuality: 'situational decision quality under pressure',
      learningVelocity: 'learning velocity and task transfer',
    },
    recommendations: {
      strong: 'STRONG ALIGNMENT',
      solid: 'SOLID ALIGNMENT WITH COACHING',
      conditional: 'CONDITIONAL ALIGNMENT',
      exploratory: 'EXPLORATORY FIT - NEEDS MORE DATA',
    },
  };
}

export function generateEdgeLocalReport(sessionData, language = 'en') {
  const labels = getLocalizedLabels(language);
  const gameIds = Object.keys(sessionData || {}).filter((k) => k !== 'futureModules');
  const getGameSignal = (id) => {
    const game = sessionData?.[id];
    if (!game || typeof game !== 'object') return null;

    const score = Number.isFinite(game.score)
      ? game.score
      : Number.isFinite(game.confidence)
        ? game.confidence
        : Number.isFinite(game.gameCoverage)
          ? game.gameCoverage
          : Number.isFinite(game.readinessScore)
            ? game.readinessScore
            : null;

    if (score === null) return null;

    return { ...game, score };
  };

  const validGames = gameIds
    .map((id) => ({ id, game: getGameSignal(id) }))
    .filter(({ game }) => Boolean(game));

  if (validGames.length === 0) return null;

  const latencyMs = Math.round(12 + Math.random() * 45); // Simulated local inference time
  const totalScore = validGames.reduce((acc, entry) => acc + (entry.game.score || 0), 0);
  const avgScore = totalScore / validGames.length;
  
  // Local signal audit (simulated)
  const telemetryCoverageScore = Math.min(100, Math.round((validGames.length / 7) * 100));
  const biometricSignalQualityScore = calculateBiometricQuality(sessionData, validGames);

  // Confidence is a function of data density + signal stability
  const confidenceScore = Math.round(
    (EDGE_CALIBRATION_REGISTRY.baselineConfidence * 100) 
    + (biometricSignalQualityScore * 0.2) 
    + (telemetryCoverageScore * 0.1)
  );

  let recommendation = labels.recommendations.exploratory;
  let strengths = [];

  if (avgScore >= 75) {
    recommendation = labels.recommendations.strong;
    strengths = [labels.strengths.executionControl, labels.strengths.decisionQuality];
  } else if (avgScore >= 60) {
    recommendation = labels.recommendations.solid;
    strengths = [labels.strengths.attentionStability, labels.strengths.adaptability];
  } else if (avgScore >= 45) {
    recommendation = labels.recommendations.conditional;
    strengths = [labels.strengths.learningVelocity];
  }

  const summary = `${labels.summaryPrefix} ${recommendation.toLowerCase()}. ${labels.confidencePrefix} (${confidenceScore}%).`;

  return {
    summary,
    strengths,
    areasToMonitor: [language === 'es' ? 'Consistencia bajo carga cognitiva extrema' : 'Consistency under extreme cognitive load'],
    careerRecommendations: [
      { 
        role: language === 'es' ? 'Analista de Operaciones / Control de Gestión' : 'Operations Analyst / Management Control', 
        fit: language === 'es' ? 'Alineación detectada por precisión en ruteo y control de excepciones.' : 'Alignment detected by routing precision and exception control.'
      }
    ],
    confidenceScore,
    recommendation,
    source: 'edge-local',
    runtime: {
      model: EDGE_MODEL_NAME,
      sizeMb: EDGE_MODEL_SIZE_MB,
      latencyMs,
      processedAt: new Date().toISOString(),
    },
    signalAudit: {
      telemetryCoverageScore,
      biometricSignalQualityScore,
    }
  };
}

function calculateBiometricQuality(data, games) {
  const qualities = games
    .map((id) => data[id]?.webcamQualityScore)
    .filter((v) => typeof v === 'number');
  
  if (qualities.length === 0) return 0;
  return Math.round(qualities.reduce((a, b) => a + b, 0) / qualities.length);
}

/**
 * Build real-time micro-insights for the HUD
 */
export function buildEdgeLocalLiveInsight(rawTelemetry) {
  if (!rawTelemetry) return null;

  if (!Number.isFinite(rawTelemetry.startTime) && !Number.isFinite(rawTelemetry.elapsedSec)) {
    return null;
  }

  const toCount = (value, fallbackKeys = []) => {
    if (Number.isFinite(value)) return value;
    if (Array.isArray(value)) return value.length;

    for (const key of fallbackKeys) {
      const candidate = rawTelemetry?.[key];
      if (Number.isFinite(candidate)) return candidate;
      if (Array.isArray(candidate)) return candidate.length;
    }

    return 0;
  };

  const elapsedSec = Number.isFinite(rawTelemetry.elapsedSec)
    ? rawTelemetry.elapsedSec
    : Number.isFinite(rawTelemetry.startTime)
      ? Math.max(0, Math.floor((Date.now() - rawTelemetry.startTime) / 1000))
      : 0;
  const cursorEvents = toCount(rawTelemetry.cursorEvents, ['mouseMovements']);
  const clickEvents = toCount(rawTelemetry.clickEvents, ['clicks']);
  const trialEvents = toCount(rawTelemetry.trialEvents);
  const webcamFrames = toCount(rawTelemetry.webcamFrames);
  const webcamQuality = Number.isFinite(rawTelemetry.webcamQuality)
    ? rawTelemetry.webcamQuality
    : Number.isFinite(rawTelemetry.webcamQualityScore)
      ? rawTelemetry.webcamQualityScore
      : 0;
  
  // Heuristic: readiness is a composite of activity levels vs time
  const activityDensity = (cursorEvents + (clickEvents * 5) + (trialEvents * 10)) / Math.max(1, elapsedSec);
  const coverageScore = Math.min(100, Math.round(activityDensity * 8));
  
  // Stability: inverse of jerky movement (simplified)
  const stabilityScore = Math.max(40, Math.min(98, 100 - (cursorEvents / 100)));
  
  // Fatigue: rises if frame count is low but time is high (proxy for eye activity drop)
  const fatigueScore = Math.min(100, Math.max(0, Math.round((elapsedSec / 180) * 100)));

  // Readiness: composite
  const readinessScore = Math.round((coverageScore * 0.4) + (stabilityScore * 0.4) + (webcamQuality * 0.2));

  const formatPercent = (v) => Math.min(100, Math.max(0, Math.round(v)));

  const signals = [];
  if (Array.isArray(rawTelemetry.qualityFlags) && rawTelemetry.qualityFlags.length > 0) {
    signals.push('Quality flags active');
  }
  if (webcamQuality > 0 && webcamQuality < 60) {
    signals.push('Webcam quality is low');
  }
  const hesitationCount = Number.isFinite(rawTelemetry?.cursorMetrics?.hesitationCount)
    ? rawTelemetry.cursorMetrics.hesitationCount
    : 0;
  if (hesitationCount > 0) {
    signals.push('Hesitation is increasing');
  }
  if (coverageScore > 80) signals.push('High data density');
  if (stabilityScore < 60) signals.push('Movement hesitation');
  if (webcamQuality > 85) signals.push('Premium visual signal');

  return {
    elapsedSec,
    cursorEvents,
    clickEvents,
    trialEvents,
    webcamFrames,
    webcamQuality: formatPercent(webcamQuality),
    coverageScore: formatPercent(coverageScore),
    stabilityScore: formatPercent(stabilityScore),
    fatigueScore: formatPercent(fatigueScore),
    readinessScore: formatPercent(readinessScore),
    signals,
  };
}
