import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const GoNoGoGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordError, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);

  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [gameState, setGameState] = useState('waiting'); // waiting, stimulus, feedback
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctGo, setCorrectGo] = useState(0);
  const [correctNoGo, setCorrectNoGo] = useState(0);
  const [commissionErrors, setCommissionErrors] = useState(0);
  const [omissionErrors, setOmissionErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const stimulusStartTimeRef = useRef(null);
  const responseTimeoutRef = useRef(null);

  const MAX_TRIALS = isDemo ? 50 : 100;
  const GO_PROBABILITY = isDemo ? 0.8 : 0.7; // 80% go trials in demo, 70% in full
  const STIMULUS_DURATION = 300; // ms
  const RESPONSE_WINDOW = 1000; // ms

  useEffect(() => {
    if (isActive) {
      startTracking();
      isActiveRef.current = true;
      startTrial();
    }
    return () => clearTimeout(responseTimeoutRef.current);
  }, [isActive]);

  useEffect(() => {
    if (isActive && isDemo) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, isDemo]);

  const startTrial = () => {
    // Determine if this is a go or no-go trial
    const isGoTrial = Math.random() < GO_PROBABILITY;
    const stimulus = isGoTrial ? 'GO' : 'NO-GO';

    setCurrentStimulus(stimulus);
    setGameState('stimulus');
    stimulusStartTimeRef.current = performance.now();

    // Set timeout for response window
    responseTimeoutRef.current = setTimeout(() => {
      handleTimeout(isGoTrial);
    }, RESPONSE_WINDOW);
  };

  const handleResponse = () => {
    if (gameState !== 'stimulus') return;

    clearTimeout(responseTimeoutRef.current);
    const rt = performance.now() - stimulusStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);

    const isGoTrial = currentStimulus === 'GO';

    if (isGoTrial) {
      // Correct response to go stimulus
      setCorrectGo(prev => prev + 1);
      setScore(prev => prev + 10);
      setGameState('feedback');
      setTimeout(() => nextTrial(), 500);
    } else {
      // Incorrect response to no-go stimulus (commission error)
      setCommissionErrors(prev => prev + 1);
      recordError();
      setGameState('feedback');
      setTimeout(() => nextTrial(), 1000);
    }
  };

  const handleTimeout = (isGoTrial) => {
    if (isGoTrial) {
      // Missed go stimulus (omission error)
      setOmissionErrors(prev => prev + 1);
      recordError();
    } else {
      // Correct no-go (no response)
      setCorrectNoGo(prev => prev + 1);
      setScore(prev => prev + 5);
    }

    setGameState('feedback');
    setTimeout(() => nextTrial(), isGoTrial ? 1000 : 500);
  };

  const nextTrial = () => {
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(prev => prev + 1);
      setGameState('waiting');
      setTimeout(() => startTrial(), 500);
    }
  };

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);

    const totalGoTrials = Math.round(MAX_TRIALS * GO_PROBABILITY);
    const totalNoGoTrials = MAX_TRIALS - totalGoTrials;

    const goAccuracy = totalGoTrials > 0 ? Math.round((correctGo / totalGoTrials) * 100) : 0;
    const noGoAccuracy = totalNoGoTrials > 0 ? Math.round((correctNoGo / totalNoGoTrials) * 100) : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    stopTracking('game11', score, commissionErrors + omissionErrors, {
      goAccuracy,
      noGoAccuracy,
      commissionErrors,
      omissionErrors,
      avgReactionTime,
      totalTrials: MAX_TRIALS
    });

    setTimeout(() => {
      navigate('/game/12', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  // Handle spacebar press
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.code === 'Space' && isActive && gameState === 'stimulus') {
        event.preventDefault();
        handleResponse();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isActive, gameState]);

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type="Response Inhibition"
        title="Go/No-Go Task"
        description="Press the SPACEBAR as quickly as possible when you see 'GO', but do NOT press anything when you see 'NO-GO'. This tests your ability to inhibit automatic responses."
        timeLimit={isDemo ? "60s" : "None"}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  const totalGoTrials = Math.round(trial * GO_PROBABILITY);
  const totalNoGoTrials = trial - totalGoTrials;
  const goAccuracy = totalGoTrials > 0 ? Math.round((correctGo / totalGoTrials) * 100) : 0;
  const noGoAccuracy = totalNoGoTrials > 0 ? Math.round((correctNoGo / totalNoGoTrials) * 100) : 0;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{trial}</span> / {MAX_TRIALS}
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span>
      </div>

      {isDemo && (
        <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
          T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
        </div>
      )}

      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '10px' }}>
          Go Accuracy: {goAccuracy}% • No-Go Accuracy: {noGoAccuracy}%
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Correct Go: {correctGo} • Correct No-Go: {correctNoGo}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Commission: {commissionErrors} • Omission: {omissionErrors}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={gameState + trial}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.2 }}
          style={{
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            backgroundColor: gameState === 'stimulus' ? '#3b82f6' : '#f3f4f6',
            border: '4px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            boxShadow: gameState === 'stimulus' ? '0 0 40px rgba(59, 130, 246, 0.6)' : '0 8px 25px rgba(0,0,0,0.1)'
          }}
        >
          {gameState === 'stimulus' && currentStimulus && (
            <div style={{
              fontSize: '3rem',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 3px 6px rgba(0,0,0,0.4)'
            }}>
              {currentStimulus}
            </div>
          )}
          {gameState === 'waiting' && (
            <div style={{
              fontSize: '1.5rem',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Get Ready...
            </div>
          )}
          {gameState === 'feedback' && (
            <div style={{
              fontSize: '2rem',
              color: '#10b981',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              ✓
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ fontSize: '1.2rem', color: '#6b7280', marginBottom: '10px' }}>
          Press SPACEBAR for GO stimuli
        </div>
        <div style={{ fontSize: '1rem', color: '#9ca3af' }}>
          Do not press for NO-GO stimuli
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        width: '400px',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(trial / MAX_TRIALS) * 100}%` }}
          style={{
            height: '100%',
            backgroundColor: '#3b82f6',
            borderRadius: '4px'
          }}
        />
      </div>
    </div>
  );
};

export default GoNoGoGame;