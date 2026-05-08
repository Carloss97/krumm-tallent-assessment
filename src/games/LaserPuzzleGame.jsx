/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playMemoryFlash, playSuccessSound, playLevelUpSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useGameTimer } from '../hooks/useGameTimer';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

const CELL = 56; // Larger board for demo
const MOBILE_CELL = 24;
const TABLET_CELL = 38;
const MOBILE_GRID_GAP = 2;
const TABLET_GRID_GAP = 4;
const MOBILE_BOARD_PADDING = 8;
const TABLET_BOARD_PADDING = 10;

const getLaserMetrics = (isMobile, isTablet) => {
  const cellSize = isMobile ? MOBILE_CELL : isTablet ? TABLET_CELL : CELL;
  const gridGap = isMobile ? MOBILE_GRID_GAP : isTablet ? TABLET_GRID_GAP : 6;
  const boardPadding = isMobile ? MOBILE_BOARD_PADDING : isTablet ? TABLET_BOARD_PADDING : 12;

  return { cellSize, gridGap, boardPadding };
};

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
      body: 'Obstrucciones detectadas en el Sector Gamma. Los portales (P) permiten trasladar el haz de luz a través de vacíos espaciales. Planifica el salto para superar los bloqueos.'
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
      body: 'Obstructions detected in Sector Gamma. Portals (P) allow transferring the light beam through spatial voids. Plan the jump to overcome blockages.'
    }
  ]
};

const getBriefing = (idx, language) => {
  const pack = DEMO_BRIEFINGS[language] || DEMO_BRIEFINGS.es;
  return pack[idx] || null;
};

