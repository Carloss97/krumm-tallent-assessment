import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import useWebcamCapture from './useWebcamCapture';
import { assertFacialWindowPrivacySafe } from '../telemetry/facial/facialTelemetrySchema';

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');

const setMediaDevices = (value) => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value,
  });
};

const restoreMediaDevices = () => {
  if (originalMediaDevicesDescriptor) {
    Object.defineProperty(navigator, 'mediaDevices', originalMediaDevicesDescriptor);
    return;
  }

  delete navigator.mediaDevices;
};

const HookHarness = ({ onFrameCapture, isActive = true, shouldCapture = true, faceLandmarkerClient = undefined }) => {
  const videoRef = useWebcamCapture({
    isActive,
    shouldCapture,
    onFrameCapture,
    gameId: 'game1',
    sessionId: 'session-001',
    sampleFps: 3,
    windowMs: 5000,
    debug: false,
    faceLandmarkerClient,
  });

  return <video data-testid="capture-video" ref={videoRef} muted playsInline />;
};

afterEach(() => {
  cleanup();
  restoreMediaDevices();
  vi.restoreAllMocks();
});

describe('useWebcamCapture', () => {
  it('emits a privacy-safe diagnostic facial window when camera APIs are unavailable', async () => {
    setMediaDevices(undefined);
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
    const onFrameCapture = vi.fn();

    render(<HookHarness onFrameCapture={onFrameCapture} />);

    await waitFor(() => expect(onFrameCapture).toHaveBeenCalledTimes(1));

    const diagnosticWindow = onFrameCapture.mock.calls[0][0];
    expect(diagnosticWindow).toMatchObject({
      type: 'facial_window_v1',
      version: '1.0.0',
      sessionId: 'session-001',
      gameId: 'game1',
      sampleCount: 0,
      quality: {
        facePresenceRatio: 0,
        signalQualityScore: 0,
        flags: ['camera_denied'],
      },
      confidence: {
        windowConfidence: 0,
        interpretationAllowed: false,
        reasonIfLowConfidence: 'webcam capture unavailable',
      },
      privacy: {
        rawVideoStored: false,
        rawFramesStored: false,
        landmarksStored: false,
        audioCaptured: false,
      },
    });
    expect(assertFacialWindowPrivacySafe(diagnosticWindow)).toBe(true);
  });

  it('emits a privacy-safe diagnostic facial window when the facial model is unavailable', async () => {
    const track = { stop: vi.fn() };
    const stream = { getTracks: vi.fn(() => [track]) };
    const getUserMedia = vi.fn(() => Promise.resolve(stream));
    setMediaDevices({ getUserMedia });
    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});

    const faceLandmarkerClient = {
      initialize: vi.fn(() => Promise.resolve({
        ok: false,
        flags: ['facial_model_unavailable'],
      })),
      detectForVideo: vi.fn(() => ({
        faceLandmarks: [],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
        error: 'facial_model_unavailable',
      })),
      dispose: vi.fn(),
    };
    const onFrameCapture = vi.fn();

    render(<HookHarness onFrameCapture={onFrameCapture} faceLandmarkerClient={faceLandmarkerClient} />);
    const video = screen.getByTestId('capture-video');

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(1));
    video.onloadedmetadata?.();

    await waitFor(() => expect(faceLandmarkerClient.initialize).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(onFrameCapture).toHaveBeenCalledWith(expect.objectContaining({
      type: 'facial_window_v1',
      gameId: 'game1',
      sessionId: 'session-001',
      quality: expect.objectContaining({
        signalQualityScore: 0,
        flags: expect.arrayContaining(['facial_model_unavailable']),
      }),
      confidence: expect.objectContaining({
        interpretationAllowed: false,
        reasonIfLowConfidence: 'facial model unavailable',
      }),
    })));

    const diagnosticWindow = onFrameCapture.mock.calls[0][0];
    expect(assertFacialWindowPrivacySafe(diagnosticWindow)).toBe(true);
  });
});
