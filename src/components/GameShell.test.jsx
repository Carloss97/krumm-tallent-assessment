import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GameShell from './GameShell';

vi.mock('./InstructionInterstitial', () => ({
  default: ({ onStart, title }) => (
    <div>
      <h1>{title}</h1>
      <button onClick={onStart}>start-game</button>
    </div>
  ),
}));

vi.mock('../TelemetryContext', () => ({
  TelemetryProvider: ({ children }) => <div>{children}</div>,
  useTelemetry: vi.fn(() => ({
    isDemo: false,
    consentState: {
      cursor: true,
      webcam: false,
      consentTimestamp: '2026-03-26T00:00:00.000Z',
      consentVersionId: 'v2.0',
    },
    featureFlags: {
      enableCursorTracking: true,
      enableWebcamTracking: true,
      enableQualityGates: true,
      enablePreGameBrief: true,
    },
    recordWebcamFrame: vi.fn(),
    setConsent: vi.fn(),
  })),
}));

describe('GameShell', () => {
  const DummyGame = () => <div data-testid="child-game">game-child</div>;
  const originalLocation = window.location;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { href: '/game/1' },
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: originalLocation,
    });
  });

  it('renders instruction state', () => {
    render(
      <BrowserRouter>
        <GameShell gameId={1}>
          <DummyGame />
        </GameShell>
      </BrowserRouter>
    );

    expect(screen.getByText('Operation Span (OSPAN)')).toBeTruthy();
  });

  it('shows child game after starting', async () => {
    render(
      <BrowserRouter>
        <GameShell gameId={1}>
          <DummyGame />
        </GameShell>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('start-game'));
    await waitFor(() => {
      expect(screen.getByTestId('child-game')).toBeTruthy();
    });
  });

  it('opens exit modal and navigates home after confirm', async () => {
    render(
      <BrowserRouter>
        <GameShell gameId={1}>
          <DummyGame />
        </GameShell>
      </BrowserRouter>
    );

    fireEvent.click(screen.getByText('start-game'));
    await waitFor(() => {
      expect(screen.getByTestId('child-game')).toBeTruthy();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Salir' }));
    expect(screen.getByText('¿Salir de la sesion?')).toBeTruthy();

    const modalConfirmBtn = document.querySelector('.game-exit-btn-danger');
    expect(modalConfirmBtn).toBeTruthy();
    fireEvent.click(modalConfirmBtn);

    await waitFor(() => {
      expect(window.location.href).toBe('/');
    });
  });
});

