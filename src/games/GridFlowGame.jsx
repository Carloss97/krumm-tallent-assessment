/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playSuccessSound, playLevelUpSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useLanguage } from '../context/LanguageContext';

const GRID = 10;
const SAT_DECAY = 1; // % per second (reduced from 2 for better pacing)
const CELL = 60; // Larger cells for better screen occupancy
const GRID_GAP = 3;
const GRID_STEP = CELL + GRID_GAP;
const BOARD_PADDING = 12;
const BOARD_SIZE = (GRID * CELL) + ((GRID - 1) * GRID_GAP) + (BOARD_PADDING * 2);

const COLOR_POINT_VALUES = {
  red: 100,
  blue: 120,
  green: 150,
  orange: 170,
  pink: 200,
};

export const GRID_LEVELS = [
  {
    // NIVEL 1: Introduction - simple linear path, no energy drain, high time limit
    // Objetivo: aprender controles y mecánica de satisfacción
    difficulty: 'easy',
    walls: [], 
    targets: [
      { id:1, x:5, y:5, color:'#ef4444', points:100, dropZone:{x:5,y:0} }, 
    ], 
    stations: [], 
    energyDrain: 0, 
    timeLimit: 40, 
    startPos: { x:5, y:9 } 
  },
  {
    // NIVEL 1-HARD: Three targets, energy management introduced
    difficulty: 'hard',
    walls: [], 
    targets: [
      { id:1, x:2, y:2, color:'#ef4444', points:100, dropZone:{x:2,y:9} },
      { id:2, x:5, y:5, color:'#3b82f6', points:100, dropZone:{x:5,y:0} },
      { id:3, x:8, y:2, color:'#10b981', points:100, dropZone:{x:8,y:9} },
    ], 
    stations: [{ x:4, y:4 }, { x:6, y:4 }],
    energyDrain: 1,
    timeLimit: 45,
    startPos: { x:5, y:9 } 
  },
  {
    // NIVEL 2: Energy management - single bottleneck with a meaningful recharge point
    difficulty: 'easy',
    walls: ['3,0', '3,1', '3,2', '3,3', '3,4', '3,5', '3,6', '3,7', '3,8'],
    targets: [
      { id:3, x:1, y:8, color:'#3b82f6', points:120, dropZone:{x:8,y:8} }
    ], 
    stations: [{ x:3, y:9 }],
    energyDrain: 2,
    timeLimit: 50,
    startPos: { x:0, y:0 } 
  },
  {
    // NIVEL 2-HARD: Dual objectives with narrow corridor and energy pressure
    difficulty: 'hard',
    walls: [
      '3,0','3,1','3,2','3,3','3,4','3,5','3,6','3,7','3,8',
      '6,1','6,2','6,3','6,4','6,5','6,6','6,7','6,8','6,9'
    ],
    targets: [
      { id:3, x:1, y:8, color:'#3b82f6', points:120, dropZone:{x:8,y:0} },
      { id:4, x:8, y:1, color:'#f59e0b', points:120, dropZone:{x:1,y:0} }
    ], 
    stations: [{ x:3, y:9 }, { x:6, y:0 }],
    energyDrain: 2.5,
    timeLimit: 45,
    startPos: { x:0, y:0 } 
  },
  {
    // NIVEL 3: Dual objectives + complex maze + critical station usage
    // Objetivo: planificación de ruta multi-objetivo, gestión de energía crítica
    difficulty: 'easy',
    walls: [
      // Left maze block
      '1,1','2,1','1,2','2,2','1,3','2,3',
      // Middle maze block  
      '4,5','5,5','4,6','5,6','4,7','5,7',
      // Right maze block
      '8,2','9,2','8,3','9,3',
    ], 
    targets: [
      { id:5, x:2, y:8, color:'#10b981', points:150, dropZone:{x:8,y:1} },
      { id:6, x:8, y:8, color:'#f59e0b', points:150, dropZone:{x:1,y:0} }
    ], 
    stations: [{ x:0, y:5 }, { x:9, y:5 }],
    energyDrain: 2.5,
    timeLimit: 70,
    startPos: { x:0, y:9 } 
  },
  {
    // NIVEL 3-HARD: Three targets, complex maze, severe energy drain, time pressure
    difficulty: 'hard',
    walls: [
      // Dense maze structure
      '1,0','2,0','1,1','2,1','1,2','2,2','1,3','2,3','1,4','2,4',
      '4,5','5,5','4,6','5,6','4,7','5,7','4,8','5,8',
      '7,1','8,1','7,2','8,2','7,3','8,3','7,4','8,4',
      '9,6','9,7','9,8','9,9',
    ], 
    targets: [
      { id:5, x:3, y:8, color:'#10b981', points:200, dropZone:{x:0,y:0} },
      { id:6, x:6, y:9, color:'#f59e0b', points:200, dropZone:{x:9,y:5} },
      { id:7, x:9, y:0, color:'#ec4899', points:200, dropZone:{x:3,y:0} }
    ], 
    stations: [{ x:0, y:4 }, { x:4, y:2 }, { x:9, y:9 }],
    energyDrain: 3.5,
    timeLimit: 65,
    startPos: { x:0, y:9 } 
  },
];

