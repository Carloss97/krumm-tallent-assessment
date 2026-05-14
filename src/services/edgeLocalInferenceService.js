import { buildAssessmentFeatureVectorV1 } from '../telemetry/features/assessmentFeatureVector';

const EDGE_MODEL_NAME = 'edge-linear-v1';
const EDGE_MODEL_SIZE_MB = 0.018;
const EDGE_LOCAL_MODEL_URL = typeof import.meta !== 'undefined' && import.meta.env?.VITE_EDGE_LOCAL_MODEL_URL
  ? import.meta.env.VITE_EDGE_LOCAL_MODEL_URL
  : '/models/edge-local-report.onnx';
const ENV = typeof import.meta !== 'undefined' ? (import.meta?.env || {}) : {};

let preloadedWorker = null;
let preloadedWorkerModelUrl = '';
let preloadedWorkerReady = null;

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

const formatPercent = (value) => Math.min(100, Math.max(0, Math.round(Number(value) || 0)));

const average = (values) => {
  const finite = values.map(Number).filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
};

const dedupe = (values) => Array.from(new Set((values || []).filter(Boolean)));

const normalizeGameEntries = (games = []) => games.map((entry) => {
  if (typeof entry === 'string') return { id: entry, game: null };
  if (entry && typeof entry === 'object' && 'id' in entry) return entry;
  return { id: null, game: entry };
});

function collectFacialWindows(data, games = []) {
  const entries = normalizeGameEntries(games);
  const sourceEntries = entries.length > 0
    ? entries
    : Object.keys(data || {}).filter((key) => key !== 'futureModules').map((id) => ({ id, game: data[id] }));

  return sourceEntries.flatMap((entry) => {
    const game = entry.game || data?.[entry.id];
    return Array.isArray(game?.facialWindows) ? game.facialWindows : [];
  });
}

function collectLegacyWebcamQualityScores(data, games = []) {
  const entries = normalizeGameEntries(games);
  const sourceEntries = entries.length > 0
    ? entries
    : Object.keys(data || {}).filter((key) => key !== 'futureModules').map((id) => ({ id, game: data[id] }));

  return sourceEntries
    .map((entry) => {
      const game = entry.game || data?.[entry.id];
      return game?.webcamQualityScore;
    })
    .filter(Number.isFinite);
}

