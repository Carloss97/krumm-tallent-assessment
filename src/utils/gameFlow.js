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
    component: CPTGame,
    telemetryId: 'cpt_game_4',
    instruction: {
      type: 'Sustained Attention',
      title: 'Continuous Performance Test (CPT)',
      description: 'Presiona cuando veas la letra X. Mantén enfoque y consistencia durante toda la prueba sin lapsos.',
    },
    timeLimit: { full: 240, demo: 120 }, // 4 min / 2 min
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
    component: RuleShiftGame,
    telemetryId: 'rsh_game_6',
    instruction: {
      type: 'Cognitive Flexibility',
      title: 'Rule Shift + Exception Handling',
      description: 'Aprende una regla, luego se cambiará sin aviso. Deberás adaptarte. Finalmente habrá excepciones que debes manejar.',
    },
    timeLimit: { full: 300, demo: 120 }, // 5 min / 2 min
  },
  {
    id: 7,
    path: '/game/7',
    nextPath: '/report',
    component: SJTGame,
    telemetryId: 'sjt_game_7',
    instruction: {
      type: 'Situational Judgment',
      title: 'Situational Judgment Test (SJT)',
      description: 'Evalúa tu juicio ante situaciones laborales reales. Elige la respuesta más apropiada según cultura y valores organizacionales.',
    },
    timeLimit: { full: 240, demo: 120 }, // 4 min / 2 min
  },
];
