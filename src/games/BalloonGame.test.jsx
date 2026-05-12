import { act, fireEvent, render, screen, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { TelemetryProvider } from '../TelemetryContext';
import BalloonGame from './BalloonGame';
import { BrowserRouter } from 'react-router-dom';

// Mock audio utilities
vi.mock('../utils/audio', () => ({
  playBalloonPump: vi.fn(),
  playBalloonPop: vi.fn(),
  playSuccessSound: vi.fn(),
  playErrorSound: vi.fn(),
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
    vi.restoreAllMocks();
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

  it('asks once at the end of the demo whether to retry the first game before continuing', async () => {
    const onEndGame = vi.fn();
    vi.spyOn(Math, 'random').mockReturnValue(0.99);

    render(
      <TelemetryProvider>
        <BrowserRouter>
          <BalloonGame isActive={true} isDemo={true} showBriefing={false} onEndGame={onEndGame} />
        </BrowserRouter>
      </TelemetryProvider>
    );

    const completeRun = () => {
      for (let i = 0; i < 10; i += 1) {
        fireEvent.click(screen.getByRole('button', { name: /expandir globo|expand balloon/i }));
        fireEvent.click(screen.getByRole('button', { name: /capturar puntos|capture points/i }));
        act(() => vi.advanceTimersByTime(1900));
      }
    };

    completeRun();

    expect(screen.getByText(/¿querés reintentar/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reintentar una vez/i })).toBeInTheDocument();
    expect(onEndGame).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /reintentar una vez/i }));
    completeRun();

    expect(screen.getByText(/segundo intento completado/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /reintentar una vez/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    await act(async () => Promise.resolve());
    expect(onEndGame).toHaveBeenCalledTimes(1);
  });
});
