/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playSuccessSound, playLevelUpSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

const DEFAULT_GRID = 16;
const SAT_DECAY = 1; // % per second (reduced from 2 for better pacing)
const CELL = 32;
const MOBILE_CELL = 20;
const TABLET_CELL = 26;
const GRID_GAP = 3;
const BOARD_PADDING = 12;

const getLevelCols = (level) => level?.cols || DEFAULT_GRID;
const getLevelRows = (level) => level?.rows || DEFAULT_GRID;

const getGridMetrics = (isMobile, isTablet) => {
  const cellSize = isMobile ? MOBILE_CELL : isTablet ? TABLET_CELL : CELL;
  const gapSize = isMobile ? 2 : GRID_GAP;
  const paddingSize = isMobile ? 10 : BOARD_PADDING;
  const stepSize = cellSize + gapSize;
  const boardSize = (18 * cellSize) + ((18 - 1) * gapSize) + (paddingSize * 2);

  return {
    cellSize,
    gapSize,
    paddingSize,
    stepSize,
    boardSize,
  };
};

const COLOR_POINT_VALUES = {
  red: 100,
  blue: 120,
  green: 150,
  orange: 170,
  pink: 200,
};

const rect = (x1, y1, x2, y2) => {
  const cells = [];
  for (let y = y1; y <= y2; y += 1) {
    for (let x = x1; x <= x2; x += 1) {
      cells.push(`${x},${y}`);
    }
  }
  return cells;
};

const cityWalls = (rectangles, reserved = []) => {
  const reservedSet = new Set(reserved.map((p) => `${p.x},${p.y}`));
  return [...new Set(rectangles.flatMap(([x1, y1, x2, y2]) => rect(x1, y1, x2, y2)))]
    .filter((key) => !reservedSet.has(key));
};

const routePoints = (level) => [
  level.startPos,
  ...level.stations,
  ...level.targets.flatMap((target) => [{ x: target.x, y: target.y }, target.dropZone]),
];

const withCityWalls = (level, rectangles) => ({
  ...level,
  walls: cityWalls(rectangles, routePoints(level)),
});

