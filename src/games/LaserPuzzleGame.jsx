/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { playMemoryClick, playMemoryFlash, playSuccessSound, playLevelUpSound } from '../utils/audio';
import Confetti from '../components/Confetti';
import { useGameTimer } from '../hooks/useGameTimer';
import { useLanguage } from '../context/LanguageContext';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

const CELL = 40; // Large maps stay visible on desktop
const MOBILE_CELL = 24;
const TABLET_CELL = 38;
const MOBILE_GRID_GAP = 2;
const TABLET_GRID_GAP = 4;
const MOBILE_BOARD_PADDING = 8;
const TABLET_BOARD_PADDING = 10;
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

export const getLaserMetrics = (isMobile, isTablet, level = {}, viewport = DEFAULT_VIEWPORT) => {
  const preferredCell = isMobile ? MOBILE_CELL : isTablet ? TABLET_CELL : CELL;
  const gridGap = isMobile ? MOBILE_GRID_GAP : viewport.height <= 820 ? TABLET_GRID_GAP : isTablet ? TABLET_GRID_GAP : 6;
  const boardPadding = isMobile ? MOBILE_BOARD_PADDING : viewport.height <= 820 ? TABLET_BOARD_PADDING : isTablet ? TABLET_BOARD_PADDING : 12;
  const minCellSize = isMobile ? 20 : isTablet ? 22 : 24;
  const cols = level?.cols || 12;
  const rows = level?.rows || 10;
  const safeWidth = Math.max(260, viewport.width - (isMobile ? 32 : 146));
  const safeHeight = Math.max(260, viewport.height - (isMobile ? 260 : 318));
  const maxCellByWidth = (safeWidth - (boardPadding * 2) - ((cols - 1) * gridGap)) / cols;
  const maxCellByHeight = (safeHeight - (boardPadding * 2) - ((rows - 1) * gridGap)) / rows;
  const fittedCell = Math.floor(Math.min(preferredCell, maxCellByWidth, maxCellByHeight));
  const cellSize = clamp(Number.isFinite(fittedCell) ? fittedCell : preferredCell, minCellSize, preferredCell);
  const boardWidth = Math.ceil((cols * cellSize) + ((cols - 1) * gridGap) + (boardPadding * 2));
  const boardHeight = Math.ceil((rows * cellSize) + ((rows - 1) * gridGap) + (boardPadding * 2));

  return {
    cellSize,
    gridGap,
    boardPadding,
    boardWidth,
    boardHeight,
    isCompact: viewport.height <= 820 || viewport.width <= 1180,
  };
};

const SHIP_ARROW = {
  right: '→', left: '←', up: '↑', down: '↓',
  upRight: '↗', downRight: '↘', downLeft: '↙', upLeft: '↖',
};
const DEFLECT_NE = {
  right: 'up', left: 'down', up: 'right', down: 'left',
  downRight: 'upLeft', upLeft: 'downRight', upRight: 'upRight', downLeft: 'downLeft',
};
const DEFLECT_NW = {
  right: 'down', left: 'up', up: 'left', down: 'right',
  downRight: 'downRight', upLeft: 'upLeft', upRight: 'downLeft', downLeft: 'upRight',
};
const BIFURCATE = {
  right: ['up', 'down'], left: ['up', 'down'], up: ['left', 'right'], down: ['left', 'right'],
  upRight: ['up', 'right'], downRight: ['down', 'right'], downLeft: ['down', 'left'], upLeft: ['up', 'left'],
};
const DIRS = {
  right: [1, 0], left: [-1, 0], up: [0, -1], down: [0, 1],
  upRight: [1, -1], downRight: [1, 1], downLeft: [-1, 1], upLeft: [-1, -1],
};

