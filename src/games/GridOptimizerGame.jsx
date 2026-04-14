import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playMemoryFlash } from '../utils/audio';

const GRID = 10;
const MAX_ROUNDS = 3;
const SAT_DECAY = 2; // % per second

const WALLS_L1 = [
  '1,1','2,1','1,2','2,2', '4,1','5,1','4,2','5,2', '7,1','8,1','7,2','8,2',
  '1,5','2,5','1,6','2,6', '4,5','5,5','4,6', '7,5','8,5','7,6','8,6',
  '1,8','2,8', '5,8','6,8', '8,8',
];
const WALLS_L2 = [...WALLS_L1, '3,1', '6,5','6,6', '3,8','4,8'];
const WALLS_L3 = [...WALLS_L2, '2,3', '7,3','8,3', '5,6'];

const LEVELS = [
  { walls: WALLS_L1, targets: [{ id:1, x:2, y:0, color:'#ef4444', points:150, dropZone:{x:7,y:9} }, { id:2, x:0, y:4, color:'#3b82f6', points:100, dropZone:{x:9,y:7} }, { id:3, x:9, y:1, color:'#10b981', points: 50, dropZone:{x:0,y:8} }], stations: [], energyDrain: 0, timeLimit: 90, startPos: { x:0, y:0 } },
  { walls: WALLS_L2, targets: [{ id:4, x:6, y:0, color:'#ef4444', points:150, dropZone:{x:3,y:9} }, { id:5, x:3, y:4, color:'#10b981', points: 50, dropZone:{x:6,y:3} }, { id:6, x:0, y:7, color:'#3b82f6', points:100, dropZone:{x:9,y:4} }], stations: [{ x:3, y:3 }, { x:6, y:6 }], energyDrain: 3, timeLimit: 90, startPos: { x:0, y:0 } },
  { walls: WALLS_L3, targets: [], stations: [{ x:6, y:3 }], energyDrain: 4, timeLimit: 60, startPos: { x:0, y:0 } },
];

const QUIZ = [
  { q:'How many points was a RED objective worth?', opts:['50 pts','100 pts','150 pts','All equal'], correct:2 },
  { q:'How does target satisfaction change over time?', opts:['It increases', 'It stays the same', 'It decreases', 'It depends on the color'], correct:2 },
];

