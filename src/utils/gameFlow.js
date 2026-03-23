import { lazy } from 'react';

// Lazy load game components for code splitting
const Game1 = lazy(() => import('../games/ColorWordGame'));
const Game2 = lazy(() => import('../games/FrustrationGame'));
const Game3 = lazy(() => import('../games/MemoryGame'));
const Game4 = lazy(() => import('../games/BalloonGame'));
const Game5 = lazy(() => import('../games/VigilanceGame'));
const Game6 = lazy(() => import('../games/GridOptimizerGame'));
const Game7 = lazy(() => import('../games/LaserPuzzleGame'));
const NBackGame = lazy(() => import('../games/NBackGame'));
const TowerOfLondonGame = lazy(() => import('../games/TowerOfLondonGame'));
const WisconsinCardSortingGame = lazy(() => import('../games/WisconsinCardSortingGame'));
const GoNoGoGame = lazy(() => import('../games/GoNoGoGame'));
const TrailMakingGame = lazy(() => import('../games/TrailMakingGame'));
const CorsiBlockTappingGame = lazy(() => import('../games/CorsiBlockTappingGame'));
const MentalRotationGame = lazy(() => import('../games/MentalRotationGame'));

export const GAME_FLOW = [
  {
    id: 1,
    path: '/game/1',
    nextPath: '/game/2',
    component: Game1,
    telemetryId: 'game1',
    instruction: {
      type: 'Cognitive Flexibility',
      title: 'Interference Matrix',
      description: 'Identify the COLOR of the ink, ignoring the word itself. The neural load will increase as the semantic meaning contradicts the visual perception. Maintain precision under time pressure.',
    },
    timeLimit: { full: 30, demo: 10 },
  },
  {
    id: 2,
    path: '/game/2',
    nextPath: '/game/3',
    component: Game2,
    telemetryId: 'game2',
    instruction: {
      type: 'Frustration Tolerance',
      title: 'Dynamic Precision Task',
      description: 'A telemetry ring will move erratically across the screen. You must keep your cursor inside the ring at all times. Slipping outside the stabilization boundary will count as a loss of control.',
    },
    timeLimit: { full: 25, demo: 5 },
  },
  {
    id: 3,
    path: '/game/3',
    nextPath: '/game/4',
    component: Game3,
    telemetryId: 'game3',
    instruction: {
        type: "Working Memory",
        title: "Neural Array Protocol",
        description: "Observe the sequence of nodes activating in the matrix. Once the sequence ends, reproduce the exact pattern. The complexity scales with each successful cycle.",
    },
    timeLimit: { full: 40, demo: 20 },
  },
  {
    id: 4,
    path: '/game/4',
    nextPath: '/game/5',
    component: Game4,
    telemetryId: 'game4',
    instruction: {
        type: "Risk Strategy",
        title: "The Balloon Test",
        description: "Pump the balloon to earn points. You can bank your points at any time. However, if the balloon pops before you bank, you lose all points for that round. Find the balance between risk and reward.",
    },
    timeLimit: 'None',
  },
  {
    id: 5,
    path: '/game/5',
    nextPath: '/game/6',
    component: Game5,
    telemetryId: 'game5',
    instruction: {
        type: "Sustained Attention",
        title: "Signal Vigilance",
        description: "Wait for the dark screen to flash. If the signal is GREEN (INTERCEPT), click as fast as possible. If the signal is RED (IGNORE), do NOT click. Do not anticipate.",
    },
    timeLimit: 'None',
  },
  {
    id: 6,
    path: '/game/6',
    nextPath: '/game/7',
    component: Game6,
    telemetryId: 'game6',
    instruction: {
        type: "Logistics & Selective Attention",
        title: "City Optimization Grid",
        description: "Navigate through the city using on-screen arrow buttons. Active targets lose satisfaction while waiting AND routing — deliver quickly! If satisfaction hits 0 before pickup, the target is lost. After delivering all targets, a brief attention quiz follows.",
    },
    timeLimit: 'Timed',
  },
  {
    id: 7,
    path: '/game/7',
    nextPath: '/game/8',
    component: Game7,
    telemetryId: 'game7',
    instruction: {
        type: "Spatial Reasoning",
        title: "Laser Routing Puzzle",
        description: "A ship emits a laser in a fixed direction. Drag movable pieces to redirect the beam to all antennas. Click a piece to select it, then click an empty cell to move it. Portals preserve the beam direction. Use the fewest moves possible.",
    },
    timeLimit: { full: 180, demo: 75 },
  },
  {
    id: 8,
    path: '/game/8',
    nextPath: '/game/9',
    component: NBackGame,
    telemetryId: 'game8',
    instruction: {
        type: "Working Memory",
        title: "N-Back Task",
        description: "Watch the sequence of letters. Press MATCH when you see a letter that matches the one shown {n}-positions back. Press NO MATCH for non-matches. Stay focused and respond quickly.",
    },
    timeLimit: { full: 60, demo: 35 },
  },
  {
    id: 9,
    path: '/game/9',
    nextPath: '/game/10',
    component: TowerOfLondonGame,
    telemetryId: 'game9',
    instruction: {
        type: "Planning & Problem Solving",
        title: "Tower of London",
        description: "Move the disks from the starting position to match the target configuration. You can only move one disk at a time, and you cannot place a larger disk on top of a smaller one. Use the minimum number of moves possible.",
    },
    timeLimit: { full: 120, demo: 60 },
  },
  {
    id: 10,
    path: '/game/10',
    nextPath: '/game/11',
    component: WisconsinCardSortingGame,
    telemetryId: 'game10',
    instruction: {
        type: "Cognitive Flexibility",
        title: "Wisconsin Card Sorting Test",
        description: "Match the card shown above with one of the four cards below based on a rule (color, shape, or number). The rule changes without warning after you get 10 correct in a row. Adapt quickly to the new sorting rule.",
    },
    timeLimit: { full: 90, demo: 45 },
  },
  {
    id: 11,
    path: '/game/11',
    nextPath: '/game/12',
    component: GoNoGoGame,
    telemetryId: 'game11',
    instruction: {
        type: "Response Inhibition",
        title: "Go/No-Go Task",
        description: "Press the SPACEBAR as quickly as possible when you see 'GO', but do NOT press anything when you see 'NO-GO'. This tests your ability to inhibit automatic responses.",
    },
    timeLimit: { full: 60, demo: 35 },
  },
  {
    id: 12,
    path: '/game/12',
    nextPath: '/game/13',
    component: TrailMakingGame,
    telemetryId: 'game12',
    instruction: {
        type: "Processing Speed & Flexibility",
        title: "Trail Making Test",
        description: "Part A: Connect the numbers in order from 1 to 25. Part B: Connect alternating numbers and letters (1-A-2-B-etc.). Click each circle in the correct sequence as quickly as possible.",
    },
    timeLimit: { full: 120, demo: 60 },
  },
  {
    id: 13,
    path: '/game/13',
    nextPath: '/game/14',
    component: CorsiBlockTappingGame,
    telemetryId: 'game13',
    instruction: {
        type: "Spatial Working Memory",
        title: "Corsi Block Tapping",
        description: "Watch the sequence of blocks that light up. Then click the blocks in the same order. Start with shorter sequences and work your way up to longer ones.",
    },
    timeLimit: { full: 90, demo: 45 },
  },
  {
    id: 14,
    path: '/game/14',
    nextPath: '/report',
    component: MentalRotationGame,
    telemetryId: 'game14',
    instruction: {
        type: "Spatial Reasoning",
        title: "Mental Rotation",
        description: "Look at the two shapes. Decide if the shape on the right is the same as the shape on the left, just rotated, or if they are different shapes. Click SAME or DIFFERENT as quickly and accurately as possible.",
    },
    timeLimit: { full: 60, demo: 35 },
  },
];
