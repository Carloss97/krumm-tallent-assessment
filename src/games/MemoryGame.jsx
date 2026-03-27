import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import { playMemoryFlash, playMemoryClick } from '../utils/audio';

const MemoryGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();
  const MAX_ROUNDS = isDemo ? 2 : 5;

  const [round, setRound] = useState(1);
  const [sequence, setSequence] = useState([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [gameState, setGameState] = useState('showing');
  const [activeSquare, setActiveSquare] = useState(null);
  
  const scoreRef = useRef(0);
  const hasEndedRef = useRef(false);
  const isActiveRef = useRef(false);
  const gameStateRef = useRef('showing');

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    stopTracking('game3', scoreRef.current, 0, { rounds: scoreRef.current });
    onEndGame(scoreRef.current);
  }, [onEndGame, stopTracking]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const updateGameState = useCallback((newState) => {
    gameStateRef.current = newState;
    setGameState(newState);
  }, []);

  const playSequence = useCallback(async (seq, currentRound) => {
    await new Promise(r => setTimeout(r, 1000));
    
    for (let i = 0; i < seq.length; i++) {
      if (!isActiveRef.current) return;
      playMemoryFlash();
      setActiveSquare(seq[i]);
      const showTime = Math.max(200, 600 - (currentRound * 50));
      await new Promise(r => setTimeout(r, showTime));
      setActiveSquare(null);
      await new Promise(r => setTimeout(r, showTime / 2));
    }
    updateGameState('playing');
  }, [updateGameState]);

  const generateSequence = useCallback((currentRound) => {
    const size = currentRound >= 3 ? 4 : 3;
    const length = currentRound + 2;
    let newSeq = [];
    for (let i = 0; i < length; i++) {
      newSeq.push(Math.floor(Math.random() * (size * size)));
    }
    setSequence(newSeq);
    setPlayerStep(0);
    setActiveSquare(null);
    updateGameState('showing');
    playSequence(newSeq, currentRound);
  }, [playSequence, updateGameState]);

  useEffect(() => {
    if (isActive) {
      isActiveRef.current = true;
      hasEndedRef.current = false;
      scoreRef.current = 0;
      startTracking();
       
      setRound(1)
      generateSequence(1);
    } else {
      isActiveRef.current = false;
    }
  }, [isActive, generateSequence, startTracking]);

  const handleSquareClick = (index) => {
    if (gameStateRef.current !== 'playing') return;
    playMemoryClick();

    if (index === sequence[playerStep]) {
      const nextStep = playerStep + 1;
      setPlayerStep(nextStep);
      
      setActiveSquare(index);
      setTimeout(() => setActiveSquare(null), 200);

      if (nextStep === sequence.length) {
        setActiveSquare(null);

        scoreRef.current += 1;
        if (round >= MAX_ROUNDS) {
          endGame();
        } else {
          const nextRound = round + 1;
          setRound(nextRound);
          updateGameState('showing');
          generateSequence(nextRound);
        }
      }
    } else {
      recordError();
      setPlayerStep(0);
      updateGameState('showing');
      
      const root = document.getElementById('root');
      if(root) {
        root.style.backgroundColor = 'rgba(239, 68, 68, 0.3)';
        setTimeout(() => root.style.backgroundColor = '', 300);
      }

      playSequence(sequence, round);
    }
  };

  const gridSize = round >= 3 ? 4 : 3;
  const gridSquares = Array.from({ length: gridSize * gridSize }).map((_, i) => i);

  if (!isActive) {
    return (
      <motion.div
        key="done"
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

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        NODE CYCLE: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{round}</span> / {MAX_ROUNDS}
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key="game"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          style={{ textAlign: 'center', width: '100%', maxWidth: '500px' }}
        >
          <div style={{ marginBottom: '30px', fontSize: '0.9rem', color: gameState === 'showing' ? '#06b6d4' : '#10b981', textTransform: 'uppercase', letterSpacing: '4px', height: '20px' }}>
            {gameState === 'showing' ? '[ Observing Node Sequence ]' : '[ Input Matrix Sequence ]'}
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gap: gridSize === 4 ? '10px' : '16px',
            padding: '28px',
            backgroundColor: 'rgba(255,255,255,0.75)',
            border: '1px solid rgba(99,102,241,0.2)',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(99,102,241,0.12)',
            margin: '0 auto',
            width: 'fit-content'
          }}>
            {gridSquares.map(index => (
              <div
                key={index}
                data-square={index}
                onClick={() => handleSquareClick(index)}
                style={{
                  width: gridSize === 4 ? '56px' : '70px',
                  height: gridSize === 4 ? '56px' : '70px',
                  boxSizing: 'border-box',
                  backgroundColor: activeSquare === index ? 'rgba(99, 102, 241, 0.85)' : 'rgba(220,224,255,0.8)',
                  border: activeSquare === index ? '2px solid #6366f1' : '2px solid rgba(99,102,241,0.2)',
                  borderRadius: '8px',
                  cursor: gameState === 'playing' ? 'pointer' : 'default',
                  boxShadow: activeSquare === index ? '0 0 16px rgba(99,102,241,0.6)' : '0 1px 4px rgba(99,102,241,0.1)',
                  transition: 'all 0.1s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onMouseEnter={e => {
                  if (gameState === 'playing' && activeSquare !== index) {
                    e.currentTarget.style.borderColor = '#a5b4fc';
                    e.currentTarget.style.backgroundColor = 'rgba(165,180,252,0.4)';
                  }
                }}
                onMouseLeave={e => {
                  if (gameState === 'playing' && activeSquare !== index) {
                    e.currentTarget.style.borderColor = 'rgba(99,102,241,0.2)';
                    e.currentTarget.style.backgroundColor = 'rgba(220,224,255,0.8)';
                  }
                }}
              >
                <div style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  backgroundColor: activeSquare === index ? 'white' : 'rgba(99,102,241,0.4)',
                  boxShadow: activeSquare === index ? '0 0 8px white' : 'none'
                }} />
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MemoryGame;
