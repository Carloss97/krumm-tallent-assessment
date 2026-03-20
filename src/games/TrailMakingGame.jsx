import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const TrailMakingGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordError, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const isActiveRef = useRef(false);
  const hasEndedRef = useRef(false);

  const [part, setPart] = useState('A');
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [startTime, setStartTime] = useState(null);
  const [partTimes, setPartTimes] = useState([]);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [timeLeft, setTimeLeft] = useState(120);

  const canvasRef = useRef(null);
  const lastClickRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      startTracking();
      isActiveRef.current = true;
      initializePart();
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

  const initializePart = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 60;

    let newNodes = [];

    if (part === 'A') {
      // Numbers 1-10 (demo) or 1-25 (full)
      const count = isDemo ? 10 : 25;
      for (let i = 1; i <= count; i++) {
        const angle = (i - 1) * (2 * Math.PI / count) - Math.PI / 2;
        newNodes.push({
          id: i,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          label: i.toString(),
          connected: false
        });
      }
    } else {
      // Alternating numbers and letters
      const numbers = isDemo ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const letters = isDemo ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

      const allItems = [];
      for (let i = 0; i < numbers.length; i++) {
        allItems.push({ type: 'number', value: numbers[i] });
        allItems.push({ type: 'letter', value: letters[i] });
      }

      allItems.forEach((item, index) => {
        const angle = index * (2 * Math.PI / allItems.length) - Math.PI / 2;
        newNodes.push({
          id: index + 1,
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle),
          label: item.value.toString(),
          type: item.type,
          connected: false
        });
      });
    }

    setNodes(newNodes);
    setConnections([]);
    setCurrentTarget(1);
    setStartTime(performance.now());
  };

  const getExpectedTarget = () => {
    if (part === 'A') {
      return currentTarget;
    } else {
      // Part B: alternating numbers and letters
      const isEven = currentTarget % 2 === 0;
      if (isEven) {
        // Should be a letter
        return String.fromCharCode(64 + Math.ceil(currentTarget / 2));
      } else {
        // Should be a number
        return Math.ceil(currentTarget / 2);
      }
    }
  };

  const handleNodeClick = (node) => {
    const expected = getExpectedTarget();

    if (node.label == expected && !node.connected) {
      // Correct connection
      const newConnections = [...connections, {
        from: lastClickRef.current,
        to: node,
        startTime: performance.now()
      }];

      setConnections(newConnections);
      lastClickRef.current = node;

      const updatedNodes = nodes.map(n =>
        n.id === node.id ? { ...n, connected: true } : n
      );
      setNodes(updatedNodes);

      setCurrentTarget(prev => prev + 1);

      // Check if part is complete
      if (currentTarget >= nodes.length) {
        completePart();
      }
    } else {
      // Error
      setErrors(prev => prev + 1);
      recordError();
    }
  };

  const completePart = () => {
    const timeTaken = performance.now() - startTime;
    setPartTimes(prev => [...prev, timeTaken]);

    const timeBonus = Math.max(0, 1000 - Math.floor(timeTaken / 100)); // Bonus for speed
    const errorPenalty = errors * 20;
    const partScore = Math.max(0, timeBonus - errorPenalty);

    setScore(prev => prev + partScore);

    if (part === 'A') {
      setPart('B');
      setTimeout(() => initializePart(), 1000);
    } else {
      endGame();
    }
  };

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);

    const totalTime = partTimes.reduce((a, b) => a + b, 0);
    const avgTime = partTimes.length > 0 ? Math.round(totalTime / partTimes.length) : 0;

    stopTracking('game12', score, errors, {
      partATime: partTimes[0] || 0,
      partBTime: partTimes[1] || 0,
      totalTime: Math.round(totalTime),
      avgTime,
      totalErrors: errors
    });

    setTimeout(() => {
      navigate('/game/13', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  const drawConnections = (ctx) => {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';

    connections.forEach((connection, index) => {
      if (connection.from && connection.to) {
        ctx.beginPath();
        ctx.moveTo(connection.from.x, connection.from.y);
        ctx.lineTo(connection.to.x, connection.to.y);
        ctx.stroke();
      }
    });
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && connections.length > 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawConnections(ctx);
    }
  }, [connections]);

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type="Processing Speed & Flexibility"
        title="Trail Making Test"
        description={`Part A: Connect the numbers in order from 1 to ${isDemo ? '10' : '25'}. Part B: Connect alternating numbers and letters (1-A-2-B-etc.). Click each circle in the correct sequence as quickly as possible.`}
        timeLimit={isDemo ? "120s" : "None"}
        onStart={() => {
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  const expectedTarget = getExpectedTarget();
  const progress = Math.round((currentTarget - 1) / nodes.length * 100);

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        PART: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{part}</span>
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
          Connect to: <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{expectedTarget}</span>
        </div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>
          Progress: {currentTarget - 1} / {nodes.length} • Errors: {errors}
        </div>
      </div>

      {/* Canvas for connections */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <canvas
          ref={canvasRef}
          width={600}
          height={600}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            pointerEvents: 'none'
          }}
        />

        {/* Nodes */}
        {nodes.map((node) => (
          <motion.div
            key={node.id}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: node.connected ? 1 : 1.1 }}
            onClick={() => handleNodeClick(node)}
            style={{
              position: 'absolute',
              left: node.x - 25,
              top: node.y - 25,
              width: 50,
              height: 50,
              borderRadius: '50%',
              backgroundColor: node.connected ? '#10b981' : expectedTarget == node.label ? '#3b82f6' : '#ffffff',
              border: `3px solid ${node.connected ? '#059669' : expectedTarget == node.label ? '#1d4ed8' : '#d1d5db'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: !node.connected ? 'pointer' : 'default',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              color: node.connected ? 'white' : expectedTarget == node.label ? 'white' : '#374151',
              boxShadow: expectedTarget == node.label ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: expectedTarget == node.label ? 10 : 1
            }}
          >
            {node.label}
          </motion.div>
        ))}
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

export default TrailMakingGame;