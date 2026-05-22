/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playSuccessSound, playLevelUpSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';
import { createGridFlowLevel } from '../utils/demoLevelAuthoring';

const DEFAULT_GRID = 16;
const SAT_DECAY = 1; // % per second (reduced from 2 for better pacing)
const CELL = 32;
const MOBILE_CELL = 20;
const TABLET_CELL = 26;
const GRID_GAP = 3;
const BOARD_PADDING = 12;

const getLevelCols = (level) => level?.cols || DEFAULT_GRID;
const getLevelRows = (level) => level?.rows || DEFAULT_GRID;

const DEFAULT_VIEWPORT = { width: 1366, height: 768 };

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const getCurrentViewport = () => {
  if (typeof window === 'undefined') return DEFAULT_VIEWPORT;
  return {
    width: window.innerWidth || DEFAULT_VIEWPORT.width,
    height: window.innerHeight || DEFAULT_VIEWPORT.height,
  };
};

const useViewportSize = () => {
  const [viewport, setViewport] = useState(getCurrentViewport);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const updateViewport = () => setViewport(getCurrentViewport());
    window.addEventListener('resize', updateViewport);
    window.visualViewport?.addEventListener?.('resize', updateViewport);

    return () => {
      window.removeEventListener('resize', updateViewport);
      window.visualViewport?.removeEventListener?.('resize', updateViewport);
    };
  }, []);

  return viewport;
};

export const getGridMetrics = (isMobile, isTablet, level = {}, viewport = DEFAULT_VIEWPORT) => {
  const preferredCell = isMobile ? MOBILE_CELL : isTablet ? TABLET_CELL : CELL;
  const gapSize = isMobile || viewport.height <= 700 ? 2 : GRID_GAP;
  const paddingSize = isMobile || viewport.height <= 700 ? 10 : BOARD_PADDING;
  const minCellSize = isMobile ? 18 : isTablet ? 18 : 20;
  const cols = getLevelCols(level);
  const rows = getLevelRows(level);
  const safeWidth = Math.max(260, viewport.width - (isMobile ? 36 : 146));
  const safeHeight = Math.max(260, viewport.height - (isMobile ? 250 : 300));
  const maxCellByWidth = (safeWidth - (paddingSize * 2) - ((cols - 1) * gapSize)) / cols;
  const maxCellByHeight = (safeHeight - (paddingSize * 2) - ((rows - 1) * gapSize)) / rows;
  const fittedCell = Math.floor(Math.min(preferredCell, maxCellByWidth, maxCellByHeight));
  const cellSize = clamp(Number.isFinite(fittedCell) ? fittedCell : preferredCell, minCellSize, preferredCell);
  const stepSize = cellSize + gapSize;
  const boardWidth = Math.ceil((cols * cellSize) + ((cols - 1) * gapSize) + (paddingSize * 2));
  const boardHeight = Math.ceil((rows * cellSize) + ((rows - 1) * gapSize) + (paddingSize * 2));

  return {
    cellSize,
    gapSize,
    paddingSize,
    stepSize,
    boardSize: boardWidth,
    boardWidth,
    boardHeight,
    isCompact: viewport.height <= 820 || viewport.width <= 1180,
  };
};

const COLOR_POINT_VALUES = {
  red: 100,
  blue: 120,
  green: 150,
  orange: 170,
  pink: 200,
};

const withCityWalls = (level, rectangles) => createGridFlowLevel({
  ...level,
  start: level.startPos,
  walls: { rects: rectangles },
});

