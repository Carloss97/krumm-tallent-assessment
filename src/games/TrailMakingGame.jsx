import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const TrailMakingGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError } = useTelemetry();

  const [part, setPart] = useState('A');
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  
  const partTimes = useRef([]);
  const startTime = useRef(null);
  const hasEndedRef = useRef(false);
  const canvasRef = useRef(null);
  const lastClickRef = useRef(null);

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const totalTime = partTimes.current.reduce((a, b) => a + b, 0);
    const avgTime = partTimes.current.length > 0 ? Math.round(totalTime / partTimes.current.length) : 0;
    onEndGame(score, errors, { partATime: partTimes.current[0] || 0, partBTime: partTimes.current[1] || 0, totalTime: Math.round(totalTime), avgTime, totalErrors: errors });
  }, [onEndGame, score, errors]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const initializePart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) - 60;
    let newNodes = [];

    if (part === 'A') {
      const count = isDemo ? 10 : 25;
      for (let i = 1; i <= count; i++) {
        const angle = (i - 1) * (2 * Math.PI / count) - Math.PI / 2;
        newNodes.push({ id: i, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), label: i.toString(), connected: false });
      }
    } else {
      const numbers = isDemo ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const letters = isDemo ? ['A', 'B', 'C', 'D', 'E'] : ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
      const allItems = [];
      for (let i = 0; i < numbers.length; i++) {
        allItems.push({ type: 'number', value: numbers[i] });
        allItems.push({ type: 'letter', value: letters[i] });
      }
      allItems.forEach((item, index) => {
        const angle = index * (2 * Math.PI / allItems.length) - Math.PI / 2;
        newNodes.push({ id: index + 1, x: centerX + radius * Math.cos(angle), y: centerY + radius * Math.sin(angle), label: item.value.toString(), type: item.type, connected: false });
      });
    }

    setNodes(newNodes);
    setConnections([]);
    setCurrentTarget(1);
    lastClickRef.current = null;
    startTime.current = performance.now();
  }, [part, isDemo]);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      setPart('A');
      setScore(0);
      setErrors(0);
      partTimes.current = [];
      // Defer initialization until canvas is ready
      setTimeout(() => initializePart(), 0);
    }
  }, [isActive, initializePart]);

  useEffect(() => {
      if(isActive && part === 'B') {
          setTimeout(() => initializePart(), 1000);
      }
  }, [part, isActive, initializePart]);

  const completePart = useCallback(() => {
    const timeTaken = performance.now() - startTime.current;
    partTimes.current.push(timeTaken);

    const timeBonus = Math.max(0, 1000 - Math.floor(timeTaken / 100));
    const errorPenalty = errors * 20;
    setScore(prev => prev + Math.max(0, timeBonus - errorPenalty));

    if (part === 'A') {
      setPart('B');
    } else {
      endGame();
    }
  }, [part, errors, endGame]);

  const handleNodeClick = (node) => {
    const expected = part === 'A' ? currentTarget : (currentTarget % 2 === 0) ? String.fromCharCode(64 + Math.ceil(currentTarget / 2)) : Math.ceil(currentTarget / 2);
    if (String(node.label) === String(expected) && !node.connected) {
      setConnections(prev => [...prev, { from: lastClickRef.current, to: node }]);
      lastClickRef.current = node;
      setNodes(prev => prev.map(n => n.id === node.id ? { ...n, connected: true } : n));
      
      if (currentTarget >= nodes.length) completePart();
      else setCurrentTarget(prev => prev + 1);

    } else if (!node.connected) {
      setErrors(prev => prev + 1);
      recordError();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas && connections.length > 0) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      connections.forEach(c => {
        if (c.from && c.to) { ctx.beginPath(); ctx.moveTo(c.from.x, c.from.y); ctx.lineTo(c.to.x, c.to.y); ctx.stroke(); }
      });
    }
  }, [connections]);

  if (!isActive) {
      return <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}><div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div><p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p></motion.div>
  }
  
  const expectedTarget = part === 'A' ? currentTarget : (currentTarget % 2 === 0) ? String.fromCharCode(64 + Math.ceil(currentTarget / 2)) : Math.ceil(currentTarget / 2);
  const progress = nodes.length > 0 ? Math.round((currentTarget - 1) / nodes.length * 100) : 0;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>PART: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{part}</span></div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 30 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '5px' }}>Connect to: <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{expectedTarget}</span></div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Progress: {nodes.length > 0 ? currentTarget -1 : 0} / {nodes.length} • Errors: {errors}</div>
      </div>
      <div style={{ position: 'relative', width: 600, height: 600, marginBottom: '20px' }}>
        <canvas ref={canvasRef} width={600} height={600} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
        {nodes.map((node) => (
          <motion.div
            key={node.id} initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={{ scale: node.connected ? 1 : 1.1 }}
            onClick={() => handleNodeClick(node)}
            style={{ position: 'absolute', left: node.x - 25, top: node.y - 25, width: 50, height: 50, borderRadius: '50%',
              backgroundColor: node.connected ? '#10b981' : String(expectedTarget) === String(node.label) ? '#3b82f6' : '#ffffff',
              border: `3px solid ${node.connected ? '#059669' : String(expectedTarget) === String(node.label) ? '#1d4ed8' : '#d1d5db'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: !node.connected ? 'pointer' : 'default',
              fontSize: '1.2rem', fontWeight: 'bold', color: node.connected || String(expectedTarget) === String(node.label) ? 'white' : '#374151',
              boxShadow: String(expectedTarget) === String(node.label) ? '0 0 20px rgba(59, 130, 246, 0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
              zIndex: String(expectedTarget) === String(node.label) ? 10 : 1
            }}
          >{node.label}</motion.div>
        ))}
      </div>
      <div style={{ width: '400px', height: '8px', backgroundColor: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}><motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} style={{ height: '100%', backgroundColor: '#3b82f6', borderRadius: '4px' }} /></div>
    </div>
  );
};

export default TrailMakingGame;
