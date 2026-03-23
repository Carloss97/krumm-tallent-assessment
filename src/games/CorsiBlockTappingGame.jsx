import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const CorsiBlockTappingGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError } = useTelemetry();

  const [blocks, setBlocks] = useState([]);
  const [sequence, setSequence] = useState([]);
  const [userSequence, setUserSequence] = useState([]);
  const [gameState, setGameState] = useState('showing');
  const [level, setLevel] = useState(3);
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctTrials, setCorrectTrials] = useState(0);
  const [totalTrials, setTotalTrials] = useState(0);
  const [maxSequenceLength, setMaxSequenceLength] = useState(0);

  const hasEndedRef = useRef(false);
  const sequenceTimeoutRef = useRef(null);
  const recallTimeoutRef = useRef(null);

  const MAX_LEVEL = isDemo ? 4 : 9;
  const TRIALS_PER_LEVEL = 2;
  const BLOCK_SIZE = 80;
  const GRID_SIZE = 3;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;
    onEndGame(score, totalTrials - correctTrials, { maxSequenceLength, finalLevel: level, accuracy, totalCorrect: correctTrials, totalTrials });
  }, [onEndGame, score, totalTrials, correctTrials, maxSequenceLength, level]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const checkSequence = useCallback((finalSequence = userSequence) => {
    const isCorrect = finalSequence.length === sequence.length && finalSequence.every((blockId, index) => blockId === sequence[index]);
    setTotalTrials(prev => prev + 1);
    setGameState('feedback');

    if (isCorrect) {
      setCorrectTrials(prev => prev + 1);
      setScore(prev => prev + level * 10);
      setMaxSequenceLength(prev => Math.max(prev, level));
      if (trial >= TRIALS_PER_LEVEL) {
        if (level >= MAX_LEVEL) endGame();
        else { setLevel(prev => prev + 1); setTrial(1); }
      } else {
        setTrial(prev => prev + 1);
      }
    } else {
      recordError();
      if (trial >= TRIALS_PER_LEVEL) {
        setLevel(prev => Math.max(3, prev - 1));
        setTrial(1);
      } else {
          setTrial(prev => prev + 1);
      }
    }
  }, [userSequence, sequence, trial, level, MAX_LEVEL, endGame, recordError]);

  const startLevel = useCallback(() => {
    const generateSequence = (length) => {
        const availableBlocks = Array.from({ length: GRID_SIZE * GRID_SIZE }, (_, i) => i);
        const newSequence = [];
        for (let i = 0; i < length; i++) {
          const randomIndex = Math.floor(Math.random() * availableBlocks.length);
          newSequence.push(availableBlocks.splice(randomIndex, 1)[0]);
        }
        return newSequence;
    };

    const newSequence = generateSequence(level);
    setSequence(newSequence);
    setUserSequence([]);
    setGameState('showing');

    setBlocks(prev => prev.map(block => ({ ...block, highlighted: false, selected: false })));

    const showSequence = async () => {
        for (let i = 0; i < newSequence.length; i++) {
            await new Promise(resolve => { sequenceTimeoutRef.current = setTimeout(() => { setBlocks(prev => prev.map(b => b.id === newSequence[i] ? { ...b, highlighted: true } : { ...b, highlighted: false })); resolve(); }, 100); });
            await new Promise(resolve => { sequenceTimeoutRef.current = setTimeout(() => { setBlocks(prev => prev.map(b => ({ ...b, highlighted: false }))); resolve(); }, 800); });
        }
        setTimeout(() => { setGameState('recalling'); recallTimeoutRef.current = setTimeout(() => checkSequence(), 10000); }, 1000);
    };
    showSequence();
  }, [level, checkSequence]);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      const newBlocks = [];
      for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
        newBlocks.push({ id: i, x: (i % GRID_SIZE) * (BLOCK_SIZE + 10) + 50, y: Math.floor(i / GRID_SIZE) * (BLOCK_SIZE + 10) + 50, highlighted: false, selected: false });
      }
      setBlocks(newBlocks);

      setLevel(3);
      setTrial(1);
      setScore(0);
      setCorrectTrials(0);
      setTotalTrials(0);
      setMaxSequenceLength(0);
      startLevel();
    }
    return () => { clearTimeout(sequenceTimeoutRef.current); clearTimeout(recallTimeoutRef.current); };
  }, [isActive, startLevel]);
  
  useEffect(() => {
    if(isActive && (trial > 1 || level > 3)) {
        startLevel();
    }
  }, [trial, level, isActive, startLevel])

  const handleBlockClick = (blockId) => {
    if (gameState !== 'recalling') return;
    const newUserSequence = [...userSequence, blockId];
    setUserSequence(newUserSequence);
    setBlocks(prev => prev.map(block => block.id === blockId ? { ...block, selected: true } : block));
    if (newUserSequence.length >= sequence.length) {
      clearTimeout(recallTimeoutRef.current);
      checkSequence(newUserSequence);
    }
  };
  
  if (!isActive) {
      return <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}><div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div><p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p></motion.div>
  }

  const accuracy = totalTrials > 0 ? Math.round((correctTrials / totalTrials) * 100) : 0;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>LEVEL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{level}</span> â€¢ TRIAL: {trial}</div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 15 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '5px' }}>
          {gameState === 'showing' && 'Watch the sequence...'}
          {gameState === 'recalling' && 'Click the blocks in order'}
          {gameState === 'feedback' && (userSequence.length === sequence.length && userSequence.every((id, i) => id === sequence[i]) ? 'Correct!' : 'Incorrect')}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Accuracy: {accuracy}% â€¢ Max Length: {maxSequenceLength}</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Progress: {userSequence.length} / {sequence.length}</div>
      </div>
      
      <div style={{ position: 'relative', width: GRID_SIZE * (BLOCK_SIZE + 10) + 100, height: GRID_SIZE * (BLOCK_SIZE + 10) + 100, marginBottom: '30px' }}>
        {blocks.map((block) => (
          <motion.div
            key={block.id} initial={{ scale: 0 }} animate={{ scale: 1, backgroundColor: block.highlighted ? '#3b82f6' : block.selected ? '#10b981' : '#ffffff' }}
            whileHover={gameState === 'recalling' ? { scale: 1.05 } : {}} onClick={() => handleBlockClick(block.id)}
            style={{ position: 'absolute', left: block.x, top: block.y, width: BLOCK_SIZE, height: BLOCK_SIZE, border: '2px solid #d1d5db', borderRadius: '8px', cursor: gameState === 'recalling' ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', fontWeight: 'bold', color: block.highlighted || block.selected ? 'white' : '#374151', boxShadow: block.highlighted ? '0 0 20px rgba(59, 130, 246, 0.6)' : block.selected ? '0 0 15px rgba(16, 185, 129, 0.4)' : '0 2px 8px rgba(0,0,0,0.1)' }}
          >
            {block.id + 1}
          </motion.div>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {sequence.map((blockId, index) => <div key={index} style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: index < userSequence.length ? (userSequence[index] === blockId ? '#10b981' : '#ef4444') : '#e5e7eb', border: '2px solid #d1d5db' }}/>)}
      </div>
    </div>
  );
};

export default CorsiBlockTappingGame;
