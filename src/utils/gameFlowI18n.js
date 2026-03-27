const GAME_FLOW_ES_META = {
  1: { mission: 'Sostener ritmo entre calculo y memoria de trabajo.', strategy: 'Evita apresurarte: primero exactitud, luego velocidad.', rewardHint: 'Insignia foco por rachas limpias.', varietyHint: 'La complejidad del estimulo escala por set.' },
  2: { mission: 'Responder rapido sin perder control inhibitorio.', strategy: 'Micro-pausa despues de GO rapidos.', rewardHint: 'Escudo de impulso por inhibiciones limpias.', varietyHint: 'La cadencia GO/STOP cambia por tramo.' },
  3: { mission: 'Cambiar regla sin perder contexto.', strategy: 'Confirma regla activa antes de responder.', rewardHint: 'Combo adaptativo por cambios consistentes.', varietyHint: 'Estimulos y reglas rotan por trial.' },
  4: { mission: 'Mantener atencion selectiva sostenida.', strategy: 'No anticipar: responder solo con evidencia.', rewardHint: 'Racha de atencion por baja falsa alarma.', varietyHint: 'Objetivo y distractores varian por bloque.' },
  5: { mission: 'Elegir trade-offs robustos bajo presion.', strategy: 'Prioriza impacto, urgencia y reversibilidad.', rewardHint: 'Insignia de decision de calidad.', varietyHint: 'Escenarios cambian por dominio operativo.' },
  6: { mission: 'Dominar cambios de regla y excepciones.', strategy: 'Revalidar regla al cambiar bloque.', rewardHint: 'Emblema rule-master por precision.', varietyHint: 'Patrones de excepcion se alternan.' },
  7: { mission: 'Balancear personas, riesgo y entrega.', strategy: 'Elegir opciones con alineacion y ejecucion.', rewardHint: 'Token de claridad de liderazgo.', varietyHint: 'Casos con contextos y tensiones diversas.' },
  8: { mission: 'Alinear confianza con calidad de evidencia.', strategy: 'Cuando hay ambiguedad, calibrar certeza.', rewardHint: 'Medalla de calibracion.', varietyHint: 'Ambiguedad de evidencia cambia por item.' },
  9: { mission: 'Secuenciar tareas para maximo impacto.', strategy: 'Resolver bloqueos antes de cascadas.', rewardHint: 'Insignia de comando operativo.', varietyHint: 'Dependencias y deadlines se remezclan.' },
  10: { mission: 'Detectar deriva de reglas y adaptarte.', strategy: 'Probar hipotesis cortas por ronda.', rewardHint: 'Cadena de agilidad por pivotes exitosos.', varietyHint: 'Los cambios de regla no siguen patron fijo.' },
  11: { mission: 'Orquestar coordinacion entre equipos.', strategy: 'Buscar compromisos verificables.', rewardHint: 'Escudo de coordinacion multi-equipo.', varietyHint: 'Roles y fricciones cambian por escenario.' },
  12: { mission: 'Conservar calidad bajo interrupciones.', strategy: 'Recuperar contexto rapido tras cortes.', rewardHint: 'Nucleo de resiliencia por recuperacion estable.', varietyHint: 'Cadencia e intensidad de interrupcion varian.' },
  13: { mission: 'Balancear upside y downside.', strategy: 'Preferir decision con cobertura explicita.', rewardHint: 'Insignia de navegacion de riesgo.', varietyHint: 'Volatilidad y confianza rotan por turno.' },
};