export const LASER_DEMO_LEVELS = [
  {
    name: 'Sector Alpha',
    difficulty: 'easy',
    cols: 10,
    rows: 7,
    par: 2,
    timeLimit: 60,
    hint: {
      es: 'Coloca los dos espejos en secuencia: primero uno para subir, luego otro para girar hacia la antena.',
      en: 'Place both mirrors in sequence: first one to rise, then another to turn toward the antenna.'
    },
    cells: [
      { x: 0, y: 3, type: 'ship', dir: 'right' },
      { x: 8, y: 0, type: 'antenna' },
      { x: 1, y: 4, type: 'reflector_nw', movable: true },
      { x: 8, y: 1, type: 'reflector_ne', movable: true },
      // Force wall barrier in middle
      { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
      { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 },
      // Block antenna approach
      { x: 8, y: 2 }, { x: 8, y: 3 }, { x: 8, y: 4 }, { x: 8, y: 5 }, { x: 8, y: 6 },
    ].map(c => c.type ? c : { ...c, type: 'wall' }),
    quiz: [],
  },
  {
    name: 'Sector Alpha+',
    difficulty: 'hard',
    cols: 11,
    rows: 8,
    par: 3,
    timeLimit: 65,
    hint: {
      es: 'Bifurca el haz y coloca dos espejos para alcanzar ambas antenas simultáneamente.',
      en: 'Bifurcate the beam and place two mirrors to reach both antennas simultaneously.'
    },
    cells: [
      { x: 0, y: 3, type: 'ship', dir: 'right' },
      { x: 10, y: 0, type: 'antenna' },
      { x: 10, y: 7, type: 'antenna' },
      { x: 2, y: 2, type: 'bifurcator', movable: true },
      { x: 10, y: 1, type: 'reflector_ne', movable: true },
      { x: 10, y: 6, type: 'reflector_nw', movable: true },
      // Middle barrier
      { x: 4, y: 0 }, { x: 4, y: 1 }, { x: 4, y: 2 }, { x: 4, y: 3 },
      { x: 4, y: 4 }, { x: 4, y: 5 }, { x: 4, y: 6 }, { x: 4, y: 7 },
      // Block antenna approaches
      { x: 10, y: 2 }, { x: 10, y: 3 }, { x: 10, y: 4 }, { x: 10, y: 5 },
    ].map(c => c.type ? c : { ...c, type: 'wall' }),
    quiz: [],
  },
  {
    name: 'Sector Beta',
    difficulty: 'easy',
    cols: 12,
    rows: 8,
    par: 2,
    timeLimit: 70,
    hint: {
      es: 'Mueve los portales y espejos para guiar el haz a través de la barrera central.',
      en: 'Move the portals and mirrors to guide the beam across the central barrier.'
    },
    cells: [
      { x: 0, y: 3, type: 'ship', dir: 'right' },
      { x: 11, y: 0, type: 'antenna' },
      { x: 1, y: 3, type: 'portal_blue', targetPortalId: 'p1', movable: true },
      { x: 8, y: 2, type: 'portal_blue', portalId: 'p1', movable: true },
      { x: 11, y: 1, type: 'reflector_ne', movable: true },
      { x: 8, y: 5, type: 'reflector_nw', movable: true },
      // Central wall barrier
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 },
      // Block antenna
      { x: 11, y: 2 }, { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 11, y: 5 },
      { x: 11, y: 6 }, { x: 11, y: 7 },
    ].map(c => c.type ? c : { ...c, type: 'wall' }),
    quiz: [],
  },
  {
    name: 'Sector Beta+',
    difficulty: 'hard',
    cols: 12,
    rows: 9,
    par: 4,
    timeLimit: 70,
    hint: {
      es: 'Mueve portales, bifurcador y espejos para alcanzar ambas antenas detrás de la barrera.',
      en: 'Move portals, bifurcator, and mirrors to reach both antennas behind the barrier.'
    },
    cells: [
      { x: 0, y: 4, type: 'ship', dir: 'right' },
      { x: 11, y: 1, type: 'antenna' },
      { x: 11, y: 7, type: 'antenna' },
      { x: 1, y: 4, type: 'portal_blue', targetPortalId: 'p2', movable: true },
      { x: 7, y: 2, type: 'portal_blue', portalId: 'p2', movable: true },
      { x: 2, y: 2, type: 'bifurcator', movable: true },
      { x: 11, y: 0, type: 'reflector_ne', movable: true },
      { x: 11, y: 8, type: 'reflector_nw', movable: true },
      // Central wall barrier
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 },
      // Block antenna
      { x: 11, y: 3 }, { x: 11, y: 4 }, { x: 11, y: 5 }, { x: 11, y: 6 },
    ].map(c => c.type ? c : { ...c, type: 'wall' }),
    quiz: [],
  },
  {
    name: 'Sector Gamma',
    difficulty: 'easy',
    cols: 13,
    rows: 9,
    par: 3,
    timeLimit: 75,
    hint: {
      es: 'Usa dos portales movibles, bifurcador y espejos para crear rutas bifurcadas.',
      en: 'Use two movable portals, bifurcator, and mirrors to create branching paths.'
    },
    cells: [
      { x: 0, y: 4, type: 'ship', dir: 'right' },
      { x: 12, y: 1, type: 'antenna' },
      { x: 12, y: 7, type: 'antenna' },
      { x: 1, y: 4, type: 'portal_blue', targetPortalId: 'p3', movable: true },
      { x: 7, y: 3, type: 'portal_blue', portalId: 'p3', movable: true },
      { x: 2, y: 2, type: 'bifurcator', movable: true },
      { x: 12, y: 0, type: 'reflector_ne', movable: true },
      { x: 12, y: 8, type: 'reflector_nw', movable: true },
      // Side barrier
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 },
      // Block antenna
      { x: 12, y: 2 }, { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 12, y: 5 }, { x: 12, y: 6 },
    ].map(c => c.type ? c : { ...c, type: 'wall' }),
    quiz: [],
  },
  {
    name: 'Sector Gamma+',
    difficulty: 'hard',
    cols: 13,
    rows: 10,
    par: 5,
    timeLimit: 85,
    hint: {
      es: 'Desafío final: encadena dos portales movibles, bifurcación y espejos para máxima complejidad.',
      en: 'Final challenge: chain two movable portals, bifurcation, and mirrors with maximum complexity.'
    },
    cells: [
      { x: 0, y: 5, type: 'ship', dir: 'right' },
      { x: 12, y: 1, type: 'antenna' },
      { x: 12, y: 8, type: 'antenna' },
      { x: 1, y: 5, type: 'portal_blue', targetPortalId: 'p4', movable: true },
      { x: 8, y: 3, type: 'portal_blue', portalId: 'p4', movable: true },
      { x: 2, y: 3, type: 'bifurcator', movable: true },
      { x: 12, y: 0, type: 'reflector_ne', movable: true },
      { x: 12, y: 9, type: 'reflector_nw', movable: true },
      { x: 10, y: 2, type: 'reflector_ne', movable: true },
      // Complex maze
      { x: 5, y: 0 }, { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 },
      { x: 5, y: 4 }, { x: 5, y: 5 }, { x: 5, y: 6 }, { x: 5, y: 7 }, { x: 5, y: 8 }, { x: 5, y: 9 },
      // Block antenna
      { x: 12, y: 2 }, { x: 12, y: 3 }, { x: 12, y: 4 }, { x: 12, y: 5 },
      { x: 12, y: 6 }, { x: 12, y: 7 },
    ].map(c => c.type ? c : { ...c, type: 'wall' }),
    quiz: [
      {
        q: '¿Cuál es la ventaja de usar portales movibles?',
        opts: ['Multiplican el haz', 'Permiten redirigir rutas sin más espejos', 'Aumentan velocidad', 'Bloquean antenas'],
        correct: 1,
      },
      {
        q: 'Movimientos mínimos en el desafío final:',
        opts: ['1', '2', '3', '5 o más'],
        correct: 3,
      },
    ],
  }
];

