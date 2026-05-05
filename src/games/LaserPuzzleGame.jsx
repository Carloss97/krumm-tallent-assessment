import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playMemoryFlash, playSuccessSound, playLevelUpSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useGameTimer } from '../hooks/useGameTimer';
import { useLanguage } from '../context/LanguageContext';

const CELL = 44; // Slightly larger for better tap targets

const SHIP_ARROW = { right: '→', left: '←', up: '↑', down: '↓' };
const DEFLECT_NE = { right: 'up', left: 'down', up: 'right', down: 'left' };
const DEFLECT_NW = { right: 'down', left: 'up', up: 'left', down: 'right' };
const BIFURCATE = { right: ['up', 'down'], left: ['up', 'down'], up: ['left', 'right'], down: ['left', 'right'] };
const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };

const DEMO_BRIEFINGS = {
  es: [
    {
      title: 'Fase I: Alineación de Haz',
      body: 'Iniciando calibración óptica. El objetivo es guiar el haz de fotones hacia los receptores utilizando las unidades de reflexión (/). Arrastra las unidades para cambiar la trayectoria.'
    },
    {
      title: 'Fase II: Distribución de Señal',
      body: 'Nuevos nodos de recepción detectados. Utiliza el módulo de bifurcación (+) para dividir el flujo de luz y cubrir múltiples objetivos simultáneamente.'
    },
    {
      title: 'Fase III: Puentes Cuánticos',
      body: 'Obstrucciones detectadas en el Sector Gamma. Los portales (P) permiten trasladar el haz de luz a través de vacíos espaciales. Planifica el salto para superar los bloqueos de roca.'
    }
  ],
  en: [
    {
      title: 'Phase I: Beam Alignment',
      body: 'Starting optical calibration. The objective is to guide the photon beam towards the receivers using reflection units (/). Drag the units to change the trajectory.'
    },
    {
      title: 'Phase II: Signal Distribution',
      body: 'New reception nodes detected. Use the bifurcation module (+) to split the light flow and cover multiple targets simultaneously.'
    },
    {
      title: 'Phase III: Quantum Bridges',
      body: 'Obstructions detected in Sector Gamma. Portals (P) allow transferring the light beam through spatial voids. Plan the jump to overcome rock blockages.'
    }
  ]
};

const getBriefing = (idx, language) => {
  const pack = DEMO_BRIEFINGS[language] || DEMO_BRIEFINGS.es;
  return pack[idx] || null;
};

const DEMO_LEVELS = [
  {
    name: 'Sector Alpha',
    cols: 8,
    rows: 6,
    par: 2,
    timeLimit: 40,
    hint: {
      es: 'Refleja la luz hacia arriba.',
      en: 'Reflect the light upwards.'
    },
    cells: [
      { x: 0, y: 4, type: 'ship', dir: 'right' },
      { x: 6, y: 1, type: 'antenna' },
      { x: 3, y: 5, type: 'reflector_ne', movable: true },
      { x: 5, y: 3, type: 'reflector_ne', movable: true },
    ],
    quiz: [],
  },
  {
    name: 'Sector Beta',
    cols: 8,
    rows: 6,
    par: 3,
    timeLimit: 50,
    hint: {
      es: 'Divide el haz para llegar a ambos lados.',
      en: 'Split the beam to reach both sides.'
    },
    cells: [
      { x: 0, y: 3, type: 'ship', dir: 'right' },
      { x: 7, y: 1, type: 'antenna' },
      { x: 7, y: 5, type: 'antenna' },
      { x: 3, y: 2, type: 'bifurcator', movable: true },
      { x: 5, y: 1, type: 'reflector_ne', movable: true },
      { x: 5, y: 5, type: 'reflector_nw', movable: true },
    ],
    quiz: [],
  },
  {
    name: 'Sector Gamma',
    cols: 8,
    rows: 8,
    par: 4,
    timeLimit: 60,
    hint: {
      es: 'Usa el portal para atravesar el muro.',
      en: 'Use the portal to cross the wall.'
    },
    cells: [
      { x: 0, y: 1, type: 'ship', dir: 'right' },
      { x: 7, y: 7, type: 'antenna' },
      { x: 3, y: 1, type: 'portal_blue', portalId: 1 },
      { x: 3, y: 5, type: 'portal_blue', portalId: 2 },
      { x: 1, y: 4, type: 'rock' },
      { x: 2, y: 4, type: 'rock' },
      { x: 3, y: 4, type: 'rock' },
      { x: 4, y: 4, type: 'rock' },
      { x: 5, y: 4, type: 'rock' },
      { x: 5, y: 1, type: 'reflector_ne', movable: true },
      { x: 5, y: 7, type: 'reflector_ne', movable: true },
      { x: 2, y: 7, type: 'reflector_nw', movable: true },
      { x: 2, y: 2, type: 'reflector_nw', movable: true },
    ],
    quiz: [
      {
        q: '¿Qué componente permite saltar obstáculos?',
        opts: ['Reflector', 'Bifurcador', 'Portal', 'Roca'],
        correct: 2
      },
    ],
  },
];