export const GRID_LEVELS = [
  withCityWalls({
    difficulty: 'easy',
    cols: 14,
    rows: 14,
    targets: [
      { id:1, x:1, y:2, color:'#ef4444', points:110, dropZone:{x:12,y:11} },
      { id:2, x:11, y:1, color:'#3b82f6', points:120, dropZone:{x:2,y:12} },
    ],
    stations: [{ x:7, y:2 }, { x:7, y:11 }],
    energyDrain: 0.7,
    timeLimit: 58,
    startPos: { x:1, y:12 },
  }, [
    [3,1,4,4], [8,1,10,3], [6,5,8,7], [1,7,3,9], [10,8,12,10], [5,10,6,12],
  ]),
  withCityWalls({
    difficulty: 'hard',
    cols: 15,
    rows: 15,
    targets: [
      { id:1, x:1, y:1, color:'#ef4444', points:140, dropZone:{x:13,y:13} },
      { id:2, x:13, y:2, color:'#3b82f6', points:140, dropZone:{x:1,y:13} },
      { id:3, x:6, y:12, color:'#10b981', points:150, dropZone:{x:12,y:6} },
    ],
    stations: [{ x:2, y:7 }, { x:7, y:2 }, { x:12, y:10 }],
    energyDrain: 1.15,
    timeLimit: 66,
    startPos: { x:7, y:14 },
  }, [
    [3,0,4,4], [8,0,10,3], [12,0,13,4], [1,5,2,6], [5,5,7,7], [10,5,13,6],
    [2,9,4,12], [7,10,9,13], [12,11,13,14],
  ]),
  withCityWalls({
    difficulty: 'easy',
    cols: 16,
    rows: 16,
    targets: [
      { id:1, x:1, y:1, color:'#ef4444', points:165, dropZone:{x:14,y:14} },
      { id:2, x:14, y:2, color:'#3b82f6', points:165, dropZone:{x:2,y:13} },
      { id:3, x:4, y:14, color:'#10b981', points:175, dropZone:{x:13,y:5} },
      { id:4, x:11, y:11, color:'#f59e0b', points:185, dropZone:{x:3,y:4} },
    ],
    stations: [{ x:1, y:8 }, { x:8, y:1 }, { x:14, y:8 }],
    energyDrain: 1.35,
    timeLimit: 78,
    startPos: { x:8, y:15 },
  }, [
    [3,1,5,3], [8,1,10,4], [12,1,14,3], [1,5,3,7], [5,6,7,9], [10,6,12,8],
    [13,6,14,10], [2,10,4,13], [7,11,9,14], [11,12,13,14],
  ]),
  withCityWalls({
    difficulty: 'hard',
    cols: 17,
    rows: 16,
    targets: [
      { id:1, x:1, y:2, color:'#ef4444', points:210, dropZone:{x:15,y:13} },
      { id:2, x:15, y:1, color:'#3b82f6', points:210, dropZone:{x:1,y:14} },
      { id:3, x:4, y:13, color:'#10b981', points:220, dropZone:{x:14,y:6} },
      { id:4, x:13, y:11, color:'#f59e0b', points:230, dropZone:{x:3,y:5} },
      { id:5, x:8, y:3, color:'#8b5cf6', points:240, dropZone:{x:8,y:14} },
    ],
    stations: [{ x:2, y:8 }, { x:8, y:1 }, { x:8, y:9 }, { x:15, y:8 }],
    energyDrain: 1.75,
    timeLimit: 88,
    startPos: { x:8, y:15 },
  }, [
    [3,0,5,4], [10,0,12,4], [14,2,15,5], [1,5,2,7], [5,6,7,8], [9,6,11,9],
    [13,7,16,9], [2,10,2,14], [4,10,4,14], [6,11,7,15], [10,11,12,14], [14,12,15,15],
  ]),
  withCityWalls({
    difficulty: 'easy',
    cols: 18,
    rows: 16,
    targets: [
      { id:1, x:1, y:1, color:'#ef4444', points:205, dropZone:{x:16,y:14} },
      { id:2, x:16, y:2, color:'#3b82f6', points:205, dropZone:{x:1,y:13} },
      { id:3, x:5, y:14, color:'#10b981', points:215, dropZone:{x:15,y:6} },
      { id:4, x:13, y:12, color:'#f59e0b', points:225, dropZone:{x:4,y:5} },
      { id:5, x:9, y:3, color:'#8b5cf6', points:235, dropZone:{x:9,y:14} },
    ],
    stations: [{ x:2, y:8 }, { x:9, y:1 }, { x:9, y:8 }, { x:16, y:9 }],
    energyDrain: 1.6,
    timeLimit: 96,
    startPos: { x:9, y:15 },
  }, [
    [3,0,5,4], [8,0,10,2], [13,0,15,4], [1,5,2,7], [5,6,7,9], [10,5,10,8], [12,5,12,8],
    [15,6,17,9], [2,10,2,14], [4,10,4,14], [7,11,8,15], [11,11,13,14], [15,12,16,15],
  ]),
  withCityWalls({
    difficulty: 'hard',
    cols: 18,
    rows: 16,
    targets: [
      { id:1, x:1, y:1, color:'#ef4444', points:250, dropZone:{x:16,y:14} },
      { id:2, x:16, y:1, color:'#3b82f6', points:250, dropZone:{x:1,y:14} },
      { id:3, x:3, y:12, color:'#10b981', points:260, dropZone:{x:15,y:5} },
      { id:4, x:14, y:12, color:'#f59e0b', points:270, dropZone:{x:4,y:4} },
      { id:5, x:8, y:3, color:'#8b5cf6', points:280, dropZone:{x:8,y:14} },
      { id:6, x:11, y:6, color:'#ec4899', points:300, dropZone:{x:2,y:8} },
    ],
    stations: [{ x:2, y:7 }, { x:8, y:1 }, { x:9, y:9 }, { x:15, y:8 }, { x:16, y:13 }],
    energyDrain: 2.05,
    timeLimit: 105,
    startPos: { x:9, y:15 },
  }, [
    [3,0,5,4], [8,0,10,2], [13,0,15,4], [1,5,2,7], [5,6,7,9], [10,5,10,8], [12,5,12,8],
    [15,6,17,9], [2,10,2,14], [4,10,4,14], [6,11,8,15], [11,10,13,14], [15,12,16,15], [4,7,4,9],
  ]),
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
  
  return Math.min(nextRound, totalLevels);
};

