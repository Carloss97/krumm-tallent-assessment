import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';

const TelemetryContext = createContext(null);

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
  const currentDataRef = useRef({
    mouseMovements: [],
    clicks: [],
    webcamFrames: [],
    trialEvents: [],
    startTime: 0,
    errors: 0,
    score: 0,
    qualityFlags: [],
    webcamQualityScore: 0
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
  useEffect(() => {
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
        const res = await fetch('/api/feature-flags', { cache: 'no-store' });
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
      } catch (err) {
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
    currentDataRef.current = {
      mouseMovements: [],
      clicks: [],
      webcamFrames: [],
      trialEvents: [],
      startTime: Date.now(),
      errors: 0,
      score: 0,
      qualityFlags: [],
      webcamQualityScore: 0
    };
  }, []);

  const stopTracking = useCallback((gameId, finalScore = 0, finalErrors = null, details = null) => {
    activeTrackingRef.current = false;
    const duration = Date.now() - currentDataRef.current.startTime;
    
    // Calcular métricas de cursor si está habilitado y consentimiento otorgado
    let cursorMetrics = null;
    if (featureFlags.enableCursorTracking && consentState.cursor && currentDataRef.current.mouseMovements.length > 0) {
      cursorMetrics = calculateCursorMetrics(currentDataRef.current.mouseMovements);
    }

    // Agregar quality flags si hay webcam
    if (featureFlags.enableQualityGates && !consentState.webcam) {
      currentDataRef.current.qualityFlags.push('no_webcam_consent');
    }
    if (currentDataRef.current.webcamQualityScore < 60 && featureFlags.enableQualityGates) {
      currentDataRef.current.qualityFlags.push('insufficient_webcam_signal');
    }

    setSessionData(prev => ({
      ...prev,
      [gameId]: {
        ...currentDataRef.current,
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

    if (activeTrackingRef.current) {
      currentDataRef.current.trialEvents.push(enriched);
    }

    // Send lightweight demo-related events to the backend for monitoring (fire-and-forget).
    try {
      const evName = String(event?.event || '').toLowerCase();
      if (evName.includes('demo') || evName.includes('cta_demo')) {
        (async () => {
          try {
            await fetch('/api/telemetry', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                event: evName,
                payload: enriched,
                demo: isDemo,
                participantId: participantProfile?.participantId || null,
                timestamp: Date.now()
              })
            });
          } catch (err) {
            // intentionally silent for non-blocking telemetry
          }
        })();
      }
    } catch (err) {
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
    if (activeTrackingRef.current && featureFlags.enableWebcamTracking && consentState.webcam) {
      currentDataRef.current.webcamFrames.push({
        ...webcamData,
        timestamp: Date.now()
      });
      // Actualizar quality score
      if (webcamData.qualityScore !== undefined) {
        currentDataRef.current.webcamQualityScore = webcamData.qualityScore;
      }
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


