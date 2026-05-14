import { describe, expect, it } from 'vitest';
import { createFacialWindow, assertTelemetryPayloadPrivacySafe } from '../facial/facialTelemetrySchema';
import {
  ASSESSMENT_FEATURE_VECTOR_TYPE,
  buildAssessmentFeatureVectorV1,
} from './assessmentFeatureVector';

const makeFacialWindow = (overrides = {}) => createFacialWindow({
  gameId: 'ospan_game_1',
  windowIndex: 0,
  startedAtMs: 0,
  endedAtMs: 5000,
  durationMs: 5000,
  sampleCount: 12,
  quality: {
    facePresenceRatio: 0.8,
    meanDetectionConfidence: 0.75,
    signalQualityScore: 70,
    flags: [],
  },
  confidence: {
    windowConfidence: 0.7,
    interpretationAllowed: true,
  },
  ...overrides,
});

describe('assessmentFeatureVectorV1', () => {
  it('fuses game, cursor, trial, and facial aggregate telemetry by canonical game id', () => {
    const vector = buildAssessmentFeatureVectorV1({
      game1: {
        score: 84,
        errors: 2,
        duration: 90_000,
        mouseMovements: [{ x: 1, y: 1 }, { x: 2, y: 2 }],
        clicks: [{ x: 10, y: 10 }],
        cursorMetrics: {
          avgVelocity: 118.4,
          hesitationCount: 3,
        },
        trialEvents: [
          { event: 'trial_start', reactionTimeMs: 450, isCorrect: true },
          { event: 'trial_response', reactionTimeMs: 550, isCorrect: false },
        ],
        facialWindows: [
          makeFacialWindow(),
          makeFacialWindow({
            windowIndex: 1,
            startedAtMs: 5000,
            endedAtMs: 10000,
            quality: {
              facePresenceRatio: 0.6,
              meanDetectionConfidence: 0.66,
              signalQualityScore: 58,
              flags: ['insufficient_facial_coverage'],
            },
            confidence: {
              windowConfidence: 0.5,
              interpretationAllowed: false,
              reasonIfLowConfidence: 'coverage below threshold',
            },
          }),
        ],
        qualityFlags: ['partial_window_flush'],
      },
    }, {
      sessionId: 'session-123',
      participantId: 'candidate-123',
      generatedAtMs: 42,
    });

    expect(vector.type).toBe(ASSESSMENT_FEATURE_VECTOR_TYPE);
    expect(vector.version).toBe('1.0.0');
    expect(vector.session).toMatchObject({
      sessionId: 'session-123',
      participantId: 'candidate-123',
      completedGameCount: 1,
      totalDurationMs: 90_000,
    });

    expect(vector.games).toHaveLength(1);
    expect(vector.games[0]).toMatchObject({
      gameId: 'ospan_game_1',
      legacyGameId: 'game1',
      talentDomain: 'cognitive',
      primaryConstruct: 'working_memory_capacity',
      score: 84,
      errors: 2,
      durationMs: 90_000,
      trialEventCount: 2,
      reactionTimeMsMean: 500,
      accuracyProxy: 50,
      cursor: {
        movementCount: 2,
        clickCount: 1,
        avgVelocity: 118.4,
        hesitationCount: 3,
      },
      facial: {
        windowCount: 2,
        coverageMean: 70,
        signalQualityMean: 64,
        confidenceMean: 60,
      },
    });
    expect(vector.games[0].quality.flags).toEqual(expect.arrayContaining([
      'partial_window_flush',
      'insufficient_facial_coverage',
    ]));
    expect(vector.aggregate).toMatchObject({
      completedGameCount: 1,
      totalTrialEvents: 2,
      meanScore: 84,
      meanFacialCoverage: 70,
      meanWebcamSignalQuality: 64,
    });
    expect(vector.caveats).toContain('Some facial telemetry windows had insufficient coverage; interpret visual-signal proxies cautiously.');
    expect(() => assertTelemetryPayloadPrivacySafe(vector)).not.toThrow();
  });

  it('degrades gracefully when webcam/facial telemetry is absent', () => {
    const vector = buildAssessmentFeatureVectorV1({
      sst_game_2: {
        score: 72,
        errors: 1,
        durationMs: 60_000,
        trialEvents: [],
        qualityFlags: ['no_webcam_consent'],
      },
    });

    expect(vector.games[0].facial).toMatchObject({
      windowCount: 0,
      coverageMean: 0,
      signalQualityMean: 0,
      confidenceMean: 0,
    });
    expect(vector.games[0].quality.interpretationAllowed).toBe(false);
    expect(vector.caveats).toContain('Facial telemetry unavailable for at least one game; feature vector remains valid with reduced visual-signal confidence.');
  });
});
