import { describe, expect, it, vi } from 'vitest';
import {
  FACIAL_TELEMETRY_SCHEMA_VERSION,
  assertFacialWindowPrivacySafe,
  assertTelemetryPayloadPrivacySafe,
  createFacialWindow,
} from './facialTelemetrySchema';
import { createFacialWindowAggregator } from './facialWindowAggregator';
import { extractFacialFrameFeatures } from './facialFeatureExtractor';
import {
  createFaceLandmarkerClient,
  DEFAULT_FACE_LANDMARKER_WASM_BASE_URL,
} from './faceLandmarkerClient';

const makeSample = (overrides = {}) => ({
  timestampMs: 0,
  facePresent: true,
  faceCount: 1,
  detectionConfidence: 0.9,
  illuminationScore: 0.8,
  blinkDetected: false,
  blinkScore: 0.1,
  headPose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0 },
  ...overrides,
});

describe('facial telemetry schema v1', () => {
  it('creates privacy-safe aggregate windows without raw or reconstructive fields', () => {
    const window = createFacialWindow({
      sessionId: 'session-123',
      gameId: 'sst_game_2',
      windowIndex: 2,
      startedAtMs: 10000,
      endedAtMs: 15000,
      durationMs: 5000,
      sampleCount: 25,
      quality: {
        facePresenceRatio: 0.92,
        meanDetectionConfidence: 0.87,
        meanIlluminationScore: 0.74,
        signalQualityScore: 81,
        multipleFaceRatio: 0,
        flags: [],
      },
      facialSignals: {
        blinkRatePerMin: 18,
        blinkAsymmetryMean: 0.02,
        headPose: {
          yawMeanDeg: 1.1,
          pitchMeanDeg: -2.2,
          rollMeanDeg: 0.4,
          yawStdDeg: 3.4,
          pitchStdDeg: 2.1,
          rollStdDeg: 1.7,
        },
        visualStabilityScore: 82,
        offScreenOrFaceAwayRatio: 0.04,
      },
      confidence: {
        windowConfidence: 0.8,
        interpretationAllowed: true,
        reasonIfLowConfidence: null,
      },
    });

    expect(window.type).toBe('facial_window_v1');
    expect(window.version).toBe(FACIAL_TELEMETRY_SCHEMA_VERSION);
    expect(window.privacy).toEqual({
      rawVideoStored: false,
      rawFramesStored: false,
      landmarksStored: false,
      audioCaptured: false,
    });
    expect(() => assertFacialWindowPrivacySafe(window)).not.toThrow();
    expect(Object.prototype.hasOwnProperty.call(window, 'rawFrame')).toBe(false);
    expect(JSON.stringify(window)).not.toMatch(/imageData|pixels|canvas|base64|faceLandmarks|frameData/i);
  });

  it('normalizes aggregate windows and strips prohibited rest fields at the factory boundary', () => {
    const window = createFacialWindow({
      gameId: 'ospan_game_1',
      windowIndex: 0,
      startedAtMs: 0,
      endedAtMs: 5000,
      durationMs: 'not-a-number',
      sampleCount: 'not-a-number',
      source: '',
      rawFrame: 'data:image/png;base64,abc',
      faceLandmarks: [{ x: 0.1, y: 0.2 }],
    });

    expect(window.durationMs).toBe(5000);
    expect(window.sampleCount).toBe(0);
    expect(window.source).toBe('mediapipe_face_landmarker');
    expect(window).not.toHaveProperty('rawFrame');
    expect(window).not.toHaveProperty('faceLandmarks');
    expect(() => assertFacialWindowPrivacySafe(window)).not.toThrow();
  });

  it('rejects aggregate windows that accidentally include raw frame or landmark payloads', () => {
    const unsafeWindow = {
      ...createFacialWindow({
        gameId: 'ospan_game_1',
        windowIndex: 0,
        startedAtMs: 0,
        endedAtMs: 5000,
        sampleCount: 1,
      }),
      rawFrame: 'data:image/png;base64,abc',
    };

    expect(() => assertFacialWindowPrivacySafe(unsafeWindow)).toThrow(/rawFrame/i);
  });

  it('validates complete session payloads before network persistence', () => {
    const safeWindow = createFacialWindow({
      gameId: 'sst_game_2',
      durationMs: 5000,
      sampleCount: 20,
      quality: {
        facePresenceRatio: 0.9,
        signalQualityScore: 84,
      },
      confidence: {
        windowConfidence: 0.8,
        interpretationAllowed: true,
      },
    });

    const safePayload = {
      sessionData: {
        telemetry: {
          game2: {
            facialWindows: [safeWindow],
            webcamFrameSummary: {
              sampleCount: 0,
              faceDetectedRatio: 0,
              meanQualityScore: 0,
            },
            qualityFlags: [],
          },
        },
      },
    };
    expect(() => assertTelemetryPayloadPrivacySafe(safePayload)).not.toThrow();

    const unsafePayload = {
      sessionData: {
        telemetry: {
          game2: {
            facialWindows: [safeWindow],
            diagnostic: { faceLandmarks: [{ x: 0.1, y: 0.2 }] },
          },
        },
      },
    };
    expect(() => assertTelemetryPayloadPrivacySafe(unsafePayload)).toThrow(/faceLandmarks/i);
  });

  it('rejects plural or alternate raw webcam payload keys at the frontend boundary', () => {
    expect(() => assertTelemetryPayloadPrivacySafe({
      sessionData: {
        game1: {
          webcamFrames: [{ faceDetected: true }],
        },
      },
    })).toThrow(/webcamFrames/);

    expect(() => assertTelemetryPayloadPrivacySafe({
      sessionData: {
        game1: {
          facialLandmarks: [{ x: 0.1, y: 0.2, z: 0.3 }],
        },
      },
    })).toThrow(/facialLandmarks/);

    expect(() => assertTelemetryPayloadPrivacySafe({
      metadata: {
        preview: 'data:image/svg+xml,<svg></svg>',
      },
    })).toThrow(/preview/);
  });
});

