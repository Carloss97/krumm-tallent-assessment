import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import { playMemoryClick, playMemoryFlash } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useLanguage } from '../context/LanguageContext';

const GoNoGoGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();
  const { language } = useLanguage();

  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctGo, setCorrectGo] = useState(0);
  const [correctNoGo, setCorrectNoGo] = useState(0);
  const [commissionErrors, setCommissionErrors] = useState(0);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [flashWrong, setFlashWrong] = useState(false);
  const [flashRight, setFlashRight] = useState(false);
  const flashTimeoutRef = useRef(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef(null);

  const reactionTimes = useRef([]);
  const stimulusStartTimeRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const hasEndedRef = useRef(false);
  const startTrialRef = useRef(null);
  const nextTrialRef = useRef(null);
  const handleTimeoutRef = useRef(null);

  const MAX_TRIALS = isDemo ? 25 : 100;
  const GO_PROBABILITY = isDemo ? 0.8 : 0.7;
  const RESPONSE_WINDOW = isDemo ? 2000 : 1400;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const totalGoTrials = Math.round(MAX_TRIALS * GO_PROBABILITY);
    const totalNoGoTrials = MAX_TRIALS - totalGoTrials;
    const goAccuracy = totalGoTrials > 0 ? Math.round((correctGo / totalGoTrials) * 100) : 0;
    const noGoAccuracy = totalNoGoTrials > 0 ? Math.round((correctNoGo / totalNoGoTrials) * 100) : 0;
    const avgReactionTime = reactionTimes.current.length > 0 ? Math.round(reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length) : 0;
    stopTracking('game11', score, commissionErrors + omissionErrors, { goAccuracy, noGoAccuracy, commissionErrors, omissionErrors, avgReactionTime, totalTrials: MAX_TRIALS });
    onEndGame(score, commissionErrors + omissionErrors, { goAccuracy, noGoAccuracy, commissionErrors, omissionErrors, avgReactionTime, totalTrials: MAX_TRIALS });
  }, [onEndGame, score, commissionErrors, omissionErrors, correctGo, correctNoGo, MAX_TRIALS, GO_PROBABILITY, stopTracking]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  // use refs for interdependent functions to avoid temporal-dead-zone errors
  const nextTrialFunc = () => {
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(prev => prev + 1);
      // schedule next trial start after a short gap (avoid racing with state updates)
      setTimeout(() => {
        if (!hasEndedRef.current && typeof startTrialRef.current === 'function') startTrialRef.current();
      }, 500);
    }
  };
  nextTrialRef.current = nextTrialFunc;

  const handleTimeoutFunc = (isGoTrial) => {
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    if (isGoTrial) {
      setOmissionErrors(prev => prev + 1);
      recordError();
    } else {
      setCorrectNoGo(prev => prev + 1);
      setScore(prev => prev + 5);
    }
    setGameState('feedback');
    const next = nextTrialRef.current;
    setTimeout(() => { if (typeof next === 'function') next(); }, isGoTrial ? 1000 : 500);
  };
  handleTimeoutRef.current = handleTimeoutFunc;

  const startTrialFunc = () => {
    // clear any pending response timeout before starting
    if (responseTimeoutRef.current) clearTimeout(responseTimeoutRef.current);
    const isGoTrial = Math.random() < GO_PROBABILITY;
    setCurrentStimulus(isGoTrial ? 'GO' : 'NO-GO');
    setGameState('stimulus');
    stimulusStartTimeRef.current = performance.now();
    const handler = handleTimeoutRef.current;
    responseTimeoutRef.current = setTimeout(() => { if (typeof handler === 'function') handler(isGoTrial); }, RESPONSE_WINDOW);
  };
  startTrialRef.current = startTrialFunc;

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      startTracking();
      setTrial(1);
      setScore(0);
      setCorrectGo(0);
      setCorrectNoGo(0);
      setCommissionErrors(0);
      setOmissionErrors(0);
      reactionTimes.current = [];
      // call via ref to ensure the latest handler chain is used
      if (typeof startTrialRef.current === 'function') startTrialRef.current();
    }
    return () => clearTimeout(responseTimeoutRef.current);
  }, [isActive, startTracking]);

  

  const handleResponse = useCallback(() => {
    if (gameState !== 'stimulus') return;
    clearTimeout(responseTimeoutRef.current);
    reactionTimes.current.push(performance.now() - stimulusStartTimeRef.current);
    const isGoTrial = currentStimulus === 'GO';

    if (isGoTrial) {
      setCorrectGo(prev => {
        const newVal = prev + 1;
        if (newVal % 10 === 0) {
          setShowConfetti(true);
          if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
          confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 1200);
        }
        return newVal;
      });
      setScore(prev => prev + 10);
      try { playMemoryClick(); } catch (e) {}
      // visual feedback for a correct GO
      setFlashRight(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashRight(false), 350);
    } else {
      setCommissionErrors(prev => prev + 1);
      recordError();
      try { playMemoryFlash(); } catch (e) {}
      // visual feedback for incorrect responses
      setFlashWrong(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashWrong(false), 350);
    }
    setGameState('feedback');
    const next = nextTrialRef.current;
    setTimeout(() => { if (typeof next === 'function') next(); }, isGoTrial ? 500 : 1000);
  }, [currentStimulus, gameState, recordError]);
  

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && isActive) {
        // prevent default page scroll when the game is active
        event.preventDefault();
        if (gameState === 'stimulus') handleResponse();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, gameState, handleResponse]);

  // Allow a clickable response for accessibility (desktop/touch)
  const clickableResponse = (e) => { if (e && e.preventDefault) e.preventDefault(); if (isActive && gameState === 'stimulus') handleResponse(); };

  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
    };
  }, []);

  if (!isActive) {
      return <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}><div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div><p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p></motion.div>
  }
  
  const totalGoTrials = Math.round(trial * GO_PROBABILITY);
  const totalNoGoTrials = trial - totalGoTrials;
  const goAccuracy = totalGoTrials > 0 ? Math.round((correctGo / totalGoTrials) * 100) : 0;
  const noGoAccuracy = totalNoGoTrials > 0 ? Math.round((correctNoGo / totalNoGoTrials) * 100) : 0;
  const progress = (trial / MAX_TRIALS) * 100;

  const hudShadow = flashWrong ? '0 0 40px rgba(239,68,68,0.8)' : (flashRight ? '0 0 40px rgba(16,185,129,0.8)' : (gameState === 'stimulus' ? '0 0 40px rgba(59, 130, 246, 0.6)' : '0 8px 25px rgba(0,0,0,0.1)'));

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', paddingTop: '80px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      {showConfetti && <Confetti count={12} spread={80} duration={1.1} />}
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{trial}</span> / {MAX_TRIALS}</div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      <div aria-live="polite" style={{position:'absolute', left:-9999, width:1, height:1, overflow:'hidden'}}>{gameState === 'feedback' ? (currentStimulus === 'GO' ? 'Correct' : 'Incorrect') : ''}</div>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '10px' }}>Go Accuracy: {goAccuracy}% | No-Go Accuracy: {noGoAccuracy}%</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Correct Go: {correctGo} | Correct No-Go: {correctNoGo}</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Commission: {commissionErrors} | Omission: {omissionErrors}</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={gameState + trial} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} style={{ width: '300px', height: '300px', borderRadius: '50%', backgroundColor: gameState === 'stimulus' ? '#3b82f6' : '#f3f4f6', border: '4px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', boxShadow: hudShadow }}>
          {gameState === 'stimulus' && currentStimulus && <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', textShadow: '0 3px 6px rgba(0,0,0,0.4)' }}>{currentStimulus}</div>}
          {gameState === 'waiting' && <div style={{ fontSize: '1.5rem', color: '#6b7280', textAlign: 'center' }}>Get Ready...</div>}
          {gameState === 'feedback' && <div style={{ fontSize: '2rem', color: flashWrong ? '#ef4444' : '#10b981', textAlign: 'center', fontWeight: 'bold' }}>{flashWrong ? (language === 'es' ? 'Incorrecto' : 'Incorrect') : (language === 'es' ? 'Correcto' : 'Correct')}</div>}
        </motion.div>
      </AnimatePresence>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>{language === 'es' ? 'Pulsa BARRA ESPACIADORA para GO' : 'Press SPACEBAR for GO stimuli'}</div>
        <div style={{ fontSize: '1rem', color: '#9ca3af' }}>{language === 'es' ? 'No pulses para NO-GO' : 'Do not press for NO-GO stimuli'}</div>
        <div><button className="btn" onClick={clickableResponse} style={{ marginTop: 8 }}>{language === 'es' ? 'RESPONDER' : 'RESPOND'}</button></div>
      </div>
      <div style={{ width: '400px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }} /></div>
    </div>
  );
};

export default GoNoGoGame;
