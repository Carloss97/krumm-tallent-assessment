import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const MentalRotationGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordError, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);

  const [currentTrial, setCurrentTrial] = useState(1);
  const [stimuli, setStimuli] = useState({ left: null, right: null, isSame: true });
  const [gameState, setGameState] = useState('waiting'); // waiting, showing, responding
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [reactionTimes, setReactionTimes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [feedback, setFeedback] = useState(null);

  const trialStartTimeRef = useRef(null);
  const timeoutRef = useRef(null);

  const MAX_TRIALS = isDemo ? 10 : 30;
  const RESPONSE_TIME = 5000; // 5 seconds to respond

  // Shape templates (simple geometric shapes)
  const shapes = [
    // Shape 1: L-shape
    [
      [1, 0, 0],
      [1, 0, 0],
      [1, 1, 1]
    ],
    // Shape 2: T-shape
    [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0]
    ],
    // Shape 3: S-shape
    [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    // Shape 4: Plus shape
    [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0]
    ],
    // Shape 5: Corner shape
    [
      [1, 1, 0],
      [1, 0, 0],
      [0, 0, 0]
    ]
  ];

  useEffect(() => {
    if (isActive) {
      startTracking();
      isActiveRef.current = true;
      startTrial();
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

  const rotateShape = (shape, angle) => {
    const rotations = angle / 90;
    let rotated = shape;

    for (let r = 0; r < rotations; r++) {
      const newShape = [];
      for (let i = 0; i < 3; i++) {
        newShape[i] = [];
        for (let j = 0; j < 3; j++) {
          newShape[i][j] = rotated[2 - j][i];
        }
      }
      rotated = newShape;
    }

    return rotated;
  };

  const generateTrial = () => {
    const shapeIndex = Math.floor(Math.random() * shapes.length);
    const baseShape = shapes[shapeIndex];

    // Random rotation for left shape (0, 90, 180, 270)
    const leftRotation = Math.floor(Math.random() * 4) * 90;
    const leftShape = rotateShape(baseShape, leftRotation);

    // Decide if same or different
    const isSame = Math.random() < 0.5;

    let rightShape;
    if (isSame) {
      // Same shape, different rotation
      let rightRotation;
      do {
        rightRotation = Math.floor(Math.random() * 4) * 90;
      } while (rightRotation === leftRotation);
      rightShape = rotateShape(baseShape, rightRotation);
    } else {
      // Different shape
      let differentShapeIndex;
      do {
        differentShapeIndex = Math.floor(Math.random() * shapes.length);
      } while (differentShapeIndex === shapeIndex);
      const differentShape = shapes[differentShapeIndex];
      const rightRotation = Math.floor(Math.random() * 4) * 90;
      rightShape = rotateShape(differentShape, rightRotation);
    }

    return {
      left: leftShape,
      right: rightShape,
      isSame,
      leftRotation,
      rightRotation: isSame ? 0 : null // Not needed for different shapes
    };
  };

  const startTrial = () => {
    const trial = generateTrial();
    setStimuli(trial);
    setGameState('showing');
    setFeedback(null);

    trialStartTimeRef.current = performance.now();

    timeoutRef.current = setTimeout(() => {
      handleTimeout();
    }, RESPONSE_TIME);
  };

  const handleResponse = (userAnswer) => {
    if (gameState !== 'showing') return;

    clearTimeout(timeoutRef.current);
    const rt = performance.now() - trialStartTimeRef.current;
    setReactionTimes(prev => [...prev, rt]);

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
      if (currentTrial >= MAX_TRIALS) {
        endGame();
      } else {
        setCurrentTrial(prev => prev + 1);
        startTrial();
      }
    }, 1500);
  };

  const handleTimeout = () => {
    setTotalAnswers(prev => prev + 1);
    recordError();
    setFeedback('timeout');
    setGameState('responding');

    setTimeout(() => {
      if (currentTrial >= MAX_TRIALS) {
        endGame();
      } else {
        setCurrentTrial(prev => prev + 1);
        startTrial();
      }
    }, 1500);
  };

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);

    const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
    const avgReactionTime = reactionTimes.length > 0
      ? Math.round(reactionTimes.reduce((a, b) => a + b, 0) / reactionTimes.length)
      : 0;

    stopTracking('game14', score, totalAnswers - correctAnswers, {
      accuracy,
      totalCorrect: correctAnswers,
      totalTrials: totalAnswers,
      avgReactionTime
    });

    setTimeout(() => {
      navigate('/report', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  const renderShape = (shape, size = 60) => {
    const cellSize = size / 3;

    return (
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        width: size,
        height: size
      }}>
        {shape.flat().map((cell, index) => (
          <div
            key={index}
            style={{
              width: cellSize,
              height: cellSize,
              backgroundColor: cell ? '#374151' : 'transparent',
              border: '1px solid #d1d5db'
            }}
          />
        ))}
      </div>
    );
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type="Spatial Reasoning"
        title="Mental Rotation"
        description="Look at the two shapes. Decide if the shape on the right is the same as the shape on the left, just rotated, or if they are different shapes. Click SAME or DIFFERENT as quickly and accurately as possible."
        timeLimit={isDemo ? "60s" : "None"}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  const accuracy = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;
  const progress = Math.round((currentTrial - 1) / MAX_TRIALS * 100);

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{currentTrial}</span> / {MAX_TRIALS}
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span>
      </div>

      {isDemo && (
        <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
          T-<span style={{ color: timeLeft < 10 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
        </div>
      )}

      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '10px' }}>
          Are these shapes the same or different?
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Accuracy: {accuracy}% • Correct: {correctAnswers} / {totalAnswers}
        </div>
      </div>

      {/* Shapes display */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '60px', marginBottom: '40px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '10px' }}>Reference</div>
          {stimuli.left && renderShape(stimuli.left, 80)}
        </div>

        <div style={{
          width: '40px',
          height: '4px',
          backgroundColor: '#d1d5db',
          borderRadius: '2px'
        }} />

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '10px' }}>Compare</div>
          {stimuli.right && renderShape(stimuli.right, 80)}
        </div>
      </div>

      {/* Response buttons */}
      <div style={{ display: 'flex', gap: '24px' }}>
        <button
          className="btn"
          onClick={() => handleResponse(true)}
          disabled={gameState !== 'showing'}
          style={{
            width: 'auto',
            minWidth: '140px',
            padding: '14px 20px',
            backgroundColor: gameState === 'showing' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            border: gameState === 'showing' ? '2px solid #10b981' : '2px solid #d1d5db',
            color: gameState === 'showing' ? '#10b981' : '#9ca3af',
            fontWeight: 'bold'
          }}
        >
          SAME
        </button>
        <button
          className="btn"
          onClick={() => handleResponse(false)}
          disabled={gameState !== 'showing'}
          style={{
            width: 'auto',
            minWidth: '140px',
            padding: '14px 20px',
            backgroundColor: gameState === 'showing' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(156, 163, 175, 0.1)',
            border: gameState === 'showing' ? '2px solid #ef4444' : '2px solid #d1d5db',
            color: gameState === 'showing' ? '#ef4444' : '#9ca3af',
            fontWeight: 'bold'
          }}
        >
          DIFFERENT
        </button>
      </div>

      {/* Feedback */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{
              position: 'absolute',
              bottom: '100px',
              backgroundColor: feedback === 'correct' ? 'rgba(16, 185, 129, 0.9)' :
                               feedback === 'incorrect' ? 'rgba(239, 68, 68, 0.9)' :
                               'rgba(156, 163, 175, 0.9)',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '1.2rem',
              fontWeight: 'bold'
            }}
          >
            {feedback === 'correct' ? 'Correct!' :
             feedback === 'incorrect' ? 'Incorrect' :
             'Too Slow'}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress bar */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        width: '400px',
        height: '8px',
        backgroundColor: '#e5e7eb',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
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

export default MentalRotationGame;