export const GAME_FLOW_EN = {
  1: {
    type: 'Working Memory',
    title: 'Operation Span (OSPAN)',
    description: 'Answer true/false math operations and memorize letters. Balance speed and accuracy under time pressure.',
    mission: 'Keep a steady rhythm while alternating between solving and memory encoding.',
    strategy: 'Prioritize consistency over speed spikes.',
    rewardHint: 'Earn focus stars by maintaining clean streaks.',
    varietyHint: 'Stimuli and pressure windows adapt over rounds.',
  },
  2: {
    type: 'Response Inhibition',
    title: 'Stop-Signal Task (SST)',
    description: 'Respond quickly on GO (green), but inhibit on STOP (red). Measures impulse control under pressure.',
    mission: 'React fast without breaking inhibitory control.',
    strategy: 'Use micro-pauses after fast GO bursts.',
    rewardHint: 'Impulse shield badge unlocks for clean inhibition streaks.',
    varietyHint: 'GO/STOP pacing shifts dynamically each run.',
  },
  3: {
    type: 'Cognitive Flexibility',
    title: 'Task Switching',
    description: 'Alternate between COLOR and SHAPE classification. Rules change without warning; adapt quickly.',
    mission: 'Switch rules without losing context.',
    strategy: 'Anchor first to current rule, then answer stimulus.',
    rewardHint: 'Adaptive combo bonus appears when switching cleanly.',
    varietyHint: 'Rule cadence and stimulus composition rotate.',
  },
  4: {
    type: 'Sustained Attention',
    title: 'Continuous Performance Test (CPT)',
    description: 'Press when the letter X appears. Maintain focus and consistency throughout.',
    mission: 'Sustain selective attention under monotony.',
    strategy: 'Keep a stable scan cycle and avoid anticipation.',
    rewardHint: 'Attention streak meter fills on low false alarms.',
    varietyHint: 'Target frequencies and distractors vary by block.',
  },
  5: {
    type: 'Decision Making',
    title: 'Decision Under Time Pressure',
    description: 'Make fast decisions on work scenarios with limited information and reducing time windows.',
    mission: 'Choose robust trade-offs under uncertainty.',
    strategy: 'Rank impact, urgency, and reversibility before selecting.',
    rewardHint: 'Decision quality badge rewards high-value choices.',
    varietyHint: 'Scenario families rotate with different constraints.',
  },
  6: {
    type: 'Cognitive Flexibility',
    title: 'Rule Shift + Exception Handling',
    description: 'Learn a rule, then adapt when it changes unexpectedly and handle exceptions.',
    mission: 'Track rule updates while handling edge cases.',
    strategy: 'Reconfirm active rule each block transition.',
    rewardHint: 'Rule master emblem for exception-aware accuracy.',
    varietyHint: 'Exception patterns are shuffled each session.',
  },
  7: {
    type: 'Situational Judgment',
    title: 'Situational Judgment Test (SJT)',
    description: 'Evaluate workplace scenarios and choose the most appropriate response.',
    mission: 'Balance people, risk, and delivery in your decisions.',
    strategy: 'Prefer options with alignment plus executable follow-up.',
    rewardHint: 'Leadership clarity token rewards consistent judgment.',
    varietyHint: 'Case contexts rotate across teams and constraints.',
  },
  8: {
    type: 'Metacognitive Calibration',
    title: 'Calibration Under Uncertainty',
    description: 'Answer scenarios and regulate certainty to measure confidence-accuracy alignment.',
    mission: 'Align confidence with evidence quality.',
    strategy: 'When signal is mixed, choose calibrated confidence.',
    rewardHint: 'Calibration medal grows with low confidence drift.',
    varietyHint: 'Evidence ambiguity changes question by question.',
  },
  9: {
    type: 'Operational Prioritization',
    title: 'Priority and Deadline Trade-offs',
    description: 'Prioritize tasks by impact and urgency under time constraints and dependencies.',
    mission: 'Sequence work for maximum operational impact.',
    strategy: 'Resolve blockers before high-cost downstream tasks.',
    rewardHint: 'Ops commander badge for efficient sequencing.',
    varietyHint: 'Deadline pressure and dependencies are remixed each run.',
  },
  10: {
    type: 'Learning Agility',
    title: 'Adaptive Rule Learning',
    description: 'Adjust strategy as rules change and evaluate adaptation speed.',
    mission: 'Detect rule drift and re-optimize quickly.',
    strategy: 'Test one hypothesis per round and update fast.',
    rewardHint: 'Agility chain rewards consecutive successful pivots.',
    varietyHint: 'Rule-shift patterns diversify across rounds.',
  },
  11: {
    type: 'Social Coordination',
    title: 'Cross-team Coordination',
    description: 'Handle team conflicts and choose collaborative alignment actions.',
    mission: 'Orchestrate alignment across conflicting stakeholders.',
    strategy: 'Select actions that create shared commitments.',
    rewardHint: 'Coordination crest for multi-team alignment wins.',
    varietyHint: 'Stakeholder roles and friction sources rotate.',
  },
  12: {
    type: 'Cognitive Resilience',
    title: 'Resilience Under Interruptions',
    description: 'Sustain performance as interruptions and cognitive load increase.',
    mission: 'Preserve output quality through cognitive turbulence.',
    strategy: 'Recover quickly after interruptions and resume sequence.',
    rewardHint: 'Resilience core lights up with stable recovery.',
    varietyHint: 'Interruption intensity and cadence vary per wave.',
  },
  13: {
    type: 'Risk Under Uncertainty',
    title: 'Decision Risk Framing',
    description: 'Select risk and coverage strategies with incomplete information.',
    mission: 'Balance upside capture with downside containment.',
    strategy: 'Prefer options with explicit hedge logic.',
    rewardHint: 'Risk navigator badge rewards balanced framing.',
    varietyHint: 'Volatility regimes and confidence bands rotate.',
  },
};

export const getLocalizedGameInstruction = (game, language = 'es') => {
  const source = game?.instruction || {};
  if (language === 'es') {
    const metaEs = GAME_FLOW_ES_META[game?.id] || {};
    return {
      type: source.type || '',
      title: source.title || '',
      description: source.description || '',
      mission: source.mission || metaEs.mission || '',
      strategy: source.strategy || metaEs.strategy || '',
      rewardHint: source.rewardHint || metaEs.rewardHint || '',
      varietyHint: source.varietyHint || metaEs.varietyHint || '',
    };
  }

  const fallback = GAME_FLOW_EN[game?.id] || {};
  return {
    type: fallback.type || source.type || '',
    title: fallback.title || source.title || '',
    description: fallback.description || source.description || '',
    mission: fallback.mission || source.mission || '',
    strategy: fallback.strategy || source.strategy || '',
    rewardHint: fallback.rewardHint || source.rewardHint || '',
    varietyHint: fallback.varietyHint || source.varietyHint || '',
  };
};

