import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_TELEMETRY_SCHEMA,
  buildAssessmentTrialEvent,
  getAssessmentTelemetryDefinition,
} from './assessmentTelemetry';

describe('assessment telemetry schema', () => {
  it('documents validated cognitive games and their talent constructs', () => {
    expect(getAssessmentTelemetryDefinition('ospan_game_1')).toEqual(expect.objectContaining({
      talentDomain: 'cognitive',
      primaryConstruct: 'working_memory_capacity',
    }));

    expect(getAssessmentTelemetryDefinition('sst_game_2')).toEqual(expect.objectContaining({
      talentDomain: 'cognitive-behavioural',
      primaryConstruct: 'response_inhibition',
    }));

    expect(getAssessmentTelemetryDefinition('tsw_game_3')).toEqual(expect.objectContaining({
      talentDomain: 'cognitive',
      primaryConstruct: 'cognitive_flexibility',
    }));

    expect(ASSESSMENT_TELEMETRY_SCHEMA.orderedGameIds.slice(0, 3)).toEqual([
      'ospan_game_1',
      'sst_game_2',
      'tsw_game_3',
    ]);
  });

  it('builds normalized trial events with construct, stimulus, response and timing metadata', () => {
    const event = buildAssessmentTrialEvent('sst_game_2', {
      phase: 'response',
      trialIndex: 7,
      stimulus: { signal: 'STOP' },
      response: { action: 'press' },
      expected: { action: 'withhold' },
      isCorrect: false,
      reactionTimeMs: 312,
      behaviouralMarkers: ['commission_error'],
    });

    expect(event).toEqual(expect.objectContaining({
      event: 'assessment_trial_response',
      gameId: 'sst_game_2',
      phase: 'response',
      trialIndex: 7,
      primaryConstruct: 'response_inhibition',
      talentDomain: 'cognitive-behavioural',
      isCorrect: false,
      reactionTimeMs: 312,
    }));
    expect(event.stimulus).toEqual({ signal: 'STOP' });
    expect(event.response).toEqual({ action: 'press' });
    expect(event.expected).toEqual({ action: 'withhold' });
    expect(event.behaviouralMarkers).toContain('commission_error');
  });
});
