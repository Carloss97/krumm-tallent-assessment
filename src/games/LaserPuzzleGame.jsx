import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playMemoryFlash } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useGameTimer } from '../hooks/useGameTimer';

const CELL = 46;

const SHIP_ARROW = { right:'>', left:'<', up:'^', down:'v' };
const DEFLECT_NE = { right:'up', left:'down', up:'right', down:'left' }; 
const DEFLECT_NW = { right:'down', left:'up', up:'left', down:'right' };
const BIFURCATE = { right:['up','down'], left:['up','down'], up:['left','right'], down:['left','right'] };
const DIRS = { right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1] };

const generateLevel = (levelIdx) => {
  const cols = 10, rows = 8;
  let valid = false;
  let bestLevel = null;
  
  while(!valid) {
    const layout = [];
    const pathCells = new Set();
    const shipY = Math.floor(Math.random() * 4) + 2;
    layout.push({ x:0, y:shipY, type:'ship', dir:'right' });
    pathCells.add(`0,${shipY}`);
    
    let pieces = [];
    let heads = [{ x:0, y:shipY, dir:'right' }];
    let antennas = 0;
    let iters = 0;
    
    while(heads.length > 0 && iters < 50) {
      iters++;
      let h = heads.shift();
      let cx = h.x, cy = h.y, cdir = h.dir;
      
      let steps = Math.floor(Math.random() * 3) + 2;
      let nx = cx, ny = cy;
      for(let s=0; s<steps; s++){
         nx += DIRS[cdir][0];
         ny += DIRS[cdir][1];
         pathCells.add(`${nx},${ny}`);
      }
      
      if (nx <= 0 || ny <= 0 || nx >= cols-1 || ny >= rows-1 || pieces.length > (levelIdx+2)) {
         nx = Math.max(0, Math.min(cols-1, nx));
         ny = Math.max(0, Math.min(rows-1, ny));
         layout.push({ x:nx, y:ny, type:'antenna', id:`a${antennas++}` });
         pathCells.add(`${nx},${ny}`);
         continue;
      }
      
      if (layout.find(l => l.x === nx && l.y === ny)) {
         layout.push({ x:nx, y:ny, type:'antenna', id:`a${antennas++}` });
         continue;
      }
      
      let ptype = Math.random() > 0.5 ? 'reflector_ne' : 'reflector_nw';
      if (levelIdx > 0 && Math.random() > 0.7) ptype = 'bifurcator';
      
      if (levelIdx > 1 && Math.random() > 0.8 && !pieces.find(p=>p.type==='portal_blue')) {
          ptype = 'portal_blue';
          let dropx, dropy, dropTries = 0, isGoodDrop = false;
          do {
            dropx = Math.floor(Math.random() * (cols-2)) + 1;
            dropy = Math.floor(Math.random() * (rows-2)) + 1;
            dropTries++;
            if (!pathCells.has(`${dropx},${dropy}`) && !layout.find(l=>l.x===dropx && l.y===dropy)) isGoodDrop = true;
          } while (!isGoodDrop && dropTries < 20);
          
          if (isGoodDrop) {
             layout.push({ x:nx, y:ny, type:'portal_blue', portalId: 1, isSolution: true });
             layout.push({ x:dropx, y:dropy, type:'portal_blue', portalId: 2, isSolution: true });
             pieces.push({ type:'portal_blue' }, { type:'portal_blue' });
             heads.push({ x:dropx, y:dropy, dir: cdir }); 
             continue;
          }
      }
      
      layout.push({ x:nx, y:ny, type:ptype, isSolution: true });
      pieces.push({ type:ptype });
      if (ptype === 'bifurcator') {
         heads.push({ x:nx, y:ny, dir: BIFURCATE[cdir][0] });
         heads.push({ x:nx, y:ny, dir: BIFURCATE[cdir][1] });
      } else {
         heads.push({ x:nx, y:ny, dir: ptype === 'reflector_ne' ? DEFLECT_NE[cdir] : DEFLECT_NW[cdir] });
      }
    }
    
    if (antennas > 0 && pieces.length >= (levelIdx===0 ? 1 : 2)) {
      const gameLayout = layout.filter(l => !l.isSolution); 
      const emptyFunc = () => {
         let rx, ry, sanity = 0;
         while(sanity < 100) {
            rx = Math.floor(Math.random() * cols); ry = Math.floor(Math.random() * rows);
            if (!gameLayout.find(l => l.x===rx && l.y===ry) && !pathCells.has(`${rx},${ry}`)) return {x:rx, y:ry};
            sanity++;
         }
         return null;
      };
      
      let piecePlacedOk = true;
      pieces.forEach(p => {
         let empty = emptyFunc();
         if (empty) gameLayout.push({ x:empty.x, y:empty.y, type:p.type, movable:true });
         else piecePlacedOk = false;
      });
      if (!piecePlacedOk) continue;
      
      let numRocks = 4 + levelIdx * 2;
      for(let r=0; r<numRocks; r++){
         let empty = emptyFunc();
         if (empty) gameLayout.push({ x:empty.x, y:empty.y, type:'rock' });
      }

      bestLevel = { name: `Sector ${levelIdx+1}`, cols, rows, par: pieces.length, hint: 'Guide the beam to all antennas. Portals preserve the beam direction.', cells: gameLayout, quiz: [{ q:'What element preserves the direction of the beam and teleports it?', opts:['Reflector','Portal','Bifurcator','Antenna'], correct:1 }, { q:'How does a Bifurcator modify the laser beam?', opts:['It speeds it up', 'It splits it into two paths', 'It changes its color', 'It stops the beam'], correct:1 }] };
      valid = true;
    }
  }
  return bestLevel;
};

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
  }
  return { beamCells, litAntennas };
}

