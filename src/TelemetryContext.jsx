import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import {
  assertFacialWindowPrivacySafe,
  assertTelemetryPayloadPrivacySafe,
  isFacialWindow,
} from './telemetry/facial/facialTelemetrySchema';

const TelemetryContext = createContext(null);

const isDevEnv = () => typeof import.meta !== 'undefined' && import.meta.env?.DEV === true;

const resolveApiBaseUrl = () => {
  if (typeof window !== 'undefined' && typeof window.__API_BASE_URL === 'string') {
    return window.__API_BASE_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  return '';
};

const normalizeBaseUrl = (baseUrl) => baseUrl.replace(/\/$/, '');

const isSameOriginBaseUrl = (baseUrl) => {
  if (!baseUrl || typeof window === 'undefined') return false;

  try {
    const resolved = new URL(baseUrl, window.location.origin);
    return resolved.origin === window.location.origin;
  } catch {
    return false;
  }
};

const isAllowedDevHost = () => {
  if (typeof window === 'undefined') return false;
  const host = (window.location.hostname || '').toLowerCase();
  const raw = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ALLOWED_DEV_HOSTS)
    ? import.meta.env.VITE_ALLOWED_DEV_HOSTS
    : 'localhost,127.0.0.1,::1,dev.krumm.cl';
  const allowed = raw.split(',').map((item) => item.trim().toLowerCase()).filter(Boolean);
  const matchesAllowed = allowed.includes(host) || allowed.some((pattern) => {
    if (!pattern.startsWith('*.')) return false;
    return host.endsWith(pattern.replace('*.', ''));
  });
  const isLocalSuffix = host.endsWith('.local');
  const isVitePort = window.location.port === '5173';
  return matchesAllowed || isLocalSuffix || isVitePort;
};

const getRuntimeApiUrl = (path) => {
  const baseUrl = resolveApiBaseUrl();
  if (baseUrl && isSameOriginBaseUrl(baseUrl)) {
    return `${normalizeBaseUrl(baseUrl)}${path}`;
  }
  if (isDevEnv() && isAllowedDevHost()) {
    return path;
  }
  return '';
};

const clampPercent = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(100, Math.max(0, Math.round(n)));
};

const average = (values) => {
  const finite = values.map(Number).filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
};

const dedupe = (values) => Array.from(new Set((values || []).filter(Boolean)));

const LATE_FACIAL_FLUSH_WINDOW_MS = 2000;

const getFacialWindowKey = (window) => [
  window?.type || 'window',
  window?.gameId || '',
  window?.windowIndex ?? '',
  window?.startedAtMs ?? '',
  window?.endedAtMs ?? '',
].join(':');

const DIAGNOSTIC_FACIAL_WINDOW_FLAGS = new Set([
  'camera_denied',
  'facial_model_unavailable',
  'facial_capture_error',
  'performance_degraded',
]);

const hasDiagnosticFacialWindowFlag = (window) => (
  (window?.quality?.flags || []).some((flag) => DIAGNOSTIC_FACIAL_WINDOW_FLAGS.has(flag))
);

const reconcileLateFacialFlushFlags = (qualityFlags = [], facialSummary) => {
  const nextFlags = qualityFlags.filter((flag) => {
    if (flag === 'face_not_detected') return false;
    if (flag === 'insufficient_webcam_signal' && facialSummary.webcamQualityScore >= 60) return false;
    return true;
  });
  return dedupe(nextFlags);
};

const summarizeFacialWindows = (facialWindows = []) => {
  if (!Array.isArray(facialWindows) || facialWindows.length === 0) {
    return {
      webcamQualityScore: 0,
      facialCoverageScore: 0,
      facialWindowCount: 0,
      qualityFlags: [],
    };
  }

  const signalScores = facialWindows.map((window) => window?.quality?.signalQualityScore);
  const coverageScores = facialWindows.map((window) => (window?.quality?.facePresenceRatio ?? 0) * 100);
  const qualityFlags = facialWindows.flatMap((window) => window?.quality?.flags || []);

  return {
    webcamQualityScore: clampPercent(average(signalScores)),
    facialCoverageScore: clampPercent(average(coverageScores)),
    facialWindowCount: facialWindows.length,
    qualityFlags: dedupe(qualityFlags),
  };
};

