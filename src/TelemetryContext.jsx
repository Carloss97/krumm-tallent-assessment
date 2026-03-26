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
    if (activeTrackingRef.current) {
      currentDataRef.current.trialEvents.push({
        ...event,
        timestamp: Date.now()
      });
    }
  }, []);

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
    timestamp: new Date().toISOString()
  }), [sessionData, participantProfile, consentState, featureFlags]);

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
      getSessionMetadata
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