const buildGrid = (level) => {
  const g = {};
  level.cells.forEach(c => { g[`${c.x},${c.y}`] = { ...c }; });
  return g;
};

const LaserPuzzleGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();
  const [procLevels, setProcLevels] = useState(null);
  const [levelIdx, setLevelIdx] = useState(0);
  const [grid, setGrid] = useState({});
  const [selected, setSelected] = useState(null); 
  const [moves, setMoves] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [gamePhase, setGamePhase] = useState('playing'); 
  const [quizStep, setQuizStep] = useState(0);
  const quizScore = useRef(0);
  const hasEndedRef = useRef(false);

  const finishGame = useCallback((tm) => {
    if(hasEndedRef.current) return;
    hasEndedRef.current = true;
    const parTotal = procLevels ? procLevels.reduce((s, l) => s + l.par, 0) : 6;
    const efficiency = Math.min(100, Math.round((parTotal / Math.max(1, tm)) * 100));
    setGamePhase('done');
    try { playMemoryFlash(); } catch(e) { /* noop */ }
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
      setGamePhase('playing');
    } else {
      const q = procLevels[procLevels.length - 1].quiz;
      if (q && q.length > 0) setGamePhase('quiz');
      else finishGame(totalMoves);
    }
  }, [levelIdx, totalMoves, procLevels, finishGame]);
  
  const timeLeft = useGameTimer({ isActive: isActive && gamePhase === 'playing', timeLimit, onEnd: advanceLevel });

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      startTracking();
      quizScore.current = 0;
      const levels = isDemo ? [generateLevel(0)] : [generateLevel(0), generateLevel(1), generateLevel(2), generateLevel(3)];
        setProcLevels(levels);
        setLevelIdx(0);
        setGrid(buildGrid(levels[0]));
        setMoves(0);
        setTotalMoves(0);
        setGamePhase('playing');
        setQuizStep(0);
    }
  }, [isActive, isDemo, startTracking]);
  
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
      try { playMemoryClick(); } catch (e) { /* noop */ }
    }
    prevLitRef.current = new Set(litAntennas);
  }, [litAntennas, grid]);

  useEffect(() => {
    if (gamePhase === 'levelComplete') {
      try { playMemoryFlash(); } catch(e) { /* noop */ }
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
    let bg = 'rgba(213,219,245,0.38)', border = '1px solid rgba(150,160,200,0.15)', cursor = 'default', content = null;

    if (type === 'ship') { bg = '#4f46e5'; border = '2px solid #6366f1'; content = <span style={{ color:'white', fontSize:'1.2rem', fontWeight:'900', lineHeight:1 }}>{SHIP_ARROW[cell.dir]}</span>; }
    else if (type === 'rock') { bg = '#475569'; border = '1px solid #334155'; content = <div style={{ width:'72%', height:'72%', background:'#334155', borderRadius:'3px' }} />; }
    else if (type === 'reflector_ne') { bg = isSel ? '#bbf7d0' : 'rgba(34,197,94,0.14)'; border = isSel ? '2px solid #22c55e' : '1px solid rgba(34,197,94,0.4)'; cursor = 'pointer'; content = <span style={{ color:'#15803d', fontSize:'1.6rem', fontWeight:'900', lineHeight:1, transform:'rotate(0deg)' }}>/</span>; }
    else if (type === 'reflector_nw') { bg = isSel ? '#a7f3d0' : 'rgba(20,184,166,0.14)'; border = isSel ? '2px solid #14b8a6' : '1px solid rgba(20,184,166,0.4)'; cursor = 'pointer'; content = <span style={{ color:'#0d9488', fontSize:'1.6rem', fontWeight:'900', lineHeight:1 }}>\</span>; }
    else if (type === 'bifurcator') { bg = isSel ? '#fed7aa' : 'rgba(249,115,22,0.13)'; border = isSel ? '2px solid #f97316' : '1px solid rgba(249,115,22,0.40)'; cursor = 'pointer'; content = <span style={{ color:'#ea580c', fontSize:'1.15rem', fontWeight:'900' }}>+</span>; }
    else if (type === 'portal_blue') { bg = isSel ? '#c7d2fe' : 'rgba(99,102,241,0.1)'; border = isSel ? '2px solid #6366f1' : '1px dashed rgba(99,102,241,0.6)'; cursor = 'pointer'; content = <span style={{ color:'#4f46e5', fontSize:'1.2rem', fontWeight:'900' }}>P</span>; }
    else if (type === 'antenna') { bg = isLit ? 'rgba(16,185,129,0.25)' : 'rgba(217,70,239,0.13)'; border = isLit ? '2px solid #10b981' : '1px solid rgba(217,70,239,0.5)'; content = <span style={{ fontSize:'1rem' }}>{isLit ? 'OK' : 'O'}</span>; }

    if (cell?.movable && !isSel) cursor = 'pointer';

    return (
      <div
        key={key}
        role="button"
        tabIndex={0}
        aria-label={`${type ? type : 'empty'} cell ${x} ${y}`}
        onClick={() => handleCellClick(x, y)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleCellClick(x, y); } }}
        style={{ width: CELL, height: CELL, background: bg, border, cursor, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', boxShadow: isSel ? '0 0 0 3px rgba(99,102,241,0.5)' : 'none', transition: 'background 0.1s, box-shadow 0.1s' }}
      >
        {isBeam && type !== 'rock' && type !== 'ship' && <div style={{ position:'absolute', inset:0, background:'rgba(251,191,36,0.28)', pointerEvents:'none', zIndex:0 }} />}
        {isBeam && !type && <div style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:'rgba(251,191,36,0.75)', zIndex:1, pointerEvents:'none' }} />}
        <div style={{ position:'relative', zIndex:2 }}>{content}</div>
      </div>
    );
  };
  
  if (!isActive) {
      return (
          <motion.div key="done" initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'2px solid #059669' }}>
            <div style={{ color:'#059669', fontSize:'2rem', fontWeight:'800', marginBottom:'12px' }}>[ ROUTING COMPLETE ]</div>
            <p style={{ color:'#6b7280', textTransform:'uppercase', letterSpacing:'2px', fontSize:'0.85rem' }}>Uploading Spatial Analysis...</p>
          </motion.div>
      )
  }

  const level = procLevels ? procLevels[levelIdx] : null;
  const allAntennas = level ? Object.keys(grid).filter(k => grid[k].type === 'antenna') : [];
  const litCount = allAntennas.filter(k => litAntennas.has(k)).length;
  const satColor = timeLeft < 30 ? '#dc2626' : timeLeft < 60 ? '#f59e0b' : '#059669';

  return (
    <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px', gap:'10px' }}>
      <AnimatePresence mode="wait">
        {(gamePhase === 'playing' || gamePhase === 'levelComplete') && level && (
          <motion.div key={`level-${levelIdx}`} initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', width:'100%', fontSize:'0.8rem', fontWeight:'600', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:'1px', gap:'16px' }}>
              <span>{level.name} <span style={{ color:'#7c3aed' }}>({levelIdx+1}/{procLevels?.length||3})</span></span>
              <span style={{ color:satColor }}>T {timeLeft}s</span>
              <span>Moves: <span style={{ color:'#4f46e5' }}>{moves}</span> / par {level.par}</span>
              <span>Antennas: <span style={{ color: litCount === allAntennas.length ? '#059669' : '#374151' }}>{litCount}/{allAntennas.length}</span></span>
            </div>
            <div style={{ display:'flex', gap:'14px', fontSize:'0.68rem', color:'#64748b', flexWrap:'wrap', justifyContent:'center' }}>
              <span><span style={{color:'#4f46e5',fontWeight:'900'}}>{'>'}</span> Emitter</span>
              <span><span style={{color:'#15803d',fontWeight:'900'}}>/</span> Reflector</span>
              <span><span style={{color:'#ea580c',fontWeight:'900'}}>+</span> Bifurcator</span>
              <span><span style={{color:'#4f46e5',fontWeight:'900'}}>P</span> Portal</span>
              <span><span style={{color:'#475569',fontWeight:'700'}}>#</span> Rock</span>
              <span><span style={{color:'#7c3aed'}}>O</span> Antenna</span>
            </div>
            <div style={{ border:'1px solid rgba(99,102,241,0.2)', borderRadius:'8px', background:'rgba(220,225,255,0.45)', padding:'4px', overflow:'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${level.cols}, ${CELL}px)`, gap:'2px' }}>
                {Array.from({ length:level.rows }, (_, y) => Array.from({ length:level.cols }, (_, x) => renderCell(x, y)))}
              </div>
            </div>
            <div style={{ display:'flex', gap:'12px', alignItems:'center', width:'100%', justifyContent:'space-between' }}>
              <span style={{ fontSize:'0.75rem', color:'#64748b', fontStyle:'italic' }}>Hint: {level.hint}</span>
              <button onClick={handleReset} style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.3)', color:'#4f46e5', borderRadius:'8px', padding:'6px 14px', cursor:'pointer', fontSize:'0.8rem', fontWeight:'600', whiteSpace:'nowrap' }}>Reset Level</button>
            </div>
            {gamePhase === 'levelComplete' && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ padding:'10px 24px', background:'rgba(16,185,129,0.15)', border:'2px solid #10b981', borderRadius:'10px', color:'#059669', fontWeight:'800', fontSize:'0.95rem', textTransform:'uppercase', letterSpacing:'2px' }}>✔ Level Complete!</motion.div>}
          </motion.div>
        )}
        {gamePhase === 'quiz' && (
          <motion.div key="quiz" initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:'40px', maxWidth:'580px', textAlign:'center' }}>
            <div style={{ color:'#7c3aed', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'3px', marginBottom:'12px', fontWeight:'700' }}>Spatial Attention Check</div>
            <p style={{ color:'#1e1b4b', marginBottom:'32px', fontSize:'1.05rem', lineHeight:'1.65' }}>{procLevels[levelIdx].quiz[quizStep].q}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
              {procLevels[levelIdx].quiz[quizStep].opts.map((opt, i) => <button key={i} className="btn" onClick={() => handleQuizAnswer(i)} style={{ padding:'13px 18px', textAlign:'left', display:'flex', gap:'12px' }}><span style={{ opacity:0.65 }}>[{i+1}]</span><span>{opt}</span></button>)}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {gamePhase === 'levelComplete' && (
        <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.6 }} style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 60 }}>
          <motion.div initial={{ scale: 0.8, rotate: 0 }} animate={{ scale: 1.12, rotate: 8 }} transition={{ duration: 0.9, yoyo: Infinity }} style={{ padding: '20px 36px', background: 'rgba(16,185,129,0.12)', border: '3px solid #10b981', borderRadius: 14, color: '#059669', fontWeight: 900, fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '2px' }}>
            ¡Nivel completado!
          </motion.div>
          <Confetti count={14} spread={80} duration={1.2} />
        </motion.div>
      )}
    </div>
  );
};

export default LaserPuzzleGame;
