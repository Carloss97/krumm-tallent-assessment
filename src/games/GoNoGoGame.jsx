import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import { playMemoryClick, playMemoryFlash } from '../utils/audio';

const GoNoGoGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();

  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctGo, setCorrectGo] = useState(0);
  const [correctNoGo, setCorrectNoGo] = useState(0);
  const [commissionErrors, setCommissionErrors] = useState(0);
  const [omissionErrors, setOmissionErrors] = useState(0);

  const reactionTimes = useRef([]);
  const stimulusStartTimeRef = useRef(null);
  const responseTimeoutRef = useRef(null);
  const hasEndedRef = useRef(false);

  const MAX_TRIALS = isDemo ? 25 : 100;
  const GO_PROBABILITY = isDemo ? 0.8 : 0.7;
  const RESPONSE_WINDOW = isDemo ? 1400 : 1000;

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

  const nextTrial = useCallback(() => {
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(prev => prev + 1);
    }
  }, [trial, MAX_TRIALS, endGame]);

  const handleTimeout = useCallback((isGoTrial) => {
    if (isGoTrial) {
      setOmissionErrors(prev => prev + 1);
      recordError();
    } else {
      setCorrectNoGo(prev => prev + 1);
      setScore(prev => prev + 5);
    }
    setGameState('feedback');
    setTimeout(nextTrial, isGoTrial ? 1000 : 500);
  }, [nextTrial, recordError]);

  const startTrial = useCallback(() => {
    const isGoTrial = Math.random() < GO_PROBABILITY;
    setCurrentStimulus(isGoTrial ? 'GO' : 'NO-GO');
    setGameState('stimulus');
    stimulusStartTimeRef.current = performance.now();
    responseTimeoutRef.current = setTimeout(() => handleTimeout(isGoTrial), RESPONSE_WINDOW);
  }, [GO_PROBABILITY, RESPONSE_WINDOW, handleTimeout]);

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
      startTrial();
    }
    return () => clearTimeout(responseTimeoutRef.current);
  }, [isActive, startTrial, startTracking]);

  useEffect(() => {
    if(isActive && trial > 1) {
         
        setGameState('waiting');
        setTimeout(() => startTrial(), 500);
    }
  }, [trial, isActive, startTrial])

  const handleResponse = useCallback(() => {
    if (gameState !== 'stimulus') return;
    clearTimeout(responseTimeoutRef.current);
    reactionTimes.current.push(performance.now() - stimulusStartTimeRef.current);
    const isGoTrial = currentStimulus === 'GO';

    if (isGoTrial) {
      setCorrectGo(prev => prev + 1);
      setScore(prev => prev + 10);
      try { playMemoryClick(); } catch (e) {}
    } else {
      setCommissionErrors(prev => prev + 1);
      recordError();
      try { playMemoryFlash(); } catch (e) {}
    }
    setGameState('feedback');
    setTimeout(nextTrial, isGoTrial ? 500 : 1000);
  }, [currentStimulus, gameState, nextTrial, recordError]);

  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && isActive && gameState === 'stimulus') {
        event.preventDefault();
        handleResponse();
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, gameState, handleResponse]);

  if (!isActive) {
      return <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}><div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div><p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p></motion.div>
  }
  
  const totalGoTrials = Math.round(trial * GO_PROBABILITY);
  const totalNoGoTrials = trial - totalGoTrials;
  const goAccuracy = totalGoTrials > 0 ? Math.round((correctGo / totalGoTrials) * 100) : 0;
  const noGoAccuracy = totalNoGoTrials > 0 ? Math.round((correctNoGo / totalNoGoTrials) * 100) : 0;
  const progress = (trial / MAX_TRIALS) * 100;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{trial}</span> / {MAX_TRIALS}</div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '10px' }}>Go Accuracy: {goAccuracy}% | No-Go Accuracy: {noGoAccuracy}%</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Correct Go: {correctGo} | Correct No-Go: {correctNoGo}</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Commission: {commissionErrors} | Omission: {omissionErrors}</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={gameState + trial} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }} style={{ width: '300px', height: '300px', borderRadius: '50%', backgroundColor: gameState === 'stimulus' ? '#3b82f6' : '#f3f4f6', border: '4px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', boxShadow: gameState === 'stimulus' ? '0 0 40px rgba(59, 130, 246, 0.6)' : '0 8px 25px rgba(0,0,0,0.1)' }}>
          {gameState === 'stimulus' && currentStimulus && <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'white', textShadow: '0 3px 6px rgba(0,0,0,0.4)' }}>{currentStimulus}</div>}
          {gameState === 'waiting' && <div style={{ fontSize: '1.5rem', color: '#6b7280', textAlign: 'center' }}>Get Ready...</div>}
          {gameState === 'feedback' && <div style={{ fontSize: '2rem', color: '#10b981', textAlign: 'center', fontWeight: 'bold' }}>OK</div>}
        </motion.div>
      </AnimatePresence>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>Press SPACEBAR for GO stimuli</div>
        <div style={{ fontSize: '1rem', color: '#9ca3af' }}>Do not press for NO-GO stimuli</div>
      </div>
      <div style={{ width: '400px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }} /></div>
    </div>
  );
};

export default GoNoGoGame;
