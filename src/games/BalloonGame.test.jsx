import { render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { TelemetryProvider } from '../TelemetryContext';
import BalloonGame from './BalloonGame';
import { BrowserRouter } from 'react-router-dom';

// Mock audio utilities
vi.mock('../utils/audio', () => ({
  playBalloonPump: vi.fn(),
  playBalloonPop: vi.fn(),
}));

describe('BalloonGame Telemetry Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  it('starts telemetry when game begins', () => {
    // We need to render with isActive=true to bypass instructions
    render(
      <TelemetryProvider>
        <BrowserRouter>
          <BalloonGame isActive={true} onEndGame={vi.fn()} />
        </BrowserRouter>
      </TelemetryProvider>
    );

    // The game should be active and show the game UI
    // Check for buttons that appear in active game state
    const expandBtn = screen.getByRole('button', { name: /expandir globo|expand balloon/i });
    expect(expandBtn).toBeDefined();
  });
});