describe('extractFacialFrameFeatures', () => {
  it('maps MediaPipe landmarks/blendshapes into a small per-frame feature object without persisting landmarks', () => {
    const result = {
      faceLandmarks: [[
        { x: 0.4, y: 0.4, z: 0 },
        { x: 0.6, y: 0.4, z: 0 },
        { x: 0.5, y: 0.55, z: -0.05 },
      ]],
      faceBlendshapes: [{
        categories: [
          { categoryName: 'eyeBlinkLeft', score: 0.7 },
          { categoryName: 'eyeBlinkRight', score: 0.8 },
          { categoryName: 'jawOpen', score: 0.2 },
          { categoryName: 'browDownLeft', score: 0.1 },
        ],
      }],
      facialTransformationMatrixes: [{
        data: [
          1, 0, 0, 0,
          0, 1, 0, 0,
          0, 0, 1, 0,
          0, 0, 0, 1,
        ],
      }],
    };

    const features = extractFacialFrameFeatures(result, {
      timestampMs: 1234,
      detectionConfidence: 0.93,
      illuminationScore: 0.76,
      source: 'mediapipe_face_landmarker',
    });

    expect(features).toMatchObject({
      type: 'facial_frame_features_v1',
      timestampMs: 1234,
      source: 'mediapipe_face_landmarker',
      facePresent: true,
      faceCount: 1,
      detectionConfidence: 0.93,
      illuminationScore: 0.76,
      blinkDetected: true,
    });
    expect(features.blinkScore).toBeCloseTo(0.75, 3);
    expect(features.blendshapes).toEqual({
      eyeBlinkLeft: 0.7,
      eyeBlinkRight: 0.8,
      jawOpen: 0.2,
      browDownLeft: 0.1,
    });
    expect(features.headPose).toEqual({ yawDeg: 0, pitchDeg: 0, rollDeg: 0 });
    expect(features.landmarks).toBeUndefined();
    expect(JSON.stringify(features)).not.toMatch(/faceLandmarks|landmarks|imageData|pixels|base64/i);
  });

  it('returns low-confidence absence features when no face is detected', () => {
    const features = extractFacialFrameFeatures({ faceLandmarks: [], faceBlendshapes: [] }, {
      timestampMs: 99,
      illuminationScore: 0.4,
    });

    expect(features.facePresent).toBe(false);
    expect(features.faceCount).toBe(0);
    expect(features.detectionConfidence).toBe(0);
    expect(features.blinkDetected).toBe(false);
    expect(features.headPose).toBeNull();
  });
});

