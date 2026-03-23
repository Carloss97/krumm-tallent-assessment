import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const shapes = [
    [[1, 0, 0], [1, 0, 0], [1, 1, 1]],
    [[1, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [1, 1, 1], [0, 1, 0]],
    [[1, 1, 0], [1, 0, 0], [0, 0, 0]],
];

const MentalRotationGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError } = useTelemetry();

  const [currentTrial, setCurrentTrial] = useState(1);
  const [stimuli, setStimuli] = useState({ left: null, right: null, isSame: true });
  const [gameState, setGameState] = useState('waiting');
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [feedback, setFeedback] = useState(null);

  const reactionTimes = useRef([]);
  const trialStartTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const hasEndedRef = useRef(false);

  const MAX_TRIALS = isDemo ? 10 : 30;
  const RESPONSE_TIME = 5000;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const avgReactionTime = reactionTimes.current.length > 0 ? Math.round(reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length) : 0;
    onEndGame(score, totalAnswers - correctAnswers, { accuracy, totalCorrect: correctAnswers, totalTrials: totalAnswers, avgReactionTime });
  }, [onEndGame, score, totalAnswers, correctAnswers]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const rotateShape = (shape, angle) => {
    let rotated = shape;
    for (let r = 0; r < angle / 90; r++) {
      rotated = rotated[0].map((_, colIndex) => rotated.map(row => row[colIndex]).reverse());
    }
    return rotated;
  };

  const handleTimeout = useCallback(() => {
    setTotalAnswers(prev => prev + 1);
    recordError();
    setFeedback('timeout');
    setGameState('responding');
    setTimeout(() => {
      if (currentTrial >= MAX_TRIALS) endGame();
      else setCurrentTrial(prev => prev + 1);
    }, 1500);
  }, [currentTrial, endGame, MAX_TRIALS, recordError]);

  const startTrial = useCallback(() => {
    const shapeIndex = Math.floor(Math.random() * shapes.length);
    const baseShape = shapes[shapeIndex];
    const leftRotation = Math.floor(Math.random() * 4) * 90;
    const leftShape = rotateShape(baseShape, leftRotation);
    const isSame = Math.random() < 0.5;
    let rightShape;

    if (isSame) {
      let rightRotation;
      do { rightRotation = Math.floor(Math.random() * 4) * 90; } while (rightRotation === leftRotation);
      rightShape = rotateShape(baseShape, rightRotation);
    } else {
      let differentShapeIndex;
      do { differentShapeIndex = Math.floor(Math.random() * shapes.length); } while (differentShapeIndex === shapeIndex);
      rightShape = rotateShape(shapes[differentShapeIndex], Math.floor(Math.random() * 4) * 90);
    }

    setStimuli({ left: leftShape, right: rightShape, isSame });
    setGameState('showing');
    setFeedback(null);
    trialStartTimeRef.current = performance.now();
    timeoutRef.current = setTimeout(() => handleTimeout(), RESPONSE_TIME);
  }, [RESPONSE_TIME, handleTimeout]);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentTrial(1);
      setScore(0);
      setCorrectAnswers(0);
      setTotalAnswers(0);
      reactionTimes.current = [];
      startTrial();
    }
    return () => clearTimeout(timeoutRef.current);
  }, [isActive, startTrial]);
  
  useEffect(() => {
    if (isActive && currentTrial > 1) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        startTrial();
    }
  }, [currentTrial, isActive, startTrial]);

  const handleResponse = (userAnswer) => {
    if (gameState !== 'showing') return;
    clearTimeout(timeoutRef.current);
    reactionTimes.current.push(performance.now() - trialStartTimeRef.current);
    const isCorrect = userAnswer === stimuli.isSame;
    setTotalAnswers(prev => prev + 1);

    if (isCorrect) {
      setCorrectAnswers(prev => prev + 1);
      setScore(prev => prev + 10);
      setFeedback('correct');
    } else {
      recordError();
      setFeedback('incorrect');
    }
    setGameState('responding');
    setTimeout(() => {
      if (currentTrial >= MAX_TRIALS) endGame();
      else setCurrentTrial(prev => prev + 1);
    }, 1500);
  };

  const renderShape = (shape, size = 60) => {
    const cellSize = size / 3;
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', width: size, height: size }}>
        {shape.flat().map((cell, index) => <div key={index} style={{ width: cellSize, height: cellSize, backgroundColor: cell ? '#374151' : 'transparent', border: '1px solid #d1d5db' }} />)}
      </div>
    );
  };

  if (!isActive) {
      return <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}><div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div><p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p></motion.div>
  }
  
  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const progress = Math.round((currentTrial - 1) / MAX_TRIALS * 100);

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{currentTrial}</span> / {MAX_TRIALS}</div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '10px' }}>Are these shapes the same or different?</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Accuracy: {accuracy}% â€¢ Correct: {correctAnswers} / {totalAnswers}</div>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '60px', marginBottom: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '10px' }}>Reference</div>
          {stimuli.left && renderShape(stimuli.left, 80)}
        </div>
        <div style={{ width: '40px', height: '4px', backgroundColor: '#d1d5db', borderRadius: '2px' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '10px' }}>Compare</div>
          {stimuli.right && renderShape(stimuli.right, 80)}
        </div>
      </div>
      
      <div style={{ display: 'flex', gap: '24px' }}>
        <button className="btn" onClick={() => handleResponse(true)} disabled={gameState !== 'showing'} style={{ width: 'auto', minWidth: '140px', padding: '14px 20px', backgroundColor: gameState === 'showing' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)', border: gameState === 'showing' ? '2px solid #10b981' : '2px solid #d1d5db', color: gameState === 'showing' ? '#10b981' : '#9ca3af', fontWeight: 'bold' }}>SAME</button>
        <button className="btn" onClick={() => handleResponse(false)} disabled={gameState !== 'showing'} style={{ width: 'auto', minWidth: '140px', padding: '14px 20px', backgroundColor: gameState === 'showing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)', border: gameState === 'showing' ? '2px solid #ef4444' : '2px solid #d1d5db', color: gameState === 'showing' ? '#ef4444' : '#9ca3af', fontWeight: 'bold' }}>DIFFERENT</button>
      </div>
      
      <AnimatePresence>
        {feedback && <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} style={{ position: 'absolute', bottom: '100px', backgroundColor: feedback === 'correct' ? 'rgba(16, 185, 129, 0.9)' : feedback === 'incorrect' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(156, 163, 175, 0.9)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}>
          {feedback === 'correct' ? 'Correct!' : feedback === 'incorrect' ? 'Incorrect' : 'Too Slow'}
        </motion.div>}
      </AnimatePresence>
      
      <div style={{ position: 'absolute', bottom: '30px', width: '400px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
        <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }}/>
      </div>
    </div>
  );
};

export default MentalRotationGame;