// Helper to determine next level adaptively based on performance
export const getAdaptiveGridNextRound = (currentRound, score, maxPossibleScore, totalLevels) => {
  const efficiency = (score / Math.max(1, maxPossibleScore)) * 100;
  
  console.log(`[GridFlow-ADAPTIVE] Round ${currentRound}: score=${score}/${maxPossibleScore}, efficiency=${efficiency.toFixed(1)}%`);
  
  // Determine next round based on performance
  // efficiency > 80%: Jump to hard variant
  // efficiency 50-80%: Normal progression
  // efficiency < 50%: Repeat current difficulty or provide easier variant
  
  let nextRound = currentRound + 1;
  
  if (efficiency > 80) {
    // Check if current round has a hard variant (hard variant index = easy index + 1)
    if ((currentRound * 2 + 1) < totalLevels) {
      nextRound = currentRound * 2 + 1; // Jump to hard variant
      console.log(`[GridFlow-ADAPTIVE] ✓ High efficiency (${efficiency.toFixed(1)}%) - advancing to hard variant (round ${nextRound})`);
    }
  } else if (efficiency < 50 && currentRound < 2) {
    // Low efficiency - stay at current round (implicit repeat)
    console.log(`[GridFlow-ADAPTIVE] ⚠ Low efficiency (${efficiency.toFixed(1)}%) - consider easier approach`);
  } else {
    console.log(`[GridFlow-ADAPTIVE] ~ Standard progression: ${efficiency.toFixed(1)}% - moving to next round`);
  }
  
  return Math.min(nextRound, totalLevels - 1);
};

export const getGridEfficiency = (score, totalPossiblePoints) => {
  return Math.min(100, Math.round((score / Math.max(1, totalPossiblePoints)) * 100));
};

const QUIZ = [
  { 
    q: '¿Qué sucede con la satisfacción del paquete cuando no se entrega rápidamente?', 
    opts: ['Aumenta', 'Se mantiene igual', 'Disminuye gradualmente', 'Depende del color'], 
    correct: 2 
  },
  { 
    q: '¿Cuál es el propósito principal de las estaciones con rayo (⚡)?', 
    opts: ['Aumentar puntos', 'Recargar energía del sistema', 'Teletransportarse', 'Acelerar tiempo'], 
    correct: 1 
  },
  {
    q: '¿Qué estrategia es más eficiente cuando tienes múltiples paquetes?',
    opts: ['Recoger todos primero y luego entregar', 'Entregar el más cercano primero', 'Priorizar según satisfacción y distancia', 'No importa el orden'],
    correct: 2
  }
];