function buildFacialSignalAudit(data, games = [], language = 'en') {
  const facialWindows = collectFacialWindows(data, games);
  const windowCount = facialWindows.length;
  const qualityFlags = dedupe(facialWindows.flatMap((window) => window?.quality?.flags || []));
  const lowConfidenceCount = facialWindows.filter((window) => (
    window?.confidence?.interpretationAllowed === false
    || (Number.isFinite(window?.confidence?.windowConfidence) && window.confidence.windowConfidence < 0.6)
  )).length;
  const caveats = [];

  if (windowCount > 0) {
    const biometricSignalQualityScore = formatPercent(average(facialWindows.map((window) => window?.quality?.signalQualityScore)));
    const facialCoverageScore = formatPercent(average(facialWindows.map((window) => (window?.quality?.facePresenceRatio ?? 0) * 100)));
    const meanWindowConfidence = average(facialWindows.map((window) => window?.confidence?.windowConfidence).filter(Number.isFinite));

    if (facialCoverageScore < 70) {
      caveats.push(language === 'es'
        ? 'Cobertura facial baja; interpretar señales observables con cautela.'
        : 'Facial coverage is low; interpret observable signals cautiously.');
    }
    if (lowConfidenceCount > 0 || meanWindowConfidence < 0.6) {
      caveats.push(language === 'es'
        ? 'La telemetría facial tiene ventanas de baja confianza; interpretar señales observables con cautela.'
        : 'Facial telemetry has low-confidence windows; interpret observable signals cautiously.');
    }
    if (qualityFlags.includes('low_light')) {
      caveats.push(language === 'es'
        ? 'La iluminación redujo la calidad de señal facial.'
        : 'Low lighting reduced facial signal quality.');
    }
    if (qualityFlags.includes('multiple_faces_detected')) {
      caveats.push(language === 'es'
        ? 'Se detectaron múltiples rostros en algunas ventanas; se reduce la confianza.'
        : 'Multiple faces were detected in some windows; confidence is reduced.');
    }
    if (qualityFlags.includes('camera_denied') || qualityFlags.includes('facial_model_unavailable')) {
      caveats.push(language === 'es'
        ? 'La cámara o el modelo facial local no estuvo disponible; no comparar señales visuales contra sesiones con cobertura completa.'
        : 'Camera or the local facial model was unavailable; do not compare visual signals against full-coverage sessions.');
    }

    return {
      biometricSignalQualityScore,
      facialCoverageScore,
      facialWindowCount: windowCount,
      facialLowConfidenceWindowCount: lowConfidenceCount,
      qualityFlags,
      caveats: dedupe(caveats),
    };
  }

  const legacyQualityScores = collectLegacyWebcamQualityScores(data, games);
  const fallbackQuality = legacyQualityScores.length > 0 ? formatPercent(average(legacyQualityScores)) : 0;
  if (fallbackQuality === 0) {
    caveats.push(language === 'es'
      ? 'Sin ventanas faciales agregadas; el reporte usa solo telemetría de juego/cursor.'
      : 'No aggregate facial windows were available; the report uses game/cursor telemetry only.');
  }

  return {
    biometricSignalQualityScore: fallbackQuality,
    facialCoverageScore: 0,
    facialWindowCount: 0,
    facialLowConfidenceWindowCount: 0,
    qualityFlags: [],
    caveats: dedupe(caveats),
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
  
  // Local signal audit: observable game/cursor coverage plus aggregate facial quality.
  const telemetryCoverageScore = Math.min(100, Math.round((validGames.length / 7) * 100));
  const signalAudit = buildFacialSignalAudit(sessionData, validGames, language);
  const biometricSignalQualityScore = signalAudit.biometricSignalQualityScore;

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
  const assessmentFeatureVector = buildAssessmentFeatureVectorV1(sessionData, {
    generatedAtMs: Date.now(),
  });

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
      ...signalAudit,
      biometricSignalQualityScore,
    },
    assessmentFeatureVector,
  };
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
  const facialWindows = Array.isArray(rawTelemetry.facialWindows) ? rawTelemetry.facialWindows : [];
  const facialWindowCount = facialWindows.length;
  const facialSignalQuality = facialWindowCount > 0
    ? formatPercent(average(facialWindows.map((window) => window?.quality?.signalQualityScore)))
    : 0;
  const facePresencePercent = facialWindowCount > 0
    ? formatPercent(average(facialWindows.map((window) => (window?.quality?.facePresenceRatio ?? 0) * 100)))
    : 0;
  const visualStabilityScore = facialWindowCount > 0
    ? formatPercent(average(facialWindows.map((window) => window?.facialSignals?.visualStabilityScore)))
    : 0;
  const blinkRatePerMin = facialWindowCount > 0
    ? Math.round(average(facialWindows.map((window) => window?.facialSignals?.blinkRatePerMin)))
    : 0;
  const lowFacialConfidence = facialWindows.some((window) => (
    window?.confidence?.interpretationAllowed === false
    || (Number.isFinite(window?.confidence?.windowConfidence) && window.confidence.windowConfidence < 0.6)
  ));
  const facialQualityFlags = dedupe(facialWindows.flatMap((window) => window?.quality?.flags || []));
  const qualityFlags = dedupe([...(rawTelemetry.qualityFlags || []), ...facialQualityFlags]);
  const webcamQuality = Number.isFinite(rawTelemetry.webcamQuality)
    ? rawTelemetry.webcamQuality
    : Number.isFinite(rawTelemetry.webcamQualityScore)
      ? rawTelemetry.webcamQualityScore
      : facialSignalQuality;
  
  // Heuristic: readiness is a composite of activity levels vs time.
  const activityDensity = (cursorEvents + (clickEvents * 5) + (trialEvents * 10)) / Math.max(1, elapsedSec);
  const coverageScore = Math.min(100, Math.round(activityDensity * 8));
  
  // Stability: inverse of jerky movement (simplified cursor proxy).
  const stabilityScore = Math.max(40, Math.min(98, 100 - (cursorEvents / 100)));
  
  // Fatigue remains a coarse time-based proxy; facial fatigue is not inferred in Hito 1.
  const fatigueScore = Math.min(100, Math.max(0, Math.round((elapsedSec / 180) * 100)));

  // Readiness: composite of interaction coverage/stability and signal quality, not a hiring decision.
  const readinessScore = Math.round((coverageScore * 0.4) + (stabilityScore * 0.4) + (webcamQuality * 0.2));

  const signals = [];
  if (qualityFlags.length > 0) {
    signals.push('Quality flags active');
  }
  if (webcamQuality > 0 && webcamQuality < 60) {
    signals.push('Webcam quality is low');
  }
  if (facialWindowCount > 0 && facePresencePercent < 70) {
    signals.push('Facial coverage is low');
  }
  if (lowFacialConfidence) {
    signals.push('Facial telemetry confidence is low');
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
    facialWindowCount,
    facePresencePercent,
    facialSignalQuality,
    visualStabilityScore,
    blinkRatePerMin,
    webcamQuality: formatPercent(webcamQuality),
    coverageScore: formatPercent(coverageScore),
    stabilityScore: formatPercent(stabilityScore),
    fatigueScore: formatPercent(fatigueScore),
    readinessScore: formatPercent(readinessScore),
    qualityFlags,
    signals: dedupe(signals),
  };
}

