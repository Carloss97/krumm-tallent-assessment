import React, { createContext, useContext, useState, useRef, useCallback } from 'react';

const TelemetryContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useTelemetry = () => useContext(TelemetryContext);

export const TelemetryProvider = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);
  const [sessionData, setSessionData] = useState({});

  const activeTrackingRef = useRef(false);
  const currentDataRef = useRef({
    mouseMovements: [],
    clicks: [],
    startTime: 0,
    errors: 0,
    score: 0
  });

  const startTracking = useCallback(() => {
    activeTrackingRef.current = true;
    currentDataRef.current = {
      mouseMovements: [],
      clicks: [],
      startTime: Date.now(),
      errors: 0,
      score: 0
    };
  }, []);

  const stopTracking = useCallback((gameId, finalScore = 0, finalErrors = null, details = null) => {
    activeTrackingRef.current = false;
    const duration = Date.now() - currentDataRef.current.startTime;
    
    setSessionData(prev => ({
      ...prev,
      [gameId]: {
        ...currentDataRef.current,
        duration,
        score: finalScore,
        errors: finalErrors !== null ? finalErrors : currentDataRef.current.errors,
        details
      }
    }));
  }, []);

  const recordError = useCallback(() => {
    if (activeTrackingRef.current) {
      currentDataRef.current.errors += 1;
    }
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (activeTrackingRef.current) {
      // Throttle recording to prevent massive arrays
      const lastMove = currentDataRef.current.mouseMovements[currentDataRef.current.mouseMovements.length - 1];
      const now = Date.now();
      if (!lastMove || now - lastMove.timestamp > 50) { // record every 50ms approx
        currentDataRef.current.mouseMovements.push({ x: e.clientX, y: e.clientY, timestamp: now });
      }
    }
  }, []);

  const handleClick = useCallback((e) => {
    if (activeTrackingRef.current) {
      currentDataRef.current.clicks.push({ x: e.clientX, y: e.clientY, timestamp: Date.now() });
    }
  }, []);

  const getCurrentTelemetry = useCallback(() => {
    return currentDataRef.current;
  }, []);

  return (
    <TelemetryContext.Provider value={{
      sessionData,
      isDemo,
      setIsDemo,
      startTracking,
      stopTracking,
      recordError,
      handleMouseMove,
      handleClick,
      getCurrentTelemetry
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
