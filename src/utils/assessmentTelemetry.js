const stripUndefined = (value) => {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, stripUndefined(entry)]),
    );
  }
  return value;
};

export const ASSESSMENT_TELEMETRY_SCHEMA = {
  version: 'talent-telemetry-v1',
  eventName: 'assessment_trial_response',
  orderedGameIds: [
    'ospan_game_1',
    'sst_game_2',
    'tsw_game_3',
    'cpt_game_4',
    'dec_game_5',
    'rsh_game_6',
    'sjt_game_7',
  ],
  commonFields: [
    'event',
    'schemaVersion',
    'gameId',
    'talentDomain',
    'primaryConstruct',
    'phase',
    'trialIndex',
    'stimulus',
    'response',
    'expected',
    'isCorrect',
    'reactionTimeMs',
    'behaviouralMarkers',
    'metrics',
  ],
  games: {
    ospan_game_1: {
      gameId: 'ospan_game_1',
      name: 'Operation Span Task',
      talentDomain: 'cognitive',
      primaryConstruct: 'working_memory_capacity',
      secondaryConstructs: ['divided_attention', 'processing_accuracy', 'serial_recall'],
      evidence: 'Dual-task operation span: alternates processing judgments with short-term letter storage and ordered recall.',
      coreMetrics: ['operationAccuracy', 'recallAccuracy', 'workingMemorySpan', 'operationReactionTimeMs'],
    },
    sst_game_2: {
      gameId: 'sst_game_2',
      name: 'Stop-Signal Task',
      talentDomain: 'cognitive-behavioural',
      primaryConstruct: 'response_inhibition',
      secondaryConstructs: ['impulse_control', 'commission_errors', 'go_accuracy'],
      evidence: 'Go/stop paradigm: measures ability to execute frequent go responses while withholding prepotent responses on stop trials.',
      coreMetrics: ['goAccuracy', 'stopAccuracy', 'commissionErrors', 'omissionErrors', 'reactionTimeMs'],
    },
    tsw_game_3: {
      gameId: 'tsw_game_3',
      name: 'Task Switching',
      talentDomain: 'cognitive',
      primaryConstruct: 'cognitive_flexibility',
      secondaryConstructs: ['rule_switching', 'interference_control', 'set_shifting'],
      evidence: 'Alternating colour/shape rules expose switch cost, perseveration and rule-application errors.',
      coreMetrics: ['accuracy', 'ruleSwitchAccuracy', 'reactionTimeMs', 'perseverationErrors'],
    },
    cpt_game_4: {
      gameId: 'cpt_game_4',
      name: 'Continuous Performance Test',
      talentDomain: 'cognitive',
      primaryConstruct: 'sustained_attention',
      secondaryConstructs: ['vigilance', 'omission_errors', 'target_discrimination'],
      evidence: 'Repeated target/non-target discrimination under time pressure approximates vigilance and sustained attention.',
      coreMetrics: ['hitRate', 'falseAlarmRate', 'omissionErrors', 'reactionTimeMs'],
    },
    dec_game_5: {
      gameId: 'dec_game_5',
      name: 'Decision Making Under Pressure',
      talentDomain: 'behavioural',
      primaryConstruct: 'judgment_under_pressure',
      secondaryConstructs: ['prioritization', 'risk_reasoning', 'communication_quality'],
      evidence: 'Scenario choices encode quality of first action under ambiguity and limited time.',
      coreMetrics: ['scenarioAccuracy', 'riskAwareChoices', 'decisionLatencyMs'],
    },
    rsh_game_6: {
      gameId: 'rsh_game_6',
      name: 'Rule Shift + Exceptions',
      talentDomain: 'cognitive',
      primaryConstruct: 'adaptive_rule_control',
      secondaryConstructs: ['exception_handling', 'perseveration', 'working_rule_update'],
      evidence: 'Progressive block rules measure whether participants update behaviour when rules and exceptions change.',
      coreMetrics: ['blockAccuracy', 'exceptionAccuracy', 'perseverationErrors'],
    },
    sjt_game_7: {
      gameId: 'sjt_game_7',
      name: 'Situational Judgment Test',
      talentDomain: 'behavioural',
      primaryConstruct: 'workplace_judgment',
      secondaryConstructs: ['collaboration', 'leadership', 'quality_orientation', 'stakeholder_management'],
      evidence: 'Workplace scenarios score quality of behavioural choices in realistic interpersonal and delivery contexts.',
      coreMetrics: ['scenarioAccuracy', 'domainScores', 'judgmentConsistency'],
    },
  },
};

export const getAssessmentTelemetryDefinition = (gameId) => {
  const definition = ASSESSMENT_TELEMETRY_SCHEMA.games[gameId];
  if (!definition) throw new Error(`Unknown assessment telemetry game: ${gameId}`);
  return definition;
};

export const buildAssessmentTrialEvent = (gameId, event = {}) => {
  const definition = getAssessmentTelemetryDefinition(gameId);
  const {
    phase,
    trialIndex,
    stimulus,
    response,
    expected,
    isCorrect,
    reactionTimeMs,
    behaviouralMarkers = [],
    metrics = {},
    context = {},
  } = event;

  return stripUndefined({
    event: ASSESSMENT_TELEMETRY_SCHEMA.eventName,
    schemaVersion: ASSESSMENT_TELEMETRY_SCHEMA.version,
    gameId,
    talentDomain: definition.talentDomain,
    primaryConstruct: definition.primaryConstruct,
    phase,
    trialIndex,
    stimulus,
    response,
    expected,
    isCorrect,
    reactionTimeMs,
    behaviouralMarkers,
    metrics,
    context,
  });
};
