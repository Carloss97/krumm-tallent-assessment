import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const NBackGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordError, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);

  const [round, setRound] = useState(1);
  const [nBack, setNBack] = useState(2); // 2-back for demo, increases for full
  const [sequence, setSequence] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStimulus, setCurrentStimulus] = useState(null);
  const [gameState, setGameState] = useState('waiting'); // waiting, showing, responding
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);

  const stimulusStartTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  const MAX_ROUNDS = isDemo ? 3 : 5;
  const STIMULUS_DURATION = 500; // ms
  const RESPONSE_WINDOW = 2000; // ms

  useEffect(() => {
    if (isActive) {
      startTracking();
      isActiveRef.current = true;
      generateRound();
    }
    return () => clearTimeout(timeoutRef.current);
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

  const generateRound = () => {
    // Generate sequence with some matches for n-back
    const length = 8 + round * 2; // Increasing difficulty
    const newSequence = [];
    const stimuli = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

    for (let i = 0; i < length; i++) {
      if (i >= nBack && Math.random() < 0.3) { // 30% chance of match
        newSequence.push(newSequence[i - nBack]);
      } else {
        let stimulus;
        do {
          stimulus = stimuli[Math.floor(Math.random() * stimuli.length)];
        } while (i >= nBack && stimulus === newSequence[i - nBack]);
        newSequence.push(stimulus);
      }
    }

    setSequence(newSequence);
    setCurrentIndex(0);
    setGameState('waiting');
    playRound();
  };

  const playRound = async () => {
    for (let i = 0; i < sequence.length; i++) {
      if (!isActiveRef.current) return;

      setCurrentIndex(i);
      setCurrentStimulus(sequence[i]);
      setGameState('showing');
      stimulusStartTimeRef.current = performance.now();

      await new Promise(resolve => {
        timeoutRef.current = setTimeout(() => {
          setGameState('responding');
          resolve();
        }, STIMULUS_DURATION);
      });

      // Wait for response window
      await new Promise(resolve => {
        timeoutRef.current = setTimeout(() => {
          // Auto-advance if no response
          if (gameState === 'responding') {
            handleNoResponse();
          }
          resolve();
        }, RESPONSE_WINDOW - STIMULUS_DURATION);
      });
    }

    // Round complete
    advanceRound();
  };

  const handleResponse = (isMatch) => {
    if (gameState !== 'responding') return;

    const rt = performance.now() - stimulusStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);

    const isActualMatch = currentIndex >= nBack && sequence[currentIndex] === sequence[currentIndex - nBack];

    if (isMatch === isActualMatch) {
      setTotalCorrect(prev => prev + 1);
      setScore(prev => prev + 10);
    } else {
      setTotalErrors(prev => prev + 1);
      recordError();
    }

    setGameState('waiting');
  };

  const handleNoResponse = () => {
    // Only count as error if it was actually a match
    const isActualMatch = currentIndex >= nBack && sequence[currentIndex] === sequence[currentIndex - nBack];
    if (isActualMatch) {
      setTotalErrors(prev => prev + 1);
      recordError();
    }
    setGameState('waiting');
  };

  const advanceRound = () => {
    if (round >= MAX_ROUNDS) {
      endGame();
    } else {
      const nextRound = round + 1;
      setRound(nextRound);
      // Increase n-back difficulty for full version
      if (!isDemo && nextRound > 2) {
        setNBack(3);
      }
      generateRound();
    }
  };

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);

    const avgReactionTime = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    stopTracking('game8', score, totalErrors, {
      totalCorrect,
      totalErrors,
      avgReactionTime,
      nBackLevel: nBack
    });

    setTimeout(() => {
      navigate('/game/9', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type="Working Memory"
        title="N-Back Task"
        description={`Watch the sequence of letters. Press MATCH when you see a letter that matches the one shown ${nBack} positions back. Press NO MATCH for non-matches. Stay focused and respond quickly.`}
        timeLimit={isDemo ? "60s" : "None"}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  const accuracy = totalCorrect + totalErrors > 0
    ? Math.round((totalCorrect / (totalCorrect + totalErrors)) * 100)
    : 0;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        ROUND: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{round}</span> / {MAX_ROUNDS}
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
          {nBack}-Back Task • Accuracy: {accuracy}%
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Correct: {totalCorrect} • Errors: {totalErrors}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={gameState}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          style={{
            width: '200px',
            height: '200px',
            borderRadius: '12px',
            backgroundColor: gameState === 'showing' ? '#3b82f6' : '#f3f4f6',
            border: '3px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
            boxShadow: gameState === 'showing' ? '0 0 30px rgba(59, 130, 246, 0.5)' : '0 4px 20px rgba(0,0,0,0.1)'
          }}
        >
          {gameState === 'showing' && currentStimulus && (
            <div style={{
              fontSize: '4rem',
              fontWeight: 'bold',
              color: 'white',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {currentStimulus}
            </div>
          )}
          {gameState === 'responding' && (
            <div style={{
              fontSize: '1.5rem',
              color: '#6b7280',
              textAlign: 'center'
            }}>
              Respond Now
            </div>
          )}
          {gameState === 'waiting' && (
            <div style={{
              fontSize: '1.2rem',
              color: '#9ca3af',
              textAlign: 'center'
            }}>
              Get Ready...
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <div style={{ display: 'flex', gap: '24px' }}>
        <button
          className="btn"
          onClick={() => handleResponse(true)}
          disabled={gameState !== 'responding'}
          style={{
            width: 'auto',
            minWidth: '140px',
            padding: '14px 20px',
            backgroundColor: gameState === 'responding' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            border: gameState === 'responding' ? '2px solid #10b981' : '2px solid #d1d5db',
            color: gameState === 'responding' ? '#10b981' : '#9ca3af',
            fontWeight: 'bold'
          }}
        >
          MATCH
        </button>
        <button
          className="btn"
          onClick={() => handleResponse(false)}
          disabled={gameState !== 'responding'}
          style={{
            width: 'auto',
            minWidth: '140px',
            padding: '14px 20px',
            backgroundColor: gameState === 'responding' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            border: gameState === 'responding' ? '2px solid #ef4444' : '2px solid #d1d5db',
            color: gameState === 'responding' ? '#ef4444' : '#9ca3af',
            fontWeight: 'bold'
          }}
        >
          NO MATCH
        </button>
      </div>
    </div>
  );
};

export default NBackGame;