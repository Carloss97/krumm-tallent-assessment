export const GAME_FLOW_EN = {
  1: {
    type: 'Working Memory',
    title: 'Operation Span (OSPAN)',
    description: 'Answer true/false math operations and memorize letters. Balance speed and accuracy under time pressure.',
  },
  2: {
    type: 'Response Inhibition',
    title: 'Stop-Signal Task (SST)',
    description: 'Respond quickly on GO (green), but inhibit on STOP (red). Measures impulse control under pressure.',
  },
  3: {
    type: 'Cognitive Flexibility',
    title: 'Task Switching',
    description: 'Alternate between COLOR and SHAPE classification. Rules change without warning; adapt quickly.',
  },
  4: {
    type: 'Sustained Attention',
    title: 'Continuous Performance Test (CPT)',
    description: 'Press when the letter X appears. Maintain focus and consistency throughout.',
  },
  5: {
    type: 'Decision Making',
    title: 'Decision Under Time Pressure',
    description: 'Make fast decisions on work scenarios with limited information and reducing time windows.',
  },
  6: {
    type: 'Cognitive Flexibility',
    title: 'Rule Shift + Exception Handling',
    description: 'Learn a rule, then adapt when it changes unexpectedly and handle exceptions.',
  },
  7: {
    type: 'Situational Judgment',
    title: 'Situational Judgment Test (SJT)',
    description: 'Evaluate workplace scenarios and choose the most appropriate response.',
  },
  8: {
    type: 'Metacognitive Calibration',
    title: 'Calibration Under Uncertainty',
    description: 'Answer scenarios and regulate certainty to measure confidence-accuracy alignment.',
  },
  9: {
    type: 'Operational Prioritization',
    title: 'Priority and Deadline Trade-offs',
    description: 'Prioritize tasks by impact and urgency under time constraints and dependencies.',
  },
  10: {
    type: 'Learning Agility',
    title: 'Adaptive Rule Learning',
    description: 'Adjust strategy as rules change and evaluate adaptation speed.',
  },
  11: {
    type: 'Social Coordination',
    title: 'Cross-team Coordination',
    description: 'Handle team conflicts and choose collaborative alignment actions.',
  },
  12: {
    type: 'Cognitive Resilience',
    title: 'Resilience Under Interruptions',
    description: 'Sustain performance as interruptions and cognitive load increase.',
  },
  13: {
    type: 'Risk Under Uncertainty',
    title: 'Decision Risk Framing',
    description: 'Select risk and coverage strategies with incomplete information.',
  },
};

export const getLocalizedGameInstruction = (game, language = 'es') => {
  const source = game?.instruction || {};
  if (language === 'es') {
    return {
      type: source.type || '',
      title: source.title || '',
      description: source.description || '',
    };
  }

  const fallback = GAME_FLOW_EN[game?.id] || {};
  return {
    type: fallback.type || source.type || '',
    title: fallback.title || source.title || '',
    description: fallback.description || source.description || '',
  };
};