const buildAttentionQuestion = (isEn) => {
  const targetColor = 'orange';
  const targetPoints = COLOR_POINT_VALUES[targetColor];
  const options = isEn
    ? [100, 120, 150, 170, 200]
    : [100, 120, 150, 170, 200];
  return {
    q: isEn
      ? `Attention check: what was the point value of the ${targetColor} target?`
      : `Chequeo de atención: ¿cuánto valía el objetivo de color ${targetColor === 'orange' ? 'naranja' : targetColor}?`,
    opts: options.map((value) => `${value} pts`),
    correct: options.indexOf(targetPoints),
  };
};

const buildQuizQuestions = (language) => {
  const isEn = language === 'en';
  return [...QUIZ, buildAttentionQuestion(isEn)];
};

const DEMO_BRIEFINGS = {
  es: [
    {
      title: 'Protocolo I: Flujo Logístico',
      body: 'Iniciando simulación de ruteo. Tu objetivo es interceptar los paquetes de datos y transferirlos a sus respectivos nodos de descarga. La precisión en la ruta es fundamental para evitar la pérdida de integridad.'
    },
    {
      title: 'Protocolo II: Gestión Energética',
      body: 'Se han activado restricciones de consumo. Cada desplazamiento consume energía del sistema. Utiliza las estaciones de carga (⚡) para reponer reservas antes de que el sistema se bloquee.'
    },
    {
      title: 'Protocolo III: Optimización Crítica',
      body: 'Escenario de alta interferencia. La red presenta obstáculos estructurales y el flujo de datos es inestable. Planifica una ruta eficiente para múltiples paquetes minimizando el gasto energético.'
    }
  ],
  en: [
    {
      title: 'Protocol I: Logistic Flow',
      body: 'Starting routing simulation. Your objective is to intercept data packets and transfer them to their respective download nodes. Routing precision is fundamental to prevent integrity loss.'
    },
    {
      title: 'Protocol II: Energy Management',
      body: 'Consumption restrictions have been activated. Each movement consumes system energy. Use charging stations (⚡) to replenish reserves before the system locks down.'
    },
    {
      title: 'Protocol III: Critical Optimization',
      body: 'High interference scenario. The network has structural obstacles and data flow is unstable. Plan an efficient route for multiple packets while minimizing energy expenditure.'
    }
  ]
};

