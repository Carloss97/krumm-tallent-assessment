import { lazy } from 'react';

// Lazy load game components for code splitting
// NEW v2.0 HRRH Assessment Games (Games 1-7)
const OSPANGame = lazy(() => import('../games/OSPANGame'));
const StopSignalGame = lazy(() => import('../games/HRRHGames').then(m => ({ default: m.StopSignalGame })));
const TaskSwitchingGame = lazy(() => import('../games/HRRHGames').then(m => ({ default: m.TaskSwitchingGame })));
const CPTGame = lazy(() => import('../games/HRRHGames').then(m => ({ default: m.CPTGame })));
const DecisionGameHTMX = lazy(() => import('../games/HRRHGames').then(m => ({ default: m.DecisionGameHTMX })));
const RuleShiftGame = lazy(() => import('../games/HRRHGames').then(m => ({ default: m.RuleShiftGame })));
const SJTGame = lazy(() => import('../games/HRRHGames').then(m => ({ default: m.SJTGame })));
const MetacognitiveCalibrationGame = lazy(() => import('../games/ComplementaryGames').then(m => ({ default: m.MetacognitiveCalibrationGame })));
const OperationalPrioritizationGame = lazy(() => import('../games/ComplementaryGames').then(m => ({ default: m.OperationalPrioritizationGame })));
const LearningAgilityGame = lazy(() => import('../games/ComplementaryGames').then(m => ({ default: m.LearningAgilityGame })));
const SocialCoordinationGame = lazy(() => import('../games/ComplementaryGames').then(m => ({ default: m.SocialCoordinationGame })));
const CognitiveResilienceGame = lazy(() => import('../games/ComplementaryGames').then(m => ({ default: m.CognitiveResilienceGame })));
const RiskUnderUncertaintyGame = lazy(() => import('../games/ComplementaryGames').then(m => ({ default: m.RiskUnderUncertaintyGame })));

