import { describe, expect, it } from 'vitest';
import { createFacialWindow, assertTelemetryPayloadPrivacySafe } from './telemetry/facial/facialTelemetrySchema';
import { generateEdgeLocalReport } from './services/edgeLocalInferenceService';
import { buildSessionPersistencePayload } from './telemetry/persistence/sessionPersistencePayload';
import { getSession, saveSession } from '../server/db.memory.js';

const makeSafeFacialWindow = (gameId, index) => createFacialWindow({
  sessionId: 'hito12-local-smoke',
  gameId,
  windowIndex: index,
  durationMs: 5000,
  sampleCount: 24,
  quality: {
    facePresenceRatio: 0.92,
    meanDetectionConfidence: 0.87,
    meanIlluminationScore: 0.78,
    signalQualityScore: 84,
    flags: [],
  },
  facialSignals: {
    blinkRatePerMin: 18,
    visualStabilityScore: 82,
    offScreenOrFaceAwayRatio: 0.04,
    headPose: {
      yawMeanDeg: 2,
      pitchMeanDeg: -1,
      rollMeanDeg: 0.5,
      yawStdDeg: 4,
      pitchStdDeg: 3,
      rollStdDeg: 2,
    },
  },
  derivedProxies: {
    attentionStabilityProxy: 78,
    cognitiveLoadProxy: 44,
    fatigueProxy: 21,
  },
  confidence: {
    windowConfidence: 0.82,
    interpretationAllowed: true,
  },
});

describe('Hito 12 local smoke without HTTP', () => {
  it('flows candidate telemetry through local model output, persistence and recruiter-readable session shape', () => {
    const telemetry = {
      game1: {
        score: 84,
        errors: 1,
        duration: 61000,
        trialEvents: [{ reactionTimeMs: 720, correct: true }],
        facialWindows: [makeSafeFacialWindow('game1', 0)],
      },
      game2: {
        score: 78,
        errors: 2,
        duration: 59000,
        trialEvents: [{ reactionTimeMs: 810, correct: true }],
        facialWindows: [makeSafeFacialWindow('game2', 0)],
      },
      game3: {
        score: 81,
        errors: 1,
        duration: 57000,
        trialEvents: [{ reactionTimeMs: 760, correct: false }],
        facialWindows: [makeSafeFacialWindow('game3', 0)],
      },
    };

    const report = generateEdgeLocalReport(telemetry, 'en');
    expect(report.edgeLocalModelOutput).toMatchObject({
      type: 'edge_local_model_output_v1',
      decisionPolicy: 'human_review_only',
      privacy: expect.objectContaining({ source: 'aggregate_metadata_only' }),
      model: expect.objectContaining({ calibrationStatus: 'baseline_not_validated' }),
    });

    const payload = buildSessionPersistencePayload({
      participant: {
        participantId: 'hito12-candidate',
        email: 'candidate+hito12@example.test',
      },
      telemetry,
      reportData: report,
      edgeLocalModelOutput: report.edgeLocalModelOutput,
      metadata: {
        sessionId: 'hito12-local-smoke',
        startedAt: '2026-05-14T20:00:00.000Z',
      },
      completedAt: '2026-05-14T20:20:00.000Z',
    });

    expect(assertTelemetryPayloadPrivacySafe(payload)).toBe(true);

    const sessionId = saveSession(payload);
    const saved = getSession(sessionId);

    expect(saved.participant_id).toBe('hito12-candidate');
    expect(saved.metrics).toEqual(expect.arrayContaining([
      expect.objectContaining({ game_id: 'game1', score: 84 }),
      expect.objectContaining({ game_id: 'game2', score: 78 }),
      expect.objectContaining({ game_id: 'game3', score: 81 }),
    ]));
    expect(saved.payload.sessionData.assessmentFeatureVector).toMatchObject({
      type: 'assessment_feature_vector_v1',
      aggregate: expect.objectContaining({ completedGameCount: 3 }),
    });
    expect(saved.payload.sessionData.edgeLocalModelOutput).toMatchObject({
      type: 'edge_local_model_output_v1',
      decisionPolicy: 'human_review_only',
      privacy: expect.objectContaining({ source: 'aggregate_metadata_only' }),
    });
    expect(JSON.stringify(saved.payload)).not.toMatch(/"rawFrame"|"faceLandmarks"|"normalizedLandmarks"|data:image|base64/i);
  });
});