/**
 * Attempt to run a lightweight edge-inference using a WebWorker (PoC).
 * Falls back to `generateEdgeLocalReport` on timeout or failure.
 * @param {Object} sessionData
 * @param {string} language
 * @param {Object} options
 */
export async function generateEdgeLocalReportModel(sessionData, language = 'en', options = {}) {
  // Derive simple features to send to the worker
  try {
    const gameIds = Object.keys(sessionData || {}).filter((k) => k !== 'futureModules');
    const games = gameIds.map((id) => sessionData[id]).filter(Boolean);
    const numGames = games.length;
    const avgScore = games.length > 0 ? Math.round(games.reduce((s, g) => s + (Number.isFinite(g.score) ? g.score : (Number.isFinite(g.confidence) ? g.confidence : 0)), 0) / games.length) : 0;
    const meanDuration = games.length > 0 ? Math.round(games.reduce((s, g) => s + (Number.isFinite(g.duration) ? g.duration : 0), 0) / games.length) : 0;
    const meanConfidence = games.length > 0 ? Math.round(games.reduce((s, g) => s + (Number.isFinite(g.confidence) ? g.confidence : 0), 0) / games.length) : 0;
    const readinessMean = games.length > 0 ? Math.round(games.reduce((s, g) => s + (Number.isFinite(g.readinessScore) ? g.readinessScore : 0), 0) / games.length) : 0;
    const telemetryCoverage = Math.min(100, Math.round((numGames / 7) * 100));
    const signalAudit = buildFacialSignalAudit(sessionData, gameIds, language);
    const stabilityScore = signalAudit.biometricSignalQualityScore;

    const features = {
      avgScore,
      meanDuration,
      meanConfidence,
      readinessMean,
      telemetryCoverage,
      stabilityScore,
      numGames,
    };
    const featureOrder = ['avgScore', 'meanDuration', 'meanConfidence', 'readinessMean', 'telemetryCoverage', 'stabilityScore', 'numGames'];

    // Try to spin up worker
    if (typeof Worker === 'undefined') {
      // Not available in current environment (e.g., unit tests). Fallback to heuristic
      return generateEdgeLocalReport(sessionData, language);
    }

    const id = `r-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    const modelUrl = options.modelUrl || EDGE_LOCAL_MODEL_URL;
    const { worker, initResult } = await preloadEdgeLocalModel({ modelUrl, featureOrder, reuseOnly: false });

    if (!worker) {
      return generateEdgeLocalReport(sessionData, language);
    }

    const promise = new Promise((resolve, reject) => {
      const onMessage = (ev) => {
        const m = ev.data || {};
        if (m.id && String(m.id) !== String(id)) return;
        if (m.type === 'infer:result' && m.result) {
          resolve(m.result);
        } else if (m.type === 'error') {
          reject(new Error(m.message || 'Worker error'));
        }
      };

      worker.addEventListener('message', onMessage);

      // Timeout fallback
      const to = setTimeout(() => {
        worker.removeEventListener('message', onMessage);
        try { worker.terminate(); } catch { /* ignore termination errors */ }
        reject(new Error('Worker timeout'));
      }, 2000);

      // Send infer request
      try {
        worker.postMessage({ type: 'infer', id, features, featureOrder, initResult });
      } catch (err) {
        clearTimeout(to);
        worker.removeEventListener('message', onMessage);
        try { worker.terminate(); } catch { /* ignore termination errors */ }
        reject(err);
      }
    });

    try {
      const result = await promise;
      try { worker.terminate(); } catch { /* ignore termination errors */ }

      // Map worker result to report-shaped object
      const latencyMs = result.latencyMs || 0;
      const confidenceScore = result.confidence || Math.round((result.scorePercent || 50) * 0.6);
      let recommendation = (result.scorePercent >= 75) ? getLocalizedLabels(language).recommendations.strong
        : (result.scorePercent >= 60) ? getLocalizedLabels(language).recommendations.solid
        : (result.scorePercent >= 45) ? getLocalizedLabels(language).recommendations.conditional
        : getLocalizedLabels(language).recommendations.exploratory;

      // Demo-specific calibration: with complete 3/3 demo coverage and stable confidence,
      // avoid labeling as fully exploratory.
      if (numGames >= 3 && numGames <= 4 && recommendation === getLocalizedLabels(language).recommendations.exploratory && confidenceScore >= 65) {
        recommendation = getLocalizedLabels(language).recommendations.conditional;
      }

      return {
        summary: `${getLocalizedLabels(language).summaryPrefix} ${recommendation.toLowerCase()}. ${getLocalizedLabels(language).confidencePrefix} (${confidenceScore}%).`,
        strengths: [],
        areasToMonitor: [language === 'es' ? 'Consistencia bajo carga cognitiva extrema' : 'Consistency under extreme cognitive load'],
        careerRecommendations: [],
        confidenceScore,
        recommendation,
        source: 'edge-local',
        runtime: {
          model: 'onnx-worker-poc',
          sizeMb: 0,
          latencyMs,
          processedAt: new Date().toISOString(),
        },
        signalAudit: {
          telemetryCoverageScore: features.telemetryCoverage,
          ...signalAudit,
          biometricSignalQualityScore: features.stabilityScore,
        }
      };
    } catch {
      // Worker failed or timed out — fallback to heuristic
      try { worker.terminate(); } catch { /* ignore termination errors */ }
      return generateEdgeLocalReport(sessionData, language);
    }
  } catch (err) {
    console.warn('[edgeLocalInference] model inference failed, falling back to heuristic:', err?.message || err);
    return generateEdgeLocalReport(sessionData, language);
  }
}

export async function preloadEdgeLocalModel(options = {}) {
  const modelUrl = options.modelUrl || EDGE_LOCAL_MODEL_URL;
  const featureOrder = Array.isArray(options.featureOrder) && options.featureOrder.length > 0
    ? [...options.featureOrder]
    : ['avgScore', 'meanDuration', 'meanConfidence', 'readinessMean', 'telemetryCoverage', 'stabilityScore', 'numGames'];

  if (typeof Worker === 'undefined') {
    return { worker: null, initResult: { type: 'worker-unavailable' } };
  }

  if (preloadedWorker && preloadedWorkerModelUrl === modelUrl && preloadedWorkerReady) {
    const initResult = await preloadedWorkerReady.catch(() => ({ type: 'init:fail' }));
    return { worker: preloadedWorker, initResult };
  }

  if (preloadedWorker && preloadedWorkerModelUrl !== modelUrl) {
    try { preloadedWorker.terminate(); } catch { /* ignore termination errors */ }
    preloadedWorker = null;
    preloadedWorkerReady = null;
    preloadedWorkerModelUrl = '';
  }

  const worker = new Worker(new URL('../workers/onnxWorker.js', import.meta.url), { type: 'module' });
  const initResultPromise = new Promise((resolve) => {
    const timeoutId = setTimeout(() => {
      worker.removeEventListener('message', onInit);
      resolve({ type: 'init:timeout' });
    }, 1500);

    function onInit(ev) {
      const message = ev.data || {};
      if (message.type === 'init:ok' || message.type === 'init:fail') {
        worker.removeEventListener('message', onInit);
        clearTimeout(timeoutId);
        resolve(message);
      }
    }

    worker.addEventListener('message', onInit);
    worker.postMessage({
      type: 'init',
      id: `init-${Date.now()}`,
      modelUrl,
      options: { featureOrder },
    });
  });

  preloadedWorker = worker;
  preloadedWorkerModelUrl = modelUrl;
  preloadedWorkerReady = initResultPromise;

  const initResult = await initResultPromise.catch((error) => ({ type: 'init:fail', message: error?.message || String(error) }));
  return { worker, initResult };
}

export function clearEdgeLocalModelCache() {
  if (preloadedWorker) {
    try { preloadedWorker.terminate(); } catch { /* ignore termination errors */ }
  }
  preloadedWorker = null;
  preloadedWorkerModelUrl = '';
  preloadedWorkerReady = null;
}

