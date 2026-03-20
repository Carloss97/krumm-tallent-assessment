import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const TowerOfLondonGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordError, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);

  const [problem, setProblem] = useState(1);
  const [towers, setTowers] = useState([[], [], []]);
  const [targetTowers, setTargetTowers] = useState([[], [], []]);
  const [selectedTower, setSelectedTower] = useState(null);
  const [moves, setMoves] = useState(0);
  const [optimalMoves, setOptimalMoves] = useState(0);
  const [score, setScore] = useState(0);
  const [problemStartTime, setProblemStartTime] = useState(null);
  const [problemTimes, setProblemTimes] = useState([]);
  const [timeLeft, setTimeLeft] = useState(120);

  const MAX_PROBLEMS = isDemo ? 3 : 5;

  // Problem configurations (initial -> target)
  const problems = [
    // Problem 1: Simple 2-disk
    {
      initial: [[2, 1], [], []],
      target: [[], [], [2, 1]],
      optimal: 3
    },
    // Problem 2: 3-disk
    {
      initial: [[3, 2, 1], [], []],
      target: [[], [3, 2, 1], []],
      optimal: 7
    },
    // Problem 3: Mixed
    {
      initial: [[3, 1], [2], []],
      target: [[], [3, 2, 1], []],
      optimal: 4
    },
    // Problem 4: Complex (full version)
    {
      initial: [[3, 2], [1], []],
      target: [[], [], [3, 2, 1]],
      optimal: 5
    },
    // Problem 5: Very complex (full version)
    {
      initial: [[3], [2, 1], []],
      target: [[], [], [3, 2, 1]],
      optimal: 6
    }
  ];

  useEffect(() => {
    if (isActive) {
      startTracking();
      isActiveRef.current = true;
      loadProblem();
    }
    return () => {};
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

  const loadProblem = () => {
    const currentProblem = problems[problem - 1];
    setTowers(JSON.parse(JSON.stringify(currentProblem.initial)));
    setTargetTowers(currentProblem.target);
    setMoves(0);
    setOptimalMoves(currentProblem.optimal);
    setSelectedTower(null);
    setProblemStartTime(performance.now());
  };

  const isValidMove = (fromTower, toTower) => {
    if (towers[fromTower].length === 0) return false;
    if (towers[toTower].length === 0) return true;
    return towers[fromTower][towers[fromTower].length - 1] < towers[toTower][towers[toTower].length - 1];
  };

  const makeMove = (fromTower, toTower) => {
    if (!isValidMove(fromTower, toTower)) {
      recordError();
      return false;
    }

    const newTowers = JSON.parse(JSON.stringify(towers));
    const disk = newTowers[fromTower].pop();
    newTowers[toTower].push(disk);

    setTowers(newTowers);
    setMoves(prev => prev + 1);
    setSelectedTower(null);

    // Check if problem is solved
    if (JSON.stringify(newTowers) === JSON.stringify(targetTowers)) {
      const timeTaken = performance.now() - problemStartTime;
      setProblemTimes(prev => [...prev, timeTaken]);

      const efficiency = Math.max(0, 100 - Math.abs(moves + 1 - optimalMoves) * 20);
      setScore(prev => prev + Math.round(efficiency));

      setTimeout(() => {
        if (problem >= MAX_PROBLEMS) {
          endGame();
        } else {
          setProblem(prev => prev + 1);
          loadProblem();
        }
      }, 1000);
    }

    return true;
  };

  const handleTowerClick = (towerIndex) => {
    if (selectedTower === null) {
      // Select source tower
      if (towers[towerIndex].length > 0) {
        setSelectedTower(towerIndex);
      }
    } else if (selectedTower === towerIndex) {
      // Deselect
      setSelectedTower(null);
    } else {
      // Try to move
      makeMove(selectedTower, towerIndex);
    }
  };

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);

    const avgTime = problemTimes.length > 0
      ? Math.round(problemTimes.reduce((a, b) => a + b, 0) / problemTimes.length)
      : 0;

    stopTracking('game9', score, 0, {
      problemsCompleted: problem,
      totalMoves: moves,
      avgTimePerProblem: avgTime,
      efficiency: score
    });

    setTimeout(() => {
      navigate('/game/10', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  const renderTower = (towerIndex, disks) => {
    const isSelected = selectedTower === towerIndex;
    const canSelect = selectedTower === null && disks.length > 0;

    return (
      <div
        key={towerIndex}
        onClick={() => handleTowerClick(towerIndex)}
        style={{
          width: '120px',
          height: '200px',
          border: '3px solid #6b7280',
          borderRadius: '4px',
          backgroundColor: isSelected ? '#dbeafe' : canSelect ? '#f3f4f6' : '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          cursor: canSelect || isSelected ? 'pointer' : 'default',
          position: 'relative',
          margin: '0 10px'
        }}
      >
        {/* Tower label */}
        <div style={{
          position: 'absolute',
          top: '-25px',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          color: '#374151'
        }}>
          {String.fromCharCode(65 + towerIndex)}
        </div>

        {/* Disks */}
        {disks.map((disk, diskIndex) => (
          <motion.div
            key={`${disk}-${diskIndex}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              width: `${40 + disk * 20}px`,
              height: '20px',
              backgroundColor: `hsl(${disk * 60}, 70%, 50%)`,
              borderRadius: '10px',
              marginBottom: '2px',
              border: '2px solid #374151',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold',
              color: 'white'
            }}
          >
            {disk}
          </motion.div>
        ))}
      </div>
    );
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type="Planning & Problem Solving"
        title="Tower of London"
        description="Move the disks from the starting position to match the target configuration. You can only move one disk at a time, and you cannot place a larger disk on top of a smaller one. Use the minimum number of moves possible."
        timeLimit={isDemo ? "120s" : "None"}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  const currentProblem = problems[problem - 1];
  const efficiency = moves > 0 ? Math.max(0, 100 - Math.abs(moves - optimalMoves) * 20) : 100;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        PROBLEM: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{problem}</span> / {MAX_PROBLEMS}
      </div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span>
      </div>

      {isDemo && (
        <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
          T-<span style={{ color: timeLeft < 30 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
        </div>
      )}

      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '5px' }}>
          Moves: {moves} • Optimal: {optimalMoves} • Efficiency: {efficiency}%
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Click towers to select and move disks
        </div>
      </div>

      {/* Target Configuration */}
      <div style={{ marginBottom: '30px', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '10px' }}>TARGET:</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {targetTowers.map((disks, index) => renderTower(index, disks))}
        </div>
      </div>

      {/* Current Configuration */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '10px' }}>CURRENT:</div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          {towers.map((disks, index) => renderTower(index, disks))}
        </div>
      </div>

      {JSON.stringify(towers) === JSON.stringify(targetTowers) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(16, 185, 129, 0.95)',
            color: 'white',
            padding: '20px 40px',
            borderRadius: '12px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            textAlign: 'center',
            zIndex: 100
          }}
        >
          Problem Solved!
          <br />
          <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>
            +{Math.round(efficiency)} points
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default TowerOfLondonGame;