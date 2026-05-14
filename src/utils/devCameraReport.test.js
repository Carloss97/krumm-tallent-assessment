import { describe, it, expect, beforeEach } from 'vitest';
import { createFacialWindow } from '../telemetry/facial/facialTelemetrySchema';
import {
  buildDevCameraReportSnapshot,
  buildDevCameraSignalAudit,
  clearDevCameraReportSnapshot,
  DEV_CAMERA_REPORT_STORAGE_KEY,
  readDevCameraReportSnapshot,
  saveDevCameraReportSnapshot,
} from './devCameraReport';

const makeWindow = (overrides = {}) => createFacialWindow({
  gameId: 'dev_camera_lab',
  sessionId: 'dev-session',
  windowIndex: 0,
  startedAtMs: 0,
  endedAtMs: 5000,
  durationMs: 5000,
  sampleCount: 10,
  quality: {
    facePresenceRatio: 0.9,
    meanDetectionConfidence: 0.92,
    meanIlluminationScore: 0.82,
    signalQualityScore: 88,
    flags: [],
  },
  facialSignals: {
    blinkRatePerMin: 12,
    visualStabilityScore: 84,
    offScreenOrFaceAwayRatio: 0.05,
  },
  confidence: {
    windowConfidence: 0.86,
    interpretationAllowed: true,
    reasonIfLowConfidence: null,
  },
  ...overrides,
});

describe('dev camera report utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('builds a privacy-safe dev camera audit from aggregate facial windows', () => {
    const audit = buildDevCameraSignalAudit([
      makeWindow(),
      makeWindow({
        windowIndex: 1,
        quality: {
          facePresenceRatio: 0.8,
          meanDetectionConfidence: 0.8,
          meanIlluminationScore: 0.7,
          signalQualityScore: 72,
          flags: ['low_light'],
        },
      }),
    ], {
      qualityGatePassed: true,
      sampleFps: 6,
      windowMs: 5000,
      stats: {
        totalFrames: 50,
        faceDetectedFrames: 48,
        avgQualityScore: 85,
        emittedWindows: 2,
      },
    });

    expect(audit).toEqual(expect.objectContaining({
      facialWindowCount: 2,
      sampleCount: 20,
      totalFrames: 50,
      faceDetectedFrames: 48,
      sampleFps: 6,
      signalQualityScore: 80,
      facialCoverageScore: 85,
      qualityGatePassed: true,
      qualityFlags: ['low_light'],
    }));
  });

  it('stores and reads only sanitized aggregate snapshots', () => {
    const unsafeWindow = {
      ...makeWindow({ windowIndex: 2 }),
      rawFrame: 'data:image/png;base64,unsafe',
    };

    const snapshot = saveDevCameraReportSnapshot({
      generatedAt: '2026-05-14T19:06:52.039Z',
      facialWindows: [makeWindow(), unsafeWindow],
      telemetryReport: {
        source: 'mediapipe_face_landmarker',
        frameCount: 51,
        qualityGatePassed: true,
        stats: {
          totalFrames: 51,
          faceDetectedFrames: 51,
          avgQualityScore: 100,
          emittedWindows: 1,
        },
      },
      captureProfile: {
        id: 'balanced',
        label: 'Balanceado',
        sampleFps: 6,
        windowMs: 5000,
        videoWidth: 640,
        videoHeight: 480,
      },
    });

    expect(snapshot.facialWindows).toHaveLength(1);
    expect(snapshot.facialWindows[0].rawFrame).toBeUndefined();
    expect(snapshot.facialWindows[0].privacy.rawFramesStored).toBe(false);
    expect(localStorage.getItem(DEV_CAMERA_REPORT_STORAGE_KEY)).toBeTruthy();

    const restored = readDevCameraReportSnapshot();
    expect(restored).toEqual(expect.objectContaining({
      type: 'dev_camera_report_snapshot_v1',
      generatedAt: '2026-05-14T19:06:52.039Z',
      audit: expect.objectContaining({ facialWindowCount: 1 }),
    }));

    clearDevCameraReportSnapshot();
    expect(readDevCameraReportSnapshot()).toBeNull();
  });

  it('rejects corrupted stored snapshots instead of rendering unsafe payloads', () => {
    localStorage.setItem(DEV_CAMERA_REPORT_STORAGE_KEY, JSON.stringify({
      type: 'dev_camera_report_snapshot_v1',
      version: '1.0.0',
      facialWindows: [],
      diagnostic: { rawVideo: 'unsafe' },
    }));

    expect(readDevCameraReportSnapshot()).toBeNull();
  });

  it('can build a snapshot without a telemetry report when only windows are available', () => {
    const snapshot = buildDevCameraReportSnapshot({ facialWindows: [makeWindow()] });

    expect(snapshot.telemetryReport).toBeNull();
    expect(snapshot.audit).toEqual(expect.objectContaining({
      facialWindowCount: 1,
      qualityGatePassed: true,
    }));
  });
});