export const GAME_FLOW = [
  {
    id: 1,
    path: '/game/1',
    nextPath: '/game/2',
    component: OSPANGame,
    telemetryId: 'ospan_game_1',
    instruction: {
      type: 'Working Memory',
      title: 'Operation Span (OSPAN)',
      description: 'Responde Verdadero/Falso a operaciones matemáticas y memoriza letras. Mantén equilibrio entre velocidad y precisión bajo presión temporal.',
    },
    timeLimit: { full: 420, demo: 180 }, // 7 min / 3 min
  },
  {
    id: 2,
    path: '/game/2',
    nextPath: '/game/3',
    component: StopSignalGame,
    telemetryId: 'sst_game_2',
    instruction: {
      type: 'Response Inhibition',
      title: 'Stop-Signal Task (SST)',
      description: 'Presiona rápido en GO (verde), pero inhibir en STOP (rojo). Mide tu capacidad de control impulsivo bajo presión temporal.',
    },
    timeLimit: { full: 300, demo: 120 }, // 5 min / 2 min
  },
  {
    id: 3,
    path: '/game/3',
    nextPath: '/game/4',
    component: TaskSwitchingGame,
    telemetryId: 'tsw_game_3',
    instruction: {
      type: 'Cognitive Flexibility',
      title: 'Task Switching',
      description: 'Alterna entre clasificar por COLOR o FORMA. La regla cambiará sin aviso. Adapta rápidamente a nuevas instrucciones.',
    },
    timeLimit: { full: 360, demo: 180 }, // 6 min / 3 min
  },
  {
    id: 4,
    path: '/game/4',
    nextPath: '/game/5',
    component: lazy(() => import('../games/BalloonGame')),
    telemetryId: 'game4',
    instruction: {
      type: 'Risk Assessment',
      title: 'Balloon Risk Task',
      description: 'Infla el globo para ganar puntos. Cada inflado aumenta el riesgo de explosión y pérdida del puntaje acumulado en la ronda.',
    },
    timeLimit: { full: 240, demo: 120 },
  },
  {
    id: 5,
    path: '/game/5',
    nextPath: '/game/6',
    component: DecisionGameHTMX,
    telemetryId: 'dec_game_5',
    instruction: {
      type: 'Decision Making',
      title: 'Decision Under Time Pressure',
      description: 'Toma decisiones rápidas sobre escenarios laborales con información limitada. El tiempo se reduce progresivamente.',
    },
    timeLimit: { full: 360, demo: 180 }, // 6 min / 3 min
  },
  {
    id: 6,
    path: '/game/6',
    nextPath: '/game/7',
    component: lazy(() => import('../games/GridFlowGame')),
    telemetryId: 'game6',
    instruction: {
      type: 'Planning & Logic',
      title: 'Grid Flow',
      description: 'Optimiza el ruteo y la gestión de recursos en una red. Recoge paquetes y gestiona tu nivel de energía.',
    },
    timeLimit: { full: 300, demo: 120 },
  },
  {
    id: 7,
    path: '/game/7',
    nextPath: '/game/8',
    component: lazy(() => import('../games/LaserPuzzleGame')),
    telemetryId: 'game7',
    instruction: {
      type: 'Spatial Reasoning',
      title: 'Laser Puzzle',
      description: 'Guía haces de luz utilizando reflectores, bifurcadores y portales cuánticos para alcanzar los receptores objetivo.',
    },
    timeLimit: { full: 240, demo: 120 },
  },
  {
    id: 8,
    path: '/game/8',
    nextPath: '/game/9',
    component: MetacognitiveCalibrationGame,
    telemetryId: 'cmp_meta_8',
    instruction: {
      type: 'Metacognitive Calibration',
      title: 'Calibration Under Uncertainty',
      description: 'Responde escenarios y regula tu nivel de certeza. Mide alineacion entre confianza y precision real.',
    },
    timeLimit: { full: 210, demo: 90 },
  },
  {
    id: 9,
    path: '/game/9',
    nextPath: '/game/10',
    component: OperationalPrioritizationGame,
    telemetryId: 'cmp_ops_9',
    instruction: {
      type: 'Operational Prioritization',
      title: 'Priority and Deadline Trade-offs',
      description: 'Ordena tareas por impacto y urgencia bajo restricciones temporales y dependencias cruzadas.',
    },
    timeLimit: { full: 210, demo: 90 },
  },
  {
    id: 10,
    path: '/game/10',
    nextPath: '/game/11',
    component: LearningAgilityGame,
    telemetryId: 'cmp_agility_10',
    instruction: {
      type: 'Learning Agility',
      title: 'Adaptive Rule Learning',
      description: 'Ajusta tu estrategia cuando cambian las reglas y evalua velocidad de adaptacion.',
    },
    timeLimit: { full: 180, demo: 75 },
  },
  {
    id: 11,
    path: '/game/11',
    nextPath: '/game/12',
    component: SocialCoordinationGame,
    telemetryId: 'cmp_social_11',
    instruction: {
      type: 'Social Coordination',
      title: 'Cross-team Coordination',
      description: 'Gestiona conflictos entre equipos y selecciona acciones de alineacion colaborativa.',
    },
    timeLimit: { full: 180, demo: 75 },
  },
  {
    id: 12,
    path: '/game/12',
    nextPath: '/game/13',
    component: CognitiveResilienceGame,
    telemetryId: 'cmp_resilience_12',
    instruction: {
      type: 'Cognitive Resilience',
      title: 'Resilience Under Interruptions',
      description: 'Mantiene desempeno consistente cuando aumenta la carga y aparecen interrupciones.',
    },
    timeLimit: { full: 180, demo: 75 },
  },
  {
    id: 13,
    path: '/game/13',
    nextPath: '/report',
    component: RiskUnderUncertaintyGame,
    telemetryId: 'cmp_risk_13',
    instruction: {
      type: 'Risk Under Uncertainty',
      title: 'Decision Risk Framing',
      description: 'Selecciona estrategias de riesgo y cobertura cuando la informacion es incompleta.',
    },
    timeLimit: { full: 180, demo: 75 },
  },
];

// DEMO_GAME_IDS defines a short sequence of game ids used for the public demo
// Choose a compact subset that results in ~4-5 minutes in demo mode
export const DEMO_GAME_IDS = [4, 6, 7];