const sanitizeLegacyWebcamFrame = (webcamData = {}) => {
  const qualityFlags = dedupe(webcamData.qualityFlags || webcamData.flags || []);
  const safeFrame = {
    type: 'legacy_webcam_metadata_v1',
    timestamp: Number.isFinite(webcamData.timestamp) ? webcamData.timestamp : Date.now(),
    source: webcamData.source || 'legacy_webcam_metadata',
    faceDetected: Boolean(webcamData.faceDetected ?? webcamData.facePresent),
  };

  if (Number.isFinite(webcamData.qualityScore)) {
    safeFrame.qualityScore = clampPercent(webcamData.qualityScore);
  }
  if (Number.isFinite(webcamData.detectionConfidence)) {
    safeFrame.detectionConfidence = Math.min(1, Math.max(0, Number(webcamData.detectionConfidence)));
  }
  if (Number.isFinite(webcamData.illuminationScore)) {
    safeFrame.illuminationScore = Math.min(1, Math.max(0, Number(webcamData.illuminationScore)));
  }
  if (qualityFlags.length > 0) {
    safeFrame.qualityFlags = qualityFlags;
  }

  return safeFrame;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useTelemetry = () => useContext(TelemetryContext);

/**
 * TelemetryProvider v2: Extended with cursor analytics, webcam, quality gates, and consent
 * 
 * Features:
 * - Advanced cursor tracking (position, velocity, accel, jerk, hesitation)
 * - Webcam telemetry (presencia, blink, head pose)
 * - Quality gates with fallback
 * - Granular consent management
 * - Feature flags for camera/cursor
 */
export const TelemetryProvider = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [sessionData, setSessionData] = useState({});
  const [participantProfile, setParticipantProfile] = useState(null);
  const [experimentAssignments, setExperimentAssignments] = useState({});
  const [consentState, setConsentState] = useState({
    cursor: false,
    webcam: false,
    consentTimestamp: null,
    consentVersionId: 'v2.0'
  });
  const [featureFlags, setFeatureFlags] = useState({
    enableCursorTracking: true,
    enableWebcamTracking: true,
    enableQualityGates: true,
    enableSessionHeader: true,
    enableSessionExitModal: true,
    enableGameErrorBoundary: true,
    enableEngagementPulse: true,
    // Controlled via env VITE_ENABLE_HERO_DEMO ("true" to enable)
    enableHeroDemo: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_ENABLE_HERO_DEMO === 'true') || false,
  });

  const activeTrackingRef = useRef(false);
  const currentGameIdRef = useRef(null);
  const lateFacialFlushRef = useRef({ gameId: null, expiresAtMs: 0 });
  const pendingDiagnosticFacialWindowsRef = useRef([]);
  const currentDataRef = useRef({
    mouseMovements: [],
    clicks: [],
    webcamFrames: [],
    facialWindows: [],
    trialEvents: [],
    startTime: 0,
    errors: 0,
    score: 0,
    qualityFlags: [],
    webcamQualityScore: 0,
    facialCoverageScore: 0,
    facialWindowCount: 0,
  });

  // ============================================
  // CONSENT MANAGEMENT
  // ============================================
  const setConsent = useCallback((cursorConsent, webcamConsent) => {
    setConsentState({
      cursor: cursorConsent,
      webcam: webcamConsent,
      consentTimestamp: new Date().toISOString(),
      consentVersionId: 'v2.0'
    });
  }, []);

  const getConsent = useCallback(() => consentState, [consentState]);

  // ============================================
  // FEATURE FLAGS
  // ============================================
  const setFeatureFlag = useCallback((flag, value) => {
    setFeatureFlags(prev => ({ ...prev, [flag]: value }));
  }, []);

  // Fetch runtime feature flags and apply a percentage-based rollout for hero demo.
  // Avoid calling runtime flags unless a backend is configured or we are on a dev host.
  useEffect(() => {
    const flagsUrl = getRuntimeApiUrl('/api/feature-flags');
    if (!flagsUrl) return undefined;
    let mounted = true;

    const simpleHash = (s) => {
      let h = 0;
      if (!s) return 0;
      for (let i = 0; i < s.length; i++) {
        h = (h << 5) - h + s.charCodeAt(i);
        h |= 0; // force 32bit
      }
      return Math.abs(h);
    };

    const applyRuntimeFlags = async () => {
      try {
        const res = await fetch(flagsUrl, { cache: 'no-store' });
        if (!mounted) return;
        if (!res.ok) return;
        const data = await res.json();
        if (!mounted || !data) return;

        const enableHero = !!data.enableHeroDemo;
        const percent = Number(data.heroDemoPercentage || 0) || 0;

        if (enableHero) {
          setFeatureFlags((prev) => ({ ...prev, enableHeroDemo: true }));
        } else if (percent > 0) {
          // assign based on participantId if available, otherwise random per session
          const seed = (participantProfile && participantProfile.participantId) ? participantProfile.participantId : `${Date.now()}-${Math.random()}`;
          const assigned = (simpleHash(seed) % 100) < percent;
          setFeatureFlags((prev) => ({ ...prev, enableHeroDemo: assigned }));
        }
      } catch {
        // noop: keep defaults if fetch fails
      }
    };

    applyRuntimeFlags();
    return () => { mounted = false; };
  }, [participantProfile]);

  const setExperimentAssignment = useCallback((experimentKey, variant) => {
    if (!experimentKey || !variant) return;
    setExperimentAssignments((prev) => ({ ...prev, [experimentKey]: variant }));
  }, []);

  // ============================================
  // CURSOR ANALYTICS
  // ============================================
  const calculateCursorMetrics = useCallback((movements) => {
    if (movements.length < 2) return null;

    const velocities = [];
    const accelerations = [];
    const jerks = [];
    let totalDistance = 0;

    for (let i = 1; i < movements.length; i++) {
      const prev = movements[i - 1];
      const curr = movements[i];
      const dt = (curr.timestamp - prev.timestamp) / 1000; // segundos
      
      if (dt === 0) continue;

      const dx = curr.x - prev.x;
      const dy = curr.y - prev.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      totalDistance += distance;
      
      const velocity = distance / dt;
      velocities.push(velocity);

      // Aceleración
      if (velocities.length > 1) {
        const prevVelocity = velocities[velocities.length - 2];
        const acceleration = Math.abs(velocity - prevVelocity) / dt;
        accelerations.push(acceleration);

        // Jerk (cambio de aceleración)
        if (accelerations.length > 1) {
          const prevAccel = accelerations[accelerations.length - 2];
          const jerk = Math.abs(acceleration - prevAccel) / dt;
          jerks.push(jerk);
        }
      }
    }

    // Calcular agregados
    const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b) / arr.length : 0;
    const median = (arr) => {
      const sorted = [...arr].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length / 2)];
    };

    // Detectar hesitation (períodos de velocidad muy baja)
    let hesitationCount = 0;
    for (let i = 0; i < movements.length - 1; i++) {
      const dt = (movements[i + 1].timestamp - movements[i].timestamp) / 1000;
      if (dt > 0) {
        const dx = movements[i + 1].x - movements[i].x;
        const dy = movements[i + 1].y - movements[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const v = dist / dt;
        if (v < 50 && dt > 0.2) { // <50px/s y >200ms
          hesitationCount++;
        }
      }
    }

    return {
      totalDistance,
      avgVelocity: avg(velocities),
      medianVelocity: median(velocities),
      maxVelocity: Math.max(...velocities),
      avgAcceleration: avg(accelerations),
      avgJerk: avg(jerks),
      hesitationCount,
      movementCount: movements.length
    };
  }, []);

  const startTracking = useCallback((gameId) => {
    activeTrackingRef.current = true;
    currentGameIdRef.current = gameId;
    lateFacialFlushRef.current = { gameId: null, expiresAtMs: 0 };

    const pendingForGame = [];
    pendingDiagnosticFacialWindowsRef.current = pendingDiagnosticFacialWindowsRef.current.filter((window) => {
      const matchesGame = !window?.gameId || !gameId || window.gameId === gameId;
      if (matchesGame) {
        pendingForGame.push(window);
        return false;
      }
      return true;
    });
    const pendingFacialSummary = summarizeFacialWindows(pendingForGame);

    currentDataRef.current = {
      mouseMovements: [],
      clicks: [],
      webcamFrames: [],
      facialWindows: pendingForGame,
      trialEvents: [],
      startTime: Date.now(),
      errors: 0,
      score: 0,
      qualityFlags: pendingFacialSummary.qualityFlags,
      webcamQualityScore: pendingFacialSummary.webcamQualityScore,
      facialCoverageScore: pendingFacialSummary.facialCoverageScore,
      facialWindowCount: pendingFacialSummary.facialWindowCount,
    };
  }, []);

  const stopTracking = useCallback((gameId, finalScore = 0, finalErrors = null, details = null) => {
    activeTrackingRef.current = false;
    lateFacialFlushRef.current = {
      gameId,
      expiresAtMs: Date.now() + LATE_FACIAL_FLUSH_WINDOW_MS,
    };
    const duration = Date.now() - currentDataRef.current.startTime;
    
    // Calcular métricas de cursor si está habilitado y consentimiento otorgado
    let cursorMetrics = null;
    if (featureFlags.enableCursorTracking && consentState.cursor && currentDataRef.current.mouseMovements.length > 0) {
      cursorMetrics = calculateCursorMetrics(currentDataRef.current.mouseMovements);
    }

    // Agregar quality flags si hay webcam
    const current = currentDataRef.current;
    const facialSummary = summarizeFacialWindows(current.facialWindows);
    if (facialSummary.facialWindowCount > 0) {
      current.webcamQualityScore = facialSummary.webcamQualityScore;
      current.facialCoverageScore = facialSummary.facialCoverageScore;
      current.facialWindowCount = facialSummary.facialWindowCount;
      current.qualityFlags = dedupe([...current.qualityFlags, ...facialSummary.qualityFlags]);
    }

    if (featureFlags.enableQualityGates && !consentState.webcam) {
      current.qualityFlags.push('no_webcam_consent');
    }
    if (
      featureFlags.enableQualityGates
      && consentState.webcam
      && current.facialWindowCount === 0
      && current.webcamFrames.length === 0
    ) {
      current.qualityFlags.push('face_not_detected');
      current.qualityFlags.push('insufficient_webcam_signal');
    }
    if (
      current.webcamQualityScore < 60
      && featureFlags.enableQualityGates
      && (consentState.webcam || current.facialWindowCount > 0 || current.webcamFrames.length > 0)
    ) {
      current.qualityFlags.push('insufficient_webcam_signal');
    }
    current.qualityFlags = dedupe(current.qualityFlags);

    setSessionData(prev => ({
      ...prev,
      [gameId]: {
        ...current,
        duration,
        score: finalScore,
        errors: finalErrors !== null ? finalErrors : currentDataRef.current.errors,
        details,
        cursorMetrics,
        consentSnapshot: consentState
      }
    }));
  }, [featureFlags, consentState, calculateCursorMetrics]);

  const recordError = useCallback(() => {
    if (activeTrackingRef.current) {
      currentDataRef.current.errors += 1;
    }
  }, []);

  const recordTrialEvent = useCallback((event) => {
    const enriched = { ...event, timestamp: Date.now() };

    try {
      assertTelemetryPayloadPrivacySafe(enriched);
    } catch (error) {
      if (isDevEnv()) {
        console.warn('[TelemetryContext] dropped unsafe trial event payload', error?.message || error);
      }
      return;
    }

    if (activeTrackingRef.current) {
      currentDataRef.current.trialEvents.push(enriched);
    }

    // Send lightweight demo-related events to the backend for monitoring (fire-and-forget).
    try {
      const evName = String(event?.event || '').toLowerCase();
      if (evName.includes('demo') || evName.includes('cta_demo')) {
        const telemetryUrl = getRuntimeApiUrl('/api/telemetry');
        if (!telemetryUrl) return;
        (async () => {
          try {
            await fetch(telemetryUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: evName,
                payload: enriched,
                demo: isDemo,
                participantId: participantProfile?.participantId || undefined,
                timestamp: Date.now()
              })
            });
          } catch {
            // intentionally silent for non-blocking telemetry
          }
        })();
      }
    } catch {
      // swallow any unexpected error to avoid breaking the app
    }
  }, [isDemo, participantProfile]);

  const handleMouseMove = useCallback((e) => {
    if (activeTrackingRef.current && featureFlags.enableCursorTracking && consentState.cursor) {
      const lastMove = currentDataRef.current.mouseMovements[currentDataRef.current.mouseMovements.length - 1];
      const now = Date.now();
      // Registrar cada 50ms
      if (!lastMove || now - lastMove.timestamp > 50) {
        currentDataRef.current.mouseMovements.push({
          x: e.clientX,
          y: e.clientY,
          timestamp: now
        });
      }
    }
  }, [featureFlags, consentState]);

  const handleClick = useCallback((e) => {
    if (activeTrackingRef.current && featureFlags.enableCursorTracking && consentState.cursor) {
      currentDataRef.current.clicks.push({
        x: e.clientX,
        y: e.clientY,
        timestamp: Date.now()
      });
    }
  }, [featureFlags, consentState]);

  // ============================================
  // WEBCAM TELEMETRY
  // ============================================
  const recordWebcamFrame = useCallback((webcamData) => {
    const webcamEnabled = featureFlags.enableWebcamTracking && consentState.webcam;
    const activeWebcamRecording = activeTrackingRef.current && webcamEnabled;
    const lateFlush = lateFacialFlushRef.current;
    const isLateFacialFlush = !activeTrackingRef.current
      && webcamEnabled
      && isFacialWindow(webcamData)
      && lateFlush.gameId
      && Date.now() <= lateFlush.expiresAtMs
      && (!webcamData.gameId || webcamData.gameId === lateFlush.gameId);

    if (!activeWebcamRecording && !isLateFacialFlush) {
      if (webcamEnabled && isFacialWindow(webcamData) && hasDiagnosticFacialWindowFlag(webcamData)) {
        assertFacialWindowPrivacySafe(webcamData);
        const incomingKey = getFacialWindowKey(webcamData);
        const alreadyPending = pendingDiagnosticFacialWindowsRef.current
          .some((window) => getFacialWindowKey(window) === incomingKey);
        if (!alreadyPending) {
          pendingDiagnosticFacialWindowsRef.current.push(webcamData);
        }
      }
      return;
    }

    if (isFacialWindow(webcamData)) {
      assertFacialWindowPrivacySafe(webcamData);

      if (isLateFacialFlush) {
        const targetGameId = lateFlush.gameId;
        setSessionData((prev) => {
          const existing = prev[targetGameId];
          if (!existing) return prev;

          const existingWindows = Array.isArray(existing.facialWindows) ? existing.facialWindows : [];
          const incomingKey = getFacialWindowKey(webcamData);
          const alreadyStored = existingWindows.some((window) => getFacialWindowKey(window) === incomingKey);
          const facialWindows = alreadyStored ? existingWindows : [...existingWindows, webcamData];
          const facialSummary = summarizeFacialWindows(facialWindows);
          const reconciledExistingFlags = reconcileLateFacialFlushFlags(existing.qualityFlags || [], facialSummary);

          return {
            ...prev,
            [targetGameId]: {
              ...existing,
              facialWindows,
              webcamQualityScore: facialSummary.webcamQualityScore,
              facialCoverageScore: facialSummary.facialCoverageScore,
              facialWindowCount: facialSummary.facialWindowCount,
              qualityFlags: dedupe([...reconciledExistingFlags, ...facialSummary.qualityFlags]),
            },
          };
        });
        return;
      }

      const current = currentDataRef.current;
      const incomingKey = getFacialWindowKey(webcamData);
      const alreadyStored = current.facialWindows.some((window) => getFacialWindowKey(window) === incomingKey);
      if (!alreadyStored) {
        current.facialWindows.push(webcamData);
      }

      const facialSummary = summarizeFacialWindows(current.facialWindows);
      current.webcamQualityScore = facialSummary.webcamQualityScore;
      current.facialCoverageScore = facialSummary.facialCoverageScore;
      current.facialWindowCount = facialSummary.facialWindowCount;
      current.qualityFlags = dedupe([...current.qualityFlags, ...facialSummary.qualityFlags]);
      return;
    }

    if (!activeWebcamRecording) {
      return;
    }

    const current = currentDataRef.current;
    const safeFrame = sanitizeLegacyWebcamFrame(webcamData);
    current.webcamFrames.push(safeFrame);

    if (safeFrame.qualityScore !== undefined) {
      const legacyQualityScores = current.webcamFrames
        .map((frame) => frame.qualityScore)
        .filter(Number.isFinite);
      current.webcamQualityScore = clampPercent(average(legacyQualityScores));
    }
    if (safeFrame.qualityFlags?.length > 0) {
      current.qualityFlags = dedupe([...current.qualityFlags, ...safeFrame.qualityFlags]);
    }
  }, [featureFlags, consentState]);

  const getCurrentTelemetry = useCallback(() => {
    return currentDataRef.current;
  }, []);

  const getSessionMetadata = useCallback(() => ({
    sessionId: sessionData,
    participantProfile,
    consentState,
    featureFlags,
    sessionMeta: { experiments: experimentAssignments },
    timestamp: new Date().toISOString()
  }), [sessionData, participantProfile, consentState, featureFlags, experimentAssignments]);

  const recordFutureModuleData = useCallback((moduleName, items) => {
    if (!moduleName) return;
    setSessionData((prev) => ({
      ...prev,
      futureModules: {
        ...(prev.futureModules || {}),
        [moduleName]: Array.isArray(items) ? items : []
      }
    }));
  }, []);

  return (
    <TelemetryContext.Provider value={{
      // Session & Basic
      sessionData,
      isDemo,
      setIsDemo,
      participantProfile,
      setParticipantProfile,
      
      // Consent Management
      consentState,
      setConsent,
      getConsent,
      
      // Feature Flags
      featureFlags,
      setFeatureFlag,
      experimentAssignments,
      setExperimentAssignment,
      
      // Tracking
      startTracking,
      stopTracking,
      recordError,
      recordTrialEvent,
      
      // Cursor
      handleMouseMove,
      handleClick,
      
      // Webcam
      recordWebcamFrame,
      
      // Utilities
      getCurrentTelemetry,
      getSessionMetadata,
      recordFutureModuleData
    }}>
      {/* We wrap children in a div that captures global movements if active */}
      <div 
        style={{ width: '100%', height: '100%' }} 
        onMouseMove={handleMouseMove}
        onClick={handleClick}
      >
        {children}
      </div>
    </TelemetryContext.Provider>
  );
};


