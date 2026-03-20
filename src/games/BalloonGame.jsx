import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';
import { playBalloonPump, playBalloonPop } from '../utils/audio';

const BalloonGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, isDemo } = useTelemetry();
  const MAX_ROUNDS = isDemo ? 3 : 10;

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  
  const [round, setRound] = useState(1);
  const [currentBalloonSize, setCurrentBalloonSize] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const totalPointsRef = useRef(0);
  const [explosionPoint, setExplosionPoint] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, exploded, banked
  const [pops, setPops] = useState(0);
  const popsRef = useRef(0);
  const hasEndedRef = useRef(false);
  
  useEffect(() => {
    if (isActive) {
      startTracking();
      initRound();
    }
  }, [isActive, startTracking]);

  const initRound = (currentRound) => {
    setCurrentBalloonSize(1);
    setCurrentRoundPoints(0);
    setGameState('playing');
    // Minimum 4 pumps safe, maximum 11 before deterministic pop
    const threshold = Math.floor(Math.random() * 8) + 4; // [4..11]
    setExplosionPoint(threshold);
  };

  const handlePump = () => {
    if (gameState !== 'playing' || hasEndedRef.current) return;
    
    const newSize = currentBalloonSize + 1;
    
    // Increased risk: deterministic pop at threshold plus mild early-pop chance
    // Prevent pop on first pump by requiring current ball size >1 for accidental early pop.
    const earlyPopChance = currentBalloonSize > 1 ? Math.min(0.15, currentBalloonSize * 0.02) : 0;
    const isEarlyPop = Math.random() < earlyPopChance;

    if (newSize >= explosionPoint || isEarlyPop) {
      // Pop!
      playBalloonPop();
      setGameState('exploded');
      popsRef.current += 1;
      setPops(popsRef.current);
      setTimeout(() => advanceRound(), 1500);
    } else {
      playBalloonPump();
      setCurrentBalloonSize(newSize);
      setCurrentRoundPoints(p => p + 10);
    }
  };

  const handleBank = () => {
    if (gameState !== 'playing' || currentBalloonSize === 1 || hasEndedRef.current) return;
    
    // Success, keep points
    totalPointsRef.current += currentRoundPoints;
    setTotalPoints(totalPointsRef.current);
    setGameState('banked');
    setTimeout(() => advanceRound(), 1500);
  };

  const advanceRound = () => {
    if (hasEndedRef.current) return;
    
    if (round >= MAX_ROUNDS) {
      hasEndedRef.current = true;
      setIsActive(false);
      
      stopTracking('game4', totalPointsRef.current, popsRef.current);

      setTimeout(() => {
        navigate('/game/5', { replace: true });
        window.scrollTo(0, 0);
      }, 500);
    } else {
      const next = round + 1;
      setRound(next);
      initRound(next);
    }
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial 
        type="Risk Strategy"
        title="The Balloon Test"
        description="Pump the balloon to earn points. You can bank your points at any time. However, if the balloon pops before you bank, you lose all points for that round. Find the balance between risk and reward."
        timeLimit="None"
        onStart={() => setShowInstructions(false) || setIsActive(true)}
      />
    );
  }

  // Calculate visual size multiplier with a safety cap
  const maxScale = 2.8;
  const rawScale = 1 + (currentBalloonSize * 0.12);
  const visualScale = Math.min(rawScale, maxScale);

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'transparent', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{round}</span> / {MAX_ROUNDS}
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        BANK: <span style={{ color: '#059669', fontWeight: 'bold' }}>{totalPoints}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
        <AnimatePresence>
          {gameState === 'playing' && (
            <motion.div
              key="balloon"
              initial={{ scale: 0 }}
              animate={{ scale: visualScale }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: 'radial-gradient(circle at 35% 35%, #6ee7b7 0%, #3b82f6 40%, #1e3a8a 80%)',
                boxShadow: 'inset -15px -15px 30px rgba(0,0,0,0.6), 0 10px 30px rgba(0,0,0,0.4)',
                border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 'bold',
                textShadow: '0 2px 4px rgba(0,0,0,0.5)',
                fontSize: `${1.2 / visualScale}rem` // Keep text readable
              }}
            >
              +{currentRoundPoints}
            </motion.div>
          )}
          
          {gameState === 'exploded' && (
            <motion.div
              key="exploded"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
              style={{
                position: 'absolute',
                color: '#ef4444',
                fontSize: '2rem',
                fontWeight: 'bold',
                textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
                letterSpacing: '4px'
              }}
            >
              [ CRITICAL FAILURE ]
            </motion.div>
          )}

          {gameState === 'banked' && (
            <motion.div
              key="banked"
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: -50, opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                color: '#10b981',
                fontSize: '1.5rem',
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}
            >
              +{currentRoundPoints} YIELD SECURED
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ display: 'flex', gap: '24px', marginBottom: '80px', zIndex: 10 }}>
        <button 
          className="btn" 
          onClick={handlePump}
          disabled={gameState !== 'playing'}
          style={{ width: 'auto', minWidth: '160px', padding: '12px 18px', textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6', backgroundImage: 'none', boxShadow: gameState === 'playing' ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none', whiteSpace: 'nowrap' }}
        >
          EXPAND GLOBE
        </button>
        <button 
          className="btn" 
          onClick={handleBank}
          disabled={gameState !== 'playing' || currentBalloonSize === 1}
          style={{ width: 'auto', minWidth: '160px', padding: '12px 18px', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', backgroundImage: 'none', boxShadow: (gameState === 'playing' && currentBalloonSize > 1) ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none', whiteSpace: 'nowrap' }}
        >
          SECURE POINTS
        </button>
      </div>
    </div>
  );
};

export default BalloonGame;