const DEMO_BRIEFINGS = {
  es: [
    {
      title: 'Paso 1: espejos y dirección del haz',
      body: 'Selecciona un espejo y muévelo a una celda libre para redirigir el haz hacia la antena. Observa la línea iluminada: te muestra en tiempo real si el camino funciona.'
    },
    {
      title: 'Paso 2: bifurcador de señal',
      body: 'El bifurcador (+) divide el haz en dos rutas. Úsalo cuando hay dos antenas: una rama debe subir y la otra bajar hasta iluminar ambos objetivos a la vez.'
    },
    {
      title: 'Paso 3: espejos encadenados',
      body: 'Ahora la solución requiere más de un giro. Piensa la ruta en tramos: salir del emisor, esquivar el bloqueo y hacer el último giro hacia la antena.'
    },
    {
      title: 'Paso 4: bifurcación con obstáculos',
      body: 'La división de señal sigue siendo la clave, pero los muros obligan a separar rutas. Ubica primero el bifurcador y luego ajusta los espejos de cada rama.'
    },
    {
      title: 'Paso 5: portales',
      body: 'Los portales trasladan el haz de una entrada a otra manteniendo su dirección. Úsalos para saltar obstáculos y después corrige la trayectoria con un espejo.'
    },
    {
      title: 'Paso 6: portales + bifurcador',
      body: 'Último desafío: combina portal, bifurcador y espejos. Primero crea el salto, luego divide la señal y finalmente ajusta cada rama hacia su antena.'
    }
  ],
  en: [
    {
      title: 'Step 1: mirrors and beam direction',
      body: 'Select a mirror and move it to an empty cell to redirect the beam toward the antenna. Watch the lit path: it shows in real time whether the route works.'
    },
    {
      title: 'Step 2: signal bifurcator',
      body: 'The bifurcator (+) splits the beam into two paths. Use it when there are two antennas: one branch should go up and the other down to light both targets at once.'
    },
    {
      title: 'Step 3: chained mirrors',
      body: 'The solution now needs more than one turn. Think in segments: leave the emitter, avoid the blocker, then make the final turn toward the antenna.'
    },
    {
      title: 'Step 4: bifurcation with blockers',
      body: 'Signal splitting is still the key, but walls force separated routes. Place the bifurcator first, then adjust each branch mirror.'
    },
    {
      title: 'Step 5: portals',
      body: 'Portals move the beam from one entry to another while preserving its direction. Use them to jump over blockers, then correct the trajectory with a mirror.'
    },
    {
      title: 'Step 6: portals + bifurcator',
      body: 'Final challenge: combine portal, bifurcator, and mirrors. Create the jump first, split the signal, then tune each branch toward its antenna.'
    }
  ]
};

export const getLaserDemoBriefing = (idx, language = 'es') => {
  const pack = DEMO_BRIEFINGS[language] || DEMO_BRIEFINGS.es;
  return pack[Math.min(Math.max(idx, 0), pack.length - 1)];
};

const wallRect = (x1, y1, x2, y2) => {
  const cells = [];
  for (let y = y1; y <= y2; y += 1) {
    for (let x = x1; x <= x2; x += 1) {
      cells.push(`${x},${y}`);
    }
  }
  return cells;
};

const makeLaserCells = (objects, rectangles, reserved = []) => {
  const reservedKeys = new Set([
    ...objects.map((cell) => `${cell.x},${cell.y}`),
    ...reserved.map((cell) => `${cell.x},${cell.y}`),
  ]);

  const walls = [...new Set(rectangles.flatMap(([x1, y1, x2, y2]) => wallRect(x1, y1, x2, y2)))]
    .filter((key) => !reservedKeys.has(key))
    .map((key) => {
      const [x, y] = key.split(',').map(Number);
      return { x, y, type: 'wall' };
    });

  return [...walls, ...objects];
};