const GridOptimizerGame = ({ isActive, onEndGame, isDemo }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();

  const effectiveMaxRounds = isDemo ? 1 : MAX_ROUNDS;
  const spawnerTimerRef = useRef(null);
  const hasEndedRef = useRef(false);

  const [gameState, setGameState] = useState('playing');
  const [round, setRound] = useState(0);
  const [player, setPlayer] = useState({ x:0, y:0 });
  const [inventory, setInventory] = useState(null);
  const [energy, setEnergy] = useState(100);
  const [targets, setTargets] = useState([]);
  const [sats, setSats] = useState({});
  const [score, setScore] = useState(0);
  const [levelTimeLeft, setLevelTimeLeft] = useState(0);
  const [quizStep, setQuizStep] = useState(0);
  const [fuelEmpty, setFuelEmpty] = useState(false);
  const [showDeliverAnim, setShowDeliverAnim] = useState(false);

  const quizScoreRef = useRef(0);
  const stateRef = useRef({ player:{x:0,y:0}, inventory:null, targets:[], energy:100, round:0, score:0 });
  const satsRef = useRef({});
  const levelTimerRef = useRef(null);
  const satTimerRef = useRef(null);

  const finishGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setGameState('done');
    stopTracking('game6', stateRef.current.score, quizScoreRef.current, { score: stateRef.current.score, quizScore: quizScoreRef.current });
    onEndGame(stateRef.current.score, quizScoreRef.current);
  }, [onEndGame, stopTracking]);

  const transitionToQuiz = useCallback(() => {
    if (hasEndedRef.current) return;
    clearInterval(levelTimerRef.current);
    clearInterval(satTimerRef.current);
    setGameState('quiz');
  }, []);

  const loadLevel = useCallback((idx) => {
    if (idx >= effectiveMaxRounds) { transitionToQuiz(); return; }
    
    const lvl = LEVELS[idx];
    const initSats = {};
    lvl.targets.forEach(t => { initSats[t.id] = 100; });
    satsRef.current = initSats;
    setSats({ ...initSats });
    setFuelEmpty(false);
    
    const newState = {
      round: idx,
      player: { ...lvl.startPos },
      inventory: null,
      energy: 100,
      targets: lvl.targets.map(t => ({ ...t, active:true })),
    };
    stateRef.current = { ...stateRef.current, ...newState };
    setRound(newState.round);
    setPlayer(newState.player);
    setInventory(newState.inventory);
    setEnergy(newState.energy);
    setTargets(newState.targets);

  }, [transitionToQuiz, effectiveMaxRounds]);

  useEffect(() => { 
    if (isActive) { 
      hasEndedRef.current = false;
      startTracking();
      quizScoreRef.current = 0;
      stateRef.current = { player:{x:0,y:0}, inventory:null, targets:[], energy:100, round:0, score:0 };
      setGameState('playing');
      setQuizStep(0);
      setScore(0);
      loadLevel(0);
    } 
  }, [isActive, loadLevel, startTracking]);

  // Level countdown & Satisfaction timer
  useEffect(() => {
    if (!isActive || gameState !== 'playing') {
      clearInterval(levelTimerRef.current);
      clearInterval(satTimerRef.current);
      return;
    }

    const lvl = LEVELS[stateRef.current.round];
    if (!lvl) return;

    const timeForThisLevel = isDemo ? Math.min(lvl.timeLimit, 60) : lvl.timeLimit;
    setLevelTimeLeft(timeForThisLevel);
    levelTimerRef.current = setInterval(() => {
      setLevelTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(levelTimerRef.current);
          const r = stateRef.current.round;
          if (r + 1 < effectiveMaxRounds) loadLevel(r + 1); else transitionToQuiz();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    satTimerRef.current = setInterval(() => {
        const newSats = { ...satsRef.current };
        let changed = false;
        stateRef.current.targets.forEach(t => {
          if (!t.active) return;
          const prev = newSats[t.id] ?? 100;
          const next = Math.max(0, prev - SAT_DECAY);
          if (next !== prev) { newSats[t.id] = next; changed = true; }
        });
        if (changed) {
          satsRef.current = newSats;
          setSats({ ...newSats });
          
          const inv = stateRef.current.inventory;
          const expiredTargets = stateRef.current.targets.map(t => (t.active && (newSats[t.id] ?? 100) <= 0 && (!inv || inv.id !== t.id)) ? { ...t, active:false } : t);
          if (expiredTargets.some((t, i) => t.active !== stateRef.current.targets[i].active)) {
            stateRef.current.targets = expiredTargets;
            setTargets([...expiredTargets]);
            if (expiredTargets.every(t => !t.active) && !inv) {
              const r = stateRef.current.round;
              if (r+1 < effectiveMaxRounds) loadLevel(r+1); else transitionToQuiz();
            }
          }
        }
      }, 1000);

    return () => {
        clearInterval(levelTimerRef.current);
        clearInterval(satTimerRef.current);
    };
  }, [isActive, gameState, round, loadLevel, transitionToQuiz, effectiveMaxRounds]);

  // Spawner for Round 3
  useEffect(() => {
     if (!isActive || gameState !== 'playing' || stateRef.current.round !== 2 || effectiveMaxRounds < 3) {
        clearInterval(spawnerTimerRef.current);
        return;
     }
     
     let targetIdCounter = 100;
     const spawnOptions = [{ color:'#ef4444', points:150 }, { color:'#3b82f6', points:100 }, { color:'#10b981', points:50 }];
     
     spawnerTimerRef.current = setInterval(() => {
       const w = new Set(LEVELS[2].walls);
       let px, py, dx, dy;
       do { px = Math.floor(Math.random()*GRID); py = Math.floor(Math.random()*GRID); } while (w.has(`${px},${py}`) || (px===0&&py===0));
       do { dx = Math.floor(Math.random()*GRID); dy = Math.floor(Math.random()*GRID); } while (w.has(`${dx},${dy}`) || (dx===px&&dy===py));
       
       const opt = spawnOptions[Math.floor(Math.random()*spawnOptions.length)];
       const newTarget = { id: targetIdCounter++, x:px, y:py, color:opt.color, points:opt.points, dropZone:{x:dx, y:dy}, active:true, fastDecay:true }; 
       
       satsRef.current[newTarget.id] = 100;
       setSats({...satsRef.current});
       
       const newList = [...stateRef.current.targets, newTarget];
       stateRef.current.targets = newList;
       setTargets(newList);
     }, 6000); 
     
     return () => clearInterval(spawnerTimerRef.current);
  }, [isActive, gameState, round, effectiveMaxRounds]);

  const move = useCallback((dir) => {
    if (!isActive || gameState !== 'playing') return;
    const { player:p, energy:eng, targets:tgt, inventory:inv, round:r, score:sc } = stateRef.current;
    
    const lvl = LEVELS[r];
    const walls = new Set(lvl.walls);

    if (eng <= 0 && lvl.energyDrain > 0) {
      recordError();
      setFuelEmpty(true);
      clearInterval(levelTimerRef.current);
      setTimeout(() => {
        setFuelEmpty(false);
        if (r+1 < effectiveMaxRounds) loadLevel(r+1); else transitionToQuiz();
      }, 2000);
      return;
    }

    let nx=p.x, ny=p.y;
    if (dir==='up') ny=Math.max(0,p.y-1);
    if (dir==='down') ny=Math.min(GRID-1,p.y+1);
    if (dir==='left') nx=Math.max(0,p.x-1);
    if (dir==='right') nx=Math.min(GRID-1,p.x+1);
    if (walls.has(`${nx},${ny}`) || (nx===p.x && ny===p.y)) return;

    let newEnergy = Math.max(0, eng - lvl.energyDrain);
    if (lvl.stations.some(s=>s.x===nx&&s.y===ny)) newEnergy = 100;

    let newInv=inv, newTargets=[...tgt], newScore=sc;
    if (!newInv) {
      const hit = newTargets.find(t=>t.active&&t.x===nx&&t.y===ny);
      if (hit) {
        newInv=hit; 
        newTargets=newTargets.map(t=>t.id===hit.id?{...t,active:false}:t);
        try { playMemoryClick(); } catch(e) { /* noop */ }
        // small pickup animation
        setShowDeliverAnim(true);
        setTimeout(() => setShowDeliverAnim(false), 800);
      }
    } else {
      if (nx===newInv.dropZone.x && ny===newInv.dropZone.y) {
        const sat = satsRef.current[newInv.id] ?? 0;
        newScore += Math.round(newInv.points * Math.max(0.1, sat/100)); 
        newInv = null;
        try { playMemoryFlash(); } catch(e) { /* noop */ }
        // delivery celebration
        setShowDeliverAnim(true);
        setTimeout(() => setShowDeliverAnim(false), 900);
      }
    }
    
    const newState = { player:{x:nx,y:ny}, energy:newEnergy, inventory:newInv, targets:newTargets, score:newScore };
    stateRef.current = { ...stateRef.current, ...newState };
    setPlayer(newState.player); setEnergy(newState.energy); setInventory(newState.inventory); setTargets(newState.targets); setScore(newState.score);

    if (newEnergy <= 0 && lvl.energyDrain > 0) {
      setFuelEmpty(true);
      clearInterval(levelTimerRef.current);
      clearInterval(spawnerTimerRef.current);
      setTimeout(transitionToQuiz, 2000);
      return;
    }
    
    if (newTargets.every(t=>!t.active) && !newInv) {
      if (r+1 < effectiveMaxRounds) loadLevel(r+1); else transitionToQuiz();
    }
  }, [isActive, gameState, loadLevel, transitionToQuiz, recordError, effectiveMaxRounds]);

  const handleKeyDown = useCallback((e) => {
    const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right' };
    if (!map[e.key]) return;
    e.preventDefault();
    move(map[e.key]);
  }, [move]);

  useEffect(() => { window.addEventListener('keydown',handleKeyDown); return ()=>window.removeEventListener('keydown',handleKeyDown); }, [handleKeyDown]);

  const handleQuizAnswer = (idx) => {
    if (hasEndedRef.current) return;
    if (idx===QUIZ[quizStep].correct) quizScoreRef.current+=1; else recordError();
    if (quizStep+1<QUIZ.length) setQuizStep(p=>p+1); else finishGame();
  };

  const renderGrid = () => {
    const lvl = LEVELS[round];
    if (!lvl) return [];
    const walls = new Set(lvl.walls);
    const revealedDrop = inventory ? inventory.dropZone : null;
    const cells = [];
    for (let y=0; y<GRID; y++) {
      for (let x=0; x<GRID; x++) {
        const isWall = walls.has(`${x},${y}`);
        const isPlayer = player.x===x && player.y===y;
        const station = lvl.stations.find(s=>s.x===x&&s.y===y);
        const target = targets.find(t=>t.active&&t.x===x&&t.y===y);
        const isDrop = revealedDrop && revealedDrop.x===x && revealedDrop.y===y;

        let bg = isWall ? 'rgba(30,35,65,0.9)' : 'rgba(200,210,235,0.4)';
        let border = isWall ? '1px solid rgba(50,55,90,0.5)' : '1px solid rgba(150,160,200,0.15)';
        if (!isWall && isDrop) { bg=`${inventory.color}22`; border=`2px dashed ${inventory.color}aa`; }
        if (!isWall && station) { bg='rgba(250,204,21,0.18)'; border='1px solid rgba(250,204,21,0.5)'; }

        let content = null;
        if (isWall) content = <div style={{ width:'100%', height:'100%' }} />;
        else if (station) content = <span style={{ fontSize:'0.95rem' }}>âš¡</span>;
        else if (isDrop) content = <motion.div animate={{ scale:[0.7,1,0.7] }} transition={{ duration:1.2, repeat:Infinity }} style={{ width:'38%', height:'38%', borderRadius:'50%', background:`${inventory.color}55`, border:`2px solid ${inventory.color}` }} />;

        if (target) {
          const sat = sats[target.id] ?? 100;
          const satColor = sat >= 60 ? '#059669' : sat >= 30 ? '#f59e0b' : '#dc2626';
          content = <div style={{ position:'relative', width:'52%', height:'52%', background:target.color, borderRadius:'3px', boxShadow:`0 2px 6px ${target.color}88`, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ position:'absolute', top:'-15px', left:'50%', transform:'translateX(-50%)', fontSize:'8px', color:satColor, fontWeight:'bold', whiteSpace:'nowrap' }}>{sat}%</span></div>;
        }

        if (isPlayer) content = <div style={{ width:'68%', height:'68%', borderRadius:'4px', background:'#4f46e5', border:'2px solid rgba(255,255,255,0.9)', boxShadow:'0 0 10px rgba(79,70,229,0.7)' }} />;

        cells.push(<div key={`${x}-${y}`} style={{ width:'36px', height:'36px', background:bg, border, display:'flex', justifyContent:'center', alignItems:'center', position:'relative' }}>{content}</div>);
      }
    }
    return cells;
  };

  const lastMoveRef = useRef(0);
  const [flashDir, setFlashDir] = useState(null);
  const ArrowBtn = ({ dir, label }) => (
    <button
      onPointerDown={(e) => { e.preventDefault(); const now = Date.now(); if (now - lastMoveRef.current < 120) return; lastMoveRef.current = now; setFlashDir(dir); setTimeout(() => setFlashDir(null), 200); move(dir); }}
      style={{ width:46, height:46, background: flashDir === dir ? 'rgba(79,70,229,0.55)' : 'rgba(79,70,229,0.12)', border: `1px solid ${flashDir === dir ? '#6366f1' : 'rgba(79,70,229,0.3)'}`, borderRadius:'10px', fontSize:'1.1rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', userSelect:'none', touchAction:'none', transition:'background 0.1s, border 0.1s', boxShadow: flashDir === dir ? '0 0 12px rgba(99,102,241,0.7)' : 'none' }}
    >{label}</button>
  );

  const avgSat = targets.length ? Math.round(Object.entries(sats).filter(([id]) => targets.find(t=>t.id===parseInt(id)&&t.active)).reduce((s,[,v])=>s+v,0) / Math.max(1, targets.filter(t=>t.active).length)) : 100;
  const satColor = avgSat >= 60 ? '#059669' : avgSat >= 30 ? '#f59e0b' : '#dc2626';

  if (!isActive) {
      return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'2px solid #059669' }}>
            <div style={{ color:'#059669', fontSize:'2rem', marginBottom:'12px', fontWeight:'800' }}>[ SHIFT COMPLETE ]</div>
            <p style={{ color:'#6b7280', textTransform:'uppercase', letterSpacing:'2px', fontSize:'0.85rem' }}>Uploading Telemetry...</p>
          </motion.div>
      )
  }

  const lvlData = LEVELS[round];

  return (
    <div style={{ width:'100%', minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'16px', gap:'10px' }}>
      {gameState === 'playing' && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'16px', display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
          {fuelEmpty && <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ padding:'6px 20px', background:'#dc2626', color:'white', borderRadius:'8px', fontWeight:'700', fontSize:'0.9rem' }}>âš¡ ENERGY DEPLETED â€” GAME OVER</motion.div>}
          <div style={{ display:'flex', justifyContent:'space-between', width:'100%', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:'1px', fontSize:'0.78rem', fontWeight:'600', gap:'14px' }}>
            <span>STAGE {round+1}/{effectiveMaxRounds}</span>
            <span style={{ color: levelTimeLeft<10?'#dc2626':'#059669' }}>â± {levelTimeLeft}s</span>
            {lvlData.energyDrain>0 && <span style={{ color: energy<30?'#dc2626':'#374151' }}>âš¡ {energy}%</span>}
            <span style={{ color:satColor }}>ðŸ˜Š {avgSat}%</span>
            <span style={{ color:'#4f46e5' }}>â¬¡ {score}pts</span>
          </div>
          <div style={{ display:'flex', gap:'15px', fontSize:'0.68rem', color:'#64748b', flexWrap:'wrap', justifyContent:'center' }}>
            <span><span style={{display:'inline-block',width:'8px',height:'8px',background:'#ef4444',borderRadius:'2px',marginRight:'4px'}}/><span style={{display:'inline-block',width:'8px',height:'8px',background:'#3b82f6',borderRadius:'2px',marginRight:'4px'}}/><span style={{display:'inline-block',width:'8px',height:'8px',background:'#10b981',borderRadius:'2px',marginRight:'4px'}}/> Targets</span>
            {lvlData.stations.length>0 && <span>âš¡ Energy Station</span>}
            <span>% = Target Satisfaction</span>
          </div>
          <div style={{ position:'relative', padding:'6px', border:'1px solid rgba(99,102,241,0.2)', borderRadius:'10px', background:'rgba(220,225,255,0.5)' }}>
            {showDeliverAnim && (
              <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.8 }} style={{ position: 'absolute', left: '50%', top: '-14px', transform: 'translateX(-50%)', zIndex: 30, pointerEvents: 'none', background: 'linear-gradient(90deg, #10b981, #3b82f6)', padding: '6px 12px', borderRadius: 10, color: 'white', fontWeight: 700 }}>
                Entrega completa
              </motion.div>
            )}
            <div style={{ display:'grid', gridTemplateColumns:`repeat(${GRID}, 36px)`, gap:'2px' }}>{renderGrid()}</div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:'10px', padding:'6px 14px', background:'rgba(99,102,241,0.07)', borderRadius:'8px', border:'1px solid rgba(99,102,241,0.18)', fontSize:'0.78rem' }}>
            <span style={{ color:'#64748b', textTransform:'uppercase', fontSize:'0.68rem' }}>Carrying:</span>
            {inventory ? <><div style={{ width:'11px', height:'11px', background:inventory.color, borderRadius:'2px' }}/><span style={{ color:'#1e1b4b' }}>Deliver to <strong>pulsing zone</strong> â€” sat: <span style={{color:satColor}}>{sats[inventory.id]??100}%</span></span></> : <span style={{ color:'#94a3b8', fontStyle:'italic' }}>Empty â€” pick up a passenger</span>}
          </div>
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
            <div><ArrowBtn dir="up" label="â–²" /></div>
            <div style={{ display:'flex', gap:'4px' }}>
              <ArrowBtn dir="left" label="â—€" /><ArrowBtn dir="down" label="â–¼" /><ArrowBtn dir="right" label="â–¶" />
            </div>
          </div>
        </motion.div>
      )}
      {gameState === 'quiz' && (
        <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:'40px', maxWidth:'580px', textAlign:'center' }}>
          <div style={{ color:'#7c3aed', fontSize:'0.85rem', textTransform:'uppercase', letterSpacing:'3px', marginBottom:'12px', fontWeight:'700' }}>Selective Attention Check</div>
          <p style={{ color:'#1e1b4b', marginBottom:'32px', fontSize:'1.05rem', lineHeight:'1.65' }}>{QUIZ[quizStep].q}</p>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            {QUIZ[quizStep].opts.map((opt, i) => <button key={i} className="btn" onClick={() => handleQuizAnswer(i)} style={{ padding:'13px 18px', textAlign:'left', display:'flex', gap:'12px' }}><span style={{ opacity:0.65 }}>[{i+1}]</span><span>{opt}</span></button>)}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default GridOptimizerGame;
