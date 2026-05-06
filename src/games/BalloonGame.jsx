import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playBalloonPump, playBalloonPop, playSuccessSound, playErrorSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';

const BalloonGame = ({ isActive, onEndGame, isDemo, showBriefing = true }) => {
  const MAX_ROUNDS = isDemo ? 10 : 10;
  const MIN_PUMPS = 6;
  const { startTracking, stopTracking, recordError, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();

  const [round, setRound] = useState(1);
  const [currentBalloonSize, setCurrentBalloonSize] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [explosionPoint, setExplosionPoint] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, exploded, banked
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(0);
  const [briefing, setBriefing] = useState(Boolean(isDemo && showBriefing));

  const totalPointsRef = useRef(0);
  const popsRef = useRef(0);
  const hasEndedRef = useRef(false);

  const initRound = useCallback(() => {
    setCurrentBalloonSize(1);
    setCurrentRoundPoints(0);
    setGameState('playing');
    // explosion threshold between 8 and 18 inclusive
    const MIN_THRESHOLD = 8;
    const MAX_THRESHOLD = 18;
    const threshold = Math.floor(Math.random() * (MAX_THRESHOLD - MIN_THRESHOLD + 1)) + MIN_THRESHOLD;
    setExplosionPoint(threshold);
  }, []);

  const advanceRound = useCallback(() => {
    if (hasEndedRef.current) return;

    let nextRound = 0;
    let shouldEnd = false;

    setRound((prevRound) => {
      nextRound = prevRound + 1;
      shouldEnd = nextRound > MAX_ROUNDS;
      return shouldEnd ? prevRound : nextRound;
    });

    if (shouldEnd) {
      hasEndedRef.current = true;
      stopTracking('game4', totalPointsRef.current, popsRef.current, { pops: popsRef.current });
      onEndGame(totalPointsRef.current, popsRef.current);
      return;
    }

    initRound();
  }, [MAX_ROUNDS, onEndGame, initRound, stopTracking]);

  const handlePump = useCallback(() => {
    if (gameState !== 'playing' || hasEndedRef.current || briefing) return;

    const newSize = currentBalloonSize + 1;
    setShake(prev => prev + 1);

    // Disable early pop chance for first few pumps
    const earlyPopChance = currentBalloonSize >= MIN_PUMPS ? Math.min(0.2, (currentBalloonSize - MIN_PUMPS) * 0.05) : 0;
    const isEarlyPop = Math.random() < earlyPopChance;

    // Record pump event
    recordTrialEvent({ event: 'pump', payload: { size: newSize } });

    if (newSize >= explosionPoint || isEarlyPop) {
      playBalloonPop();
      playErrorSound();
      setGameState('exploded');
      popsRef.current += 1;
      recordError(); // Record "error" for pop
      setTimeout(() => advanceRound(), 1800);
    } else {
      playBalloonPump();
      setCurrentBalloonSize(newSize);
      setCurrentRoundPoints(p => p + 10);
    }
  }, [currentBalloonSize, gameState, briefing, explosionPoint, MIN_PUMPS, advanceRound, recordError, recordTrialEvent]);

  const handleBank = useCallback(() => {
    if (gameState !== 'playing' || currentBalloonSize === 1 || hasEndedRef.current || briefing) return;
    
    totalPointsRef.current += currentRoundPoints;
    setTotalPoints(totalPointsRef.current);
    setGameState('banked');

    // Record bank event
    recordTrialEvent({ event: 'bank', payload: { points: currentRoundPoints } });

    try { playSuccessSound(); } catch (error) { void error; }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 1400);
    setTimeout(() => advanceRound(), 1800);
  }, [currentBalloonSize, currentRoundPoints, gameState, briefing, advanceRound, recordTrialEvent]);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      totalPointsRef.current = 0;
      popsRef.current = 0;
      startTracking();
      setRound(1);
      setTotalPoints(0);
      initRound();
      setBriefing(Boolean(isDemo && showBriefing));
    }
  }, [isActive, initRound, startTracking, isDemo, showBriefing]);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (!isActive || hasEndedRef.current || briefing) return;
      if ((e.code === 'Space' || e.key === ' ')) {
        e.preventDefault();
        handlePump();
      }
      if (e.code === 'Enter') {
        e.preventDefault();
        handleBank();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isActive, briefing, handlePump, handleBank]);

  const copy = {
    es: {
      trialLabel: 'Fase',
      bankTitle: 'Reserva',
      criticalFailure: '[ COLAPSO DEL SISTEMA ]',
      yieldSecured: 'Capital Capturado',
      pumpLabel: 'Optimizar',
      bankBtn: 'Capturar',
      ariaPump: 'Expandir globo (Barra espaciadora)',
      ariaBank: 'Capturar puntos en reserva (Enter)',
      briefTitle: 'Protocolo de Riesgo',
      briefBody: 'Iniciando evaluación de captura de valor. Debe gestionar el crecimiento del activo mediante ciclos de optimización. Mayor volumen implica mayor recompensa, pero incrementa exponencialmente la probabilidad de colapso de la integridad. Utilice el comando Capturar para asegurar el rendimiento acumulado.',
      startBtn: 'Iniciar Operación'
    },
    en: {
      trialLabel: 'Phase',
      bankTitle: 'Reserve',
      criticalFailure: '[ SYSTEM COLLAPSE ]',
      yieldSecured: 'Capital Captured',
      pumpLabel: 'Optimize',
      bankBtn: 'Capture',
      ariaPump: 'Expand balloon (Spacebar)',
      ariaBank: 'Capture points to reserve (Enter)',
      briefTitle: 'Risk Protocol',
      briefBody: 'Initiating value capture assessment. You must manage asset growth through optimization cycles. Higher volume implies higher reward, but exponentially increases the probability of integrity collapse. Use the Capture command to secure accumulated yield.',
      startBtn: 'Start Operation'
    }
  };

  const t = copy[language] || copy.es;

  if (!isActive) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ padding: '40px', textAlign: 'center', border: '2px solid #10b981' }}>
        <div style={{ color: '#059669', fontSize: '2rem', fontWeight: '800', marginBottom: '12px' }}>[ ANALYSIS SYNC ]</div>
        <p style={{ color: '#6b7280', textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.85rem' }}>Processing Risk Tolerance Data...</p>
      </motion.div>
    );
  }

  const rawScale = 1 + (currentBalloonSize * 0.12);
  const visualScale = Math.min(rawScale, 2.8);
  
  // Dynamic color based on size (risk)
  const hue = Math.max(0, 240 - (currentBalloonSize * 15)); // Starts blue, goes to red
  const balloonColor = `hsl(${hue}, 70%, 50%)`;
  const balloonGradient = `radial-gradient(circle at 35% 35%, hsl(${hue}, 60%, 75%) 0%, ${balloonColor} 50%, hsl(${hue}, 80%, 25%) 100%)`;

  return (
    <div style={{ width: '100%', minHeight: '600px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', gap: '20px', position: 'relative', overflow: 'hidden' }}>
      
      <AnimatePresence>
        {briefing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 200, borderRadius: '16px' }}>
            <motion.div initial={{ y:20, scale:0.95 }} animate={{ y:0, scale:1 }} style={{ background:'#ffffff', padding:'32px', borderRadius:'20px', maxWidth:'440px', textAlign:'center', border:'1px solid rgba(15,23,42,0.1)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)' }}>
              <div style={{ color: '#4f46e5', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
                {t.briefTitle}
              </div>
              <h4 style={{ margin: 0, fontSize:'1.4rem', color:'#1e1b4b', fontWeight: 800 }}>Protocolo de Riesgo</h4>
              <p style={{ margin:'16px 0 24px', color:'#475569', lineHeight:1.7, fontSize: '0.95rem' }}>{t.briefBody}</p>
              <button className="btn btn-primary" onClick={() => setBriefing(false)} style={{ width: '100%', padding: '14px' }}>
                {t.startBtn}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px', padding: '0 20px', position: 'absolute', top: '40px', zIndex: 10 }}>
        <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(255,255,255,0.8)' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>{t.trialLabel}</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e1b4b' }}>{round}<span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>/{MAX_ROUNDS}</span></span>
        </div>
        <div className="glass-panel" style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(255,255,255,0.8)' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>{t.bankTitle}</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>{totalPoints}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', position: 'relative' }}>
        <AnimatePresence mode="wait">
          {gameState === 'playing' && (
            <motion.div
              key="balloon"
              animate={{ scale: visualScale, x: [0, -2, 2, -2, 2, 0][shake % 6] }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              style={{
                width: '80px',
                height: '95px',
                borderRadius: '50% 50% 50% 50% / 40% 40% 60% 60%',
                background: balloonGradient,
                boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.3), 0 25px 40px -10px ${balloonColor}66`,
                border: '1px solid rgba(255,255,255,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 900,
                textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                fontSize: `${0.9 / Math.sqrt(visualScale)}rem`,
                position: 'relative'
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} key={currentRoundPoints}>
                   +{currentRoundPoints}
                </motion.div>
              </div>
              <div style={{ position: 'absolute', bottom: '-10px', left: '50%', transform: 'translateX(-50%)', width: '12px', height: '12px', background: balloonColor, clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }} />
            </motion.div>
          )}
          
          {gameState === 'exploded' && (
            <motion.div
              key="exploded"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              style={{
                position: 'absolute',
                color: '#dc2626',
                fontSize: '3rem',
                fontWeight: 950,
                textTransform: 'uppercase',
                letterSpacing: '8px',
                filter: 'drop-shadow(0 0 10px rgba(220,38,38,0.5))'
              }}
            >
              {language === 'es' ? '¡BOOM!' : 'POP!'}
            </motion.div>
          )}

          {gameState === 'banked' && (
            <motion.div
              key="banked"
              initial={{ y: 20, opacity: 0, scale: 0.8 }}
              animate={{ y: -80, opacity: 1, scale: 1.3 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'absolute',
                color: '#fff',
                fontSize: '1.8rem',
                fontWeight: 900,
                letterSpacing: '2px',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #10b981, #059669)',
                padding: '12px 32px',
                borderRadius: '16px',
                boxShadow: '0 15px 30px -10px rgba(5,150,105,0.4)',
                zIndex: 50
              }}
            >
              +{currentRoundPoints}
            </motion.div>
          )}
        </AnimatePresence>
        {showConfetti && <Confetti count={25} spread={100} duration={1.5} />}
      </div>

      <div style={{ position: 'absolute', bottom: '60px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '20px', zIndex: 100 }}>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)' }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary"
          aria-label={t.ariaPump}
          onClick={handlePump}
          disabled={gameState !== 'playing' || briefing}
          style={{ width: '160px', padding: '18px', borderRadius: '20px', fontWeight: 800, fontSize: '1.1rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
        >
          {t.pumpLabel}
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.05, background: 'rgba(16,185,129,0.05)' }}
          whileTap={{ scale: 0.95 }}
          className="btn"
          aria-label={t.ariaBank}
          onClick={handleBank}
          disabled={gameState !== 'playing' || currentBalloonSize === 1 || briefing}
          style={{ width: '160px', padding: '18px', borderRadius: '20px', fontWeight: 800, fontSize: '1.1rem', border: '2px solid #10b981', color: '#059669', background: 'transparent' }}
        >
          {t.bankBtn}
        </motion.button>
      </div>

      <div style={{ position: 'absolute', bottom: '20px', fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
        {language === 'es' ? 'ESPACIO: INFLAR • ENTER: ASEGURAR' : 'SPACE: PUMP • ENTER: BANK'}
      </div>
    </div>
  );
};

export default BalloonGame;
