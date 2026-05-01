const EDGE_MODEL_NAME = 'edge-linear-v1';
const EDGE_MODEL_SIZE_MB = 0.018;
const ENV = typeof import.meta !== 'undefined' ? (import.meta?.env || {}) : {};

const EDGE_CALIBRATION_REGISTRY = {
  stableVersion: '2026-03-27.v1-stable',
  activeVersion: '2026-03-27.v2-calibrated',
  versions: {
    '2026-03-27.v1-stable': {
      fitWeights: {
        executionControl: 0.24,
        adaptability: 0.2,
        attentionStability: 0.18,
        decisionQuality: 0.22,
        learningVelocity: 0.16,
      },
      thresholds: {
        strong: 78,
        solid: 62,
        conditional: 46,
      },
      cohorts: {
        general: {
          dimensionMultiplier: {
            executionControl: 1,
            adaptability: 1,
            attentionStability: 1,
            decisionQuality: 1,
            learningVelocity: 1,
          },
          confidenceBias: 0,
        },
        operations: {
          dimensionMultiplier: {
            executionControl: 1.06,
            adaptability: 0.98,
            attentionStability: 1.08,
            decisionQuality: 1.05,
            learningVelocity: 0.97,
          },
          confidenceBias: 1,
        },
        tech: {
          dimensionMultiplier: {
            executionControl: 0.98,
            adaptability: 1.08,
            attentionStability: 1,
            decisionQuality: 1,
            learningVelocity: 1.07,
          },
          confidenceBias: 0,
        },
      },
    },
    '2026-03-27.v2-calibrated': {
      fitWeights: {
        executionControl: 0.22,
        adaptability: 0.23,
        attentionStability: 0.2,
        decisionQuality: 0.2,
        learningVelocity: 0.15,
      },
      thresholds: {
        strong: 76,
        solid: 60,
        conditional: 45,
      },
      cohorts: {
        general: {
          dimensionMultiplier: {
            executionControl: 1,
            adaptability: 1,
            attentionStability: 1.03,
            decisionQuality: 1,
            learningVelocity: 1.02,
          },
          confidenceBias: 1,
        },
        operations: {
          dimensionMultiplier: {
            executionControl: 1.08,
            adaptability: 0.99,
            attentionStability: 1.1,
            decisionQuality: 1.07,
            learningVelocity: 0.98,
          },
          confidenceBias: 2,
        },
        tech: {
          dimensionMultiplier: {
            executionControl: 0.97,
            adaptability: 1.1,
            attentionStability: 1.02,
            decisionQuality: 1,
            learningVelocity: 1.1,
          },
          confidenceBias: 1,
        },
      },
    },
  },
};

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, value));
}

function safeNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizedString(value) {
  return String(value || '').trim().toLowerCase();
}

