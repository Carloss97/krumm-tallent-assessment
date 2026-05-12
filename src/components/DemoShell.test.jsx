import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DemoShell from './DemoShell';

const preloadEdgeLocalModelMock = vi.hoisted(() => vi.fn(() => Promise.resolve()));
const setConsentMock = vi.hoisted(() => vi.fn());

vi.mock('../TelemetryContext', () => ({
  useTelemetry: () => ({
    sessionData: {},
    setIsDemo: vi.fn(),
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
    recordTrialEvent: vi.fn(),
    recordWebcamFrame: vi.fn(),
    setConsent: setConsentMock,
  }),
}));

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es' }),
}));

vi.mock('../hooks/useMediaQuery', () => ({
  useIsMobile: () => false,
}));

vi.mock('../hooks/useWebcamCapture', () => ({
  useWebcamCapture: vi.fn(() => ({ current: null })),
}));

vi.mock('../services/edgeLocalInferenceService', () => ({
  preloadEdgeLocalModel: preloadEdgeLocalModelMock,
}));

vi.mock('./GameGallery', () => ({
  default: () => <div data-testid="game-gallery">Demo games locked to 3 modules</div>,
}));

vi.mock('./ProgressTracker', () => ({
  default: () => <div data-testid="progress-tracker">progress</div>,
}));

vi.mock('./PermissionModal', () => ({
  default: ({ open }) => open ? <div role="dialog">Permisos de cámara y micrófono</div> : null,
}));

vi.mock('./LiveDemoTelemetryHud', () => ({
  default: () => <aside aria-label="Live telemetry insights">Informe en vivo</aside>,
}));

vi.mock('../games/BalloonGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-balloon</button>,
}));

vi.mock('../games/GridFlowGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-grid</button>,
}));

vi.mock('../games/LaserPuzzleGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-laser</button>,
}));

vi.mock('../games/GoNoGoGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-gng</button>,
}));

vi.mock('../games/NBackGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-nback</button>,
}));

vi.mock('../games/MemoryGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-memory</button>,
}));

vi.mock('../games/ColorWordGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-colorword</button>,
}));

vi.mock('../games/TrailMakingGame', () => ({
  default: ({ onEndGame }) => <button onClick={() => onEndGame?.()}>finish-trails</button>,
}));

describe('DemoShell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts the public demo directly with instructions and without permission, webcam preload, or live telemetry HUD', async () => {
    render(<DemoShell />);

    fireEvent.click(screen.getByRole('button', { name: /continuar a demo/i }));

    await waitFor(() => {
      expect(screen.getByTestId('progress-tracker')).toBeInTheDocument();
    });

    expect(screen.getByText(/^instrucciones$/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /comenzar actividad/i })).toBeInTheDocument();
    expect(screen.queryByText(/permisos de cámara/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/informe en vivo/i)).not.toBeInTheDocument();
    expect(preloadEdgeLocalModelMock).not.toHaveBeenCalled();
    expect(setConsentMock).not.toHaveBeenCalledWith(expect.anything(), true);
    expect(document.querySelector('video')).toBeNull();
  });

  it('finishes the short demo with a locked dummy report teaser', async () => {
    render(<DemoShell />);

    fireEvent.click(screen.getByRole('button', { name: /continuar a demo/i }));
    fireEvent.click(await screen.findByRole('button', { name: /comenzar actividad/i }));

    fireEvent.click(await screen.findByRole('button', { name: /finish-balloon/i }));
    fireEvent.click(await screen.findByRole('button', { name: /finish-grid/i }));
    fireEvent.click(await screen.findByRole('button', { name: /finish-laser/i }));

    await waitFor(() => {
      expect(screen.getByText(/reporte demo bloqueado/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/datos referenciales/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/informe en vivo/i)).not.toBeInTheDocument();
  });
});
