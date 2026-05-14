import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { WebcamCapture } from './webcamCapture';
import {
  assertTelemetryPayloadPrivacySafe,
  createFacialWindow,
} from '../telemetry/facial/facialTelemetrySchema';

const makeWindow = (overrides = {}) => createFacialWindow({
  gameId: 'sst_game_2',
  startedAtMs: 0,
  endedAtMs: 5000,
  durationMs: 5000,
  sampleCount: 5,
  quality: {
    facePresenceRatio: 0.9,
    meanDetectionConfidence: 0.88,
    meanIlluminationScore: 0.76,
    signalQualityScore: 82,
    flags: [],
  },
  confidence: {
    windowConfidence: 0.8,
    interpretationAllowed: true,
  },
  ...overrides,
});

describe('WebcamCapture facial telemetry integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('processes webcam samples with the local FaceLandmarker and emits aggregate facial windows only', async () => {
    const emittedWindow = makeWindow();
    const onWindowCapture = vi.fn();
    const faceLandmarkerClient = {
      initialize: vi.fn(() => Promise.resolve({ ok: true })),
      detectForVideo: vi.fn(() => ({ faceLandmarks: [[{ x: 0.5, y: 0.5 }]] })),
      dispose: vi.fn(),
    };
    const facialWindowAggregator = {
      addSample: vi.fn(() => emittedWindow),
      flush: vi.fn(() => []),
      reset: vi.fn(),
    };
    const extractFeatures = vi.fn(() => ({
      type: 'facial_frame_features_v1',
      timestampMs: 1234,
      source: 'mediapipe_face_landmarker',
      facePresent: true,
      faceCount: 1,
      detectionConfidence: 0.92,
      illuminationScore: 0.8,
      blinkDetected: false,
      blinkScore: 0.1,
      blinkAsymmetry: 0.02,
      headPose: { yawDeg: 2, pitchDeg: 0, rollDeg: -1 },
    }));

    const capture = new WebcamCapture(onWindowCapture, {
      gameId: 'sst_game_2',
      sampleFps: 6,
      scheduleNextFrame: false,
      now: () => 1234,
      faceLandmarkerClient,
      facialWindowAggregator,
      extractFeatures,
    });
    capture.videoElement = { readyState: 4, videoWidth: 640, videoHeight: 480 };
    capture.isCapturing = true;

    await capture.captureFrame();

    expect(faceLandmarkerClient.detectForVideo).toHaveBeenCalledWith(capture.videoElement, 1234);
    expect(extractFeatures).toHaveBeenCalledWith(
      { faceLandmarks: [[{ x: 0.5, y: 0.5 }]] },
      expect.objectContaining({ timestampMs: 1234, source: 'mediapipe_face_landmarker' }),
    );
    expect(facialWindowAggregator.addSample).toHaveBeenCalledWith(expect.objectContaining({
      type: 'facial_frame_features_v1',
      facePresent: true,
    }));
    expect(onWindowCapture).toHaveBeenCalledTimes(1);
    expect(onWindowCapture).toHaveBeenCalledWith(emittedWindow);
    expect(onWindowCapture.mock.calls[0][0]).not.toHaveProperty('faceLandmarks');
    expect(onWindowCapture.mock.calls[0][0]).not.toHaveProperty('imageData');
  });

  it('flushes pending windows and stops camera resources during cleanup', () => {
    const pendingWindow = makeWindow({ windowIndex: 1 });
    const onWindowCapture = vi.fn();
    const track = { stop: vi.fn() };
    const faceLandmarkerClient = { dispose: vi.fn() };
    const facialWindowAggregator = {
      addSample: vi.fn(),
      flush: vi.fn(() => [pendingWindow]),
      reset: vi.fn(),
    };
    const clearScheduledFrame = vi.fn();
    const videoElement = {
      srcObject: { getTracks: () => [track] },
      pause: vi.fn(),
    };

    const capture = new WebcamCapture(onWindowCapture, {
      faceLandmarkerClient,
      facialWindowAggregator,
      clearScheduledFrame,
    });
    capture.stream = videoElement.srcObject;
    capture.videoElement = videoElement;
    capture.captureTimerId = 42;
    capture.isCapturing = true;

    capture.cleanup();

    expect(facialWindowAggregator.flush).toHaveBeenCalledTimes(1);
    expect(onWindowCapture).toHaveBeenCalledWith(pendingWindow);
    expect(clearScheduledFrame).toHaveBeenCalledWith(42);
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(videoElement.pause).toHaveBeenCalledTimes(1);
    expect(videoElement.srcObject).toBeNull();
    expect(faceLandmarkerClient.dispose).toHaveBeenCalledTimes(1);
    expect(capture.isCapturing).toBe(false);
  });

  it('always releases camera resources when a pending window fails privacy validation', () => {
    const unsafePendingWindow = {
      ...makeWindow({ windowIndex: 2 }),
      rawFrame: 'data:image/png;base64,unsafe',
    };
    const onWindowCapture = vi.fn();
    const track = { stop: vi.fn() };
    const faceLandmarkerClient = { dispose: vi.fn() };
    const facialWindowAggregator = {
      addSample: vi.fn(),
      flush: vi.fn(() => [unsafePendingWindow]),
      reset: vi.fn(),
    };
    const videoElement = {
      srcObject: { getTracks: () => [track] },
      pause: vi.fn(),
    };

    const capture = new WebcamCapture(onWindowCapture, {
      faceLandmarkerClient,
      facialWindowAggregator,
      clearScheduledFrame: vi.fn(),
      logger: { error: vi.fn(), warn: vi.fn() },
    });
    capture.stream = videoElement.srcObject;
    capture.videoElement = videoElement;
    capture.isCapturing = true;

    expect(() => capture.cleanup()).not.toThrow();
    expect(onWindowCapture).not.toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(videoElement.pause).toHaveBeenCalledTimes(1);
    expect(videoElement.srcObject).toBeNull();
    expect(faceLandmarkerClient.dispose).toHaveBeenCalledTimes(1);
  });

  it('simulates a browser getUserMedia session and emits aggregate metadata without raw camera payloads', async () => {
    const emittedWindow = makeWindow({ windowIndex: 3 });
    const onWindowCapture = vi.fn();
    const track = { stop: vi.fn() };
    const stream = { getTracks: vi.fn(() => [track]) };
    const getUserMedia = vi.fn(() => Promise.resolve(stream));
    vi.stubGlobal('navigator', { mediaDevices: { getUserMedia } });

    const faceLandmarkerClient = {
      initialize: vi.fn(() => Promise.resolve({ ok: true })),
      detectForVideo: vi.fn(() => ({ faceLandmarks: [[{ x: 0.5, y: 0.5 }]] })),
      dispose: vi.fn(),
    };
    const facialWindowAggregator = {
      addSample: vi.fn(() => emittedWindow),
      flush: vi.fn(() => []),
      reset: vi.fn(),
    };
    const extractFeatures = vi.fn(() => ({
      type: 'facial_frame_features_v1',
      timestampMs: 1500,
      source: 'mediapipe_face_landmarker',
      facePresent: true,
      faceCount: 1,
      detectionConfidence: 0.91,
      illuminationScore: 0.82,
      blinkDetected: false,
      blinkScore: 0.05,
      blinkAsymmetry: 0.01,
      headPose: { yawDeg: 1, pitchDeg: 0, rollDeg: 0 },
    }));
    const videoElement = {
      readyState: 1,
      play: vi.fn(() => Promise.resolve()),
      srcObject: null,
      videoWidth: 640,
      videoHeight: 480,
    };

    const capture = new WebcamCapture(onWindowCapture, {
      gameId: 'sst_game_2',
      sampleFps: 6,
      scheduleNextFrame: false,
      now: () => 1500,
      faceLandmarkerClient,
      facialWindowAggregator,
      extractFeatures,
    });

    await expect(capture.initialize(videoElement)).resolves.toBe(true);
    expect(getUserMedia).toHaveBeenCalledWith(expect.objectContaining({ audio: false }));
    expect(videoElement.srcObject).toBe(stream);
    expect(faceLandmarkerClient.initialize).toHaveBeenCalledTimes(1);

    expect(capture.startCapture()).toBe(true);
    expect(onWindowCapture).toHaveBeenCalledWith(emittedWindow);
    expect(() => assertTelemetryPayloadPrivacySafe({ sessionData: { game: onWindowCapture.mock.calls[0][0] } })).not.toThrow();

    capture.cleanup();
    expect(track.stop).toHaveBeenCalledTimes(1);
    expect(videoElement.srcObject).toBeNull();
  });
});
