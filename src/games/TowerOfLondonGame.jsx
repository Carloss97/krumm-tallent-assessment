import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const problems = [
    { initial: [[2, 1], [], []], target: [[], [], [2, 1]], optimal: 3 },
    { initial: [[3, 2, 1], [], []], target: [[], [3, 2, 1], []], optimal: 7 },
    { initial: [[3, 1], [2], []], target: [[], [3, 2, 1], []], optimal: 4 },
    { initial: [[3, 2], [1], []], target: [[], [], [3, 2, 1]], optimal: 5 },
    { initial: [[3], [2, 1], []], target: [[], [], [3, 2, 1]], optimal: 6 }
];

const TowerOfLondonGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();

  const [problem, setProblem] = useState(1);
  const [towers, setTowers] = useState([[], [], []]);
  const [targetTowers, setTargetTowers] = useState([[], [], []]);
  const [selectedTower, setSelectedTower] = useState(null);
  const [moves, setMoves] = useState(0);
  const [optimalMoves, setOptimalMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [problemTimes, setProblemTimes] = useState([]);
  
  const hasEndedRef = useRef(false);
  const problemStartTime = useRef(null);

  const MAX_PROBLEMS = isDemo ? 3 : 5;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const avgTime = problemTimes.length > 0 ? Math.round(problemTimes.reduce((a, b) => a + b, 0) / problemTimes.length) : 0;
    stopTracking('game9', score, 0, { problemsCompleted: problem -1, totalMoves: moves, avgTimePerProblem: avgTime, efficiency: score });
    onEndGame(score, 0, { problemsCompleted: problem -1, totalMoves: moves, avgTimePerProblem: avgTime, efficiency: score });
  }, [onEndGame, score, problem, moves, problemTimes, stopTracking]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const loadProblem = useCallback((problemIndex) => {
    const currentProblem = problems[problemIndex - 1];
    setTowers(JSON.parse(JSON.stringify(currentProblem.initial)));
    setTargetTowers(currentProblem.target);
    setMoves(0);
    setOptimalMoves(currentProblem.optimal);
    setSelectedTower(null);
    problemStartTime.current = Date.now();
  }, [problems]);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      startTracking();
      setProblem(1);
      setScore(0);
      setProblemTimes([]);
      loadProblem(1);
    }
  }, [isActive, loadProblem, startTracking]);

  useEffect(() => {
    if(isActive && problem > 1) {
        loadProblem(problem)
    }
  }, [problem, isActive, loadProblem])

  const handleTowerClick = (towerIndex) => {
    if (selectedTower === null) {
      if (towers[towerIndex].length > 0) setSelectedTower(towerIndex);
    } else if (selectedTower === towerIndex) {
      setSelectedTower(null);
    } else {
      makeMove(selectedTower, towerIndex);
    }
  };

  const makeMove = (fromTower, toTower) => {
    const isValid = towers[fromTower].length > 0 && (towers[toTower].length === 0 || towers[fromTower][towers[fromTower].length - 1] < towers[toTower][towers[toTower].length - 1]);
    if (!isValid) { recordError(); return; }

    const newTowers = JSON.parse(JSON.stringify(towers));
    newTowers[toTower].push(newTowers[fromTower].pop());

    setTowers(newTowers);
    setMoves(prev => prev + 1);
    setSelectedTower(null);

    if (JSON.stringify(newTowers) === JSON.stringify(targetTowers)) {
       
      const timeTaken = Date.now() - problemStartTime.current;
      setProblemTimes(prev => [...prev, timeTaken]);

      const efficiency = Math.max(0, 100 - Math.abs(moves + 1 - optimalMoves) * 20);
      setScore(prev => prev + Math.round(efficiency));

      setTimeout(() => {
        if (problem >= MAX_PROBLEMS) endGame();
        else setProblem(prev => prev + 1);
      }, 1000);
    }
  };

  const renderTower = (disks, towerIndex, isTarget = false) => (
    <div
      key={towerIndex}
      onClick={() => !isTarget && handleTowerClick(towerIndex)}
      style={{
        width: '120px', height: '200px', border: '3px solid #6b7280', borderRadius: '4px',
        backgroundColor: selectedTower === towerIndex ? '#dbeafe' : (selectedTower === null && disks.length > 0 && !isTarget) ? '#f3f4f6' : '#ffffff',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        cursor: !isTarget && (selectedTower === null && disks.length > 0 || selectedTower !== null) ? 'pointer' : 'default',
        position: 'relative', margin: '0 10px'
      }}
    >
      <div style={{ position: 'absolute', top: '-25px', fontSize: '1.2rem', fontWeight: 'bold', color: '#374151' }}>{String.fromCharCode(65 + towerIndex)}</div>
      {disks.map((disk, diskIndex) => (
        <motion.div
          key={`${disk}-${diskIndex}`} initial={{ scale: 0 }} animate={{ scale: 1 }}
          style={{ width: `${40 + disk * 20}px`, height: '20px', backgroundColor: `hsl(${disk * 60}, 70%, 50%)`, borderRadius: '10px', marginBottom: '2px', border: '2px solid #374151', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 'bold', color: 'white' }}
        >
          {disk}
        </motion.div>
      ))}
    </div>
  );
  
  if (!isActive) {
      return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}>
            <div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div>
            <p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p>
          </motion.div>
      )
  }

  const efficiency = moves > 0 ? Math.max(0, 100 - Math.abs(moves - optimalMoves) * 20) : 100;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>PROBLEM: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{problem}</span> / {MAX_PROBLEMS}</div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 30 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '5px' }}>Moves: {moves} â€¢ Optimal: {optimalMoves} â€¢ Efficiency: {efficiency}%</div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Click towers to select and move disks</div>
      </div>
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '10px' }}>TARGET:</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{targetTowers.map((disks, index) => renderTower(disks, index, true))}</div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '10px' }}>CURRENT:</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>{towers.map((disks, index) => renderTower(disks, index))}</div>
      </div>
      {JSON.stringify(towers) === JSON.stringify(targetTowers) && (
        <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', backgroundColor: 'rgba(16, 185, 129, 0.95)', color: 'white', padding: '20px 40px', borderRadius: '12px', fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', zIndex: 100 }}>
          Problem Solved!<br/><span style={{ fontSize: '1rem', fontWeight: 'normal' }}>+{Math.round(efficiency)} points</span>
        </motion.div>
      )}
    </div>
  );
};

export default TowerOfLondonGame;
