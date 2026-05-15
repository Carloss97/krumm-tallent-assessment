import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import DevCameraLab from './DevCameraLab';

const mocks = vi.hoisted(() => ({
  verifyDevAccessPassword: vi.fn(),
  isDevLabEnabled: vi.fn(() => true),
  isDevAccessConfigured: vi.fn(() => true),
  isDevAccessAllowedHost: vi.fn(() => true),
  getDevAccessSession: vi.fn(() => null),
  setDevAccessSession: vi.fn(),
  clearDevAccessSession: vi.fn(),
  createDevAccessSession: vi.fn(() => ({ authenticatedAt: 1000, expiresAt: 2000 })),
  looksLikeSha256Hex: vi.fn(() => false),
  initialize: vi.fn(() => Promise.resolve(true)),
  startCapture: vi.fn(),
  cleanup: vi.fn(),
}));

vi.mock('../utils/devAccess', () => ({
  verifyDevAccessPassword: mocks.verifyDevAccessPassword,
  isDevLabEnabled: mocks.isDevLabEnabled,
  isDevAccessConfigured: mocks.isDevAccessConfigured,
  isDevAccessAllowedHost: mocks.isDevAccessAllowedHost,
  getDevAccessSession: mocks.getDevAccessSession,
  setDevAccessSession: mocks.setDevAccessSession,
  clearDevAccessSession: mocks.clearDevAccessSession,
  createDevAccessSession: mocks.createDevAccessSession,
  looksLikeSha256Hex: mocks.looksLikeSha256Hex,
}));

vi.mock('../utils/webcamCapture', () => ({
  WebcamCapture: vi.fn(function MockWebcamCapture(onWindowCapture) {
    return {
      initialize: mocks.initialize,
      startCapture: () => {
        mocks.startCapture();
        onWindowCapture({
          type: 'facial_window_v1',
          version: '1.0.0',
          gameId: 'dev_camera_lab',
          sessionId: 'dev-session',
          windowIndex: 0,
          startedAtMs: 0,
          endedAtMs: 5000,
          durationMs: 5000,
          sampleCount: 5,
          source: 'mediapipe_face_landmarker',
          privacy: {
            rawVideoStored: false,
            rawFramesStored: false,
            landmarksStored: false,
            audioCaptured: false,
          },
          quality: {
            facePresenceRatio: 0.8,
            meanDetectionConfidence: 0.9,
            meanIlluminationScore: 0.7,
            signalQualityScore: 82,
            multipleFaceRatio: 0,
            flags: [],
          },
          facialSignals: {
            blinkRatePerMin: 12,
            visualStabilityScore: 76,
            offScreenOrFaceAwayRatio: 0.1,
          },
          derivedProxies: {
            attentionStabilityProxy: null,
            cognitiveLoadProxy: null,
            fatigueProxy: null,
          },
          confidence: {
            windowConfidence: 0.8,
            interpretationAllowed: true,
            reasonIfLowConfidence: null,
          },
        });
        return true;
      },
      cleanup: mocks.cleanup,
      getTelemetryReport: () => ({ source: 'test', frameCount: 1 }),
    };
  }),
}));

const renderLab = (props = {}) => render(
  <MemoryRouter>
    <DevCameraLab {...props} />
  </MemoryRouter>,
);

describe('DevCameraLab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.isDevLabEnabled.mockReturnValue(true);
    mocks.isDevAccessConfigured.mockReturnValue(true);
    mocks.isDevAccessAllowedHost.mockReturnValue(true);
    mocks.getDevAccessSession.mockReturnValue(null);
    mocks.looksLikeSha256Hex.mockReturnValue(false);
    Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('requires a private dev login before showing browser-only camera tools', () => {
    renderLab();

    expect(screen.getByRole('heading', { name: /login de development/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /development browser lab/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /iniciar prueba de cámara/i })).not.toBeInTheDocument();
  });

  it('unlocks the camera lab after a valid password and emits only aggregate facial telemetry windows', async () => {
    mocks.verifyDevAccessPassword.mockResolvedValue(true);

    renderLab();

    fireEvent.change(screen.getByLabelText(/clave privada/i), { target: { value: 'camera-secret' } });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    await screen.findByRole('heading', { name: /development browser lab/i });
    expect(mocks.setDevAccessSession).toHaveBeenCalledWith(
      { authenticatedAt: 1000, expiresAt: 2000 },
      expect.any(Storage),
    );

    fireEvent.click(screen.getByRole('button', { name: /iniciar prueba de cámara/i }));

    await waitFor(() => expect(mocks.initialize).toHaveBeenCalledTimes(1));
    expect(mocks.startCapture).toHaveBeenCalledTimes(1);
    expect((await screen.findAllByText(/facial_window_v1/i)).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/rawVideoStored/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/faceLandmarks/i)).not.toBeInTheDocument();
  });

  it('explains that a pasted SHA-256 hash is not the browser login password', async () => {
    mocks.verifyDevAccessPassword.mockResolvedValue(false);
    mocks.looksLikeSha256Hex.mockReturnValue(true);

    renderLab();

    fireEvent.change(screen.getByLabelText(/clave privada/i), {
      target: { value: '6311eb28fd635243bd89c8c58c7a408636c0bc32c759cbc146d480c63f538fbc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }));

    expect(await screen.findByText(/pegaste el sha-256/i)).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /development browser lab/i })).not.toBeInTheDocument();
  });

  it('keeps local diagnostics independently scrollable so the latest safe window remains reachable', () => {
    mocks.getDevAccessSession.mockReturnValue({ authenticatedAt: 1000, expiresAt: 2000 });

    renderLab();

    fireEvent.click(screen.getByRole('button', { name: /simular ventana segura/i }));

    const localDiagnostic = screen.getByTestId('dev-camera-local-diagnostic');
    const latestSafeWindow = screen.getByTestId('dev-camera-latest-safe-window');

    expect(localDiagnostic).toHaveStyle({ maxHeight: '260px', overflowY: 'auto', overflowX: 'auto' });
    expect(latestSafeWindow).toHaveStyle({ maxHeight: '360px', overflowY: 'auto', overflowX: 'auto' });
    expect(latestSafeWindow).toHaveTextContent(/facial_window_v1/i);
    expect(latestSafeWindow).toHaveTextContent(/rawVideoStored/i);
  });

  it('opens as a production-safe camera diagnostics route without private dev login', () => {
    mocks.getDevAccessSession.mockReturnValue(null);

    renderLab({ production: true, basePath: '/camera' });

    expect(screen.getByRole('heading', { name: /browser-local camera check/i })).toBeTruthy();
    expect(screen.getByRole('button', { name: /iniciar prueba de cámara/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /login de development/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/dev\.krumm\.cl privado/i)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /reporte diagnóstico de cámara/i })).toHaveAttribute('href', '/camera/report');
  });

  it('blocks the lab when the route is opened outside the allowed dev hosts', () => {
    mocks.isDevAccessAllowedHost.mockReturnValue(false);

    renderLab();

    expect(screen.getByText(/no disponible en este host/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /entrar/i })).not.toBeInTheDocument();
  });
});