export const getGridEfficiency = (score, totalPossiblePoints) => {
  return Math.min(100, Math.round((score / Math.max(1, totalPossiblePoints)) * 100));
};

export const getGridFeedbackToastProps = (variant, isMobile = false) => {
  const baseStyle = {
    position: 'absolute',
    left: '50%',
    zIndex: 50,
    maxWidth: 'calc(100% - 24px)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    boxShadow: '0 18px 45px -16px rgba(15,23,42,0.55)',
  };

  const compactPad = isMobile ? '9px 16px' : '12px 28px';

  if (variant === 'deliver') {
    return {
      initial: { scale: 0.92, opacity: 0, y: 0 },
      animate: { scale: 1.08, opacity: 1, y: 0 },
      exit: { opacity: 0 },
      style: {
        ...baseStyle,
        top: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'linear-gradient(135deg, #10b981, #059669)',
        padding: isMobile ? '14px 24px' : '20px 42px',
        borderRadius: 20,
        color: '#fff',
        fontWeight: 950,
        fontSize: isMobile ? '1.05rem' : '1.35rem',
      },
    };
  }

  if (variant === 'charge') {
    return {
      initial: { scale: 0.95, opacity: 0, y: 0 },
      animate: { scale: 1, opacity: 1, y: 0 },
      exit: { opacity: 0 },
      style: {
        ...baseStyle,
        top: isMobile ? '10px' : '14px',
        transform: 'translateX(-50%)',
        background: '#fbbf24',
        padding: compactPad,
        borderRadius: 16,
        color: '#111827',
        fontWeight: 950,
        fontSize: isMobile ? '0.95rem' : '1.05rem',
      },
    };
  }

  return {
    initial: { y: -6, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    exit: { opacity: 0 },
    style: {
      ...baseStyle,
      top: isMobile ? '10px' : '14px',
      transform: 'translateX(-50%)',
      background: '#1e293b',
      padding: compactPad,
      borderRadius: 32,
      color: '#fff',
      fontWeight: 900,
      fontSize: isMobile ? '0.95rem' : '1.05rem',
    },
  };
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
      title: 'Paso 1: mover, recoger y entregar',
      body: 'Mueve el operador por la grilla. Toca un paquete para recogerlo y llévalo al nodo marcado del mismo color. En este primer paso no hay obstáculos: enfócate en entender recoger → entregar.'
    },
    {
      title: 'Paso 2: mismo flujo, más destinos',
      body: 'El objetivo no cambia: recoger y entregar. Ahora hay más paquetes y nodos. Mantén el mismo flujo, decide el orden antes de moverte y evita hacer recorridos duplicados.'
    },
    {
      title: 'Paso 3: energía y estaciones de carga',
      body: 'Cada movimiento consume energía. Las estaciones ⚡ recargan el sistema. Mira el indicador de energía antes de cruzar la grilla y planifica paradas cortas si vas a quedar al límite.'
    },
    {
      title: 'Paso 4: rutas con obstáculos',
      body: 'Aparecen muros y corredores. Antes de recoger un paquete, identifica por dónde podrás entregarlo. Si una ruta está bloqueada, busca una vuelta segura en vez de gastar energía probando.'
    },
    {
      title: 'Paso 5: priorización por tiempo',
      body: 'Los paquetes pierden satisfacción con el tiempo. Prioriza los que están más lejos o se degradan antes, y combina entregas cercanas para no volver dos veces al mismo sector.'
    },
    {
      title: 'Paso 6: optimización crítica',
      body: 'Última fase: planifica, prioriza y ejecuta con eficiencia. Balancea energía, obstáculos y valor de cada entrega. No necesitas hacerlo perfecto: muestra cómo decides bajo presión.'
    }
  ],
  en: [
    {
      title: 'Step 1: move, pick up, and deliver',
      body: 'Move the operator through the grid. Touch one packet to pick it up and carry it to the matching colored node. There are no blockers yet: focus on pick up → deliver.'
    },
    {
      title: 'Step 2: same flow, more destinations',
      body: 'The goal is the same: pick up and deliver. Now there are more packets and nodes. Keep the same flow, decide the order before moving, and avoid duplicate routes.'
    },
    {
      title: 'Step 3: energy and recharge stations',
      body: 'Every move consumes energy. ⚡ stations recharge the system. Check energy before crossing the grid and plan short stops if you are close to the limit.'
    },
    {
      title: 'Step 4: blocked routes',
      body: 'Walls and corridors appear. Before picking up a packet, identify how you will deliver it. If a route is blocked, find a safe detour instead of spending energy by trial and error.'
    },
    {
      title: 'Step 5: time prioritization',
      body: 'Packets lose satisfaction over time. Prioritize distant or faster-degrading packets, and combine nearby deliveries so you do not return twice to the same sector.'
    },
    {
      title: 'Step 6: critical optimization',
      body: 'Final phase: plan, prioritize, and execute efficiently. Balance energy, blockers, and delivery value. It does not need to be perfect: show how you decide under pressure.'
    }
  ]
};

