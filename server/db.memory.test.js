import { describe, expect, it } from 'vitest';
import { getSession, saveSession } from './db.memory.js';

const makeTelemetryPayload = () => ({
  participant: { participantId: 'candidate-telemetry', email: 'candidate@example.com' },
  sessionData: {
    startedAt: '2026-05-14T20:00:00.000Z',
    completedAt: '2026-05-14T20:30:00.000Z',
    telemetry: {
      ospan_game_1: {
        score: 82,
        errors: 1,
        duration: 60000,
        facialWindows: [{ type: 'facial_window_v1', quality: { signalQualityScore: 88 } }],
      },
      sst_game_2: {
        score: 76,
        errors: 2,
        durationMs: 54000,
      },
    },
    assessmentFeatureVector: {
      type: 'assessment_feature_vector_v1',
      aggregate: { completedGameCount: 2 },
    },
  },
});

describe('in-memory session persistence metrics extraction', () => {
  it('indexes game metrics from the new sessionData.telemetry payload shape', () => {
    const sessionId = saveSession(makeTelemetryPayload());

    const saved = getSession(sessionId);

    expect(saved.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        session_id: sessionId,
        game_id: 'ospan_game_1',
        score: 82,
        errors: 1,
      }),
      expect.objectContaining({
        session_id: sessionId,
        game_id: 'sst_game_2',
        score: 76,
        errors: 2,
      }),
    ]));
    expect(saved.metrics).toHaveLength(2);
  });
});