// Helper function to get next level(s) based on performance
export const getAdaptiveNextLevel = (currentLevelIndex, efficiency, totalLevels) => {
  // efficiency = (par / moves) * 100
  // > 85%: Very efficient - jump to hard variant
  // 60-85%: Good - go to next standard level  
  // < 60%: Struggling - repeat with easier variant or same level
  
  if (efficiency > 85) {
    // Find hard variant of next level or skip ahead
    const nextIdx = currentLevelIndex + 1;
    if (nextIdx < totalLevels && LASER_DEMO_LEVELS[nextIdx]?.difficulty === 'hard') {
      return nextIdx; // Go to hard variant
    }
    // Skip to level after hard variant
    return Math.min(nextIdx + 1, totalLevels - 1);
  } else if (efficiency >= 60) {
    // Standard progression
    return currentLevelIndex + 1 < totalLevels ? currentLevelIndex + 1 : currentLevelIndex;
  } else {
    // Struggling - repeat current level or go to easy variant
    // For now, repeat the same level
    return currentLevelIndex;
  }
};

export const getLaserEfficiency = (moves, par) => {
  return Math.min(100, Math.round((Math.max(1, par) / Math.max(1, moves)) * 100));
};

export function traceBeam(grid, cols, rows) {
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

    if (!type || type === 'empty' || type === 'wall') { 
      if (type !== 'wall') {
        beamCells.add(cellKey); 
        queue.push({ x:nx, y:ny, dir });
      }
    }
    else if (type === 'reflector_ne') { beamCells.add(cellKey); queue.push({ x:nx, y:ny, dir: DEFLECT_NE[dir] }); }
    else if (type === 'reflector_nw') { beamCells.add(cellKey); queue.push({ x:nx, y:ny, dir: DEFLECT_NW[dir] }); }
    else if (type === 'bifurcator') { beamCells.add(cellKey); BIFURCATE[dir].forEach(d => queue.push({ x:nx, y:ny, dir:d })); }
    else if (type === 'portal_blue') {
      beamCells.add(cellKey);
      const otherPortalKey = findLinkedPortalKey(grid, cellKey, cell);
      if (otherPortalKey) { const [px, py] = otherPortalKey.split(',').map(Number); queue.push({ x:px, y:py, dir }); }
    } else if (type === 'antenna') { beamCells.add(cellKey); litAntennas.add(cellKey); }
  }
  return { beamCells, litAntennas };
}

