import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const CorsiBlockTappingGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordError, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);

  const [blocks, setBlocks] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [gameState, setGameState] = useState('showing'); // showing, recalling, feedback
  const [level, setLevel] = useState(3);
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctTrials, setCorrectTrials] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [maxSequenceLength, setMaxSequenceLength] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);

  const sequenceTimeoutRef = useRef(null);
  const recallTimeoutRef = useRef(null);

  const MAX_LEVEL = isDemo ? 5 : 9;
  const TRIALS_PER_LEVEL = 2;
  const BLOCK_SIZE = 80;
  const GRID_SIZE = 3; // 3x3 grid

  useEffect(() => {
    if (isActive) {
      startTracking();
      isActiveRef.current = true;
      initializeBlocks();
      startLevel();
    }
    return () => {
      clearTimeout(sequenceTimeoutRef.current);
      clearTimeout(recallTimeoutRef.current);
    };
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

  const initializeBlocks = () => {
    const newBlocks = [];
    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      newBlocks.push({
        id: i,
        x: (i % GRID_SIZE) * (BLOCK_SIZE + 10) + 50,
        y: Math.floor(i / GRID_SIZE) * (BLOCK_SIZE + 10) + 50,
        highlighted: false,
        selected: false
      });
    }
    setBlocks(newBlocks);
  };

  const generateSequence = (length) => {
    const availableBlocks = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
    const newSequence = [];

    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * availableBlocks.length);
      const blockId = availableBlocks.splice(randomIndex, 1)[0];
      newSequence.push(blockId);
    }

    return newSequence;
  };

  const startLevel = () => {
    const newSequence = generateSequence(level);
    setSequence(newSequence);
    setUserSequence([]);
    setGameState('showing');
    setTrial(1);

    // Reset block states
    setBlocks(prev => prev.map(block => ({
      ...block,
      highlighted: false,
      selected: false
    })));

    showSequence();
  };

  const showSequence = async () => {
    for (let i = 0; i < sequence.length; i++) {
      await new Promise(resolve => {
        sequenceTimeoutRef.current = setTimeout(() => {
          // Highlight current block
          setBlocks(prev => prev.map(block =>
            block.id === sequence[i]
              ? { ...block, highlighted: true }
              : { ...block, highlighted: false }
          ));
          resolve();
        }, 100);
      });

      await new Promise(resolve => {
        sequenceTimeoutRef.current = setTimeout(() => {
          // Unhighlight
          setBlocks(prev => prev.map(block => ({ ...block, highlighted: false })));
          resolve();
        }, 800);
      });
    }

    // Start recall phase
    setTimeout(() => {
      setGameState('recalling');
      recallTimeoutRef.current = setTimeout(() => {
        // Auto-submit if no response
        checkSequence();
      }, 10000); // 10 second timeout
    }, 1000);
  };

  const handleBlockClick = (blockId) => {
    if (gameState !== 'recalling') return;

    const newUserSequence = [...userSequence, blockId];
    setUserSequence(newUserSequence);

    // Highlight selected block
    setBlocks(prev => prev.map(block =>
      block.id === blockId
        ? { ...block, selected: true }
        : block
    ));

    // Check if sequence is complete
    if (newUserSequence.length >= sequence.length) {
      clearTimeout(recallTimeoutRef.current);
      checkSequence(newUserSequence);
    }
  };

  const checkSequence = (finalSequence = userSequence) => {
    const isCorrect = finalSequence.length === sequence.length &&
      finalSequence.every((blockId, index) => blockId === sequence[index]);

    setTotalTrials(prev => prev + 1);

    if (isCorrect) {
      setCorrectTrials(prev => prev + 1);
      setScore(prev => prev + level * 10);
      setMaxSequenceLength(prev => Math.max(prev, level));
      setGameState('feedback');

      // Advance trial or level
      if (trial >= TRIALS_PER_LEVEL) {
        if (level >= MAX_LEVEL) {
          endGame();
        } else {
          setLevel(prev => prev + 1);
          setTimeout(() => startLevel(), 1500);
        }
      } else {
        setTrial(prev => prev + 1);
        setTimeout(() => startLevel(), 1500);
      }
    } else {
      recordError();
      setGameState('feedback');

      // Stay at same level or decrease if too many errors
      setTimeout(() => {
        if (trial >= TRIALS_PER_LEVEL) {
          // Failed level, decrease difficulty
          setLevel(prev => Math.max(3, prev - 1));
        }
        startLevel();
      }, 2000);
    }
  };

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);

    const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

    stopTracking('game13', score, totalTrials - correctTrials, {
      maxSequenceLength,
      finalLevel: level,
      accuracy,
      totalCorrect: correctTrials,
      totalTrials
    });

    setTimeout(() => {
      navigate('/game/14', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type="Spatial Working Memory"
        title="Corsi Block Tapping"
        description="Watch the sequence of blocks that light up. Then click the blocks in the same order. Start with shorter sequences and work your way up to longer ones."
        timeLimit={isDemo ? "90s" : "None"}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        LEVEL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{level}</span> • TRIAL: {trial}
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span>
      </div>

      {isDemo && (
        <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
          T-<span style={{ color: timeLeft < 15 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
        </div>
      )}

      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '5px' }}>
          {gameState === 'showing' && 'Watch the sequence...'}
          {gameState === 'recalling' && 'Click the blocks in order'}
          {gameState === 'feedback' && (userSequence.length === sequence.length && userSequence.every((id, i) => id === sequence[i]) ? 'Correct!' : 'Incorrect')}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Accuracy: {accuracy}% • Max Length: {maxSequenceLength}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Progress: {userSequence.length} / {sequence.length}
        </div>
      </div>

      {/* Block grid */}
      <div style={{
        position: 'relative',
        width: GRID_SIZE * (BLOCK_SIZE + 10) + 100,
        height: GRID_SIZE * (BLOCK_SIZE + 10) + 100,
        marginBottom: '30px'
      }}>
        {blocks.map((block) => (
          <motion.div
            key={block.id}
            initial={{ scale: 0 }}
            animate={{
              scale: 1,
              backgroundColor: block.highlighted ? '#3b82f6' :
                              block.selected ? '#10b981' : '#ffffff'
            }}
            whileHover={gameState === 'recalling' ? { scale: 1.05 } : {}}
            onClick={() => handleBlockClick(block.id)}
            style={{
              position: 'absolute',
              left: block.x,
              top: block.y,
              width: BLOCK_SIZE,
              height: BLOCK_SIZE,
              border: '2px solid #d1d5db',
              borderRadius: '8px',
              cursor: gameState === 'recalling' ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: block.highlighted || block.selected ? 'white' : '#374151',
              boxShadow: block.highlighted ? '0 0 20px rgba(59, 130, 246, 0.6)' :
                         block.selected ? '0 0 15px rgba(16, 185, 129, 0.4)' :
                         '0 2px 8px rgba(0,0,0,0.1)'
            }}
          >
            {block.id + 1}
          </motion.div>
        ))}
      </div>

      {/* Progress indicators */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sequence.map((blockId, index) => (
          <div
            key={index}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              backgroundColor: index < userSequence.length
                ? (userSequence[index] === blockId ? '#10b981' : '#ef4444')
                : '#e5e7eb',
              border: '2px solid #d1d5db'
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default CorsiBlockTappingGame;