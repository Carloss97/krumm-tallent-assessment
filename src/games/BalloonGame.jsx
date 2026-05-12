/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { playBalloonPump, playBalloonPop, playSuccessSound, playErrorSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';

const DEFAULT_VIEWPORT = { width: 1366, height: 768 };

const getCurrentViewport = () => {
  if (typeof window === 'undefined') return DEFAULT_VIEWPORT;
  return {
    width: window.innerWidth || DEFAULT_VIEWPORT.width,
    height: window.innerHeight || DEFAULT_VIEWPORT.height,
  };
};

const useViewportSize = () => {
  const [viewport, setViewport] = useState(getCurrentViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateViewport = () => setViewport(getCurrentViewport());
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener?.('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener?.('resize', updateViewport);
    };
  }, []);

  return viewport;
};

export const getBalloonLayoutMetrics = (viewport = DEFAULT_VIEWPORT) => {
  const height = viewport?.height || DEFAULT_VIEWPORT.height;
  const width = viewport?.width || DEFAULT_VIEWPORT.width;
  const isCompact = height <= 820 || width <= 1180;
  const isVeryShort = height <= 680;

  return {
    isCompact,
    containerMinHeight: isCompact ? 0 : 600,
    containerHeight: isCompact ? '100%' : 'auto',
    maxVisualScale: isVeryShort ? 2.2 : isCompact ? 2.45 : 2.8,
    controlsBottom: isVeryShort ? 30 : isCompact ? 36 : 60,
    hintBottom: isCompact ? 10 : 20,
    statsTop: isVeryShort ? 18 : isCompact ? 24 : 40,
    padding: isCompact ? 12 : 20,
    gap: isCompact ? 12 : 20,
    buttonWidth: width <= 420 ? 136 : isCompact ? 148 : 160,
    buttonPadding: isCompact ? 14 : 18,
    bodyBottomReserve: isCompact ? 124 : 150,
    bodyTopReserve: isCompact ? 86 : 112,
  };
};

