import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playBalloonPump, playBalloonPop, playMemoryFlash } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useTelemetry } from '../TelemetryContext';

const BalloonGame = ({ isActive, onEndGame, isDemo }) => {
  const MAX_ROUNDS = isDemo ? 3 : 10;
  const MIN_PUMPS = 6;
  const MAX_EXTRA = 6; // explosion threshold will be in [MIN_PUMPS .. MIN_PUMPS+MAX_EXTRA-1]
  const { startTracking, stopTracking } = useTelemetry();

  const [round, setRound] = useState(1);
  const [currentBalloonSize, setCurrentBalloonSize] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [explosionPoint, setExplosionPoint] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, exploded, banked
  const [showConfetti, setShowConfetti] = useState(false);

  const totalPointsRef = useRef(0);
  const popsRef = useRef(0);
  const hasEndedRef = useRef(false);

  const initRound = useCallback(() => {
    setCurrentBalloonSize(1);
    setCurrentRoundPoints(0);
    setGameState('playing');
    const threshold = MIN_PUMPS + Math.floor(Math.random() * MAX_EXTRA); // [MIN_PUMPS..MIN_PUMPS+MAX_EXTRA-1]
    setExplosionPoint(threshold);
  }, []);

  const advanceRound = useCallback(() => {
    if (hasEndedRef.current) return;
    
    if (round >= MAX_ROUNDS) {
      hasEndedRef.current = true;
      stopTracking('game4', totalPointsRef.current, popsRef.current, { pops: popsRef.current });
      onEndGame(totalPointsRef.current, popsRef.current);
    } else {
      const next = round + 1;
      setRound(next);
      initRound();
    }
  }, [round, MAX_ROUNDS, onEndGame, initRound, stopTracking]);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      totalPointsRef.current = 0;
      popsRef.current = 0;
      startTracking();
      setRound(1);
      setTotalPoints(0);
      initRound();
    }
  }, [isActive, initRound, startTracking]);

  // Keyboard shortcuts for demo accessibility: Space = pump, Enter = bank
  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isActive || hasEndedRef.current) return;
      // prefer semantic button clicks to reuse existing logic
      const pumpBtn = document.querySelector('.balloon-pump-btn');
      const bankBtn = document.querySelector('.balloon-bank-btn');
      if ((e.code === 'Space' || e.key === ' ') && pumpBtn) {
        e.preventDefault();
        pumpBtn.click();
      }
      if (e.code === 'Enter' && bankBtn) {
        e.preventDefault();
        bankBtn.click();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive]);

  const handlePump = () => {
    if (gameState !== 'playing' || hasEndedRef.current) return;

    const newSize = currentBalloonSize + 1;

    // Disable any chance of an "early" pop until the minimum pump threshold is reached
    const earlyPopChance = currentBalloonSize >= MIN_PUMPS ? Math.min(0.15, currentBalloonSize * 0.02) : 0;
    const isEarlyPop = Math.random() < earlyPopChance;

    if (newSize >= explosionPoint || isEarlyPop) {
      playBalloonPop();
      setGameState('exploded');
      popsRef.current += 1;
      setTimeout(() => advanceRound(), 1500);
    } else {
      playBalloonPump();
      setCurrentBalloonSize(newSize);
      setCurrentRoundPoints(p => p + 10);
    }
  };

  const handleBank = () => {
    if (gameState !== 'playing' || currentBalloonSize === 1 || hasEndedRef.current) return;
    
    totalPointsRef.current += currentRoundPoints;
    setTotalPoints(totalPointsRef.current);
    setGameState('banked');
    try { playMemoryFlash(); } catch (e) {}
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1200);
    setTimeout(() => advanceRound(), 1500);
  };

  if (!isActive) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="glass-panel"
        style={{ padding: '40px', textAlign: 'center', border: '1px solid #10b981' }}
      >
        <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '16px' }}>[ STAGE COMPLETE ]</div>
        <p style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Awaiting Next Sequence...</p>
      </motion.div>
    );
  }

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
        {showConfetti && <Confetti count={18} spread={70} duration={1.1} />}
      </div>

        <div style={{ display: 'flex', gap: '24px', marginBottom: '80px', zIndex: 10 }}>
        <button
          className="btn balloon-pump-btn"
          aria-label="Expandir globo (Barra espaciadora)"
          onClick={handlePump}
          disabled={gameState !== 'playing'}
          style={{ width: 'auto', minWidth: '160px', padding: '12px 18px', textAlign: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid #3b82f6', color: '#3b82f6', backgroundImage: 'none', boxShadow: gameState === 'playing' ? '0 0 15px rgba(59, 130, 246, 0.2)' : 'none', whiteSpace: 'nowrap' }}
        >
          EXPANDIR GLOBO
        </button>
        <button
          className="btn balloon-bank-btn"
          aria-label="Asegurar puntos (Enter)"
          onClick={handleBank}
          disabled={gameState !== 'playing' || currentBalloonSize === 1}
          style={{ width: 'auto', minWidth: '160px', padding: '12px 18px', textAlign: 'center', backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981', color: '#10b981', backgroundImage: 'none', boxShadow: (gameState === 'playing' && currentBalloonSize > 1) ? '0 0 15px rgba(16, 185, 129, 0.2)' : 'none', whiteSpace: 'nowrap' }}
        >
          ASEGURAR PUNTOS
        </button>
      </div>
    </div>
  );
};

export default BalloonGame;
