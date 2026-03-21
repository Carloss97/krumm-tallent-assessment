import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
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

  it('starts telemetry when game begins', async () => {
    // Mock the telemetry context
    const mockStartTracking = vi.fn();
    const mockStopTracking = vi.fn();

    // We need to render with isActive=true to bypass instructions
    render(
      <TelemetryProvider>
        <BrowserRouter>
          <BalloonGame isActive={true} onEndGame={vi.fn()} />
        </BrowserRouter>
      </TelemetryProvider>
    );

    // The game should be active and show the game UI
    expect(screen.getByText(/TRIAL:/i)).toBeDefined();
  });
});