const BalloonGame = ({ isActive, onEndGame, isDemo, showBriefing = true }) => {
  const MAX_ROUNDS = isDemo ? 10 : 10;
  const MIN_PUMPS = 6;
  const { startTracking, stopTracking, recordError, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const viewportSize = useViewportSize();
  const layoutMetrics = getBalloonLayoutMetrics(viewportSize);

  const [round, setRound] = useState(1);
  const [currentBalloonSize, setCurrentBalloonSize] = useState(1);
  const [currentRoundPoints, setCurrentRoundPoints] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  const [explosionPoint, setExplosionPoint] = useState(0);
  const [gameState, setGameState] = useState('playing'); // playing, exploded, banked
  const [showConfetti, setShowConfetti] = useState(false);
  const [shake, setShake] = useState(0);
  const [briefing, setBriefing] = useState(Boolean(isDemo && showBriefing));
  const [retryUsed, setRetryUsed] = useState(false);
  const [reviewScore, setReviewScore] = useState(0);
  const [reviewPops, setReviewPops] = useState(0);

  const totalPointsRef = useRef(0);
  const popsRef = useRef(0);
  const hasEndedRef = useRef(false);
  const roundRef = useRef(1);
  const retryUsedRef = useRef(false);

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

    const nextRound = roundRef.current + 1;

    if (nextRound > MAX_ROUNDS) {
      hasEndedRef.current = true;
      stopTracking('game4', totalPointsRef.current, popsRef.current, { pops: popsRef.current });
      if (isDemo) {
        recordTrialEvent({
          event: 'balloon_review_shown',
          payload: {
            score: totalPointsRef.current,
            pops: popsRef.current,
            retryAvailable: !retryUsedRef.current,
          },
        });
        setReviewScore(totalPointsRef.current);
        setReviewPops(popsRef.current);
        setGameState('review');
        return;
      }
      // Defer onEndGame to avoid calling parent setState during a render cycle
      queueMicrotask(() => onEndGame(totalPointsRef.current, popsRef.current));
      return;
    }

    roundRef.current = nextRound;
    setRound(nextRound);
    setTimeout(() => initRound(), 0);
  }, [MAX_ROUNDS, onEndGame, initRound, stopTracking, isDemo, recordTrialEvent]);

  const restartDemoOnce = useCallback(() => {
    if (retryUsedRef.current || !isDemo) return;

    retryUsedRef.current = true;
    setRetryUsed(true);
    hasEndedRef.current = false;
    totalPointsRef.current = 0;
    popsRef.current = 0;
    roundRef.current = 1;
    setRound(1);
    setTotalPoints(0);
    setReviewScore(0);
    setReviewPops(0);
    recordTrialEvent({ event: 'balloon_retry_selected', payload: { previousScore: reviewScore, previousPops: reviewPops } });
    startTracking();
    initRound();
  }, [initRound, isDemo, recordTrialEvent, reviewPops, reviewScore, startTracking]);

  const continueAfterReview = useCallback(() => {
    recordTrialEvent({
      event: 'balloon_review_continued',
      payload: { score: reviewScore, pops: reviewPops, retryUsed: retryUsedRef.current },
    });
    queueMicrotask(() => onEndGame(reviewScore, reviewPops));
  }, [onEndGame, recordTrialEvent, reviewPops, reviewScore]);

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
      retryUsedRef.current = false;
      startTracking();
      roundRef.current = 1;
      setRound(1);
      setTotalPoints(0);
      setRetryUsed(false);
      setReviewScore(0);
      setReviewPops(0);
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
      startBtn: 'Iniciar Operación',
      reviewTitle: '¿Querés reintentar este primer juego?',
      reviewBody: 'Tu resultado queda registrado para la demo. Si no estás conforme, podés reiniciar este juego una sola vez antes de continuar.',
      reviewDoneTitle: 'Segundo intento completado',
      reviewDoneBody: 'Ya usaste el reintento disponible. Continuemos con los desafíos de rutas y razonamiento espacial.',
      retryBtn: 'Reintentar una vez',
      continueBtn: 'Continuar',
      scoreLabel: 'Puntaje',
      popsLabel: 'Colapsos'
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
      startBtn: 'Start Operation',
      reviewTitle: 'Do you want to retry this first game?',
      reviewBody: 'Your result is recorded for the demo. If you are not satisfied, you can restart this game one time before continuing.',
      reviewDoneTitle: 'Second attempt completed',
      reviewDoneBody: 'You already used the available retry. Let’s continue with the routing and spatial reasoning challenges.',
      retryBtn: 'Retry once',
      continueBtn: 'Continue',
      scoreLabel: 'Score',
      popsLabel: 'Collapses'
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
  const visualScale = Math.min(rawScale, layoutMetrics.maxVisualScale);
  
  // Dynamic color based on size (risk)
  const hue = Math.max(0, 240 - (currentBalloonSize * 15)); // Starts blue, goes to red
  const balloonColor = `hsl(${hue}, 70%, 50%)`;
  const balloonGradient = `radial-gradient(circle at 35% 35%, hsl(${hue}, 60%, 75%) 0%, ${balloonColor} 50%, hsl(${hue}, 80%, 25%) 100%)`;

  return (
    <div style={{ width: '100%', height: layoutMetrics.containerHeight, minHeight: layoutMetrics.containerMinHeight, maxHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: layoutMetrics.padding, gap: layoutMetrics.gap, position: 'relative', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      <AnimatePresence>
        {gameState === 'review' && (
          <motion.div
            key="review"
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-panel"
            style={{
              padding: '40px',
              maxWidth: '560px',
              width: 'min(92vw, 560px)',
              textAlign: 'center',
              border: '1px solid rgba(99,102,241,0.18)',
              boxShadow: '0 30px 70px -24px rgba(15,23,42,0.35)',
              background: 'rgba(255,255,255,0.96)',
              zIndex: 120,
            }}
          >
            <div style={{ color: '#4f46e5', fontSize: '0.78rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '12px' }}>
              {language === 'es' ? 'Cierre del primer juego' : 'First game checkpoint'}
            </div>
            <h4 style={{ margin: 0, color: '#1e1b4b', fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.03em' }}>
              {retryUsed ? t.reviewDoneTitle : t.reviewTitle}
            </h4>
            <p style={{ margin: '18px 0 26px', color: '#475569', lineHeight: 1.65, fontSize: '1rem', fontWeight: 500 }}>
              {retryUsed ? t.reviewDoneBody : t.reviewBody}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '12px', marginBottom: '28px' }}>
              <div style={{ padding: '16px', borderRadius: '18px', background: '#eef2ff', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900 }}>{t.scoreLabel}</div>
                <div style={{ color: '#1e1b4b', fontSize: '1.8rem', fontWeight: 950 }}>{reviewScore}</div>
              </div>
              <div style={{ padding: '16px', borderRadius: '18px', background: '#fef2f2', border: '1px solid rgba(239,68,68,0.16)' }}>
                <div style={{ color: '#64748b', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 900 }}>{t.popsLabel}</div>
                <div style={{ color: '#b91c1c', fontSize: '1.8rem', fontWeight: 950 }}>{reviewPops}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {!retryUsed && (
                <button className="btn" type="button" onClick={restartDemoOnce} style={{ padding: '16px', borderRadius: '18px', fontWeight: 900, border: '2px solid #4f46e5', color: '#4f46e5' }}>
                  {t.retryBtn}
                </button>
              )}
              <button className="btn btn-primary" type="button" onClick={continueAfterReview} style={{ padding: '16px', borderRadius: '18px', fontWeight: 900 }}>
                {t.continueBtn}
              </button>
            </div>
          </motion.div>
        )}

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

      <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', maxWidth: '500px', padding: layoutMetrics.isCompact ? '0 12px' : '0 20px', position: 'absolute', top: layoutMetrics.statsTop, zIndex: 10 }}>
        <div className="glass-panel" style={{ padding: layoutMetrics.isCompact ? '8px 16px' : '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(99,102,241,0.15)', background: 'rgba(255,255,255,0.8)' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>{t.trialLabel}</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1e1b4b' }}>{round}<span style={{ color: '#94a3b8', fontSize: '1rem', fontWeight: 500 }}>/{MAX_ROUNDS}</span></span>
        </div>
        <div className="glass-panel" style={{ padding: layoutMetrics.isCompact ? '8px 16px' : '10px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', border: '1px solid rgba(16,185,129,0.15)', background: 'rgba(255,255,255,0.8)' }}>
          <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 800 }}>{t.bankTitle}</span>
          <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#059669' }}>{totalPoints}</span>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', minHeight: 0, position: 'relative', paddingTop: layoutMetrics.bodyTopReserve, paddingBottom: layoutMetrics.bodyBottomReserve, boxSizing: 'border-box' }}>
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

      <div style={{ position: 'absolute', bottom: layoutMetrics.controlsBottom, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: layoutMetrics.isCompact ? '14px' : '20px', zIndex: 100 }}>
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 10px 20px -5px rgba(79,70,229,0.4)' }}
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary"
          aria-label={t.ariaPump}
          onClick={handlePump}
          disabled={gameState !== 'playing' || briefing}
          style={{ width: layoutMetrics.buttonWidth, padding: layoutMetrics.buttonPadding, borderRadius: '20px', fontWeight: 800, fontSize: layoutMetrics.isCompact ? '1rem' : '1.1rem', background: 'linear-gradient(135deg, #6366f1, #4f46e5)' }}
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
          style={{ width: layoutMetrics.buttonWidth, padding: layoutMetrics.buttonPadding, borderRadius: '20px', fontWeight: 800, fontSize: layoutMetrics.isCompact ? '1rem' : '1.1rem', border: '2px solid #10b981', color: '#059669', background: 'transparent' }}
        >
          {t.bankBtn}
        </motion.button>
      </div>

      <div style={{ position: 'absolute', bottom: layoutMetrics.hintBottom, fontSize: layoutMetrics.isCompact ? '0.68rem' : '0.75rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>
        {language === 'es' ? 'ESPACIO: INFLAR • ENTER: ASEGURAR' : 'SPACE: PUMP • ENTER: BANK'}
      </div>
    </div>
  );
};

export default BalloonGame;
