import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const FrustrationGame = ({ isActive, onEndGame, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();
  
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 }); // percentage
  const [inZone, setInZone] = useState(false);
  const [trackingTimeMs, setTrackingTimeMs] = useState(0);
  const trackingTimeRef = useRef(0);
  const hasEndedRef = useRef(false);

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const score = Math.floor(trackingTimeRef.current / 1000);
    stopTracking('game2', score, 0, { syncTime: score });
    onEndGame(score);
  }, [onEndGame, stopTracking]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      startTracking();
      trackingTimeRef.current = 0;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTrackingTimeMs(0);
      // Move the ring: random
      const moveInterval = setInterval(() => {
        setTargetPos({
          x: 15 + Math.random() * 70,
          y: 15 + Math.random() * 70
        });
      }, 800);

      return () => {
        clearInterval(moveInterval);
      };
    }
  }, [isActive, startTracking]);

  useEffect(() => {
    // Score based on time in zone
    let trackTimer;
    if (isActive && inZone) {
      trackTimer = setInterval(() => {
        trackingTimeRef.current += 100;
        setTrackingTimeMs(trackingTimeRef.current);
      }, 100);
    }
    return () => clearInterval(trackTimer);
  }, [isActive, inZone]);

  const handlePointerLeave = () => {
    if (isActive) {
      setInZone(false);
      recordError(); // Slipping out is a frustration event
    }
  };

  const handlePointerEnter = () => {
    if (isActive) {
      setInZone(true);
    }
  };

  if (!isActive) {
    return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-panel flex-center"
          style={{ 
            position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            padding: '40px', textAlign: 'center', border: '1px solid #10b981' 
          }}
        >
          <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '16px' }}>[ STAGE COMPLETE ]</div>
          <p style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Awaiting Next Sequence...</p>
        </motion.div>
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'transparent', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        SYNC: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{(trackingTimeMs / 1000).toFixed(1)}s</span>
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
      </div>

      <AnimatePresence>
          <>
            <div style={{
              position: 'absolute', top: '80px', width: '100%', textAlign: 'center', color: '#475569', textTransform: 'uppercase', letterSpacing: '4px', fontSize: '0.8rem'
            }}>
              [ Maintain Cursor Synchronization ]
            </div>

            <motion.div
              animate={{ 
                left: `${targetPos.x}%`, 
                top: `${targetPos.y}%`,
                borderColor: inZone ? '#10b981' : '#ef4444',
                boxShadow: inZone ? '0 0 20px rgba(16, 185, 129, 0.4)' : '0 0 20px rgba(239, 68, 68, 0.4)'
              }}
              transition={{ type: 'spring', stiffness: 60, damping: 15 }}
              onPointerEnter={handlePointerEnter}
              onPointerLeave={handlePointerLeave}
              style={{
                position: 'absolute',
                transform: 'translate(-50%, -50%)',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: '2px solid',
                backgroundColor: 'rgba(255,255,255,0.6)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'crosshair',
              backdropFilter: 'blur(4px)'
              }}
            >
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', 
                backgroundColor: inZone ? '#10b981' : '#ef4444' 
              }} />
            </motion.div>
          </>
      </AnimatePresence>
    </div>
  );
};

export default FrustrationGame;
