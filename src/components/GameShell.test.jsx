import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    },
    recordWebcamFrame: vi.fn(),
    setConsent: vi.fn(),
  })),
}));

describe('GameShell', () => {
  const DummyGame = () => <div data-testid="child-game">game-child</div>;

  beforeEach(() => {
    vi.clearAllMocks();
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
});