const GridFlowGame = ({ isActive, onEndGame, isDemo, showBriefing = true }) => {
  const { recordError, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();

  const effectiveMaxRounds = GRID_LEVELS.length;
  const hasEndedRef = useRef(false);

  const totalPossiblePoints = useMemo(
    () => GRID_LEVELS.reduce((sum, lvl) => sum + lvl.targets.reduce((targetSum, t) => targetSum + t.points, 0), 0),
    []
  );

  const [gameState, setGameState] = useState('playing');
  const [briefing, setBriefing] = useState(null);
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
  const [showPickupAnim, setShowPickupAnim] = useState(false);
  const [showChargeAnim, setShowChargeAnim] = useState(false);
  const quizQuestions = useMemo(() => buildQuizQuestions(language), [language]);

  const quizScoreRef = useRef(0);
  const stateRef = useRef({ player:{x:0,y:0}, inventory:null, targets:[], energy:100, round:0, score:0, totalMoves:0 });
  const satsRef = useRef({});
  const levelTimerRef = useRef(null);
  const satTimerRef = useRef(null);

  const finishGame = useCallback(() => {
    if (hasEndedRef.current) {
      console.log('[GridFlow-TRACE] finishGame called but hasEndedRef.current already true, skipping');
      return;
    }
    console.log('[GridFlow-TRACE] finishGame executing - setting state to done and calling onEndGame');
    hasEndedRef.current = true;
    setGameState('done');
    
    const efficiency = getGridEfficiency(stateRef.current.score, totalPossiblePoints);

    stopTracking('game6', stateRef.current.score, quizScoreRef.current, { 
      score: stateRef.current.score, 
      quizScore: quizScoreRef.current,
      efficiency,
      totalMoves: stateRef.current.totalMoves
    });
    console.log('[GridFlow-TRACE] Calling onEndGame callback with score:', stateRef.current.score);
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
    
    const lvl = GRID_LEVELS[idx];
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
    
    const pack = DEMO_BRIEFINGS[language] || DEMO_BRIEFINGS.es;
    setBriefing(isDemo && showBriefing ? pack[idx] || null : null);
    setGameState(isDemo && !showBriefing ? 'playing' : 'briefing');

  }, [transitionToQuiz, effectiveMaxRounds, language]);

  useEffect(() => { 
    if (isActive) { 
      hasEndedRef.current = false;
      startTracking();
      quizScoreRef.current = 0;
      stateRef.current = { player:{x:0,y:0}, inventory:null, targets:[], energy:100, round:0, score:0, totalMoves:0 };
      setGameState(isDemo && !showBriefing ? 'playing' : 'briefing');
      setQuizStep(0);
      setScore(0);
      loadLevel(0);
    } 
  }, [isActive, loadLevel, startTracking]);

  useEffect(() => {
    if (!isActive || gameState !== 'playing') {
      clearInterval(levelTimerRef.current);
      clearInterval(satTimerRef.current);
      return;
    }

    const lvl = GRID_LEVELS[stateRef.current.round];
    if (!lvl) return;

    setLevelTimeLeft(lvl.timeLimit);
    levelTimerRef.current = setInterval(() => {
      setLevelTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(levelTimerRef.current);
          const r = stateRef.current.round;
          const currentRoundScore = stateRef.current.score;
          const maxPossibleScore = GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0);
          
          // Use adaptive branching based on score
          const nextRound = getAdaptiveGridNextRound(r, currentRoundScore, maxPossibleScore, effectiveMaxRounds);
          
          if (nextRound < effectiveMaxRounds) {
            loadLevel(nextRound);
          } else {
            transitionToQuiz();
          }
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
              const currentRoundScore = stateRef.current.score;
              const maxPossibleScore = GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0);
              const nextRound = getAdaptiveGridNextRound(r, currentRoundScore, maxPossibleScore, effectiveMaxRounds);
              if (nextRound < effectiveMaxRounds) loadLevel(nextRound); else transitionToQuiz();
            }
          }
        }
      }, 1000);

    return () => {
        clearInterval(levelTimerRef.current);
        clearInterval(satTimerRef.current);
    };
  }, [isActive, gameState, round, loadLevel, transitionToQuiz, effectiveMaxRounds]);

  const move = useCallback((dir) => {
    if (!isActive || gameState !== 'playing') return;
    const { player:p, energy:eng, targets:tgt, inventory:inv, round:r, score:sc, totalMoves: tm } = stateRef.current;
    
    const lvl = GRID_LEVELS[r];
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
    if (lvl.stations.some(s=>s.x===nx&&s.y===ny)) {
      if (eng < 100) {
        setShowChargeAnim(true);
        setTimeout(() => setShowChargeAnim(false), 900);
        try { playLevelUpSound(); } catch (error) { void error; }
      }
      newEnergy = 100;
    }

    let newInv=inv, newTargets=[...tgt], newScore=sc;
    if (!newInv) {
      const hit = newTargets.find(t=>t.active&&t.x===nx&&t.y===ny);
        if (hit) {
        if (!Number.isFinite(satsRef.current[hit.id])) {
          satsRef.current[hit.id] = 100;
        }
        newInv=hit; 
        newTargets=newTargets.map(t=>t.id===hit.id?{...t,active:false}:t);
        try { playMemoryClick(); } catch (error) { void error; }
        setShowPickupAnim(true);
        setTimeout(() => setShowPickupAnim(false), 800);
      }
    } else {
      if (nx===newInv.dropZone.x && ny===newInv.dropZone.y) {
        const sat = satsRef.current[newInv.id] ?? 0;
        newScore += Math.round(newInv.points * Math.max(0.1, sat/100)); 
        newInv = null;
        try { playSuccessSound(); } catch (error) { void error; }
        setShowDeliverAnim(true);
        setTimeout(() => setShowDeliverAnim(false), 900);
      }
    }
    
    const newState = { player:{x:nx,y:ny}, energy:newEnergy, inventory:newInv, targets:newTargets, score:newScore, totalMoves: tm + 1 };
    stateRef.current = { ...stateRef.current, ...newState };
    setPlayer(newState.player); 
    setEnergy(newState.energy); 
    setInventory(newState.inventory); 
    setTargets(newState.targets); 
    setScore(newState.score);

    // Record event for HUD and telemetry
    recordTrialEvent({ 
      type: 'move', 
      payload: { x: nx, y: ny, energy: newEnergy, hasInventory: !!newInv } 
    });

    if (newEnergy <= 0 && lvl.energyDrain > 0) {
      setFuelEmpty(true);
      clearInterval(levelTimerRef.current);
      setTimeout(transitionToQuiz, 2000);
      return;
    }
    
    if (newTargets.every(t=>!t.active) && !newInv) {
      const r = stateRef.current.round;
      const currentRoundScore = stateRef.current.score;
      const maxPossibleScore = GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0);
      const nextRound = getAdaptiveGridNextRound(r, currentRoundScore, maxPossibleScore, effectiveMaxRounds);
      if (nextRound < effectiveMaxRounds) loadLevel(nextRound); else transitionToQuiz();
    }
  }, [isActive, gameState, loadLevel, transitionToQuiz, recordError, effectiveMaxRounds, recordTrialEvent]);

  const handleKeyDown = useCallback((e) => {
    const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right', w:'up', s:'down', a:'left', d:'right' };
    if (!map[e.key]) return;
    e.preventDefault();
    move(map[e.key]);
  }, [move]);

  useEffect(() => { window.addEventListener('keydown',handleKeyDown); return ()=>window.removeEventListener('keydown',handleKeyDown); }, [handleKeyDown]);

  const handleQuizAnswer = (idx) => {
    if (hasEndedRef.current) {
      console.log('[GridFlow-TRACE] handleQuizAnswer called but game already ended');
      return;
    }
    const currentQuestion = quizQuestions[quizStep];
    const isCorrect = idx===currentQuestion.correct;
    console.log(`[GridFlow-TRACE] Quiz answer submitted. Question ${quizStep+1}/${quizQuestions.length}, Answer correct: ${isCorrect}`);
    if (isCorrect) quizScoreRef.current+=1; else recordError();
    if (quizStep+1<quizQuestions.length) {
      console.log(`[GridFlow-TRACE] Moving to next quiz question ${quizStep+2}/${quizQuestions.length}`);
      setQuizStep(p=>p+1);
    } else {
      console.log('[GridFlow-TRACE] All quiz questions answered, calling finishGame()');
      finishGame();
    }
  };

  const renderGrid = () => {
    const lvl = GRID_LEVELS[round];
    if (!lvl) return [];
    const walls = new Set(lvl.walls);
    const revealedDrop = inventory ? inventory.dropZone : null;
    const cells = [];
    for (let y=0; y<GRID; y++) {
      for (let x=0; x<GRID; x++) {
        const isWall = walls.has(`${x},${y}`);
        const station = lvl.stations.find(s=>s.x===x&&s.y===y);
        const target = targets.find(t=>t.active&&t.x===x&&t.y===y);
        const isDrop = revealedDrop && revealedDrop.x===x && revealedDrop.y===y;

        let bg = isWall ? '#1e293b' : 'rgba(241,245,249,0.5)';
        let border = isWall ? '1px solid #0f172a' : '1px solid rgba(148,163,184,0.1)';
        if (!isWall && isDrop) { bg=`${inventory.color}15`; border=`2px dashed ${inventory.color}80`; }
        if (!isWall && station) { bg='rgba(254,240,138,0.3)'; border='1px solid rgba(234,179,8,0.4)'; }

        let content = null;
        if (isWall) content = null;
        else if (station) content = <motion.span animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ fontSize:'1.4rem' }}>⚡</motion.span>;
        else if (isDrop) content = <motion.div animate={{ scale:[0.6,1,0.6], opacity: [0.4, 0.8, 0.4] }} transition={{ duration:2, repeat:Infinity }} style={{ width:'40%', height:'40%', borderRadius:'50%', background:inventory.color, border:`2px solid ${inventory.color}` }} />;

        if (target) {
          const sat = sats[target.id] ?? 100;
          const satColor = sat >= 60 ? '#059669' : sat >= 30 ? '#d97706' : '#dc2626';
          content = (
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ position:'relative', width:'60%', height:'60%', background:target.color, borderRadius:'8px', boxShadow:`0 6px 20px -1px ${target.color}60`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span style={{ position:'absolute', top:'2px', left:'50%', transform:'translateX(-50%)', fontSize:'10px', color:satColor, fontWeight:'900', lineHeight: 1, background:'rgba(255,255,255,0.9)', borderRadius:'6px', padding:'2px 4px' }}>{sat}%</span>
            </motion.div>
          );
        }

        cells.push(<div key={`${x}-${y}`} style={{ width:`${CELL}px`, height:`${CELL}px`, minWidth:`${CELL}px`, minHeight:`${CELL}px`, background:bg, border, display:'flex', justifyContent:'center', alignItems:'center', position:'relative', borderRadius: isWall ? '6px' : '0', flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden' }}>{content}</div>);
      }
    }
    return cells;
  };

  const lastMoveRef = useRef(0);
  const [flashDir, setFlashDir] = useState(null);
  const ArrowBtn = ({ dir, label }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onPointerDown={(e) => { e.preventDefault(); const now = Date.now(); if (now - lastMoveRef.current < 100) return; lastMoveRef.current = now; setFlashDir(dir); setTimeout(() => setFlashDir(null), 150); move(dir); }}
      style={{ width:64, height:64, background: flashDir === dir ? '#4f46e5' : 'rgba(255,255,255,0.85)', border: `2px solid ${flashDir === dir ? '#4f46e5' : 'rgba(99,102,241,0.25)'}`, borderRadius:'18px', fontSize:'1.6rem', color: flashDir === dir ? '#fff' : '#1e1b4b', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 8px 12px -2px rgba(0,0,0,0.1)' }}
    >{label}</motion.button>
  );

  const activeIds = targets.filter((target) => target.active).map((target) => target.id);
  const trackedIds = inventory ? [...activeIds, inventory.id] : activeIds;
  const trackedSatValues = trackedIds
    .map((id) => sats[id])
    .filter((value) => Number.isFinite(value));
  const avgSat = trackedSatValues.length > 0
    ? Math.round(trackedSatValues.reduce((sum, value) => sum + value, 0) / trackedSatValues.length)
    : 100;
  const satColor = avgSat >= 60 ? '#059669' : avgSat >= 30 ? '#d97706' : '#dc2626';

  if (!isActive) {
      return (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'2px solid #059669' }}>
            <div style={{ color:'#059669', fontSize:'2rem', marginBottom:'12px', fontWeight:'800' }}>[ FLOW SYNC ]</div>
            <p style={{ color:'#6b7280', textTransform:'uppercase', letterSpacing:'2px', fontSize:'0.85rem' }}>Optimizing Resource Allocation...</p>
          </motion.div>
      )
  }

  const lvlData = GRID_LEVELS[round];
  const liveEfficiency = getGridEfficiency(score, totalPossiblePoints);
  const currentQuestion = quizQuestions[quizStep];

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', gap:'20px', position:'relative' }}>
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:'40px', display:'flex', flexDirection:'column', alignItems:'center', gap:'32px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', width: 'fit-content', minWidth: `${BOARD_SIZE}px`, maxWidth: '100%' }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, minmax(0, 1fr))', width:'100%', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:'3px', fontSize:'1rem', fontWeight:'900', gap:'24px', whiteSpace:'nowrap' }}>
              <span>Round {round+1}/{effectiveMaxRounds}</span>
              <span style={{ color: levelTimeLeft<10?'#dc2626':'#059669' }}>⏱ {levelTimeLeft}s</span>
              {lvlData.energyDrain>0 && <span style={{ color: energy<30?'#dc2626':'#1e1b4b' }}>⚡ {energy}%</span>}
              <span style={{ color:satColor }}>★ {avgSat}%</span>
              <span style={{ color:'#0f766e' }}>Eff: {liveEfficiency}%</span>
              <span style={{ color:'#4f46e5' }}>Pts: {score}</span>
            </div>
            
            <div style={{ position:'relative', padding:`${BOARD_PADDING}px`, border:'2px solid rgba(99,102,241,0.2)', borderRadius:'20px', background:'#f8fafc', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)', width: `${BOARD_SIZE}px`, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
              {showPickupAnim && (
                <motion.div initial={{ y:10, opacity:0 }} animate={{ y:-50, opacity:1 }} exit={{ opacity:0 }} style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', zIndex: 30, background: '#1e293b', padding: '12px 32px', borderRadius: 32, color: '#fff', fontWeight: 900, fontSize: '1.1rem' }}>
                  {language === 'es' ? '+ RECOGIDO' : '+ COLLECTED'}
                </motion.div>
              )}
              {showDeliverAnim && (
                <motion.div initial={{ scale:0.8, opacity:0 }} animate={{ scale:1.3, opacity:1 }} exit={{ opacity:0 }} style={{ position: 'absolute', left: '50%', top: '40%', transform: 'translate(-50%, -50%)', zIndex: 30, background: 'linear-gradient(135deg, #10b981, #059669)', padding: '24px 48px', borderRadius: 20, color: '#fff', fontWeight: 950, fontSize: '1.5rem', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.4)' }}>
                  {language === 'es' ? 'ENTREGADO' : 'DELIVERED'}
                </motion.div>
              )}
              {showChargeAnim && (
                <motion.div initial={{ scale:0.5, opacity:0 }} animate={{ scale:1, opacity:1 }} exit={{ opacity:0 }} style={{ position: 'absolute', right: '30px', top: '30px', zIndex: 30, background: '#fbbf24', padding: '10px 20px', borderRadius: 16, color: '#000', fontWeight: 950, fontSize: '1.1rem' }}>
                  ⚡ RECARGA
                </motion.div>
              )}
              {showDeliverAnim && (<div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}><Confetti count={30} spread={100} duration={1.5} /></div>)}
              <div style={{ position: 'relative', display:'inline-block', width: `${GRID * CELL + ((GRID - 1) * GRID_GAP)}px`, height: `${GRID * CELL + ((GRID - 1) * GRID_GAP)}px`, overflow: 'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${GRID}, ${CELL}px)`, gap:`${GRID_GAP}px` }}>{renderGrid()}</div>
                <motion.div
                  aria-hidden="true"
                  style={{ position:'absolute', left: 0, top: 0, width: CELL, height: CELL, zIndex: 20, pointerEvents: 'none' }}
                  animate={{ x: player.x * GRID_STEP, y: player.y * GRID_STEP }}
                  transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
                >
                  <div style={{ width:'100%', height:'100%', borderRadius:'16px', background:'linear-gradient(135deg, #4f46e5, #6366f1)', border:'3px solid #fff', boxShadow:'0 18px 30px -8px rgba(79,70,229,0.55)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight: 900, fontSize: '1.35rem' }}>
                    ⬚
                  </div>
                </motion.div>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '60px', alignItems: 'center' }}>
               <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
                <ArrowBtn dir="up" label="↑" />
                <div style={{ display:'flex', gap:'12px' }}>
                  <ArrowBtn dir="left" label="←" /><ArrowBtn dir="down" label="↓" /><ArrowBtn dir="right" label="→" />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: '220px' }}>
                <div style={{ fontSize: '1rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px' }}>{language === 'es' ? 'Inventario' : 'Inventory'}</div>
                {inventory ? (
                  <motion.div initial={{ x:-20, opacity:0 }} animate={{ x:0, opacity:1 }} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '20px', background: 'rgba(99,102,241,0.1)', borderRadius: '16px', border: `2px solid ${inventory.color}60` }}>
                    <div style={{ width:'20px', height:'20px', background:inventory.color, borderRadius:'6px' }}/>
                    <span style={{ fontSize: '1.2rem', fontWeight: 900 }}>{language === 'es' ? 'Listo' : 'Ready'}</span>
                  </motion.div>
                ) : (
                  <div style={{ fontSize: '1.2rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600 }}>{language === 'es' ? 'Vacío' : 'Empty'}</div>
                )}
              </div>
            </div>

            {fuelEmpty && <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} style={{ padding:'20px 48px', background:'#dc2626', color:'white', borderRadius:'20px', fontWeight:'950', fontSize:'1.4rem', boxShadow: '0 20px 40px -10px rgba(220,38,38,0.5)' }}>{language === 'es' ? '⚠ SIN ENERGÍA' : '⚠ NO ENERGY'}</motion.div>}
          </motion.div>
        )}

        {gameState === 'briefing' && briefing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 100, borderRadius: '32px' }}>
            <motion.div initial={{ y:40, scale:0.95 }} animate={{ y:0, scale:1 }} style={{ background:'#ffffff', padding:'60px', borderRadius:'40px', maxWidth:'600px', textAlign:'center', border:'1px solid rgba(15,23,42,0.1)', boxShadow:'0 40px 80px -20px rgba(0,0,0,0.5)' }}>
              <div style={{ color: '#4f46e5', fontSize: '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px' }}>
                {language === 'es' ? 'Protocolo de Red' : 'Network Protocol'}
              </div>
              <h4 style={{ margin: 0, fontSize:'2.5rem', color:'#1e1b4b', fontWeight: 950, letterSpacing: '-0.04em' }}>{briefing.title}</h4>
              <p style={{ margin:'32px 0 48px', color:'#475569', lineHeight:1.8, fontSize: '1.25rem', fontWeight: 500 }}>{briefing.body}</p>
              <button className="btn btn-primary" onClick={() => setGameState('playing')} style={{ width: '100%', padding: '24px', fontSize: '1.4rem', borderRadius: '24px' }}>
                {language === 'es' ? 'Iniciar Operación' : 'Start Operation'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'quiz' && currentQuestion && (
          <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:'64px', maxWidth:'700px', textAlign:'center' }}>
            <div style={{ color:'#7c3aed', fontSize:'1rem', textTransform:'uppercase', letterSpacing:'5px', marginBottom:'24px', fontWeight:'950' }}>Network Check</div>
            <p style={{ color:'#1e1b4b', marginBottom:'60px', fontSize:'1.8rem', fontWeight: '900', lineHeight: 1.25 }}>{currentQuestion.q}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'20px' }}>
              {currentQuestion.opts.map((opt, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ x: 12, backgroundColor: 'rgba(124,58,237,0.15)' }}
                  className="btn" 
                  onClick={() => handleQuizAnswer(i)} 
                  style={{ padding:'24px 36px', textAlign:'left', display:'flex', gap:'20px', borderRadius: '24px', fontSize: '1.3rem' }}
                >
                  <span style={{ opacity:0.5, fontWeight: 950 }}>{i+1}.</span><span style={{ fontWeight: 800 }}>{opt}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GridFlowGame;