describe('createFacialWindowAggregator', () => {
  it('emits one five-second privacy-safe aggregate window with coverage, blink, pose, and quality metrics', () => {
    const aggregator = createFacialWindowAggregator({
      sessionId: 'session-123',
      gameId: 'sst_game_2',
      windowMs: 5000,
      minSamples: 3,
    });

    const emitted = [];
    [
      makeSample({ timestampMs: 0, blinkDetected: false, headPose: { yawDeg: 0, pitchDeg: 0, rollDeg: 0 } }),
      makeSample({ timestampMs: 1000, blinkDetected: true, blinkScore: 0.8, headPose: { yawDeg: 2, pitchDeg: 1, rollDeg: 0 } }),
      makeSample({ timestampMs: 2000, blinkDetected: false, headPose: { yawDeg: 4, pitchDeg: 1, rollDeg: 1 } }),
      makeSample({ timestampMs: 3000, blinkDetected: false, headPose: { yawDeg: 2, pitchDeg: -1, rollDeg: 0 } }),
      makeSample({ timestampMs: 5000, blinkDetected: true, blinkScore: 0.7, headPose: { yawDeg: 1, pitchDeg: 0, rollDeg: 0 } }),
    ].forEach((sample) => {
      const window = aggregator.addSample(sample);
      if (window) emitted.push(window);
    });

    expect(emitted).toHaveLength(1);
    const [window] = emitted;
    expect(window.type).toBe('facial_window_v1');
    expect(window.gameId).toBe('sst_game_2');
    expect(window.durationMs).toBe(5000);
    expect(window.sampleCount).toBe(5);
    expect(window.quality.facePresenceRatio).toBe(1);
    expect(window.quality.meanDetectionConfidence).toBeCloseTo(0.9, 3);
    expect(window.facialSignals.blinkRatePerMin).toBe(24);
    expect(window.facialSignals.visualStabilityScore).toBeGreaterThan(70);
    expect(window.confidence.interpretationAllowed).toBe(true);
    expect(() => assertFacialWindowPrivacySafe(window)).not.toThrow();
  });

  it('marks low-confidence windows when facial coverage is insufficient', () => {
    const aggregator = createFacialWindowAggregator({
      gameId: 'ospan_game_1',
      windowMs: 5000,
      minSamples: 3,
    });

    [
      makeSample({ timestampMs: 0, facePresent: false, detectionConfidence: 0 }),
      makeSample({ timestampMs: 1000, facePresent: false, detectionConfidence: 0 }),
      makeSample({ timestampMs: 2000, facePresent: true, detectionConfidence: 0.5 }),
      makeSample({ timestampMs: 5000, facePresent: false, detectionConfidence: 0 }),
    ].forEach((sample) => aggregator.addSample(sample));

    const [window] = aggregator.flush();
    expect(window.quality.facePresenceRatio).toBeCloseTo(0.25, 3);
    expect(window.quality.flags).toContain('insufficient_facial_coverage');
    expect(window.confidence.interpretationAllowed).toBe(false);
    expect(window.confidence.reasonIfLowConfidence).toMatch(/coverage/i);
  });
});

describe('createFaceLandmarkerClient', () => {
  it('uses a pinned MediaPipe WASM version by default for production stability', () => {
    expect(DEFAULT_FACE_LANDMARKER_WASM_BASE_URL).toContain('@mediapipe/tasks-vision@0.10.35/wasm');
    expect(DEFAULT_FACE_LANDMARKER_WASM_BASE_URL).not.toContain('@latest');
  });

  it('initializes MediaPipe FaceLandmarker with browser-local video options and runs detectForVideo', async () => {
    const detectForVideo = vi.fn(() => ({ faceLandmarks: [] }));
    const close = vi.fn();
    const createFromOptions = vi.fn(async () => ({ detectForVideo, close }));
    const forVisionTasks = vi.fn(async () => ({ wasm: true }));

    const client = createFaceLandmarkerClient({
      importTasksVision: async () => ({
        FilesetResolver: { forVisionTasks },
        FaceLandmarker: { createFromOptions },
      }),
      wasmBaseUrl: '/vendor/mediapipe/wasm',
      modelAssetPath: '/models/face_landmarker.task',
    });

    const initResult = await client.initialize();
    expect(initResult).toEqual({ ok: true, source: 'mediapipe_face_landmarker' });
    expect(forVisionTasks).toHaveBeenCalledWith('/vendor/mediapipe/wasm');
    expect(createFromOptions).toHaveBeenCalledWith(
      { wasm: true },
      expect.objectContaining({
        runningMode: 'VIDEO',
        numFaces: 1,
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
      }),
    );
    expect(createFromOptions.mock.calls[0][1].baseOptions.modelAssetPath).toBe('/models/face_landmarker.task');

    const result = client.detectForVideo({ nodeName: 'VIDEO' }, 777);
    expect(result).toEqual({ faceLandmarks: [] });
    expect(detectForVideo).toHaveBeenCalledWith({ nodeName: 'VIDEO' }, 777);

    client.dispose();
    expect(close).toHaveBeenCalledTimes(1);
  });

  it('fails closed when MediaPipe cannot be loaded', async () => {
    const client = createFaceLandmarkerClient({
      importTasksVision: async () => { throw new Error('network failed'); },
    });

    const initResult = await client.initialize();
    expect(initResult.ok).toBe(false);
    expect(initResult.code).toBe('facial_model_unavailable');
    expect(initResult.flags).toContain('facial_model_unavailable');
    expect(client.detectForVideo({}, 1)).toEqual({
      faceLandmarks: [],
      faceBlendshapes: [],
      facialTransformationMatrixes: [],
      error: 'facial_model_unavailable',
    });
  });
});