export const getGridDemoBriefing = (idx, language = 'es') => {
  const pack = DEMO_BRIEFINGS[language] || DEMO_BRIEFINGS.es;
  return pack[Math.min(Math.max(idx, 0), pack.length - 1)];
};

// Helper: Randomize target positions within grid (except last level)
const randomizeTargetPositions = (level, round, totalRounds) => {
  if (!level.randomizeTargets || round === totalRounds - 1) {
    // Preserve authored city pickup/drop geometry unless a level opts into randomization.
    return level.targets.map(t => ({ ...t }));
  }
  
  // Other levels: randomize positions to create dynamic "street-like" experience
  const walls = new Set(level.walls);
  const occupied = new Set();
  
  return level.targets.map(t => {
    let x, y;
    let attempts = 0;
    do {
      x = Math.floor(Math.random() * getLevelCols(level));
      y = Math.floor(Math.random() * getLevelRows(level));
      attempts++;
    } while ((walls.has(`${x},${y}`) || occupied.has(`${x},${y}`)) && attempts < 50);
    
    occupied.add(`${x},${y}`);
    return { ...t, x, y };
  });
};

// Helper: Generate spontaneous targets for final level
const generateSpontaneousTarget = (levelIndex, currentTargets, walls) => {
  if (levelIndex !== GRID_LEVELS.length - 1) return null;
  
  // Only spawn if not already at max targets
  if (currentTargets.length >= 5) return null;
  
  let x, y, attempts = 0;
  const occupied = new Set(currentTargets.map(t => `${t.x},${t.y}`));
  
  do {
    x = Math.floor(Math.random() * getLevelCols(GRID_LEVELS[levelIndex]));
    y = Math.floor(Math.random() * getLevelRows(GRID_LEVELS[levelIndex]));
    attempts++;
  } while ((walls.has(`${x},${y}`) || occupied.has(`${x},${y}`)) && attempts < 50);
  
  if (attempts >= 50) return null;
  
  // Create a new target with random color from existing set
  const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
  const randomColor = colors[Math.floor(Math.random() * colors.length)];
  const nextId = Math.max(...currentTargets.map(t => t.id), 0) + 1;
  
  return {
    id: nextId,
    x,
    y,
    color: randomColor,
    points: 150,
    dropZone: { x: Math.floor(Math.random() * getLevelCols(GRID_LEVELS[levelIndex])), y: Math.floor(Math.random() * getLevelRows(GRID_LEVELS[levelIndex])) },
    active: true
  };
};

