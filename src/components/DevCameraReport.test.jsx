import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import DevCameraReport from './DevCameraReport';
import { createFacialWindow } from '../telemetry/facial/facialTelemetrySchema';
import {
  DEV_CAMERA_REPORT_STORAGE_KEY,
  saveDevCameraReportSnapshot,
} from '../utils/devCameraReport';

const mocks = vi.hoisted(() => ({
  isDevLabEnabled: vi.fn(() => true),
  isDevAccessConfigured: vi.fn(() => true),
  isDevAccessAllowedHost: vi.fn(() => true),
  getDevAccessSession: vi.fn(() => ({ authenticatedAt: 1000, expiresAt: 2000 })),
}));

vi.mock('../utils/devAccess', () => ({
  isDevLabEnabled: mocks.isDevLabEnabled,
  isDevAccessConfigured: mocks.isDevAccessConfigured,
  isDevAccessAllowedHost: mocks.isDevAccessAllowedHost,
  getDevAccessSession: mocks.getDevAccessSession,
}));

const renderReport = (props = {}) => render(
  <MemoryRouter>
    <DevCameraReport {...props} />
  </MemoryRouter>,
);

const saveSampleSnapshot = () => saveDevCameraReportSnapshot({
  generatedAt: '2026-05-14T19:06:52.039Z',
  captureProfile: {
    id: 'balanced',
    label: 'Balanceado — 6 FPS, 640×480',
    sampleFps: 6,
    windowMs: 5000,
    videoWidth: 640,
    videoHeight: 480,
  },
  telemetryReport: {
    timestamp: '2026-05-14T19:06:52.039Z',
    source: 'mediapipe_face_landmarker',
    qualityGatePassed: true,
    frameCount: 1,
    sampleFps: 6,
    windowMs: 5000,
    stats: {
      totalFrames: 51,
      faceDetectedFrames: 51,
      avgQualityScore: 100,
      emittedWindows: 1,
    },
  },
  facialWindows: [createFacialWindow({
    gameId: 'dev_camera_lab',
    sessionId: 'dev-session',
    durationMs: 5000,
    sampleCount: 12,
    quality: {
      facePresenceRatio: 1,
      meanDetectionConfidence: 0.94,
      meanIlluminationScore: 0.82,
      signalQualityScore: 96,
      flags: [],
    },
    facialSignals: {
      blinkRatePerMin: 10,
      visualStabilityScore: 88,
      offScreenOrFaceAwayRatio: 0,
    },
    confidence: {
      windowConfidence: 0.91,
      interpretationAllowed: true,
    },
  })],
});

describe('DevCameraReport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mocks.isDevLabEnabled.mockReturnValue(true);
    mocks.isDevAccessConfigured.mockReturnValue(true);
    mocks.isDevAccessAllowedHost.mockReturnValue(true);
    mocks.getDevAccessSession.mockReturnValue({ authenticatedAt: 1000, expiresAt: 2000 });
  });

  it('asks the user to run the camera lab when no dev camera snapshot exists', () => {
    renderReport();

    expect(screen.getByRole('heading', { name: /no hay diagnóstico de cámara guardado/i })).toBeTruthy();
    expect(screen.getByRole('link', { name: /abrir laboratorio de cámara/i })).toHaveAttribute('href', '/dev/camera');
  });

  it('renders the saved aggregate camera audit without requiring final assessment data', () => {
    saveSampleSnapshot();

    renderReport();

    expect(screen.getByRole('heading', { name: /validación browser-local/i })).toBeTruthy();
    expect(screen.getByText(/quality gate de cámara aprobado/i)).toBeTruthy();
    expect(screen.getByText('96%')).toBeTruthy();
    expect(screen.getByText('51/51')).toBeTruthy();
    expect(screen.getAllByText(/facial_window_v1/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/no reemplaza el reporte final/i)).toBeTruthy();
  });

  it('requires a private dev session before showing the stored snapshot', () => {
    saveSampleSnapshot();
    mocks.getDevAccessSession.mockReturnValue(null);

    renderReport();

    expect(screen.getByRole('heading', { name: /sesión dev requerida/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /validación browser-local/i })).not.toBeInTheDocument();
  });

  it('renders production camera diagnostics without a private dev session', () => {
    saveSampleSnapshot();
    mocks.getDevAccessSession.mockReturnValue(null);

    renderReport({ production: true, basePath: '/camera' });

    expect(screen.getByRole('heading', { name: /validación browser-local/i })).toBeTruthy();
    expect(screen.queryByRole('heading', { name: /sesión dev requerida/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /volver al diagnóstico de cámara/i })).toHaveAttribute('href', '/camera');
  });

  it('clears the saved diagnostic snapshot from localStorage', () => {
    saveSampleSnapshot();

    renderReport();
    fireEvent.click(screen.getByRole('button', { name: /borrar diagnóstico/i }));

    expect(localStorage.getItem(DEV_CAMERA_REPORT_STORAGE_KEY)).toBeNull();
    expect(screen.getByRole('heading', { name: /no hay diagnóstico de cámara guardado/i })).toBeTruthy();
  });
});