export const LASER_DEMO_LEVELS = [
  {
    name: 'Sector Alpha',
    difficulty: 'easy',
    cols: 12,
    rows: 10,
    par: 6,
    timeLimit: 105,
    hint: {
      es: 'Encadena cuatro esquinas: salida horizontal, subida, cruce superior, bajada y alineación final. Los espejos sobrantes son distractores.',
      en: 'Chain four corners: horizontal exit, climb, upper crossing, descent, and final alignment. Extra mirrors are distractors.'
    },
    solutionPlacements: [['1,8', '3,5'], ['9,8', '3,2'], ['10,8', '7,2'], ['11,7', '7,7']],
    cells: makeLaserCells([
      { x: 0, y: 5, type: 'ship', dir: 'right' },
      { x: 10, y: 7, type: 'antenna' },
      { x: 1, y: 8, type: 'reflector_ne', movable: true },
      { x: 9, y: 8, type: 'reflector_ne', movable: true },
      { x: 10, y: 8, type: 'reflector_nw', movable: true },
      { x: 11, y: 7, type: 'reflector_nw', movable: true },
      { x: 11, y: 0, type: 'reflector_ne', movable: true },
      { x: 5, y: 9, type: 'reflector_nw', movable: true },
      { x: 8, y: 0, type: 'reflector_ne', movable: true },
    ], [
      [1,0,2,1], [5,0,6,1], [9,0,11,1], [0,8,4,9], [5,8,6,9], [9,4,11,5], [0,2,1,3], [8,8,11,9],
    ], [{ x:3, y:5 }, { x:3, y:2 }, { x:7, y:2 }, { x:7, y:7 }, { x:10, y:7 }, { x:1, y:8 }, { x:9, y:8 }, { x:10, y:8 }, { x:11, y:7 }, { x:11, y:0 }, { x:5, y:9 }, { x:8, y:0 }]),
    quiz: [],
  },
  {
    name: 'Sector Alpha+',
    difficulty: 'hard',
    cols: 12,
    rows: 10,
    par: 8,
    timeLimit: 115,
    hint: {
      es: 'El bifurcador no alcanza por sí solo: cada rama necesita dos giros para entrar por corredores estrechos hasta su antena.',
      en: 'The bifurcator is not enough by itself: each branch needs two turns to enter narrow lanes toward its antenna.'
    },
    solutionPlacements: [['1,8', '4,5'], ['9,0', '4,2'], ['2,0', '9,2'], ['9,9', '4,8'], ['10,4', '9,8']],
    cells: makeLaserCells([
      { x: 0, y: 5, type: 'ship', dir: 'right' },
      { x: 9, y: 4, type: 'antenna' },
      { x: 9, y: 6, type: 'antenna' },
      { x: 1, y: 8, type: 'bifurcator', movable: true },
      { x: 9, y: 0, type: 'reflector_ne', movable: true },
      { x: 2, y: 0, type: 'reflector_nw', movable: true },
      { x: 9, y: 9, type: 'reflector_nw', movable: true },
      { x: 10, y: 4, type: 'reflector_ne', movable: true },
      { x: 1, y: 1, type: 'reflector_ne', movable: true },
      { x: 8, y: 9, type: 'reflector_nw', movable: true },
      { x: 11, y: 4, type: 'bifurcator', movable: true },
    ], [
      [1,0,2,1], [6,0,7,1], [10,0,11,2], [6,3,7,4], [0,7,2,9], [6,6,7,7], [10,6,11,9], [1,2,2,3], [11,4,11,5],
    ], [{ x:4, y:5 }, { x:4, y:2 }, { x:9, y:2 }, { x:4, y:8 }, { x:9, y:8 }, { x:9, y:4 }, { x:9, y:6 }, { x:1, y:8 }, { x:9, y:0 }, { x:2, y:0 }, { x:9, y:9 }, { x:10, y:4 }, { x:1, y:1 }, { x:8, y:9 }, { x:11, y:4 }]),
    quiz: [],
  },
  {
    name: 'Sector Beta',
    difficulty: 'easy',
    cols: 13,
    rows: 11,
    par: 9,
    timeLimit: 125,
    hint: {
      es: 'La ruta correcta zigzaguea por seis piezas. Planifica de atrás hacia adelante: la antena queda alineada sólo después del último giro.',
      en: 'The correct route zigzags through six pieces. Plan backward: the antenna aligns only after the final turn.'
    },
    solutionPlacements: [['1,1', '3,8'], ['11,1', '3,2'], ['1,9', '7,2'], ['11,9', '7,6'], ['10,0', '10,6'], ['12,10', '10,3']],
    cells: makeLaserCells([
      { x: 0, y: 8, type: 'ship', dir: 'right' },
      { x: 12, y: 3, type: 'antenna' },
      { x: 1, y: 1, type: 'reflector_ne', movable: true },
      { x: 11, y: 1, type: 'reflector_ne', movable: true },
      { x: 1, y: 9, type: 'reflector_nw', movable: true },
      { x: 11, y: 9, type: 'reflector_nw', movable: true },
      { x: 10, y: 0, type: 'reflector_ne', movable: true },
      { x: 12, y: 10, type: 'reflector_ne', movable: true },
      { x: 6, y: 10, type: 'reflector_nw', movable: true },
      { x: 12, y: 8, type: 'reflector_ne', movable: true },
    ], [
      [1,3,2,6], [5,0,6,1], [9,0,10,1], [5,4,6,5], [11,5,12,7], [1,9,2,10], [4,9,5,10], [8,8,10,10], [12,0,12,2], [0,0,0,3],
    ], [{ x:3, y:8 }, { x:3, y:2 }, { x:7, y:2 }, { x:7, y:6 }, { x:10, y:6 }, { x:10, y:3 }, { x:12, y:3 }, { x:1, y:1 }, { x:11, y:1 }, { x:1, y:9 }, { x:11, y:9 }, { x:10, y:0 }, { x:12, y:10 }, { x:6, y:10 }, { x:12, y:8 }]),
    quiz: [],
  },
  {
    name: 'Sector Beta+',
    difficulty: 'hard',
    cols: 14,
    rows: 11,
    par: 9,
    timeLimit: 130,
    hint: {
      es: 'Resuelve desde el centro: el bifurcador abre dos ramas, pero cada rama necesita dos espejos para entrar por ventanas separadas.',
      en: 'Solve from the center: the bifurcator opens two branches, but each branch needs two mirrors to pass through separated windows.'
    },
    solutionPlacements: [['2,9', '5,5'], ['12,0', '5,2'], ['8,10', '10,2'], ['12,10', '5,8'], ['1,1', '10,8']],
    cells: makeLaserCells([
      { x: 0, y: 5, type: 'ship', dir: 'right' },
      { x: 10, y: 4, type: 'antenna' },
      { x: 10, y: 6, type: 'antenna' },
      { x: 2, y: 9, type: 'bifurcator', movable: true },
      { x: 12, y: 0, type: 'reflector_ne', movable: true },
      { x: 8, y: 10, type: 'reflector_nw', movable: true },
      { x: 12, y: 10, type: 'reflector_nw', movable: true },
      { x: 1, y: 1, type: 'reflector_ne', movable: true },
      { x: 11, y: 4, type: 'bifurcator', movable: true },
      { x: 13, y: 1, type: 'reflector_ne', movable: true },
      { x: 13, y: 9, type: 'reflector_nw', movable: true },
    ], [
      [2,0,3,3], [7,0,8,1], [12,0,13,2], [2,7,3,10], [7,4,8,6], [11,7,13,8], [0,1,1,3], [0,7,1,9], [11,4,13,6], [4,0,4,3], [4,7,4,10],
    ], [{ x:5, y:5 }, { x:5, y:2 }, { x:10, y:2 }, { x:5, y:8 }, { x:10, y:8 }, { x:10, y:4 }, { x:10, y:6 }, { x:2, y:9 }, { x:12, y:0 }, { x:8, y:10 }, { x:12, y:10 }, { x:1, y:1 }, { x:11, y:4 }, { x:13, y:1 }, { x:13, y:9 }]),
    quiz: [],
  },
  {
    name: 'Sector Gamma',
    difficulty: 'easy',
    cols: 14,
    rows: 12,
    par: 10,
    timeLimit: 135,
    hint: {
      es: 'Usá el portal para saltar la barrera principal. Luego encadena tres giros: salida, corrección vertical y último ajuste hacia la antena.',
      en: 'Use the portal to jump the main barrier. Then chain three turns: exit, vertical correction, and final alignment toward the antenna.'
    },
    solutionPlacements: [['1,10', '3,6'], ['10,10', '10,6'], ['2,1', '12,6'], ['12,10', '12,2'], ['9,1', '13,2']],
    cells: makeLaserCells([
      { x: 0, y: 6, type: 'ship', dir: 'right' },
      { x: 13, y: 0, type: 'antenna' },
      { x: 1, y: 10, type: 'portal_blue', targetPortalId: 'p1', movable: true },
      { x: 10, y: 10, type: 'portal_blue', portalId: 'p1', movable: true },
      { x: 2, y: 1, type: 'reflector_ne', movable: true },
      { x: 12, y: 10, type: 'reflector_ne', movable: true },
      { x: 9, y: 1, type: 'reflector_ne', movable: true },
      { x: 13, y: 11, type: 'portal_red', portalId: 'r1', movable: true },
      { x: 0, y: 11, type: 'reflector_nw', movable: true },
      { x: 0, y: 0, type: 'bifurcator', movable: true },
      { x: 13, y: 8, type: 'reflector_ne', movable: true },
    ], [
      [5,0,6,11], [1,0,3,2], [8,0,10,2], [1,4,3,5], [8,4,9,5], [1,8,4,11], [8,8,11,11], [13,4,13,5],
    ], [{ x:3, y:6 }, { x:10, y:6 }, { x:12, y:6 }, { x:12, y:2 }, { x:13, y:2 }, { x:13, y:0 }, { x:1, y:10 }, { x:10, y:10 }, { x:2, y:1 }, { x:12, y:10 }, { x:9, y:1 }, { x:13, y:11 }, { x:0, y:11 }, { x:0, y:0 }, { x:13, y:8 }]),
    quiz: [],
  },
  {
    name: 'Sector Gamma+',
    difficulty: 'hard',
    cols: 15,
    rows: 12,
    par: 13,
    timeLimit: 155,
    hint: {
      es: 'El emisor diagonal debe entrar a un portal, reaparecer en el centro, dividirse y encadenar espejos independientes para dos antenas.',
      en: 'The diagonal emitter must enter a portal, reappear near the center, split, and chain independent mirrors toward two antennas.'
    },
    solutionPlacements: [['1,10', '4,4'], ['9,9', '8,8'], ['12,1', '10,10'], ['4,10', '10,11'], ['13,8', '12,10'], ['7,2', '12,7']],
    cells: makeLaserCells([
      { x: 0, y: 0, type: 'ship', dir: 'downRight' },
      { x: 14, y: 7, type: 'antenna' },
      { x: 14, y: 11, type: 'antenna' },
      { x: 1, y: 10, type: 'portal_blue', targetPortalId: 'pb1', movable: true },
      { x: 9, y: 9, type: 'portal_blue', portalId: 'pb1', movable: true },
      { x: 12, y: 1, type: 'bifurcator', movable: true },
      { x: 2, y: 10, type: 'portal_red', targetPortalId: 'pr1', movable: true },
      { x: 13, y: 3, type: 'portal_red', portalId: 'pr1', movable: true },
      { x: 4, y: 10, type: 'reflector_nw', movable: true },
      { x: 13, y: 8, type: 'reflector_ne', movable: true },
      { x: 7, y: 2, type: 'reflector_ne', movable: true },
      { x: 14, y: 3, type: 'reflector_nw', movable: true },
    ], [
      [5,5,5,5], [2,0,4,1], [7,0,9,2], [11,0,14,2], [0,4,2,6], [4,4,6,6], [8,4,11,6], [13,4,14,6], [0,8,2,11], [5,8,7,11], [11,8,11,9],
    ], [{ x:4, y:4 }, { x:8, y:8 }, { x:10, y:10 }, { x:10, y:11 }, { x:12, y:10 }, { x:12, y:7 }, { x:14, y:7 }, { x:14, y:11 }, { x:1, y:10 }, { x:9, y:9 }, { x:12, y:1 }, { x:2, y:10 }, { x:13, y:3 }, { x:4, y:10 }, { x:13, y:8 }, { x:7, y:2 }, { x:14, y:3 }]),
    quiz: [
      {
        q: '¿Qué aporta el emisor diagonal en este nivel?',
        opts: ['Permite entrar al portal por una ruta oblicua', 'Duplica puntos automáticamente', 'Elimina obstáculos', 'No cambia la trayectoria'],
        correct: 0,
      },
      {
        q: 'El bifurcador final permite:',
        opts: ['Separar dos rutas hacia dos antenas', 'Mover muros', 'Cambiar combustible', 'Finalizar sin alinear el haz'],
        correct: 0,
      },
    ],
  },
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

    const directionVector = DIRS[dir];
    if (!directionVector) continue;
    const [dx, dy] = directionVector;
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
    else if (type === 'bifurcator') { beamCells.add(cellKey); (BIFURCATE[dir] || []).forEach(d => queue.push({ x:nx, y:ny, dir:d })); }
    else if (type === 'portal_blue' || type === 'portal_red') {
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
  const cellType = cell?.type;

  if (targetPortalId) {
    const match = Object.keys(grid).find((key) => key !== cellKey && grid[key].type === cellType && grid[key].portalId === targetPortalId);
    if (match) return match;
  }

  if (portalId) {
    const match = Object.keys(grid).find((key) => key !== cellKey && grid[key].type === cellType && grid[key].targetPortalId === portalId);
    if (match) return match;
  }

  const fallback = Object.keys(grid).find((key) => key !== cellKey && (grid[key].type === 'portal_blue' || grid[key].type === 'portal_red'));
  return fallback || null;
}

const LaserPuzzleGame = ({ isActive, onEndGame, isDemo, showBriefing = true, timeLimit }) => {
  const { recordError, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const viewportSize = useViewportSize();
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
  const wasActiveRef = useRef(false);
  const initTimeoutRef = useRef(null);
  const advanceTimeoutRef = useRef(null);
  
  const currentLevel = useMemo(() => procLevels ? procLevels[levelIdx] : LASER_DEMO_LEVELS[levelIdx] || LASER_DEMO_LEVELS[0], [procLevels, levelIdx]);
  const { cellSize, gridGap, boardPadding, boardWidth, boardHeight, isCompact: isCompactViewport } = useMemo(
    () => getLaserMetrics(isMobile, isTablet, currentLevel, viewportSize),
    [isMobile, isTablet, currentLevel, viewportSize.width, viewportSize.height]
  );

  const finishGame = useCallback((tm) => {
    if(hasEndedRef.current) {
      return;
    }
    hasEndedRef.current = true;
    const parTotal = procLevels ? procLevels.reduce((s, l) => s + l.par, 0) : 6;
    const efficiency = Math.min(100, Math.round((parTotal / Math.max(1, tm)) * 100));
    setGamePhase('done');
    try { playSuccessSound(); } catch (error) { void error; }
    stopTracking('game7', efficiency, quizScore.current, { efficiency, quizScore: quizScore.current, totalMoves: tm });
    onEndGame(efficiency, quizScore.current);
  }, [procLevels, onEndGame, stopTracking]);

  const advanceLevel = useCallback(() => {
    if (hasEndedRef.current) return;
    setSelected(null);
    if (!procLevels) return;
    
    // Calculate efficiency and determine next level adaptively
    const currentLevelData = procLevels[levelIdx];
    const efficiency = currentLevelData ? getLaserEfficiency(moves, currentLevelData.par) : 100;
    
    
    // Use adaptive branching if level completed (high efficiency) or fallback to standard progression
    let nextLevelIdx = levelIdx + 1;
    if (efficiency > 75 && currentLevelData?.difficulty !== 'hard') {
      // High efficiency on easy level - check if there's a hard variant available
      const hardVariantIdx = procLevels.findIndex((lvl, idx) => idx > levelIdx && lvl.difficulty === 'hard');
      if (hardVariantIdx >= 0 && hardVariantIdx < procLevels.length) {
        nextLevelIdx = hardVariantIdx;
      }
    } else if (efficiency < 50 && levelIdx > 0) {
      // Low efficiency - might want to repeat, but for demo we'll progress anyway with a note
    }
    
    // Progress to next level or finish
    if (nextLevelIdx < procLevels.length) {
      setLevelIdx(nextLevelIdx);
      setGrid(buildGrid(procLevels[nextLevelIdx]));
      setMoves(0);
      setBriefing(isDemo && showBriefing ? getLaserDemoBriefing(nextLevelIdx, language) : null);
      setGamePhase(isDemo && !showBriefing ? 'playing' : (isDemo ? 'briefing' : 'playing'));
      try { playLevelUpSound(); } catch (error) { void error; }
    } else {
      // Game complete - go to quiz if available
      const lastLevel = procLevels[procLevels.length - 1];
      const q = lastLevel?.quiz;
      if (q && q.length > 0) {
        setQuizStep(0);
        setGamePhase('quiz');
      }
      else finishGame(totalMoves);
    }
  }, [levelIdx, totalMoves, procLevels, finishGame, isDemo, showBriefing, language, moves]);
  
  const levelTimeLimit = isDemo && currentLevel?.timeLimit ? currentLevel.timeLimit : timeLimit;
  const timeLeft = useGameTimer({ isActive: isActive && gamePhase === 'playing', timeLimit: levelTimeLimit, onEnd: advanceLevel });
  const levelEfficiency = currentLevel ? getLaserEfficiency(moves, currentLevel.par) : 100;

  useEffect(() => {
    // Initialize only on inactive->active transition (not on every internal state update)
    if (isActive && !wasActiveRef.current) {
      hasEndedRef.current = false;
      startTracking();
      quizScore.current = 0;
      setLevelIdx(0);
      setMoves(0);
      setTotalMoves(0);
      setQuizStep(0);
      
      // Set levels and grid immediately (no setTimeout delay)
      setProcLevels(LASER_DEMO_LEVELS);
      setGrid(buildGrid(LASER_DEMO_LEVELS[0]));
      setBriefing(isDemo && showBriefing ? getLaserDemoBriefing(0, language) : null);
      setGamePhase(isDemo && showBriefing ? 'briefing' : 'playing');
    }

    if (!isActive) {
      if (initTimeoutRef.current) {
        clearTimeout(initTimeoutRef.current);
        initTimeoutRef.current = null;
      }
      if (advanceTimeoutRef.current) {
        clearTimeout(advanceTimeoutRef.current);
        advanceTimeoutRef.current = null;
      }
    }

    wasActiveRef.current = isActive;
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
      return;
    }
    const level = procLevels?.[levelIdx];
    const quizItems = level?.quiz || [];
    const q = quizItems[quizStep];
    if (!q) {
      finishGame(totalMoves);
      return;
    }
    const isCorrect = idx === q.correct;
    if (isCorrect) quizScore.current += 1;
    else recordError();
    if (quizStep + 1 < quizItems.length) {
      setQuizStep(s => s + 1);
    } else {
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
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = setTimeout(() => {
        advanceLevel();
        advanceTimeoutRef.current = null;
      }, 1400);
    }
  }, [litAntennas, grid, gamePhase, advanceLevel]);

  useEffect(() => {
    return () => {
      if (initTimeoutRef.current) clearTimeout(initTimeoutRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

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
    else if (type === 'portal_red') { bg = isSel ? '#fecaca' : 'rgba(239,68,68,0.08)'; border = isSel ? '2px solid #ef4444' : '1px dashed rgba(239,68,68,0.5)'; cursor = 'pointer'; content = <span style={{ color:'#dc2626', fontSize:'1.4rem', fontWeight:'900' }}>P</span>; }
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
  const quizItems = procLevels?.[levelIdx]?.quiz || [];
  const currentQuiz = quizItems[quizStep] || null;
  const stagePadding = isMobile ? 12 : isCompactViewport ? 8 : 20;
  const panelPadding = isMobile ? 24 : isCompactViewport ? 16 : 32;
  const panelGap = isMobile ? 16 : isCompactViewport ? 12 : 20;
  const headerGap = isMobile ? 8 : isCompactViewport ? 10 : 16;

  return (
    <div style={{ width:'100%', height:'100%', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:stagePadding, gap:isMobile ? '10px' : isCompactViewport ? '8px' : '12px', position:'relative', overflow:'hidden', boxSizing:'border-box' }}>
      <AnimatePresence mode="wait">
        {gamePhase === 'done' && (
          <motion.div key="game-complete" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="glass-panel" style={{ padding: '56px', maxWidth: '600px', textAlign: 'center' }}>
            <div style={{ color: '#059669', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '4px', marginBottom: '20px', fontWeight: '900' }}>Game Complete</div>
            <p style={{ color: '#1e1b4b', marginBottom: '48px', fontSize: '1.4rem', fontWeight: '800', lineHeight: 1.3 }}>
              {language === 'es' ? 'Has completado todos los niveles. ¡Excelente trabajo!' : 'You completed all levels. Excellent work!'}
            </p>
            <Confetti />
          </motion.div>
        )}
        {(gamePhase === 'playing' || gamePhase === 'levelComplete') && level && (
          <motion.div key={`level-${levelIdx}`} initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} className="glass-panel" style={{ padding:panelPadding, display:'flex', flexDirection:'column', alignItems:'center', gap:panelGap, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', maxWidth: '100%', maxHeight:'100%', overflow:'hidden', boxSizing:'border-box' }}>
            <div style={{ display:'grid', gridTemplateColumns:isMobile ? 'repeat(2, minmax(0, 1fr))' : 'repeat(5, minmax(0, auto))', justifyContent:'space-between', width:'100%', fontSize:isMobile ? '0.78rem' : isCompactViewport ? '0.78rem' : '0.9rem', fontWeight:'900', color:'#1e1b4b', textTransform:'uppercase', letterSpacing:isMobile ? '1px' : isCompactViewport ? '1px' : '2px', gap:headerGap }}>
              <span>{level.name}</span>
              <span style={{ color:satColor }}>⏱ {timeLeft}s</span>
              <span>Moves: <span style={{ color:'#4f46e5' }}>{moves}</span></span>
              <span style={{ color:'#0f766e' }}>Eff: {levelEfficiency}%</span>
              <span>Antennas: <span style={{ color: litCount === allAntennas.length ? '#059669' : '#b91c1c' }}>{litCount}/{allAntennas.length}</span></span>
            </div>
            
            <div style={{ border:'2px solid rgba(99,102,241,0.15)', borderRadius:'16px', background:'rgba(248,250,252,0.8)', padding:`${boardPadding}px`, boxShadow: 'inset 0 4px 10px rgba(0,0,0,0.08)', width: `${boardWidth}px`, height: `${boardHeight}px`, maxWidth: '100%', overflow: 'hidden', boxSizing:'border-box', flexShrink:0 }}>
              <div style={{ display:'grid', gridTemplateColumns:`repeat(${level.cols}, ${cellSize}px)`, gap:`${gridGap}px`, width: 'fit-content', margin: '0 auto' }}>
                {Array.from({ length:level.rows }, (_, y) => Array.from({ length:level.cols }, (_, x) => renderCell(x, y)))}
              </div>
            </div>

            <div style={{ display:'flex', gap:isCompactViewport ? '8px' : '12px', alignItems:'center', width:'100%', justifyContent:'space-between', marginTop: isCompactViewport ? 0 : '8px' }}>
              <span style={{ fontSize:isCompactViewport ? '0.78rem' : '0.85rem', color:'#64748b', fontStyle:'italic', fontWeight: 500, lineHeight:1.3 }}>{language === 'es' ? 'Pista:' : 'Hint:'} {hintText}</span>
              <button onClick={handleReset} className="btn" style={{ padding: isCompactViewport ? '8px 14px' : '10px 20px', fontSize: '0.85rem', fontWeight: 700 }}>Reset</button>
            </div>
          </motion.div>
        )}
        {gamePhase === 'quiz' && currentQuiz && (
          <motion.div key="quiz" initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} className="glass-panel" style={{ padding:'56px', maxWidth:'600px', textAlign:'center' }}>
            <div style={{ color:'#7c3aed', fontSize:'0.9rem', textTransform:'uppercase', letterSpacing:'4px', marginBottom:'20px', fontWeight:'900' }}>Spatial Insight</div>
            <p style={{ color:'#1e1b4b', marginBottom:'48px', fontSize:'1.4rem', fontWeight: '800', lineHeight: 1.3 }}>{currentQuiz.q}</p>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {currentQuiz.opts.map((opt, i) => (
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