function traceBeam(grid, cols, rows) {
  const shipEntry = Object.entries(grid).find(([, c]) => c.type === 'ship');
  if (!shipEntry) return { beamCells: new Set(), litAntennas: new Set() };
  
  const [shipKey, ship] = shipEntry;
  const [sx, sy] = shipKey.split(',').map(Number);

  const beamCells = new Set(), litAntennas = new Set(), visited = new Set();
  const queue = [{ x:sx, y:sy, dir:ship.dir }];

  while (queue.length > 0) {
    const { x, y, dir } = queue.shift();
    const stateKey = `${x},${y},${dir}`;
    if (visited.has(stateKey)) continue;
    visited.add(stateKey);

    const [dx, dy] = DIRS[dir];
    const nx = x + dx, ny = y + dy;
    if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue;

    const cellKey = `${nx},${ny}`;
    const cell = grid[cellKey];
    const type = cell?.type;

    if (!type || type === 'empty') { beamCells.add(cellKey); queue.push({ x:nx, y:ny, dir }); }
    else if (type === 'reflector_ne') { beamCells.add(cellKey); queue.push({ x:nx, y:ny, dir: DEFLECT_NE[dir] }); }
    else if (type === 'reflector_nw') { beamCells.add(cellKey); queue.push({ x:nx, y:ny, dir: DEFLECT_NW[dir] }); }
    else if (type === 'bifurcator') { beamCells.add(cellKey); BIFURCATE[dir].forEach(d => queue.push({ x:nx, y:ny, dir:d })); }
    else if (type === 'portal_blue') {
      beamCells.add(cellKey);
      const otherPortalKey = Object.keys(grid).find(k => k !== cellKey && grid[k].type === 'portal_blue');
      if (otherPortalKey) { const [px, py] = otherPortalKey.split(',').map(Number); queue.push({ x:px, y:py, dir }); }
    } else if (type === 'antenna') { beamCells.add(cellKey); litAntennas.add(cellKey); }
    else if (type === 'rock') { /* blocks beam */ }
  }
  return { beamCells, litAntennas };
}

const buildGrid = (level) => {
  const g = {};
  level.cells.forEach(c => { g[`${c.x},${c.y}`] = { ...c }; });
  return g;
};

const LaserPuzzleGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const [procLevels, setProcLevels] = useState(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [grid, setGrid] = useState({});
  const [selected, setSelected] = useState(null); 
  const [moves, setMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [gamePhase, setGamePhase] = useState('playing'); 
  const [briefing, setBriefing] = useState(null);
  const [quizStep, setQuizStep] = useState(0);
  const quizScore = useRef(0);
  const hasEndedRef = useRef(false);
  const currentLevel = procLevels ? procLevels[levelIdx] : null;

  const finishGame = useCallback((tm) => {
    if(hasEndedRef.current) return;
    hasEndedRef.current = true;
    const parTotal = procLevels ? procLevels.reduce((s, l) => s + l.par, 0) : 6;
    const efficiency = Math.min(100, Math.round((parTotal / Math.max(1, tm)) * 100));
    setGamePhase('done');
    try { playSuccessSound(); } catch (error) { void error; }
    stopTracking('game7', efficiency, quizScore.current, { efficiency, quizScore: quizScore.current, totalMoves: tm });
    onEndGame(efficiency, quizScore.current);
  }, [procLevels, onEndGame, stopTracking]);

  const advanceLevel = useCallback(() => {
    setSelected(null);
    if (!procLevels) return;
    if (levelIdx + 1 < procLevels.length) {
      const next = levelIdx + 1;
      setLevelIdx(next);
      setGrid(buildGrid(procLevels[next]));
      setMoves(0);
      setBriefing(isDemo ? getBriefing(next, language) : null);
      setGamePhase(isDemo ? 'briefing' : 'playing');
      try { playLevelUpSound(); } catch (error) { void error; }
    } else {
      const q = procLevels[procLevels.length - 1].quiz;
      if (q && q.length > 0) setGamePhase('quiz');
      else finishGame(totalMoves);
    }
  }, [levelIdx, totalMoves, procLevels, finishGame, isDemo, language]);
  
  const levelTimeLimit = isDemo && currentLevel?.timeLimit ? currentLevel.timeLimit : timeLimit;
  const timeLeft = useGameTimer({ isActive: isActive && gamePhase === 'playing', timeLimit: levelTimeLimit, onEnd: advanceLevel });

  useEffect(() => {
    if (isActive) {
        hasEndedRef.current = false;
        startTracking();
        quizScore.current = 0;
        setProcLevels(null);
        setLevelIdx(0);
        setGrid({});
        setMoves(0);
        setTotalMoves(0);
        setGamePhase(isDemo ? 'briefing' : 'playing');
        setQuizStep(0);

        setTimeout(() => {
          setProcLevels(DEMO_LEVELS);
          setLevelIdx(0);
          setGrid(buildGrid(DEMO_LEVELS[0]));
          setBriefing(isDemo ? getBriefing(0, language) : null);
        }, 0);
    }
  }, [isActive, isDemo, startTracking, language]);
  
  const handleCellClick = useCallback((x, y) => {
    if (gamePhase !== 'playing') return;
    const key = `${x},${y}`;
    const cell = grid[key];

    if (selected) {
      const { x:sx, y:sy } = selected;
      const selKey = `${sx},${sy}`;
      if (sx === x && sy === y) setSelected(null);
      else if (!cell) {
        const piece = grid[selKey];
        setGrid(g => { const n = { ...g }; delete n[selKey]; n[key] = piece; return n; });
        setMoves(m => m + 1); setTotalMoves(tm => tm + 1);
        setSelected(null);
        try { playMemoryClick(); } catch (error) { void error; }
        
        // Record event for HUD and telemetry
        recordTrialEvent({ 
          event: 'move', 
          payload: { x, y, type: piece.type } 
        });
      } else if (cell?.movable) setSelected({ x, y });
      else setSelected(null);
    } else {
      if (cell?.movable) setSelected({ x, y });
    }
  }, [selected, grid, gamePhase]);

  const handleReset = () => {
    if (procLevels) setGrid(buildGrid(procLevels[levelIdx]));
    setSelected(null);
    setMoves(0);
    setGamePhase('playing');
  };

  const handleQuizAnswer = (idx) => {
    const level = procLevels[levelIdx];
    const q = level.quiz[quizStep];
    if (idx === q.correct) quizScore.current += 1;
    else recordError();
    if (quizStep + 1 < level.quiz.length) setQuizStep(s => s + 1);
    else finishGame(totalMoves);
  };

  const { beamCells, litAntennas } = useMemo(() => {
     const level = procLevels ? procLevels[levelIdx] : null;
     if (!level) return { beamCells: new Set(), litAntennas: new Set() };
     return traceBeam(grid, level.cols, level.rows);
  }, [grid, procLevels, levelIdx]);

  const prevLitRef = useRef(new Set());

  useEffect(() => {
    if (!grid) return;
    const prev = prevLitRef.current;
    const newly = [...litAntennas].filter(k => !prev.has(k));
    if (newly.length > 0) {
      try { playMemoryClick(); } catch (error) { void error; }
    }
    prevLitRef.current = new Set(litAntennas);
  }, [litAntennas, grid]);

  useEffect(() => {
    if (gamePhase === 'levelComplete') {
      try { playMemoryFlash(); } catch (error) { void error; }
    }
  }, [gamePhase]);

  useEffect(() => {
    if (gamePhase !== 'playing') return;
    const antennaKeys = Object.keys(grid).filter(k => grid[k].type === 'antenna');
    if (antennaKeys.length > 0 && antennaKeys.every(k => litAntennas.has(k))) {
       
      setGamePhase('levelComplete');
      setTimeout(advanceLevel, 1400);
    }
  }, [litAntennas, grid, gamePhase, advanceLevel]);

  const renderCell = (x, y) => {
    const key = `${x},${y}`;
    const cell = grid[key];
    const isBeam = beamCells.has(key);
    const isLit = litAntennas.has(key);
    const isSel = selected?.x === x && selected?.y === y;
    const type = cell?.type;
    let bg = 'rgba(213,219,245,0.25)', border = '1px solid rgba(150,160,200,0.1)', cursor = 'default', content = null;

    if (type === 'ship') { 
      bg = '#4f46e5'; border = '2px solid #6366f1'; 
      content = <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ color:'white', fontSize:'1.2rem', fontWeight:'900' }}>{SHIP_ARROW[cell.dir]}</motion.span>; 
    }
    else if (type === 'rock') { bg = '#334155'; border = '1px solid #1e293b'; content = <div style={{ width:'60%', height:'60%', background:'#475569', borderRadius:'4px' }} />; }
    else if (type === 'reflector_ne') { bg = isSel ? '#bbf7d0' : 'rgba(34,197,94,0.1)'; border = isSel ? '2px solid #22c55e' : '1px solid rgba(34,197,94,0.3)'; cursor = 'pointer'; content = <span style={{ color:'#15803d', fontSize:'1.6rem', fontWeight:'900' }}>/</span>; }
    else if (type === 'reflector_nw') { bg = isSel ? '#a7f3d0' : 'rgba(20,184,166,0.1)'; border = isSel ? '2px solid #14b8a6' : '1px solid rgba(20,184,166,0.3)'; cursor = 'pointer'; content = <span style={{ color:'#0d9488', fontSize:'1.6rem', fontWeight:'900' }}>\</span>; }
    else if (type === 'bifurcator') { bg = isSel ? '#fed7aa' : 'rgba(249,115,22,0.1)'; border = isSel ? '2px solid #f97316' : '1px solid rgba(249,115,22,0.3)'; cursor = 'pointer'; content = <span style={{ color:'#ea580c', fontSize:'1.4rem', fontWeight:'900' }}>+</span>; }
    else if (type === 'portal_blue') { bg = isSel ? '#c7d2fe' : 'rgba(99,102,241,0.08)'; border = isSel ? '2px solid #6366f1' : '1px dashed rgba(99,102,241,0.5)'; cursor = 'pointer'; content = <span style={{ color:'#4f46e5', fontSize:'1.2rem', fontWeight:'900' }}>P</span>; }
    else if (type === 'antenna') { 
      bg = isLit ? 'rgba(16,185,129,0.2)' : 'rgba(217,70,239,0.1)'; 
      border = isLit ? '2px solid #10b981' : '1px solid rgba(217,70,239,0.4)'; 
      content = isLit ? <motion.div initial={{ scale:0 }} animate={{ scale:1.2 }} style={{ color:'#059669', fontWeight:'900' }}>OK</motion.div> : <span style={{ color:'#a21caf' }}>○</span>; 
    }

    if (cell?.movable && !isSel) cursor = 'pointer';

    return (
      <motion.div
        key={key}
        whileHover={cell?.movable ? { scale: 1.05, backgroundColor: 'rgba(99,102,241,0.1)' } : {}}
        onClick={() => handleCellClick(x, y)}
        style={{ width: CELL, height: CELL, background: bg, border, cursor, display: 'flex', alignItems: 'center', justifyContent:'center', position: 'relative', borderRadius: '4px', boxShadow: isSel ? '0 0 0 3px rgba(99,102,241,0.4)' : 'none', transition: 'all 0.15s' }}
      >
        {isBeam && type !== 'rock' && type !== 'ship' && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            style={{ position:'absolute', inset:0, background:'rgba(251,191,36,0.15)', pointerEvents:'none', zIndex:0 }} 
          />
        )}
        {isBeam && !type && (
          <motion.div 
            animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ position:'absolute', width:8, height:8, borderRadius:'50%', background:'#f59e0b', zIndex:1, pointerEvents:'none', boxShadow: '0 0 8px #f59e0b' }} 
          />
        )}
        <div style={{ position:'relative', zIndex:2 }}>{content}</div>
      </motion.div>
    );
  };
  
  if (!isActive) {
      return (
          <motion.div key="done" initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'2px solid #059669' }}>
            <div style={{ color:'#059669', fontSize:'2rem', fontWeight:'800', marginBottom:'12px' }}>[ ANALYSIS SYNC ]</div>
            <p style={{ color:'#6b7280', textTransform:'uppercase', letterSpacing:'2px', fontSize:'0.85rem' }}>Processing Spatial Competencies...</p>
          </motion.div>
      )
  }

  const level = currentLevel;
  const levelTypes = useMemo(() => {
    if (!level?.cells) return new Set();
    return new Set(level.cells.map((cell) => cell.type));
  }, [level]);
  const hintText = level
    ? (typeof level.hint === 'object' ? (level.hint[language] || level.hint.es) : level.hint)
    : '';
  const allAntennas = level ? Object.keys(grid).filter(k => grid[k].type === 'antenna') : [];
  const litCount = allAntennas.filter(k => litAntennas.has(k)).length;
  const satColor = timeLeft < 15 ? '#dc2626' : timeLeft < 30 ? '#f59e0b' : '#059669';

  return (
    <div style={{ width:'100%', minHeight:'620px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'12px', gap:'10px', position:'relative' }}>
      <AnimatePresence mode="wait">
        {(gamePhase === 'playing' || gamePhase === 'levelComplete') && level && (
          <motion.div key={`level-${levelIdx}`} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:'20px', display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', width:'100%', fontSize:'0.85rem', fontWeight:'700', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:'1px', gap:'20px' }}>
              <span>{level.name}</span>
              <span style={{ color:satColor }}>⏱ {timeLeft}s</span>
              <span>Moves: <span style={{ color:'#4f46e5' }}>{moves}</span></span>
              <span>Antennas: <span style={{ color: litCount === allAntennas.length ? '#059669' : '#b91c1c' }}>{litCount}/{allAntennas.length}</span></span>
            </div>
            
            <div style={{ border:'1px solid rgba(99,102,241,0.15)', borderRadius:'12px', background:'rgba(248,250,252,0.8)', padding:'8px', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${level.cols}, ${CELL}px)`, gap:'4px' }}>
                {Array.from({ length:level.rows }, (_, y) => Array.from({ length:level.cols }, (_, x) => renderCell(x, y)))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'12px', alignItems:'center', width:'100%', justifyContent:'space-between', marginTop: '4px' }}>
              <span style={{ fontSize:'0.75rem', color:'#64748b', fontStyle:'italic' }}>{language === 'es' ? 'Pista:' : 'Hint:'} {hintText}</span>
              <button onClick={handleReset} className="btn" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>Reset</button>
            </div>
          </motion.div>
        )}
        {gamePhase === 'quiz' && (
          <motion.div key="quiz" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:'40px', maxWidth:'580px', textAlign:'center' }}>
            <div style={{ color:'#7c3aed', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'3px', marginBottom:'12px', fontWeight:'700' }}>Spatial Insight</div>
            <p style={{ color:'#1e1b4b', marginBottom:'32px', fontSize:'1.1rem', fontWeight: '500' }}>{procLevels[levelIdx].quiz[quizStep].q}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {procLevels[levelIdx].quiz[quizStep].opts.map((opt, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ x: 5, backgroundColor: 'rgba(124,58,237,0.1)' }}
                  className="btn" 
                  onClick={() => handleQuizAnswer(i)} 
                  style={{ padding:'14px 20px', textAlign:'left', display:'flex', gap:'12px', borderRadius: '12px' }}
                >
                  <span style={{ opacity:0.5 }}>{i+1}.</span><span>{opt}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gamePhase === 'briefing' && briefing && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 80, borderRadius: '16px' }}>
          <motion.div initial={{ y:20, scale:0.95 }} animate={{ y:0, scale:1 }} style={{ background:'#ffffff', padding:'32px', borderRadius:'20px', maxWidth:'480px', textAlign:'center', border:'1px solid rgba(15,23,42,0.1)', boxShadow:'0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <div style={{ color: '#6366f1', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', marginBottom: '8px' }}>
              {language === 'es' ? 'Briefing del Sistema' : 'System Briefing'}
            </div>
            <h4 style={{ margin: 0, fontSize:'1.4rem', color:'#1e1b4b', fontWeight: 800 }}>{briefing.title}</h4>
            <p style={{ margin:'16px 0 24px', color:'#475569', lineHeight:1.7, fontSize: '0.95rem' }}>{briefing.body}</p>
            <button className="btn btn-primary" onClick={() => setGamePhase('playing')} style={{ width: '100%', padding: '14px' }}>
              {language === 'es' ? 'Activar Sistema' : 'Activate System'}
            </button>
          </motion.div>
        </motion.div>
      )}

      {gamePhase === 'levelComplete' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 60 }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} style={{ padding: '24px 48px', background: 'rgba(16,185,129,0.95)', border: '2px solid #fff', borderRadius: 16, color: '#fff', fontWeight: 900, fontSize: '1.5rem', textTransform: 'uppercase', letterSpacing: '4px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            {language === 'es' ? '¡ÓPTIMO!' : 'OPTIMIZED!'}
          </motion.div>
          <Confetti count={20} spread={100} duration={1.5} />
        </div>
      )}
    </div>
  );
};

export default LaserPuzzleGame;