export const GRID_LEVELS = [
  // ── Level 1 [no energy, learn mechanics] ──
  // 10×10, 1 pkg, short route: start(2,6)→P(4,5)→D(7,5) ≈ 5+3=8km
  withCityWalls({
    difficulty: 'easy',
    cols: 10,
    rows: 10,
    targets: [
      { id:1, x:4, y:5, color:'#ef4444', points:100, dropZone:{x:7,y:5} },
    ],
    stations: [],
    energyDrain: 0,
    timeLimit: 25,
    startPos: { x:2, y:6 },
  }, [
    [0,0,1,0],[3,0,5,0],[7,0,9,0],[0,1,1,1],[3,1,5,1],[7,1,9,1],
    [0,8,1,8],[3,8,5,8],[7,8,9,8],[0,9,1,9],[3,9,5,9],[7,9,9,9],
  ]),

  // ── Level 2 [no energy, 2 pkgs] ──
  withCityWalls({
    difficulty: 'easy',
    cols: 11,
    rows: 11,
    targets: [
      { id:1, x:3, y:5, color:'#ef4444', points:110, dropZone:{x:9,y:8} },
      { id:2, x:8, y:6, color:'#3b82f6', points:120, dropZone:{x:2,y:5} },
    ],
    stations: [],
    energyDrain: 0,
    timeLimit: 35,
    startPos: { x:2, y:8 },
  }, [
    [0,0,1,0],[3,0,5,0],[7,0,10,0],[0,1,1,1],[3,1,5,1],[7,1,10,1],
    [0,9,1,9],[3,9,5,9],[7,9,10,9],[0,10,1,10],[3,10,5,10],[7,10,10,10],
  ]),

  // ── Level 3 [energy intro, 2 pkgs, 1 station] ──
  // Compact 10×10. Total path ≈20km, well within 30km budget.
  withCityWalls({
    difficulty: 'easy',
    cols: 10,
    rows: 10,
    targets: [
      { id:1, x:3, y:4, color:'#ef4444', points:130, dropZone:{x:7,y:3} },
      { id:2, x:6, y:7, color:'#3b82f6', points:135, dropZone:{x:3,y:8} },
    ],
    stations: [{ x:5, y:4 }],
    energyDrain: 0.6,
    timeLimit: 35,
    startPos: { x:2, y:7 },
  }, [
    [0,0,1,0],[3,0,5,0],[7,0,9,0],[0,1,1,1],[3,1,5,1],[7,1,9,1],
    [0,2,1,2],[9,2,9,2],[0,8,1,8],[3,8,5,8],[7,8,9,8],
    [0,9,1,9],[3,9,5,9],[7,9,9,9],
  ]),

  // ── Level 4 [3 pkgs, 3 stations, 12×12] ──
  withCityWalls({
    difficulty: 'medium',
    cols: 12,
    rows: 12,
    targets: [
      { id:1, x:3, y:5, color:'#ef4444', points:150, dropZone:{x:9,y:4} },
      { id:2, x:8, y:8, color:'#3b82f6', points:155, dropZone:{x:3,y:9} },
      { id:3, x:6, y:9, color:'#10b981', points:160, dropZone:{x:9,y:9} },
    ],
    stations: [{ x:4, y:5 }, { x:7, y:5 }, { x:4, y:8 }],
    energyDrain: 0.6,
    timeLimit: 50,
    startPos: { x:2, y:9 },
  }, [
    [0,0,2,0],[4,0,7,0],[9,0,11,0],[0,1,2,1],[4,1,7,1],[9,1,11,1],
    [0,2,1,2],[4,2,4,2],[7,2,7,2],[9,2,11,2],
    [0,10,2,10],[4,10,7,10],[9,10,11,10],[0,11,2,11],[4,11,7,11],[9,11,11,11],
  ]),

  // ── Level 5 [3 pkgs, 3 stations, tighter] ──
  withCityWalls({
    difficulty: 'medium',
    cols: 12,
    rows: 12,
    targets: [
      { id:1, x:3, y:5, color:'#ef4444', points:170, dropZone:{x:9,y:4} },
      { id:2, x:8, y:7, color:'#3b82f6', points:180, dropZone:{x:3,y:9} },
      { id:3, x:5, y:9, color:'#10b981', points:180, dropZone:{x:9,y:9} },
    ],
    stations: [{ x:4, y:5 }, { x:7, y:5 }, { x:5, y:7 }],
    energyDrain: 0.6,
    timeLimit: 55,
    startPos: { x:2, y:9 },
  }, [
    [0,0,2,0],[4,0,7,0],[9,0,11,0],[0,1,2,1],[4,1,7,1],[9,1,11,1],
    [0,2,1,2],[4,2,4,2],[6,2,7,2],[9,2,11,2],
    [0,10,2,10],[4,10,7,10],[9,10,11,10],[0,11,1,11],[3,11,5,11],[7,11,9,11],[11,11,11,11],
  ]),

  // ── Level 6 [4 pkgs, 4 stations, 12×12] ──
  withCityWalls({
    difficulty: 'hard',
    cols: 12,
    rows: 12,
    targets: [
      { id:1, x:3, y:5, color:'#ef4444', points:200, dropZone:{x:9,y:4} },
      { id:2, x:8, y:6, color:'#3b82f6', points:210, dropZone:{x:3,y:9} },
      { id:3, x:5, y:8, color:'#10b981', points:210, dropZone:{x:9,y:9} },
      { id:4, x:8, y:10, color:'#f59e0b', points:220, dropZone:{x:5,y:5} },
    ],
    stations: [{ x:4, y:5 }, { x:7, y:5 }, { x:4, y:8 }, { x:8, y:8 }],
    energyDrain: 0.6,
    timeLimit: 70,
    startPos: { x:2, y:10 },
  }, [
    [0,0,2,0],[4,0,7,0],[9,0,11,0],[0,1,2,1],[4,1,7,1],[9,1,11,1],
    [0,2,1,2],[4,2,4,2],[6,2,7,2],[10,2,11,2],
    [0,10,2,10],[4,10,7,10],[9,10,11,10],[0,11,1,11],[3,11,5,11],[7,11,9,11],[11,11,11,11],
  ]),

  // ── Level 7 [5 pkgs, 5 stations, 13×13 — maximum complexity] ──
  withCityWalls({
    difficulty: 'hard',
    cols: 13,
    rows: 13,
    targets: [
      { id:1, x:3, y:5, color:'#ef4444', points:230, dropZone:{x:10,y:4} },
      { id:2, x:9, y:5, color:'#3b82f6', points:240, dropZone:{x:3,y:9} },
      { id:3, x:5, y:7, color:'#10b981', points:240, dropZone:{x:10,y:7} },
      { id:4, x:8, y:9, color:'#f59e0b', points:250, dropZone:{x:5,y:5} },
      { id:5, x:5, y:10, color:'#8b5cf6', points:250, dropZone:{x:2,y:5} },
    ],
    stations: [{ x:4, y:5 }, { x:7, y:5 }, { x:11, y:5 }, { x:5, y:7 }, { x:8, y:7 }],
    energyDrain: 0.6,
    timeLimit: 85,
    startPos: { x:2, y:11 },
  }, [
    [0,0,2,0],[4,0,7,0],[9,0,12,0],[0,1,2,1],[4,1,7,1],[9,1,12,1],
    [0,2,1,2],[4,2,4,2],[6,2,7,2],[10,2,12,2],
    [0,11,2,11],[4,11,7,11],[9,11,12,11],[0,12,1,12],[3,12,5,12],[7,12,9,12],[11,12,12,12],
  ]),
];

