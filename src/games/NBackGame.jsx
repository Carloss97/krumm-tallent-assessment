import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import { playMemoryClick, playMemoryFlash } from '../utils/audio';
import Confetti from '../components/Confetti';

const NBackGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();

  const [round, setRound] = useState(1);
  const [nBack, setNBack] = useState(2);
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [gameState, setGameState] = useState('waiting');
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);

  const stimulusStartTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);
  const gameStateRef = useRef('waiting');
  const isPlayingRef = useRef(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiTimeoutRef = useRef(null);

  const MAX_ROUNDS = isDemo ? 3 : 5;
  const STIMULUS_DURATION = isDemo ? 700 : 500;
  const RESPONSE_WINDOW = isDemo ? 2500 : 2000;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const avgReactionTime = reactionTimes.length > 0 ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length) : 0;
    stopTracking('game8', score, totalErrors, { totalCorrect, totalErrors, avgReactionTime, nBackLevel: nBack });
    onEndGame(score, totalErrors, { totalCorrect, totalErrors, avgReactionTime, nBackLevel: nBack });
  }, [onEndGame, score, totalErrors, totalCorrect, reactionTimes, nBack, stopTracking]);
  
  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const setGameStateSafe = useCallback((newState) => {
    gameStateRef.current = newState;
    setGameState(newState);
  }, []);

  const advanceRound = useCallback(() => {
    if (round >= MAX_ROUNDS) {
      endGame();
    } else {
      const nextRound = round + 1;
      setRound(nextRound);
      if (!isDemo && nextRound > 2) setNBack(3);
    }
  }, [round, MAX_ROUNDS, endGame, isDemo]);

  useEffect(() => {
    if (round > 1) {
      setShowConfetti(true);
      if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current);
      confettiTimeoutRef.current = setTimeout(() => setShowConfetti(false), 1200);
    }
  }, [round]);
  
  const generateRound = useCallback(() => {
    const length = isDemo ? 6 + round * 2 : 8 + round * 2;
    const newSequence = [];
    const stimuli = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    for (let i = 0; i < length; i++) {
      if (i >= nBack && Math.random() < 0.3) {
        newSequence.push(newSequence[i - nBack]);
      } else {
        let stimulus;
        do { stimulus = stimuli[Math.floor(Math.random() * stimuli.length)]; } 
        while (i >= nBack && stimulus === newSequence[i - nBack]);
        newSequence.push(stimulus);
      }
    }
    setSequence(newSequence);
    setCurrentIndex(0);
    setGameStateSafe('waiting');
  }, [round, nBack, setGameStateSafe]);

  const handleNoResponse = useCallback(() => {
    if (gameStateRef.current !== 'responding') return;
    const isActualMatch = currentIndex >= nBack && sequence[currentIndex] === sequence[currentIndex - nBack];
    if (isActualMatch) { setTotalErrors(prev => prev + 1); recordError(); }
    setGameStateSafe('waiting');
  }, [currentIndex, nBack, recordError, sequence, setGameStateSafe]);

  const playRound = useCallback(async () => {
    if (isPlayingRef.current) return;
    isPlayingRef.current = true;
    for (let i = 0; i < sequence.length; i++) {
      if (!isActiveRef.current) return;
      setCurrentIndex(i);
      setCurrentStimulus(sequence[i]);
      setGameStateSafe('showing');
      stimulusStartTimeRef.current = performance.now();
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(() => {
          setGameStateSafe('responding');
          resolve();
        }, STIMULUS_DURATION);
      });
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(() => {
          handleNoResponse();
          resolve();
        }, RESPONSE_WINDOW - STIMULUS_DURATION);
      });
    }
    isPlayingRef.current = false;
    advanceRound();
  }, [sequence, STIMULUS_DURATION, RESPONSE_WINDOW, handleNoResponse, advanceRound, setGameStateSafe]);

  useEffect(() => {
    if (isActive) {
      isActiveRef.current = true;
      hasEndedRef.current = false;
      startTracking();
      setRound(1);
      setNBack(2);
      setScore(0);
      setTotalCorrect(0);
      setTotalErrors(0);
      setReactionTimes([]);
      gameStateRef.current = 'waiting';
    } else {
      isActiveRef.current = false;
      clearTimeout(timeoutRef.current);
    }
  }, [isActive, startTracking]);

  useEffect(() => {
      if(isActive) {
        generateRound();
      }
  }, [isActive, round, generateRound])

  useEffect(() => {
    return () => { if (confettiTimeoutRef.current) clearTimeout(confettiTimeoutRef.current); };
  }, []);

  useEffect(() => {
    if (isActive && sequence.length > 0) {
       
      playRound();
    }
  }, [isActive, sequence, playRound]);

  const handleResponse = (isMatch) => {
    if (gameState !== 'responding') return;
    const rt = performance.now() - stimulusStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);
    const isActualMatch = currentIndex >= nBack && sequence[currentIndex] === sequence[currentIndex - nBack];
    if (isMatch === isActualMatch) { setTotalCorrect(prev => prev + 1); setScore(prev => prev + 10); } 
    else { setTotalErrors(prev => prev + 1); recordError(); }
    setGameStateSafe('waiting');
    try { if (isMatch === isActualMatch) playMemoryClick(); else playMemoryFlash(); } catch (error) { void error; }
  };

  // Keyboard shortcuts for accessibility: M = match, N = no-match
  useEffect(() => {
    const onKey = (e) => {
      if (!isActive || gameState !== 'responding') return;
      if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        handleResponse(true);
      }
      if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        handleResponse(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isActive, gameState, handleResponse]);

  if (!isActive) {
      return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}>
            <div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div>
            <p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p>
          </motion.div>
      )
  }

  const accuracy = totalCorrect + totalErrors > 0 ? Math.round((totalCorrect / (totalCorrect + totalErrors)) * 100) : 0;

  return (
    <div className="flex-center" style={{ width: '100%', minHeight: '620px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      {showConfetti && <Confetti count={12} spread={80} duration={1.1} />}
      <div style={{ position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.95rem', color: '#374151', zIndex: 55, background: 'rgba(255,255,255,0.9)', backdropFilter:'blur(6px)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.12)', display: 'flex', gap: '12px', alignItems: 'center', fontWeight: '600' }}>
        <span>ROUND: <span style={{color: '#4f46e5', fontWeight: '700'}}>{round}</span> / {MAX_ROUNDS}</span>
        <span>SCORE: <span style={{ color: '#059669', fontWeight: '700' }}>{score}</span></span>
        {isDemo && <span>T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: '700' }}>{timeLeft}s</span></span>}
      </div>
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '10px' }}>{nBack}-Back Task | Accuracy: {accuracy}%</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Correct: {totalCorrect} | Errors: {totalErrors}</div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div key={gameState} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.1 }} style={{ width: '200px', height: '200px', borderRadius: '12px', backgroundColor: gameState === 'showing' ? '#3b82f6' : '#f3f4f6', border: '3px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '40px', boxShadow: gameState === 'showing' ? '0 0 30px rgba(59, 130, 246, 0.5)' : '0 4px 20px rgba(0,0,0,0.1)' }}>
          {gameState === 'showing' && currentStimulus && <div style={{ fontSize: '4rem', fontWeight: 'bold', color: 'white', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>{currentStimulus}</div>}
          {gameState === 'responding' && <div style={{ fontSize: '1.5rem', color: '#6b7280', textAlign: 'center' }}>Respond Now</div>}
          {gameState === 'waiting' && <div style={{ fontSize: '1.2rem', color: '#9ca3af', textAlign: 'center' }}>Get Ready...</div>}
        </motion.div>
      </AnimatePresence>
      <div style={{ display: 'flex', gap: '24px' }}>
        <button className="btn" onClick={() => handleResponse(true)} disabled={gameState !== 'responding'} style={{ width: 'auto', minWidth: '140px', padding: '14px 20px', backgroundColor: gameState === 'responding' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)', border: gameState === 'responding' ? '2px solid #10b981' : '2px solid #d1d5db', color: gameState === 'responding' ? '#10b981' : '#9ca3af', fontWeight: 'bold' }}>MATCH</button>
        <button className="btn" onClick={() => handleResponse(false)} disabled={gameState !== 'responding'} style={{ width: 'auto', minWidth: '140px', padding: '14px 20px', backgroundColor: gameState === 'responding' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)', border: gameState === 'responding' ? '2px solid #ef4444' : '2px solid #d1d5db', color: gameState === 'responding' ? '#ef4444' : '#9ca3af', fontWeight: 'bold' }}>NO MATCH</button>
      </div>
    </div>
  );
};

export default NBackGame;