function hashToUnitInterval(value) {
  const raw = String(value || 'anonymous');
  let hash = 2166136261;
  for (let i = 0; i < raw.length; i += 1) {
    hash ^= raw.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

function resolveVariant(participantId, options = {}) {
  const abEnabled = String(ENV.VITE_EDGE_AB_MODE || 'true').toLowerCase() !== 'false';
  const forced = normalizedString(ENV.VITE_EDGE_AB_FORCE_VARIANT || options.forceVariant);
  if (forced === 'control' || forced === 'calibrated') return forced;
  if (!abEnabled) return 'calibrated';

  const bucket = hashToUnitInterval(participantId || options.participantId);
  return bucket < 0.5 ? 'control' : 'calibrated';
}

function resolveCalibration(options = {}) {
  const rollbackToStable = String(ENV.VITE_EDGE_ROLLBACK_TO_STABLE || options.rollbackToStable || 'false').toLowerCase() === 'true';
  const requestedVersion = String(ENV.VITE_EDGE_CALIBRATION_VERSION || options.version || EDGE_CALIBRATION_REGISTRY.activeVersion);
  const requestedCohort = normalizedString(ENV.VITE_EDGE_COHORT || options.cohort || 'general') || 'general';
  const variant = resolveVariant(options.participantId, options);

  const stableVersion = EDGE_CALIBRATION_REGISTRY.stableVersion;
  const activeVersion = EDGE_CALIBRATION_REGISTRY.activeVersion;
  const variantVersion = variant === 'control' ? stableVersion : requestedVersion;
  const selectedVersion = rollbackToStable ? stableVersion : variantVersion;

  const versionConfig = EDGE_CALIBRATION_REGISTRY.versions[selectedVersion]
    || EDGE_CALIBRATION_REGISTRY.versions[activeVersion]
    || EDGE_CALIBRATION_REGISTRY.versions[stableVersion];
  const selectedVersionResolved = EDGE_CALIBRATION_REGISTRY.versions[selectedVersion]
    ? selectedVersion
    : (EDGE_CALIBRATION_REGISTRY.versions[activeVersion] ? activeVersion : stableVersion);

  const cohortConfig = versionConfig?.cohorts?.[requestedCohort]
    || versionConfig?.cohorts?.general
    || EDGE_CALIBRATION_REGISTRY.versions[stableVersion]?.cohorts?.general;

  return {
    variant,
    cohort: versionConfig?.cohorts?.[requestedCohort] ? requestedCohort : 'general',
    version: selectedVersionResolved,
    rollbackToStable,
    fitWeights: versionConfig.fitWeights,
    thresholds: versionConfig.thresholds,
    dimensionMultiplier: cohortConfig?.dimensionMultiplier || {
      executionControl: 1,
      adaptability: 1,
      attentionStability: 1,
      decisionQuality: 1,
      learningVelocity: 1,
    },
    confidenceBias: safeNumber(cohortConfig?.confidenceBias, 0),
  };
}

function getSessionEntry(sessionData, newId, legacyId) {
  return sessionData?.[newId] || sessionData?.[legacyId] || null;
}

function getGameEntries(sessionData) {
  return [
    getSessionEntry(sessionData, 'ospan_game_1', 'game1'),
    getSessionEntry(sessionData, 'sst_game_2', 'game2'),
    getSessionEntry(sessionData, 'tsw_game_3', 'game3'),
    getSessionEntry(sessionData, 'cpt_game_4', 'game4'),
    getSessionEntry(sessionData, 'dec_game_5', 'game5'),
    getSessionEntry(sessionData, 'rsh_game_6', 'game6'),
    getSessionEntry(sessionData, 'sjt_game_7', 'game7'),
    getSessionEntry(sessionData, 'nback_game_8', 'game8'),
    getSessionEntry(sessionData, 'tol_game_9', 'game9'),
    getSessionEntry(sessionData, 'wcst_game_10', 'game10'),
    getSessionEntry(sessionData, 'gonogo_game_11', 'game11'),
    getSessionEntry(sessionData, 'tmt_game_12', 'game12'),
    getSessionEntry(sessionData, 'corsi_game_13', 'game13'),
  ].filter(Boolean);
}

function normalizeEntry(entry) {
  const score = clamp(safeNumber(entry?.score, 0), 0, 100);
  const errors = clamp(safeNumber(entry?.errors, 0), 0, 40);
  const durationMs = clamp(safeNumber(entry?.duration, 60000), 5000, 300000);

  const errorPenalty = clamp(errors * 1.35, 0, 45);
  const speedPenalty = clamp((durationMs - 60000) / 4000, 0, 18);
  const normalized = clamp(score - errorPenalty - speedPenalty, 0, 100);

  return {
    normalized,
    score,
    errors,
    durationMs,
  };
}

function average(values) {
  if (!Array.isArray(values) || values.length === 0) return 0;
  const sum = values.reduce((acc, value) => acc + safeNumber(value, 0), 0);
  return sum / values.length;
}

function normalizeTargetBand(value, idealMin, idealMax, hardMin, hardMax) {
  const bounded = clamp(safeNumber(value, hardMin), hardMin, hardMax);
  if (bounded >= idealMin && bounded <= idealMax) return 100;

  const distance = bounded < idealMin
    ? idealMin - bounded
    : bounded - idealMax;
  const maxDistance = bounded < idealMin
    ? idealMin - hardMin
    : hardMax - idealMax;

  if (maxDistance <= 0) return 0;
  return clamp(100 - ((distance / maxDistance) * 100), 0, 100);
}

function extractTelemetryBiometricFeatures(rawEntries) {
  const telemetry = rawEntries.reduce((acc, entry) => {
    const cursorEvents = entry?.mouseMovements?.length || 0;
    const clickEvents = entry?.clicks?.length || 0;
    const trialEvents = entry?.trialEvents?.length || 0;
    const webcamFrames = entry?.webcamFrames?.length || 0;

    acc.cursorEvents += cursorEvents;
    acc.clickEvents += clickEvents;
    acc.trialEvents += trialEvents;
    acc.webcamFrames += webcamFrames;
    acc.qualityFlags += entry?.qualityFlags?.length || 0;
    acc.hesitationValues.push(entry?.cursorMetrics?.hesitationCount);
    acc.cursorVelocityValues.push(entry?.cursorMetrics?.avgVelocity);
    acc.webcamQualityValues.push(entry?.webcamQualityScore);

    if (entry?.consentSnapshot?.cursor === true) {
      acc.cursorConsentGames += 1;
    }
    if (entry?.consentSnapshot?.webcam === true) {
      acc.webcamConsentGames += 1;
    }

    if (Array.isArray(entry?.webcamFrames) && entry.webcamFrames.length > 0) {
      const faceFrames = entry.webcamFrames.filter((frame) => frame?.faceDetected === true).length;
      const blinkFrames = entry.webcamFrames.filter((frame) => frame?.blinkDetected === true).length;
      acc.facePresenceRatios.push(faceFrames / entry.webcamFrames.length);

      const blinkRateEstimate = (blinkFrames / Math.max(entry.webcamFrames.length, 1)) * 1800;
      acc.blinkRateValues.push(blinkRateEstimate);

      const driftValues = entry.webcamFrames
        .map((frame) => {
          const yaw = Math.abs(safeNumber(frame?.headPose?.yaw, 0));
          const pitch = Math.abs(safeNumber(frame?.headPose?.pitch, 0));
          return yaw + pitch;
        })
        .filter((value) => Number.isFinite(value));

      if (driftValues.length > 0) {
        acc.headPoseDriftValues.push(average(driftValues));
      }
    }

    return acc;
  }, {
    cursorEvents: 0,
    clickEvents: 0,
    trialEvents: 0,
    webcamFrames: 0,
    qualityFlags: 0,
    cursorConsentGames: 0,
    webcamConsentGames: 0,
    hesitationValues: [],
    cursorVelocityValues: [],
    webcamQualityValues: [],
    facePresenceRatios: [],
    blinkRateValues: [],
    headPoseDriftValues: [],
  });

  const gamesCount = Math.max(rawEntries.length, 1);
  const avgHesitationCount = average(telemetry.hesitationValues);
  const avgCursorVelocity = average(telemetry.cursorVelocityValues);
  const avgWebcamQuality = average(telemetry.webcamQualityValues);
  const facePresenceRatio = average(telemetry.facePresenceRatios);
  const avgBlinkRate = average(telemetry.blinkRateValues);
  const avgHeadPoseDrift = average(telemetry.headPoseDriftValues);

  const cursorTelemetryDensity = telemetry.trialEvents > 0
    ? (telemetry.cursorEvents + telemetry.clickEvents) / telemetry.trialEvents
    : 0;
  const webcamDensity = telemetry.trialEvents > 0
    ? telemetry.webcamFrames / telemetry.trialEvents
    : 0;

  const cursorCoverageScore = clamp(cursorTelemetryDensity * 24, 0, 100);
  const webcamCoverageScore = clamp(webcamDensity * 38, 0, 100);
  const hesitationStabilityScore = clamp(100 - (avgHesitationCount * 3.2), 0, 100);
  const cursorVelocityQualityScore = normalizeTargetBand(avgCursorVelocity, 350, 1300, 50, 2200);
  const webcamQualityScore = clamp(avgWebcamQuality, 0, 100);
  const facePresenceScore = clamp(facePresenceRatio * 100, 0, 100);
  const blinkStabilityScore = normalizeTargetBand(avgBlinkRate, 8, 28, 0, 60);
  const poseStabilityScore = clamp(100 - (avgHeadPoseDrift * 2.1), 0, 100);

  const signalQualityScore = clamp(
    (cursorVelocityQualityScore * 0.2)
    + (hesitationStabilityScore * 0.2)
    + (webcamQualityScore * 0.18)
    + (facePresenceScore * 0.16)
    + (blinkStabilityScore * 0.12)
    + (poseStabilityScore * 0.14),
    0,
    100
  );

  const coverageScore = clamp(
    (cursorCoverageScore * 0.48)
    + (webcamCoverageScore * 0.34)
    + (((telemetry.cursorConsentGames / gamesCount) * 100) * 0.1)
    + (((telemetry.webcamConsentGames / gamesCount) * 100) * 0.08),
    0,
    100
  );

  return {
    cursorEvents: telemetry.cursorEvents,
    clickEvents: telemetry.clickEvents,
    trialEvents: telemetry.trialEvents,
    webcamFrames: telemetry.webcamFrames,
    qualityFlags: telemetry.qualityFlags,
    avgHesitationCount,
    avgCursorVelocity,
    avgWebcamQuality,
    facePresenceRatio,
    avgBlinkRate,
    avgHeadPoseDrift,
    cursorConsentCoverage: (telemetry.cursorConsentGames / gamesCount) * 100,
    webcamConsentCoverage: (telemetry.webcamConsentGames / gamesCount) * 100,
    cursorCoverageScore,
    webcamCoverageScore,
    hesitationStabilityScore,
    cursorVelocityQualityScore,
    webcamQualityScore,
    facePresenceScore,
    blinkStabilityScore,
    poseStabilityScore,
    signalQualityScore,
    coverageScore,
  };
}

function computeRuntimeMetrics(startTime, entriesCount) {
  const endTime = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  const latencyMs = Math.round((endTime - startTime) * 100) / 100;

  const heapBytes = typeof performance !== 'undefined' && performance.memory
    ? safeNumber(performance.memory.usedJSHeapSize, 0)
    : 0;

  const estimatedMemoryMb = heapBytes > 0
    ? Math.round((heapBytes / (1024 * 1024)) * 100) / 100
    : Math.round((28 + (entriesCount * 1.2)) * 100) / 100;

  return {
    latencyMs,
    estimatedMemoryMb,
    modelSizeMb: EDGE_MODEL_SIZE_MB,
    runtime: 'js',
  };
}

function recommendationFromScore(score, thresholds) {
  const strong = safeNumber(thresholds?.strong, 78);
  const solid = safeNumber(thresholds?.solid, 62);
  const conditional = safeNumber(thresholds?.conditional, 46);

  if (score >= strong) return 'STRONG ALIGNMENT';
  if (score >= solid) return 'SOLID ALIGNMENT WITH COACHING';
  if (score >= conditional) return 'CONDITIONAL ALIGNMENT';
  return 'EXPLORATORY FIT - NEEDS MORE DATA';
}

function topAndBottomDimensions(dimensions) {
  const ordered = Object.entries(dimensions).sort(([, a], [, b]) => b - a);
  return {
    top: ordered.slice(0, 2),
    watch: ordered.slice(-2).reverse(),
  };
}

function localizedLabels(isEn) {
  if (isEn) {
    return {
      summaryPrefix: 'Edge-local assessment indicates',
      confidencePrefix: 'confidence calibrated from local signal stability',
      strengths: {
        executionControl: 'execution control under pressure',
        adaptability: 'adaptability to changing rules',
        attentionStability: 'sustained attention stability',
        decisionQuality: 'decision quality with limited time',
        learningVelocity: 'learning velocity across tasks',
      },
      areas: {
        executionControl: 'stabilize execution consistency during high-cognitive load blocks',
        adaptability: 'train faster adaptation when task conditions shift',
        attentionStability: 'reinforce sustained attention in repetitive sequences',
        decisionQuality: 'improve trade-off calibration between speed and accuracy',
        learningVelocity: 'increase transfer speed after feedback and rule updates',
      },
      evidenceInterpretationHigh: 'signal above target baseline',
      evidenceInterpretationMid: 'signal within expected baseline band',
      evidenceInterpretationLow: 'signal below target baseline',
      career: [
        {
          role: 'Operations Coordinator / Team Lead',
          fit: 'Consistent execution and situational decision quality fit operational leadership tracks.',
        },
        {
          role: 'Customer Operations / Service Excellence',
          fit: 'Attention and response control profile supports quality-sensitive customer workflows.',
        },
        {
          role: 'Junior Analyst / Process Improvement',
          fit: 'Adaptability and learning velocity indicate fit for structured analytical growth paths.',
        },
      ],
    };
  }

  return {
    summaryPrefix: 'La evaluacion edge-local indica',
    confidencePrefix: 'confianza calibrada por estabilidad de senales locales',
    strengths: {
      executionControl: 'control de ejecucion bajo presion',
      adaptability: 'adaptabilidad ante cambios de reglas',
      attentionStability: 'estabilidad de atencion sostenida',
      decisionQuality: 'calidad de decision con tiempo acotado',
      learningVelocity: 'velocidad de aprendizaje entre tareas',
    },
    areas: {
      executionControl: 'estabilizar consistencia de ejecucion en bloques de alta carga cognitiva',
      adaptability: 'entrenar adaptacion mas rapida cuando cambian las condiciones',
      attentionStability: 'reforzar atencion sostenida en secuencias repetitivas',
      decisionQuality: 'mejorar calibracion entre velocidad y precision',
      learningVelocity: 'aumentar velocidad de transferencia tras feedback y cambios de regla',
    },
    evidenceInterpretationHigh: 'senal por sobre la linea base objetivo',
    evidenceInterpretationMid: 'senal en banda esperada de linea base',
    evidenceInterpretationLow: 'senal por debajo de la linea base objetivo',
    career: [
      {
        role: 'Coordinacion Operativa / Liderazgo de Equipo',
        fit: 'Ejecucion consistente y calidad de decision situacional alinean con rutas de liderazgo operativo.',
      },
      {
        role: 'Operaciones de Cliente / Excelencia de Servicio',
        fit: 'Perfil de atencion y control de respuesta favorece flujos sensibles a calidad de servicio.',
      },
      {
        role: 'Analista Junior / Mejora de Procesos',
        fit: 'Adaptabilidad y velocidad de aprendizaje sugieren encaje para crecimiento analitico estructurado.',
      },
    ],
  };
}

function buildEvidence(dimensions, labels) {
  return Object.entries(dimensions).map(([metric, value]) => {
    let interpretation = labels.evidenceInterpretationLow;
    if (value >= 70) interpretation = labels.evidenceInterpretationHigh;
    else if (value >= 50) interpretation = labels.evidenceInterpretationMid;

    return {
      metric,
      value: Math.round(value),
      interpretation,
    };
  });
}

export function generateEdgeLocalReport(sessionData, language = 'en', options = {}) {
  const isEn = language === 'en';
  const labels = localizedLabels(isEn);
  const startTime = typeof performance !== 'undefined' && typeof performance.now === 'function'
    ? performance.now()
    : Date.now();
  const calibration = resolveCalibration(options);

  const rawEntries = getGameEntries(sessionData);
  const entries = rawEntries.map(normalizeEntry);
  const entriesCount = entries.length;

  if (!entriesCount) {
    return null;
  }

  const avgNormalized = entries.reduce((acc, entry) => acc + entry.normalized, 0) / entriesCount;
  const avgErrors = entries.reduce((acc, entry) => acc + entry.errors, 0) / entriesCount;
  const avgDuration = entries.reduce((acc, entry) => acc + entry.durationMs, 0) / entriesCount;
  const telemetry = extractTelemetryBiometricFeatures(rawEntries);

  const executionFromTelemetry = clamp(
    (telemetry.hesitationStabilityScore * 0.55)
    + (telemetry.cursorVelocityQualityScore * 0.45),
    0,
    100
  );
  const attentionFromTelemetry = clamp(
    (telemetry.webcamQualityScore * 0.35)
    + (telemetry.facePresenceScore * 0.3)
    + (telemetry.blinkStabilityScore * 0.15)
    + (telemetry.poseStabilityScore * 0.2),
    0,
    100
  );
  const telemetryReliability = clamp(
    (telemetry.coverageScore * 0.5)
    + (telemetry.signalQualityScore * 0.5),
    0,
    100
  );

  const baseDimensions = {
    executionControl: clamp((avgNormalized * 0.5) + ((100 - avgErrors * 2.2) * 0.2) + (executionFromTelemetry * 0.3), 0, 100),
    adaptability: clamp((avgNormalized * 0.52) + ((110 - avgDuration / 1200) * 0.28) + (telemetry.coverageScore * 0.2), 0, 100),
    attentionStability: clamp((avgNormalized * 0.42) + ((100 - avgErrors * 1.8) * 0.15) + (attentionFromTelemetry * 0.43), 0, 100),
    decisionQuality: clamp((avgNormalized * 0.56) + ((100 - avgErrors * 1.3) * 0.24) + (telemetry.signalQualityScore * 0.2), 0, 100),
    learningVelocity: clamp((avgNormalized * 0.48) + ((105 - avgDuration / 1300) * 0.22) + (telemetryReliability * 0.3), 0, 100),
  };

  const dimensions = {
    executionControl: clamp(baseDimensions.executionControl * safeNumber(calibration.dimensionMultiplier.executionControl, 1), 0, 100),
    adaptability: clamp(baseDimensions.adaptability * safeNumber(calibration.dimensionMultiplier.adaptability, 1), 0, 100),
    attentionStability: clamp(baseDimensions.attentionStability * safeNumber(calibration.dimensionMultiplier.attentionStability, 1), 0, 100),
    decisionQuality: clamp(baseDimensions.decisionQuality * safeNumber(calibration.dimensionMultiplier.decisionQuality, 1), 0, 100),
    learningVelocity: clamp(baseDimensions.learningVelocity * safeNumber(calibration.dimensionMultiplier.learningVelocity, 1), 0, 100),
  };

  const fitWeights = calibration.fitWeights || EDGE_CALIBRATION_REGISTRY.versions[EDGE_CALIBRATION_REGISTRY.stableVersion].fitWeights;

  const fitScore = clamp(
    (dimensions.executionControl * safeNumber(fitWeights.executionControl, 0.24))
    + (dimensions.adaptability * safeNumber(fitWeights.adaptability, 0.2))
    + (dimensions.attentionStability * safeNumber(fitWeights.attentionStability, 0.18))
    + (dimensions.decisionQuality * safeNumber(fitWeights.decisionQuality, 0.22))
    + (dimensions.learningVelocity * safeNumber(fitWeights.learningVelocity, 0.16)),
    0,
    100
  );

  const confidenceScore = Math.round(clamp(
    54
    + (entriesCount * 1.15)
    + ((fitScore - 50) * 0.16)
    + (telemetry.coverageScore * 0.08)
    + (telemetry.signalQualityScore * 0.05)
    + calibration.confidenceBias
    - (telemetry.qualityFlags * 0.8),
    58,
    92
  ));
  const recommendation = recommendationFromScore(fitScore, calibration.thresholds);

  const buckets = topAndBottomDimensions(dimensions);
  const strengths = buckets.top.map(([metric]) => {
    const label = labels.strengths[metric] || metric;
    return isEn ? `Strong ${label}` : `Fortaleza en ${label}`;
  });

  const areasToMonitor = buckets.watch.map(([metric]) => labels.areas[metric] || metric);

  const runtime = computeRuntimeMetrics(startTime, entriesCount);
  const evidence = [
    ...buildEvidence(dimensions, labels),
    {
      metric: 'telemetry_coverage',
      value: Math.round(telemetry.coverageScore),
      interpretation: telemetry.coverageScore >= 70
        ? labels.evidenceInterpretationHigh
        : telemetry.coverageScore >= 45
          ? labels.evidenceInterpretationMid
          : labels.evidenceInterpretationLow,
    },
    {
      metric: 'biometric_signal_quality',
      value: Math.round(telemetry.signalQualityScore),
      interpretation: telemetry.signalQualityScore >= 70
        ? labels.evidenceInterpretationHigh
        : telemetry.signalQualityScore >= 45
          ? labels.evidenceInterpretationMid
          : labels.evidenceInterpretationLow,
    },
    {
      metric: 'webcam_quality_mean',
      value: Math.round(telemetry.avgWebcamQuality),
      interpretation: telemetry.avgWebcamQuality >= 60
        ? labels.evidenceInterpretationHigh
        : labels.evidenceInterpretationLow,
    },
  ];

  const summary = isEn
    ? `${labels.summaryPrefix} a ${recommendation.toLowerCase()} profile with ${Math.round(fitScore)} / 100 composite fit and ${labels.confidencePrefix} (${confidenceScore}%).`
    : `${labels.summaryPrefix} un perfil ${recommendation.toLowerCase()} con ajuste compuesto de ${Math.round(fitScore)} / 100 y ${labels.confidencePrefix} (${confidenceScore}%).`;

  return {
    summary,
    strengths,
    areasToMonitor,
    careerRecommendations: labels.career,
    confidenceScore,
    recommendation,
    source: 'edge-local',
    evidence,
    runtime,
    signalAudit: {
      telemetryCoverageScore: Math.round(telemetry.coverageScore),
      biometricSignalQualityScore: Math.round(telemetry.signalQualityScore),
      cursorConsentCoverage: Math.round(telemetry.cursorConsentCoverage),
      webcamConsentCoverage: Math.round(telemetry.webcamConsentCoverage),
      cursorEvents: telemetry.cursorEvents,
      clickEvents: telemetry.clickEvents,
      trialEvents: telemetry.trialEvents,
      webcamFrames: telemetry.webcamFrames,
      qualityFlags: telemetry.qualityFlags,
      avgCursorVelocity: Math.round(telemetry.avgCursorVelocity),
      avgWebcamQuality: Math.round(telemetry.avgWebcamQuality),
      facePresenceRatio: Math.round(telemetry.facePresenceRatio * 100),
      avgBlinkRate: Math.round(telemetry.avgBlinkRate),
      avgHeadPoseDrift: Math.round(telemetry.avgHeadPoseDrift),
    },
    model: {
      name: EDGE_MODEL_NAME,
      version: `1.2.0-${calibration.version}`,
      inference: 'local-client',
      sendsRawVideo: false,
      calibrationVersion: calibration.version,
      calibrationCohort: calibration.cohort,
      calibrationVariant: calibration.variant,
      rollbackToStable: calibration.rollbackToStable,
    },
    generatedAt: new Date().toISOString(),
  };
}

export function checkEdgeLocalHealth(sessionData) {
  const report = generateEdgeLocalReport(sessionData || {}, 'en', {});
  if (!report) {
    return {
      ok: false,
      code: 'NO_INPUT',
      message: 'No local assessment signals available for edge inference.',
      model: EDGE_MODEL_NAME,
    };
  }

  return {
    ok: true,
    code: 'OK',
    message: 'Edge-local inference pipeline is ready.',
    model: EDGE_MODEL_NAME,
    runtime: report.runtime,
  };
}

export function getEdgeCalibrationStatus(options = {}) {
  const calibration = resolveCalibration(options);
  return {
    ...calibration,
    registry: {
      stableVersion: EDGE_CALIBRATION_REGISTRY.stableVersion,
      activeVersion: EDGE_CALIBRATION_REGISTRY.activeVersion,
      availableVersions: Object.keys(EDGE_CALIBRATION_REGISTRY.versions),
    },
  };
}

function formatPercent(value) {
  return Math.round(clamp(safeNumber(value, 0), 0, 100));
}

export function buildEdgeLocalLiveInsight(currentTelemetry = {}, options = {}) {
  if (!currentTelemetry || !currentTelemetry.startTime) {
    return null;
  }

  const elapsedSec = Math.max(1, Math.round((Date.now() - currentTelemetry.startTime) / 1000));
  const cursorEvents = currentTelemetry.mouseMovements?.length || 0;
  const clickEvents = currentTelemetry.clicks?.length || 0;
  const trialEvents = currentTelemetry.trialEvents?.length || 0;
  const webcamFrames = currentTelemetry.webcamFrames?.length || 0;
  const qualityFlags = currentTelemetry.qualityFlags?.length || 0;
  const hesitationCount = currentTelemetry.cursorMetrics?.hesitationCount || 0;
  const avgVelocity = currentTelemetry.cursorMetrics?.avgVelocity || 0;
  const webcamQuality = Number.isFinite(currentTelemetry.webcamQualityScore) ? currentTelemetry.webcamQualityScore : 0;

  const eventDensity = (cursorEvents + clickEvents + trialEvents + webcamFrames) / elapsedSec;
  const coverageScore = clamp(eventDensity * 10, 0, 100);
  const motionQualityScore = normalizeTargetBand(avgVelocity, 250, 1300, 50, 2200);
  const stabilityScore = clamp(
    (motionQualityScore * 0.28)
    + (webcamQuality * 0.24)
    + ((100 - Math.min(hesitationCount * 3.2, 100)) * 0.3)
    + ((100 - Math.min(qualityFlags * 12, 100)) * 0.18),
    0,
    100
  );
  const fatigueScore = clamp(
    (elapsedSec * 1.5)
    + (qualityFlags * 10)
    + ((100 - webcamQuality) * 0.22)
    + (hesitationCount * 1.4),
    0,
    100
  );
  const readinessScore = clamp(
    (coverageScore * 0.32)
    + (stabilityScore * 0.44)
    + ((100 - fatigueScore) * 0.18)
    + (webcamQuality * 0.06),
    0,
    100
  );

  const signals = [];
  if (qualityFlags > 0) signals.push('Quality flags active');
  if (webcamQuality > 0 && webcamQuality < 60) signals.push('Webcam quality is low');
  if (hesitationCount > 5) signals.push('Hesitation is increasing');
  if (elapsedSec > 60 && fatigueScore > 55) signals.push('Fatigue trend is visible');

  return {
    elapsedSec,
    cursorEvents,
    clickEvents,
    trialEvents,
    webcamFrames,
    qualityFlags,
    hesitationCount,
    avgVelocity: Math.round(avgVelocity),
    webcamQuality: formatPercent(webcamQuality),
    coverageScore: formatPercent(coverageScore),
    stabilityScore: formatPercent(stabilityScore),
    fatigueScore: formatPercent(fatigueScore),
    readinessScore: formatPercent(readinessScore),
    signals,
    calibration: resolveCalibration(options),
  };
}