// Helper to determine next level adaptively based on performance
export const getAdaptiveGridNextRound = (currentRound, score, maxPossibleScore, totalLevels) => {
  const efficiency = (score / Math.max(1, maxPossibleScore)) * 100;
  
  
  // Determine next round based on performance
  // efficiency > 80%: Jump to hard variant
  // efficiency 50-80%: Normal progression
  // efficiency < 50%: Repeat current difficulty or provide easier variant
  
  let nextRound = currentRound + 1;
  
  if (efficiency > 80) {
    // Check if current round has a hard variant (hard variant index = easy index + 1)
    if ((currentRound * 2 + 1) < totalLevels) {
      nextRound = currentRound * 2 + 1; // Jump to hard variant
    }
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

export const LEVEL_BRIEFINGS = {
  es: [
    {
      title: 'Paso 1: Planifica, recoge y entrega',
      body: 'Eres un gestor de logística de entregas. Tu objetivo es recoger paquetes y llevarlos a su destino. Muévete por el mapa explorando las distintas rutas disponibles. Observa cuidadosamente los elementos del mapa antes de avanzar. Tramos horizontales = 1 km, verticales = 2 km.'
    },
    {
      title: 'Paso 2: Recoge y entrega más paquetes',
      body: 'A medida que avances aparecerán nuevos desafíos. Planifica tus movimientos para completar el recorrido de forma eficiente. Cada tramo horizontal equivale a 1 km, cada tramo vertical a 2 km. Evita recorridos duplicados.'
    },
    {
      title: 'Paso 3: La energía no es infinita',
      body: 'Algunos caminos pueden ayudarte más que otros. Explora alternativas y administra cuidadosamente tus movimientos y energía. Puedes desviarte a recargar energía en las estaciones ⚡. Energía base: 30 km.'
    },
    {
      title: 'Paso 4: Rutas extendidas con obstáculos',
      body: 'Más paquetes y mayor consumo de energía. Analiza el entorno antes de tomar decisiones y busca rutas eficientes. Aparecen obstáculos en el mapa que deberás rodear.'
    },
    {
      title: 'Paso 5: Priorización de entregas',
      body: 'Algunas entregas dan más puntos. Prioriza tus entregas y obtén mayor cantidad de estrellas. Aparecen muros, callejones y corredores. Si una ruta está bloqueada, busca una vuelta segura.'
    },
    {
      title: 'Paso 6: Decisiones sobre la marcha',
      body: 'Más paquetes, más muros, más restricciones. Prioriza los que están más lejos o requieren más energía y combina entregas cercanas para no volver dos veces al mismo sector.'
    },
    {
      title: 'Paso 7: Optimización crítica final',
      body: 'Última fase: planifica, prioriza y ejecuta con máxima eficiencia. Cinco paquetes en una ciudad densa de obstáculos. Balancea energía (30 km base), muros y valor de cada entrega. Muestra cómo decides bajo presión.'
    }
  ],
  en: [
    {
      title: 'Step 1: Plan, pick up and deliver',
      body: 'You are a delivery logistics manager. Your goal is to pick up packages and deliver them to their destination. Move through the map exploring the available routes. Observe the map carefully before advancing. Horizontal segments = 1 km, vertical = 2 km.'
    },
    {
      title: 'Step 2: Pick up and deliver more packages',
      body: 'As you progress, new challenges will appear. Plan your moves to complete the route efficiently. Each horizontal segment equals 1 km, vertical 2 km. Avoid duplicate routes.'
    },
    {
      title: 'Step 3: Energy is not infinite',
      body: 'Some paths may help you more than others. Explore alternatives and manage your moves and energy carefully. You can detour to recharge energy at ⚡ stations. Base energy: 30 km.'
    },
    {
      title: 'Step 4: Extended routes with obstacles',
      body: 'More packages and higher energy consumption. Analyze the environment before making decisions and look for efficient routes. Obstacles appear on the map that you must navigate around.'
    },
    {
      title: 'Step 5: Delivery prioritization',
      body: 'Some deliveries give more points. Prioritize your deliveries and earn more stars. Walls, alleys, and corridors appear. If a route is blocked, find a safe detour.'
    },
    {
      title: 'Step 6: On-the-fly decisions',
      body: 'More packages, more walls, tighter constraints. Prioritize distant or energy-intensive ones and combine nearby deliveries so you do not return twice to the same sector.'
    },
    {
      title: 'Step 7: Final critical optimization',
      body: 'Final phase: plan, prioritize, and execute with maximum efficiency. Five packages in a dense city of obstacles. Balance energy (30 km base), walls, and delivery value. Show how you decide under pressure.'
    }
  ]
};

export const getGridBriefing = (idx, language = 'es') => {
  const pack = LEVEL_BRIEFINGS[language] || LEVEL_BRIEFINGS.es;
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

  const viewportSize = useViewportSize();

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
  const [energy, setEnergy] = useState(30);
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
  const stateRef = useRef({ player:{x:0,y:0}, inventory:null, targets:[], energy:30, round:0, score:0, totalMoves:0 });
  const satsRef = useRef({});
  const levelTimerRef = useRef(null);
  const satTimerRef = useRef(null);
  const levelTransitionRef = useRef(false);

  const currentLevel = GRID_LEVELS[round] || GRID_LEVELS[0];
  const { cellSize, gapSize, paddingSize, stepSize, boardSize, isCompact: isCompactViewport } = useMemo(
    () => getGridMetrics(isMobile, isTablet, currentLevel, viewportSize),
    [isMobile, isTablet, currentLevel, viewportSize.width, viewportSize.height]
  );

  const finishGame = useCallback(() => {
    if (hasEndedRef.current) {
      return;
    }
    hasEndedRef.current = true;
    setGameState('done');
    
    const efficiency = getGridEfficiency(stateRef.current.score, totalPossiblePoints);

    stopTracking('game6', stateRef.current.score, quizScoreRef.current, { 
      score: stateRef.current.score, 
      quizScore: quizScoreRef.current,
      efficiency,
      totalMoves: stateRef.current.totalMoves
    });
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
      energy: 30,
      targets: randomizedTargets.map(t => ({ ...t, active:true })),
    };
    stateRef.current = { ...stateRef.current, ...newState };
    setRound(newState.round);
    setPlayer(newState.player);
    setInventory(newState.inventory);
    setEnergy(newState.energy);
    setTargets(newState.targets);
    
    const nextBriefing = getGridBriefing(idx, language);
    setBriefing(isDemo && showBriefing ? nextBriefing : null);
    setGameState(isDemo && showBriefing ? 'briefing' : 'playing');

  }, [transitionToQuiz, effectiveMaxRounds, language, isDemo, showBriefing]);

  useEffect(() => { 
    if (isActive) { 
      hasEndedRef.current = false;
      startTracking();
      quizScoreRef.current = 0;
      stateRef.current = { player:{x:0,y:0}, inventory:null, targets:[], energy:30, round:0, score:0, totalMoves:0 };
      setGameState(isDemo && !showBriefing ? 'playing' : 'briefing');
      setQuizStep(0);
      setScore(0);
      loadLevel(0);
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
    let moveCost = 0;
    if (dir==='up') { ny=Math.max(0,p.y-1); moveCost=2; }
    if (dir==='down') { ny=Math.min(getLevelRows(lvl)-1,p.y+1); moveCost=2; }
    if (dir==='left') { nx=Math.max(0,p.x-1); moveCost=1; }
    if (dir==='right') { nx=Math.min(getLevelCols(lvl)-1,p.x+1); moveCost=1; }
    if (walls.has(`${nx},${ny}`) || (nx===p.x && ny===p.y)) return;

    let newEnergy = Math.max(0, eng - moveCost);
    if (lvl.stations.some(s=>s.x===nx&&s.y===ny)) {
      if (eng < 30) {
        setShowChargeAnim(true);
        setTimeout(() => setShowChargeAnim(false), 900);
        try { playLevelUpSound(); } catch (error) { void error; }
      }
      newEnergy = 30;
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
        // PDF scoring: +1 satisfacción, +5 buenas referencias por entrega
        const satisfactionBonus = Math.round(sat / 100); // +1 per full satisfaction preserved
        const referralBonus = 5; // +5 buenas referencias
        newScore += Math.round(newInv.points * Math.max(0.1, sat/100)) + satisfactionBonus + referralBonus;
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
      return;
    }
    const currentQuestion = quizQuestions[quizStep];
    const isCorrect = idx===currentQuestion.correct;
    if (isCorrect) quizScoreRef.current+=1; else recordError();
    if (quizStep+1<quizQuestions.length) {
      setQuizStep(p=>p+1);
    } else {
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
  const arrowSize = isCompactViewport && !isMobile ? 46 : 64;
  const arrowGap = isCompactViewport && !isMobile ? 8 : 12;
  const panelPadding = isMobile ? 24 : isCompactViewport ? 16 : 40;
  const panelGap = isMobile ? 20 : isCompactViewport ? 14 : 32;
  const stagePadding = isMobile ? 12 : isCompactViewport ? 8 : 20;
  const controlsGap = isMobile ? 18 : isCompactViewport ? 28 : 60;
  const ArrowBtn = ({ dir, label }) => (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onPointerDown={(e) => { e.preventDefault(); const now = Date.now(); if (now - lastMoveRef.current < 100) return; lastMoveRef.current = now; setFlashDir(dir); setTimeout(() => setFlashDir(null), 150); move(dir); }}
      style={{ width:arrowSize, height:arrowSize, background: flashDir === dir ? '#4f46e5' : 'rgba(255,255,255,0.85)', border: `2px solid ${flashDir === dir ? '#4f46e5' : 'rgba(99,102,241,0.25)'}`, borderRadius:isCompactViewport && !isMobile ? '14px' : '18px', fontSize:isCompactViewport && !isMobile ? '1.35rem' : '1.6rem', color: flashDir === dir ? '#fff' : '#1e1b4b', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow: '0 8px 12px -2px rgba(0,0,0,0.1)' }}
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
            <div style={{ color:'#059669', fontSize:'2rem', marginBottom:'12px', fontWeight:'800' }}>[ DELIVERY HUB ]</div>
            <p style={{ color:'#6b7280', textTransform:'uppercase', letterSpacing:'2px', fontSize:'0.85rem' }}>Optimización de Rutas Logísticas...</p>
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
      <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:stagePadding, gap:isMobile ? '12px' : isCompactViewport ? '8px' : '20px', position:'relative', overflow:'hidden', boxSizing:'border-box' }}>
      <AnimatePresence>
        {gameState === 'playing' && (
          <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:panelPadding, display:'flex', flexDirection:'column', alignItems:'center', gap:panelGap, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', width: 'fit-content', minWidth: `${Math.min(boardSize, boardPixelWidth)}px`, maxWidth: '100%', maxHeight:'100%', overflow:'hidden', boxSizing:'border-box' }}>
            <div style={{ display:'grid', gridTemplateColumns:isMobile ? 'repeat(3, minmax(0, 1fr))' : isTablet ? 'repeat(3, minmax(0, 1fr))' : 'repeat(6, minmax(0, 1fr))', width:'100%', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:isMobile ? '1px' : isCompactViewport ? '1.5px' : '3px', fontSize:isMobile ? '0.78rem' : isTablet ? '0.82rem' : isCompactViewport ? '0.78rem' : '1rem', fontWeight:'900', gap:isMobile ? '10px' : isTablet ? '10px' : isCompactViewport ? '12px' : '24px', whiteSpace: isMobile || isTablet ? 'normal' : 'nowrap' }}>
              <span>Round {round+1}/{effectiveMaxRounds}</span>
              <span style={{ color: levelTimeLeft<10?'#dc2626':'#059669' }}>⏱ {levelTimeLeft}s</span>
              {lvlData.energyDrain>0 && <span style={{ color: energy<8?'#dc2626':'#1e1b4b' }}>⚡ {energy} km</span>}
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

            <div style={{ width: '100%', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'center', gap: controlsGap, alignItems: 'center' }}>
               <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:arrowGap }}>
                <ArrowBtn dir="up" label="↑" />
                <div style={{ display:'flex', gap:arrowGap }}>
                  <ArrowBtn dir="left" label="←" /><ArrowBtn dir="down" label="↓" /><ArrowBtn dir="right" label="→" />
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', minWidth: isMobile ? '0' : '220px', flex: isMobile ? '1' : 'none', width: isMobile ? '100%' : 'auto' }}>
                <div style={{ fontSize: isMobile ? '0.85rem' : '1rem', color: '#64748b', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '2px', textAlign: isMobile ? 'center' : 'left' }}>{language === 'es' ? 'Inventario' : 'Inventory'}</div>
                {inventory ? (
                  <motion.div initial={{ x:-20, opacity:0 }} animate={{ x:0, opacity:1 }} style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '16px', padding: isMobile ? '14px' : '20px', background: 'rgba(99,102,241,0.1)', borderRadius: isMobile ? '12px' : '16px', border: `2px solid ${inventory.color}60`, justifyContent: isMobile ? 'center' : 'flex-start' }}>
                    <div style={{ width:isMobile ? '16px' : '20px', height:isMobile ? '16px' : '20px', background:inventory.color, borderRadius:'6px', flexShrink: 0 }}/>
                    <span style={{ fontSize: isMobile ? '1rem' : '1.2rem', fontWeight: 900 }}>{language === 'es' ? 'Listo' : 'Ready'}</span>
                  </motion.div>
                ) : (
                  <div style={{ fontSize: isMobile ? '1rem' : '1.2rem', color: '#94a3b8', fontStyle: 'italic', fontWeight: 600, textAlign: isMobile ? 'center' : 'left' }}>{language === 'es' ? 'Vacío' : 'Empty'}</div>
                )}
              </div>
            </div>

            {fuelEmpty && <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }} style={{ padding:'20px 48px', background:'#dc2626', color:'white', borderRadius:'20px', fontWeight:'950', fontSize:'1.4rem', boxShadow: '0 20px 40px -10px rgba(220,38,38,0.5)' }}>{language === 'es' ? '⚠ SIN ENERGÍA' : '⚠ NO ENERGY'}</motion.div>}
          </motion.div>
        )}

        {gameState === 'briefing' && briefing && (
          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.7)', backdropFilter: 'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 100, borderRadius: isMobile ? '20px' : '32px', padding: isMobile ? '12px' : '20px' }}>
            <motion.div initial={{ y:40, scale:0.95 }} animate={{ y:0, scale:1 }} style={{ background:'#ffffff', padding:isMobile ? '28px 22px' : isCompactViewport ? '36px 28px' : '60px', borderRadius:isMobile ? '24px' : '40px', maxWidth:isMobile ? '100%' : '600px', width: '100%', textAlign:'center', border:'1px solid rgba(15,23,42,0.1)', boxShadow:'0 40px 80px -20px rgba(0,0,0,0.5)', maxHeight: isMobile ? 'calc(100dvh - 40px)' : 'none', overflowY: 'auto', boxSizing: 'border-box' }}>
              <div style={{ color: '#4f46e5', fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: isMobile ? '3px' : '4px', marginBottom: isMobile ? '12px' : '20px' }}>
                {language === 'es' ? 'Centro de Control' : 'Control Center'}
              </div>
              <h4 style={{ margin: 0, fontSize:isMobile ? '1.5rem' : isCompactViewport ? '1.8rem' : '2.5rem', color:'#1e1b4b', fontWeight: 950, letterSpacing: '-0.04em' }}>{briefing.title}</h4>
              <p style={{ margin:isMobile ? '18px 0 28px' : '32px 0 48px', color:'#475569', lineHeight:1.8, fontSize: isMobile ? '0.95rem' : isCompactViewport ? '1.1rem' : '1.25rem', fontWeight: 500 }}>{briefing.body}</p>
              <button className="btn btn-primary" onClick={() => setGameState('playing')} style={{ width: '100%', padding: isMobile ? '18px' : '24px', fontSize: isMobile ? '1.1rem' : '1.4rem', borderRadius: isMobile ? '18px' : '24px', minHeight: isMobile ? '48px' : 'auto' }}>
                {language === 'es' ? 'Iniciar Operación' : 'Start Operation'}
              </button>
            </motion.div>
          </motion.div>
        )}

        {gameState === 'quiz' && currentQuestion && (
          <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:isMobile ? '28px 20px' : isCompactViewport ? '40px' : '64px', maxWidth:isMobile ? '100%' : '700px', width: isMobile ? 'calc(100% - 24px)' : 'auto', textAlign:'center', margin: isMobile ? '12px' : '0', boxSizing: 'border-box', maxHeight: isMobile ? 'calc(100dvh - 40px)' : 'none', overflowY: 'auto' }}>
            <div style={{ color:'#7c3aed', fontSize:isMobile ? '0.85rem' : '1rem', textTransform:'uppercase', letterSpacing:isMobile ? '3px' : '5px', marginBottom:isMobile ? '16px' : '24px', fontWeight:'950' }}>Network Check</div>
            <p style={{ color:'#1e1b4b', marginBottom:isMobile ? '32px' : '60px', fontSize:isMobile ? '1.25rem' : isCompactViewport ? '1.4rem' : '1.8rem', fontWeight: '900', lineHeight: 1.25 }}>{currentQuestion.q}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:isMobile ? '12px' : '20px' }}>
              {currentQuestion.opts.map((opt, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ x: 12, backgroundColor: 'rgba(124,58,237,0.15)' }}
                  className="btn" 
                  onClick={() => handleQuizAnswer(i)} 
                  style={{ padding:isMobile ? '18px 20px' : '24px 36px', textAlign:'left', display:'flex', gap:isMobile ? '14px' : '20px', borderRadius: isMobile ? '18px' : '24px', fontSize: isMobile ? '1.05rem' : '1.3rem', minHeight: isMobile ? '48px' : 'auto' }}
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