export const buildGrid = (level) => {
  const g = {};
  level.cells.forEach(c => { g[`${c.x},${c.y}`] = { ...c }; });
  return g;
};

function findLinkedPortalKey(grid, cellKey, cell) {
  const targetPortalId = cell?.targetPortalId;
  const portalId = cell?.portalId;

  if (targetPortalId) {
    const match = Object.keys(grid).find((key) => key !== cellKey && grid[key].type === 'portal_blue' && grid[key].portalId === targetPortalId);
    if (match) return match;
  }

  if (portalId) {
    const match = Object.keys(grid).find((key) => key !== cellKey && grid[key].type === 'portal_blue' && grid[key].targetPortalId === portalId);
    if (match) return match;
  }

  const fallback = Object.keys(grid).find((key) => key !== cellKey && grid[key].type === 'portal_blue');
  return fallback || null;
}

const LaserPuzzleGame = ({ isActive, onEndGame, isDemo, showBriefing = true, timeLimit }) => {
  const { recordError, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
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
  const { cellSize, gridGap, boardPadding } = useMemo(
    () => getLaserMetrics(isMobile, isTablet),
    [isMobile, isTablet]
  );
  
  const currentLevel = useMemo(() => procLevels ? procLevels[levelIdx] : null, [procLevels, levelIdx]);

  const finishGame = useCallback((tm) => {
    if(hasEndedRef.current) {
      console.log('[LaserPuzzle-TRACE] finishGame called but hasEndedRef.current already true, skipping');
      return;
    }
    console.log('[LaserPuzzle-TRACE] finishGame executing - setting phase to done and calling onEndGame');
    hasEndedRef.current = true;
    const parTotal = procLevels ? procLevels.reduce((s, l) => s + l.par, 0) : 6;
    const efficiency = Math.min(100, Math.round((parTotal / Math.max(1, tm)) * 100));
    setGamePhase('done');
    try { playSuccessSound(); } catch (error) { void error; }
    stopTracking('game7', efficiency, quizScore.current, { efficiency, quizScore: quizScore.current, totalMoves: tm });
    console.log('[LaserPuzzle-TRACE] Calling onEndGame callback with efficiency:', efficiency);
    onEndGame(efficiency, quizScore.current);
  }, [procLevels, onEndGame, stopTracking]);

  const advanceLevel = useCallback(() => {
    setSelected(null);
    if (!procLevels) return;
    
    // Calculate efficiency and determine next level adaptively
    const currentLevelData = procLevels[levelIdx];
    const efficiency = currentLevelData ? getLaserEfficiency(moves, currentLevelData.par) : 100;
    
    console.log(`[LaserPuzzle-ADAPTIVE] Level ${levelIdx} (${currentLevelData?.name}) completed with efficiency ${efficiency}%`);
    
    // Use adaptive branching if level completed (high efficiency) or fallback to standard progression
    let nextLevelIdx = levelIdx + 1;
    if (efficiency > 75 && currentLevelData?.difficulty !== 'hard') {
      // High efficiency on easy level - check if there's a hard variant available
      const hardVariantIdx = procLevels.findIndex((lvl, idx) => idx > levelIdx && lvl.difficulty === 'hard');
      if (hardVariantIdx >= 0 && hardVariantIdx < procLevels.length) {
        nextLevelIdx = hardVariantIdx;
        console.log(`[LaserPuzzle-ADAPTIVE] ✓ High efficiency (${efficiency}%) - advancing to hard variant at index ${hardVariantIdx}`);
      }
    } else if (efficiency < 50 && levelIdx > 0) {
      // Low efficiency - might want to repeat, but for demo we'll progress anyway with a note
      console.log(`[LaserPuzzle-ADAPTIVE] ⚠ Low efficiency (${efficiency}%) - consider repeating, but progressing for demo`);
    }
    
    // Progress to next level or finish
    if (nextLevelIdx < procLevels.length) {
      setLevelIdx(nextLevelIdx);
      setGrid(buildGrid(procLevels[nextLevelIdx]));
      setMoves(0);
      setBriefing(isDemo && showBriefing ? getBriefing(nextLevelIdx, language) : null);
      setGamePhase(isDemo && !showBriefing ? 'playing' : (isDemo ? 'briefing' : 'playing'));
      try { playLevelUpSound(); } catch (error) { void error; }
    } else {
      // Game complete - go to quiz if available
      const lastLevel = procLevels[procLevels.length - 1];
      const q = lastLevel?.quiz;
      if (q && q.length > 0) setGamePhase('quiz');
      else finishGame(totalMoves);
    }
  }, [levelIdx, totalMoves, procLevels, finishGame, isDemo, language, moves]);
  
  const levelTimeLimit = isDemo && currentLevel?.timeLimit ? currentLevel.timeLimit : timeLimit;
  const timeLeft = useGameTimer({ isActive: isActive && gamePhase === 'playing', timeLimit: levelTimeLimit, onEnd: advanceLevel });
  const levelEfficiency = currentLevel ? getLaserEfficiency(moves, currentLevel.par) : 100;

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
        setGamePhase(isDemo && showBriefing ? 'briefing' : 'playing');
        setQuizStep(0);

        setTimeout(() => {
          setProcLevels(LASER_DEMO_LEVELS);
          setLevelIdx(0);
          setGrid(buildGrid(LASER_DEMO_LEVELS[0]));
          setBriefing(isDemo && showBriefing ? getBriefing(0, language) : null);
        }, 0);
    }
  }, [isActive, isDemo, showBriefing, startTracking, language]);
  
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
  }, [selected, grid, gamePhase, recordTrialEvent]);

  const handleReset = () => {
    if (procLevels) setGrid(buildGrid(procLevels[levelIdx]));
    setSelected(null);
    setMoves(0);
    setGamePhase('playing');
  };

  const handleQuizAnswer = (idx) => {
    if (hasEndedRef.current) {
      console.log('[LaserPuzzle-TRACE] handleQuizAnswer called but game already ended');
      return;
    }
    const level = procLevels[levelIdx];
    const q = level.quiz[quizStep];
    const isCorrect = idx === q.correct;
    console.log(`[LaserPuzzle-TRACE] Quiz answer submitted. Question ${quizStep+1}/${level.quiz.length}, Answer correct: ${isCorrect}`);
    if (isCorrect) quizScore.current += 1;
    else recordError();
    if (quizStep + 1 < level.quiz.length) {
      console.log(`[LaserPuzzle-TRACE] Moving to next quiz question ${quizStep+2}/${level.quiz.length}`);
      setQuizStep(s => s + 1);
    } else {
      console.log('[LaserPuzzle-TRACE] All quiz questions answered, calling finishGame()');
      finishGame(totalMoves);
    }
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
      content = <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} style={{ color:'white', fontSize:'1.4rem', fontWeight:'900' }}>{SHIP_ARROW[cell.dir]}</motion.span>; 
    }
    else if (type === 'wall') { bg = '#334155'; border = '1px solid #1e293b'; content = <div style={{ width:'60%', height:'60%', background:'#475569', borderRadius:'4px' }} />; }
    else if (type === 'reflector_ne') { bg = isSel ? '#bbf7d0' : 'rgba(34,197,94,0.1)'; border = isSel ? '2px solid #22c55e' : '1px solid rgba(34,197,94,0.3)'; cursor = 'pointer'; content = <span style={{ color:'#15803d', fontSize:'1.8rem', fontWeight:'900' }}>/</span>; }
    else if (type === 'reflector_nw') { bg = isSel ? '#a7f3d0' : 'rgba(20,184,166,0.1)'; border = isSel ? '2px solid #14b8a6' : '1px solid rgba(20,184,166,0.3)'; cursor = 'pointer'; content = <span style={{ color:'#0d9488', fontSize:'1.8rem', fontWeight:'900' }}>\</span>; }
    else if (type === 'bifurcator') { bg = isSel ? '#fed7aa' : 'rgba(249,115,22,0.1)'; border = isSel ? '2px solid #f97316' : '1px solid rgba(249,115,22,0.3)'; cursor = 'pointer'; content = <span style={{ color:'#ea580c', fontSize:'1.6rem', fontWeight:'900' }}>+</span>; }
    else if (type === 'portal_blue') { bg = isSel ? '#c7d2fe' : 'rgba(99,102,241,0.08)'; border = isSel ? '2px solid #6366f1' : '1px dashed rgba(99,102,241,0.5)'; cursor = 'pointer'; content = <span style={{ color:'#4f46e5', fontSize:'1.4rem', fontWeight:'900' }}>P</span>; }
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
        style={{ width: cellSize, height: cellSize, background: bg, border, cursor, display: 'flex', alignItems: 'center', justifyContent:'center', position: 'relative', borderRadius: '4px', boxShadow: isSel ? '0 0 0 3px rgba(99,102,241,0.4)' : 'none', transition: 'all 0.15s' }}
      >
        {isBeam && type !== 'wall' && type !== 'ship' && (
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
            style={{ position:'absolute', width:10, height:10, borderRadius:'50%', background:'#f59e0b', zIndex:1, pointerEvents:'none', boxShadow: '0 0 10px #f59e0b' }} 
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
  const hintText = level
    ? (typeof level.hint === 'object' ? (level.hint[language] || level.hint.es) : level.hint)
    : '';
  const allAntennas = level ? Object.keys(grid).filter(k => grid[k].type === 'antenna') : [];
  const litCount = allAntennas.filter(k => litAntennas.has(k)).length;
  const satColor = timeLeft < 15 ? '#dc2626' : timeLeft < 30 ? '#f59e0b' : '#059669';

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:isMobile ? '12px' : '20px', gap:isMobile ? '10px' : '12px', position:'relative' }}>
      <AnimatePresence mode="wait">
        {(gamePhase === 'playing' || gamePhase === 'levelComplete') && level && (
          <motion.div key={`level-${levelIdx}`} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:isMobile ? '24px' : '32px', display:'flex', flexDirection:'column', alignItems:'center', gap:isMobile ? '16px' : '20px', background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', maxWidth: '100%' }}>
            <div style={{ display:'grid', gridTemplateColumns:isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, auto))', justifyContent:'space-between', width:'100%', fontSize:isMobile ? '0.78rem' : '0.9rem', fontWeight:'900', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:isMobile ? '1px' : '2px', gap:isMobile ? '8px' : '16px' }}>
              <span>{level.name}</span>
              <span style={{ color:satColor }}>⏱ {timeLeft}s</span>
              <span>Moves: <span style={{ color:'#4f46e5' }}>{moves}</span></span>
              <span style={{ color:'#0f766e' }}>Eff: {levelEfficiency}%</span>
              <span>Antennas: <span style={{ color: litCount === allAntennas.length ? '#059669' : '#b91c1c' }}>{litCount}/{allAntennas.length}</span></span>
            </div>
            
            <div style={{ border:'2px solid rgba(99,102,241,0.15)', borderRadius:'16px', background:'rgba(248,250,252,0.8)', padding:`${boardPadding}px`, boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.08)', width: '100%', maxWidth: '100%', overflowX: 'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${level.cols}, ${cellSize}px)`, gap:`${gridGap}px`, width: 'fit-content', margin: '0 auto' }}>
                {Array.from({ length:level.rows }, (_, y) => Array.from({ length:level.cols }, (_, x) => renderCell(x, y)))}
              </div>
            </div>

            <div style={{ display:'flex', gap:'12px', alignItems:'center', width:'100%', justifyContent:'space-between', marginTop: '8px' }}>
              <span style={{ fontSize:'0.85rem', color:'#64748b', fontStyle:'italic', fontWeight: 500 }}>{language === 'es' ? 'Pista:' : 'Hint:'} {hintText}</span>
              <button onClick={handleReset} className="btn" style={{ padding: '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>Reset</button>
            </div>
          </motion.div>
        )}
        {gamePhase === 'quiz' && (
          <motion.div key="quiz" initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:'56px', maxWidth:'600px', textAlign:'center' }}>
            <div style={{ color:'#7c3aed', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'20px', fontWeight:'900' }}>Spatial Insight</div>
            <p style={{ color:'#1e1b4b', marginBottom:'48px', fontSize:'1.4rem', fontWeight: '800', lineHeight: 1.3 }}>{procLevels[levelIdx].quiz[quizStep].q}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {procLevels[levelIdx].quiz[quizStep].opts.map((opt, i) => (
                <motion.button 
                  key={i} 
                  whileHover={{ x: 8, backgroundColor: 'rgba(124,58,237,0.12)' }}
                  className="btn" 
                  onClick={() => handleQuizAnswer(i)} 
                  style={{ padding:'20px 28px', textAlign:'left', display:'flex', gap:'16px', borderRadius: '18px', fontSize: '1.1rem' }}
                >
                  <span style={{ opacity:0.5, fontWeight: 900 }}>{i+1}.</span><span style={{ fontWeight: 700 }}>{opt}</span>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {gamePhase === 'briefing' && briefing && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ position:'absolute', inset:0, background:'rgba(15,23,42,0.7)', backdropFilter: 'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex: 100, borderRadius: '24px' }}>
          <motion.div initial={{ y:30, scale:0.95 }} animate={{ y:0, scale:1 }} style={{ background:'#ffffff', padding:'48px', borderRadius:'32px', maxWidth:'520px', textAlign:'center', border:'1px solid rgba(15,23,42,0.1)', boxShadow:'0 35px 70px -15px rgba(0,0,0,0.4)' }}>
            <div style={{ color: '#6366f1', fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '3px', marginBottom: '16px' }}>
              {language === 'es' ? 'Briefing del Sistema' : 'System Briefing'}
            </div>
            <h4 style={{ margin: 0, fontSize:'2rem', color:'#1e1b4b', fontWeight: 900, letterSpacing: '-0.03em' }}>{briefing.title}</h4>
            <p style={{ margin:'24px 0 36px', color:'#475569', lineHeight:1.7, fontSize: '1.1rem', fontWeight: 500 }}>{briefing.body}</p>
            <button className="btn btn-primary" onClick={() => setGamePhase('playing')} style={{ width: '100%', padding: '20px', fontSize: '1.2rem' }}>
              {language === 'es' ? 'Activar Sistema' : 'Activate System'}
            </button>
          </motion.div>
        </motion.div>
      )}

      {gamePhase === 'levelComplete' && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', zIndex: 110 }}>
          <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1.1, opacity: 1 }} exit={{ scale: 1.5, opacity: 0 }} style={{ padding: '32px 64px', background: 'rgba(16,185,129,0.98)', border: '3px solid #fff', borderRadius: 24, color: '#fff', fontWeight: 900, fontSize: '2rem', textTransform: 'uppercase', letterSpacing: '6px', boxShadow: '0 30px 60px -10px rgba(0,0,0,0.3)' }}>
            {language === 'es' ? '¡ÓPTIMO!' : 'OPTIMIZED!'}
          </motion.div>
          <Confetti count={30} spread={120} duration={1.8} />
        </div>
      )}
    </div>
  );
};

export default LaserPuzzleGame;
