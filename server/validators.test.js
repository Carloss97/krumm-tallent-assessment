import { describe, expect, it } from 'vitest';
import validateSession from './validators.js';

const makeSessionPayload = (overrides = {}) => ({
  participant: {
    participantId: 'candidate-001',
  },
  sessionData: {
    startedAt: '2026-05-13T20:00:00.000Z',
    game1: {
      score: 87,
      facialWindows: [
        {
          type: 'facial_window_v1',
          privacy: {
            rawVideoStored: false,
            rawFramesStored: false,
            landmarksStored: false,
            audioCaptured: false,
          },
          quality: {
            facePresenceRatio: 0.9,
            signalQualityScore: 82,
            flags: [],
          },
        },
      ],
    },
  },
  ...overrides,
});

describe('session payload validator privacy guard', () => {
  it('accepts aggregate session telemetry payloads without raw media', () => {
    const payload = makeSessionPayload();

    expect(validateSession(payload)).toBe(true);
  });

  it('accepts an assessment_feature_vector_v1 derived from aggregate metadata', () => {
    const payload = makeSessionPayload({
      sessionData: {
        startedAt: '2026-05-13T20:00:00.000Z',
        assessmentFeatureVector: {
          type: 'assessment_feature_vector_v1',
          version: '1.0.0',
          privacy: {
            source: 'aggregate_metadata_only',
            rawVideoStored: false,
            rawFramesStored: false,
            landmarksStored: false,
            audioCaptured: false,
          },
          aggregate: {
            completedGameCount: 3,
            meanWebcamSignalQuality: 72,
            meanFacialCoverage: 83,
          },
        },
      },
    });

    expect(validateSession(payload)).toBe(true);
  });

  it('rejects nested raw webcam or reconstructive facial fields in sessionData', () => {
    const payload = makeSessionPayload({
      sessionData: {
        startedAt: '2026-05-13T20:00:00.000Z',
        game1: {
          trialEvents: [
            {
              event: 'unsafe_diagnostic',
              payload: {
                rawFrame: 'data:image/png;base64,unsafe',
              },
            },
          ],
        },
      },
    });

    expect(validateSession(payload)).toBe(false);
    expect(validateSession.errors?.some((error) => String(error.message).includes('forbidden raw media'))).toBe(true);
  });

  it('rejects forbidden media-like values even when hidden under innocuous keys', () => {
    const payload = makeSessionPayload({
      sessionData: {
        startedAt: '2026-05-13T20:00:00.000Z',
        game1: {
          diagnostics: {
            preview: 'data:image/jpeg;base64,/9j/unsafe',
          },
        },
      },
    });

    expect(validateSession(payload)).toBe(false);
  });

  it('rejects raw media values anywhere in the request payload, not only sessionData', () => {
    const payload = makeSessionPayload({
      metadata: {
        diagnosticPreview: 'data:image/png;base64,unsafe',
      },
    });

    expect(validateSession(payload)).toBe(false);
  });

  it('rejects common plural/alternate raw webcam keys and non-base64 image data URIs', () => {
    const payloads = [
      makeSessionPayload({
        sessionData: {
          startedAt: '2026-05-13T20:00:00.000Z',
          game1: { rawFrames: [{ bytes: [1, 2, 3] }] },
        },
      }),
      makeSessionPayload({
        sessionData: {
          startedAt: '2026-05-13T20:00:00.000Z',
          game1: { webcamFrames: [{ faceDetected: true, pixels: [1, 2, 3] }] },
        },
      }),
      makeSessionPayload({
        sessionData: {
          startedAt: '2026-05-13T20:00:00.000Z',
          game1: { facialLandmarks: [{ x: 0.1, y: 0.2, z: 0.3 }] },
        },
      }),
      makeSessionPayload({
        metadata: { preview: 'data:image/svg+xml,<svg></svg>' },
      }),
    ];

    payloads.forEach((payload) => {
      expect(validateSession(payload)).toBe(false);
    });
  });
});