const GridFlowGame = ({ isActive, onEndGame, isDemo, showBriefing = true }) => {
  const { recordError, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();

  const effectiveMaxRounds = GRID_LEVELS.length;
  const hasEndedRef = useRef(false);

  const totalPossiblePoints = useMemo(
    () => GRID_LEVELS.reduce((sum, lvl) => sum + lvl.targets.reduce((targetSum, t) => targetSum + t.points, 0), 0),
    []
  );
  const { cellSize, gapSize, paddingSize, stepSize, boardSize } = useMemo(
    () => getGridMetrics(isMobile, isTablet),
    [isMobile, isTablet]
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
  const levelTransitionRef = useRef(false);

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
    levelTransitionRef.current = true;
    clearInterval(levelTimerRef.current);
    clearInterval(satTimerRef.current);
    setGameState('quiz');
  }, []);

  const loadLevel = useCallback((idx) => {
    if (idx >= effectiveMaxRounds) { transitionToQuiz(); return; }
    
    levelTransitionRef.current = false;

    const lvl = GRID_LEVELS[idx];
    // Randomize target positions for dynamic "street-like" gameplay
    const randomizedTargets = randomizeTargetPositions(lvl, idx, effectiveMaxRounds);
    const initSats = {};
    randomizedTargets.forEach(t => { initSats[t.id] = 100; });
    satsRef.current = initSats;
    setSats({ ...initSats });
    setFuelEmpty(false);
    
    const newState = {
      round: idx,
      player: { ...lvl.startPos },
      inventory: null,
      energy: 100,
      targets: randomizedTargets.map(t => ({ ...t, active:true })),
    };
    stateRef.current = { ...stateRef.current, ...newState };
    setRound(newState.round);
    setPlayer(newState.player);
    setInventory(newState.inventory);
    setEnergy(newState.energy);
    setTargets(newState.targets);
    
    const nextBriefing = getGridDemoBriefing(idx, language);
    setBriefing(isDemo && showBriefing ? nextBriefing : null);
    setGameState(isDemo && showBriefing ? 'briefing' : 'playing');

  }, [transitionToQuiz, effectiveMaxRounds, language, isDemo, showBriefing]);

  useEffect(() => { 
    if (isActive) { 
      console.log('[GridFlow-TRACE] Initializing GridFlowGame, isActive=true');
      hasEndedRef.current = false;
      startTracking();
      quizScoreRef.current = 0;
      stateRef.current = { player:{x:0,y:0}, inventory:null, targets:[], energy:100, round:0, score:0, totalMoves:0 };
      setGameState(isDemo && !showBriefing ? 'playing' : 'briefing');
      setQuizStep(0);
      setScore(0);
      console.log('[GridFlow-TRACE] Calling loadLevel(0), isDemo=', isDemo, 'showBriefing=', showBriefing);
      loadLevel(0);
      console.log('[GridFlow-TRACE] Initialization complete');
    } 
  }, [isActive, loadLevel, startTracking, isDemo, showBriefing]);

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
          if (levelTransitionRef.current) return 0;
          levelTransitionRef.current = true;
          clearInterval(levelTimerRef.current);
          clearInterval(satTimerRef.current);
          const r = stateRef.current.round;
          const currentRoundScore = stateRef.current.score;
          const maxPossibleScore = GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0);
          
          const nextRound = isDemo ? r + 1 : getAdaptiveGridNextRound(r, currentRoundScore, maxPossibleScore, effectiveMaxRounds);
          
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
            if (expiredTargets.every(t => !t.active) && !inv && !levelTransitionRef.current) {
              levelTransitionRef.current = true;
              clearInterval(levelTimerRef.current);
              clearInterval(satTimerRef.current);
              const r = stateRef.current.round;
              const currentRoundScore = stateRef.current.score;
              const maxPossibleScore = GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0);
              const nextRound = isDemo ? r + 1 : getAdaptiveGridNextRound(r, currentRoundScore, maxPossibleScore, effectiveMaxRounds);
              if (nextRound < effectiveMaxRounds) loadLevel(nextRound); else transitionToQuiz();
            }
          }
        }
      }, 1000);

    // Spontaneous target spawning for final level (Sector Gamma+)
    let spawnTimerRef = null;
    if (stateRef.current.round === effectiveMaxRounds - 1) {
      spawnTimerRef = setInterval(() => {
        const lvl = GRID_LEVELS[stateRef.current.round];
        const newTarget = generateSpontaneousTarget(stateRef.current.round, stateRef.current.targets, new Set(lvl.walls));
        if (newTarget) {
          const updatedTargets = [...stateRef.current.targets, newTarget];
          stateRef.current.targets = updatedTargets;
          setTargets(updatedTargets);
          
          // Initialize satisfaction for new target
          const newSats = { ...satsRef.current, [newTarget.id]: 100 };
          satsRef.current = newSats;
          setSats(newSats);
        }
      }, 4000); // Spawn every 4 seconds in final level
    }

    return () => {
        clearInterval(levelTimerRef.current);
        clearInterval(satTimerRef.current);
        if (spawnTimerRef) clearInterval(spawnTimerRef);
    };
  }, [isActive, gameState, round, loadLevel, transitionToQuiz, effectiveMaxRounds, isDemo]);

  const move = useCallback((dir) => {
    if (!isActive || gameState !== 'playing') return;
    const { player:p, energy:eng, targets:tgt, inventory:inv, round:r, score:sc, totalMoves: tm } = stateRef.current;
    
    const lvl = GRID_LEVELS[r];
    const walls = new Set(lvl.walls);

    if (eng <= 0 && lvl.energyDrain > 0) {
      if (levelTransitionRef.current) return;
      levelTransitionRef.current = true;
      recordError();
      setFuelEmpty(true);
      clearInterval(levelTimerRef.current);
      clearInterval(satTimerRef.current);
      setTimeout(() => {
        setFuelEmpty(false);
        const nextRound = isDemo ? r + 1 : getAdaptiveGridNextRound(r, sc, GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0), effectiveMaxRounds);
        if (nextRound < effectiveMaxRounds) loadLevel(nextRound); else transitionToQuiz();
      }, 1600);
      return;
    }

    let nx=p.x, ny=p.y;
    if (dir==='up') ny=Math.max(0,p.y-1);
    if (dir==='down') ny=Math.min(getLevelRows(lvl)-1,p.y+1);
    if (dir==='left') nx=Math.max(0,p.x-1);
    if (dir==='right') nx=Math.min(getLevelCols(lvl)-1,p.x+1);
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
      if (levelTransitionRef.current) return;
      levelTransitionRef.current = true;
      setFuelEmpty(true);
      clearInterval(levelTimerRef.current);
      clearInterval(satTimerRef.current);
      setTimeout(() => {
        setFuelEmpty(false);
        const nextRound = isDemo ? r + 1 : getAdaptiveGridNextRound(r, newScore, GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0), effectiveMaxRounds);
        if (nextRound < effectiveMaxRounds) loadLevel(nextRound); else transitionToQuiz();
      }, 1600);
      return;
    }
    
    if (newTargets.every(t=>!t.active) && !newInv && !levelTransitionRef.current) {
      levelTransitionRef.current = true;
      clearInterval(levelTimerRef.current);
      clearInterval(satTimerRef.current);
      const r = stateRef.current.round;
      const currentRoundScore = stateRef.current.score;
      const maxPossibleScore = GRID_LEVELS[r].targets.reduce((sum, t) => sum + t.points, 0);
      const nextRound = isDemo ? r + 1 : getAdaptiveGridNextRound(r, currentRoundScore, maxPossibleScore, effectiveMaxRounds);
      if (nextRound < effectiveMaxRounds) loadLevel(nextRound); else transitionToQuiz();
    }
  }, [isActive, gameState, loadLevel, transitionToQuiz, recordError, effectiveMaxRounds, recordTrialEvent, isDemo]);

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
    for (let y=0; y<getLevelRows(lvl); y++) {
      for (let x=0; x<getLevelCols(lvl); x++) {
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

        cells.push(<div key={`${x}-${y}`} style={{ width:`${cellSize}px`, height:`${cellSize}px`, minWidth:`${cellSize}px`, minHeight:`${cellSize}px`, background:bg, border, display:'flex', justifyContent:'center', alignItems:'center', position:'relative', borderRadius: isWall ? '6px' : '0', flexShrink: 0, boxSizing: 'border-box', overflow: 'hidden' }}>{content}</div>);
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
  const gridCols = getLevelCols(lvlData);
  const gridRows = getLevelRows(lvlData);
  const gridPixelWidth = gridCols * cellSize + ((gridCols - 1) * gapSize);
  const gridPixelHeight = gridRows * cellSize + ((gridRows - 1) * gapSize);
  const boardPixelWidth = gridPixelWidth + (paddingSize * 2);
  const liveEfficiency = getGridEfficiency(score, totalPossiblePoints);
  const currentQuestion = quizQuestions[quizStep];
  const pickupToastProps = getGridFeedbackToastProps('pickup', isMobile);
  const deliverToastProps = getGridFeedbackToastProps('deliver', isMobile);
  const chargeToastProps = getGridFeedbackToastProps('charge', isMobile);

  return (
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:isMobile ? '12px' : '20px', gap:isMobile ? '12px' : '20px', position:'relative' }}>
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:isMobile ? '24px' : '40px', display:'flex', flexDirection:'column', alignItems:'center', gap:isMobile ? '20px' : '32px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', width: 'fit-content', minWidth: `${Math.min(boardSize, boardPixelWidth)}px`, maxWidth: '100%' }}>
            <div style={{ display:'grid', gridTemplateColumns:isMobile ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))', width:'100%', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:isMobile ? '1px' : '3px', fontSize:isMobile ? '0.78rem' : '1rem', fontWeight:'900', gap:isMobile ? '10px' : '24px', whiteSpace:'nowrap' }}>
              <span>Round {round+1}/{effectiveMaxRounds}</span>
              <span style={{ color: levelTimeLeft<10?'#dc2626':'#059669' }}>⏱ {levelTimeLeft}s</span>
              {lvlData.energyDrain>0 && <span style={{ color: energy<30?'#dc2626':'#1e1b4b' }}>⚡ {Math.round(energy)}%</span>}
              <span style={{ color:satColor }}>★ {Math.round(avgSat)}%</span>
              <span style={{ color:'#0f766e' }}>Eff: {Math.round(liveEfficiency)}%</span>
              <span style={{ color:'#4f46e5' }}>Pts: {score}</span>
            </div>
            
            <div style={{ position:'relative', padding:`${paddingSize}px`, border:'2px solid rgba(99,102,241,0.2)', borderRadius:'20px', background:'#f8fafc', boxShadow: 'inset 0 4px 12px rgba(0,0,0,0.1)', width: `${boardPixelWidth}px`, maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
              {showPickupAnim && (
                <motion.div {...pickupToastProps}>
                  {language === 'es' ? '+ RECOGIDO' : '+ COLLECTED'}
                </motion.div>
              )}
              {showDeliverAnim && (
                <motion.div {...deliverToastProps}>
                  {language === 'es' ? 'ENTREGADO' : 'DELIVERED'}
                </motion.div>
              )}
              {showChargeAnim && (
                <motion.div {...chargeToastProps}>
                  {language === 'es' ? '⚡ RECARGA' : '⚡ RECHARGE'}
                </motion.div>
              )}
              {showDeliverAnim && (<div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40 }}><Confetti count={30} spread={100} duration={1.5} /></div>)}
              <div style={{ position: 'relative', display:'inline-block', width: `${gridPixelWidth}px`, height: `${gridPixelHeight}px`, overflow: 'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:`repeat(${gridCols}, ${cellSize}px)`, gap:`${gapSize}px` }}>{renderGrid()}</div>
                <motion.div
                  aria-hidden="true"
                  style={{ position:'absolute', left: 0, top: 0, width: cellSize, height: cellSize, zIndex: 20, pointerEvents: 'none' }}
                  animate={{ x: player.x * stepSize, y: player.y * stepSize }}
                  transition={{ type: 'spring', stiffness: 460, damping: 34, mass: 0.7 }}
                >
                  <div style={{ width:'100%', height:'100%', borderRadius:isMobile ? '12px' : '16px', background:'linear-gradient(135deg, #4f46e5, #6366f1)', border:'3px solid #fff', boxShadow:'0 18px 30px -8px rgba(79,70,229,0.55)', display:'flex', alignItems:'center', justifyContent:'center', color:'#fff', fontWeight: 900, fontSize: isMobile ? '1rem' : '1.35rem' }}>
                    ⬚
                  </div>
                </motion.div>
              </div>
            </div>

            <div style={{ width: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: isMobile ? '18px' : '60px', alignItems: 'center' }}>
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
