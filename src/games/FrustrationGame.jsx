import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const FrustrationGame = () => {
  const navigate = useNavigate();
  const { isDemo, startTracking, stopTracking, recordError } = useTelemetry();
  
  const GAME_TIME = isDemo ? 5 : 25;

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [targetPos, setTargetPos] = useState({ x: 50, y: 50 }); // percentage
  const [timeLeft, setTimeLeft] = useState(GAME_TIME); 
  const timeLeftRef = useRef(GAME_TIME);
  const [inZone, setInZone] = useState(false);
  const [trackingTime, setTrackingTime] = useState(0);
  const trackingTimeRef = useRef(0);
  const hasEndedRef = useRef(false);

  useEffect(() => {
    if (isActive) {
      startTracking();
      // Move the ring: random
      const moveInterval = setInterval(() => {
        setTargetPos({
          x: 15 + Math.random() * 70,
          y: 15 + Math.random() * 70
        });
      }, 800);

      timeLeftRef.current = GAME_TIME;
      setTimeLeft(GAME_TIME);

      const timer = setInterval(() => {
        timeLeftRef.current -= 1;
        setTimeLeft(timeLeftRef.current);
        if (timeLeftRef.current <= 0) {
          endGame();
        }
      }, 1000);

      return () => {
        clearInterval(moveInterval);
        clearInterval(timer);
      };
    }
  }, [isActive, startTracking, GAME_TIME]);

  useEffect(() => {
    // Score based on time in zone
    let trackTimer;
    if (isActive && inZone) {
      trackTimer = setInterval(() => {
        trackingTimeRef.current += 100;
        setTrackingTime(trackingTimeRef.current);
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

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);
    
    stopTracking('game2', Math.floor(trackingTimeRef.current / 1000));

    setTimeout(() => {
      navigate('/game/3', { replace: true });
      window.scrollTo(0, 0);
    }, 1500);
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial 
        type="Frustration Tolerance"
        title="Dynamic Precision Task"
        description="A telemetry ring will move erratically across the screen. You must keep your cursor inside the ring at all times. Slipping outside the stabilization boundary will count as a loss of control."
        timeLimit={`${GAME_TIME}s`}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden', backgroundColor: 'transparent', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        SYNC: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{(trackingTime / 1000).toFixed(1)}s</span>
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
      </div>

      <AnimatePresence>
        {isActive ? (
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
        ) : (
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
        )}
      </AnimatePresence>
    </div>
  );
};

export default FrustrationGame;
