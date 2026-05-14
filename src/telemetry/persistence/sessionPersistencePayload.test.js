import { describe, expect, it } from 'vitest';
import { createFacialWindow, assertTelemetryPayloadPrivacySafe } from '../facial/facialTelemetrySchema';
import { buildSessionPersistencePayload } from './sessionPersistencePayload';

const makeMetadata = () => ({
  startedAt: '2026-05-13T00:00:00.000Z',
  sessionId: 'session-001',
});

describe('buildSessionPersistencePayload', () => {
  it('adds a versioned assessment feature vector to the backend payload without raw telemetry', () => {
    const facialWindow = createFacialWindow({
      gameId: 'sst_game_2',
      durationMs: 5000,
      sampleCount: 12,
      quality: {
        facePresenceRatio: 0.9,
        signalQualityScore: 82,
        flags: [],
      },
      confidence: {
        windowConfidence: 0.84,
        interpretationAllowed: true,
      },
    });
    const telemetry = {
      game1: {
        score: 91,
        duration: 60000,
        trialEvents: [
          { reactionTimeMs: 640, isCorrect: true },
          { reactionTimeMs: 760, isCorrect: false },
        ],
        cursorMetrics: { avgVelocity: 120, hesitationCount: 2 },
        facialWindows: [facialWindow],
      },
    };

    const payload = buildSessionPersistencePayload({
      participant: { participantId: 'candidate-001' },
      telemetry,
      reportData: telemetry,
      metadata: makeMetadata(),
      completedAt: '2026-05-13T00:10:00.000Z',
      generatedAtMs: 1770000000000,
    });

    expect(payload).toMatchObject({
      participant: { participantId: 'candidate-001' },
      sessionData: {
        startedAt: '2026-05-13T00:00:00.000Z',
        completedAt: '2026-05-13T00:10:00.000Z',
        participantId: 'candidate-001',
        assessmentFeatureVector: {
          type: 'assessment_feature_vector_v1',
          version: '1.0.0',
          session: {
            participantId: 'candidate-001',
            sessionId: 'session-001',
            completedGameCount: 1,
          },
          aggregate: {
            completedGameCount: 1,
            totalTrialEvents: 2,
            meanScore: 91,
            meanFacialCoverage: 90,
            meanWebcamSignalQuality: 82,
          },
        },
      },
      metadata: makeMetadata(),
    });
    expect(() => assertTelemetryPayloadPrivacySafe(payload)).not.toThrow();
    expect(JSON.stringify(payload)).not.toContain('data:image');
    expect(JSON.stringify(payload)).not.toContain('faceLandmarks');
    expect(JSON.stringify(payload)).not.toContain('srcObject');
  });

  it('fails closed when telemetry would make the backend payload privacy-unsafe', () => {
    expect(() => buildSessionPersistencePayload({
      participant: { participantId: 'candidate-unsafe' },
      telemetry: {
        game1: {
          score: 88,
          diagnostic: { rawFrame: 'data:image/png;base64,unsafe' },
        },
      },
      reportData: {},
      metadata: makeMetadata(),
    })).toThrow(/Unsafe telemetry payload/);
  });

  it('summarizes legacy webcamFrames instead of persisting frame-level arrays', () => {
    const telemetry = {
      game1: {
        score: 82,
        duration: 50000,
        webcamFrames: [
          { faceDetected: true, qualityScore: 80, timestamp: 1000 },
          { faceDetected: false, qualityScore: 40, timestamp: 1100 },
        ],
      },
    };

    const payload = buildSessionPersistencePayload({
      participant: { participantId: 'candidate-legacy' },
      telemetry,
      reportData: telemetry,
      metadata: makeMetadata(),
    });

    expect(payload.sessionData.telemetry.game1.webcamFrames).toBeUndefined();
    expect(payload.sessionData.report.game1.webcamFrames).toBeUndefined();
    expect(payload.sessionData.telemetry.game1.webcamFrameSummary).toEqual({
      sampleCount: 2,
      faceDetectedRatio: 50,
      meanQualityScore: 60,
    });
    expect(() => assertTelemetryPayloadPrivacySafe(payload)).not.toThrow();
  });

  it('narrows metadata sessionId to a scalar before placing it in the feature vector', () => {
    const payload = buildSessionPersistencePayload({
      participant: { participantId: 'candidate-metadata' },
      telemetry: { game1: { score: 70, duration: 1000 } },
      reportData: {},
      metadata: {
        ...makeMetadata(),
        sessionId: { nested: 'not-allowed' },
      },
    });

    expect(payload.metadata.sessionId).toEqual({ nested: 'not-allowed' });
    expect(payload.sessionData.assessmentFeatureVector.session.sessionId).toBeNull();
    expect(() => assertTelemetryPayloadPrivacySafe(payload)).not.toThrow();
  });
});
