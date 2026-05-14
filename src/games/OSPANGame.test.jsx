import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import OSPANGame from './OSPANGame';

let timerEnd = () => {};

const telemetry = {
  startTracking: vi.fn(),
  stopTracking: vi.fn(),
  recordError: vi.fn(),
  recordTrialEvent: vi.fn(),
};

vi.mock('../TelemetryContext', () => ({
  useTelemetry: () => telemetry,
}));

vi.mock('../hooks/useGameTimer', () => ({
  useGameTimer: ({ onEnd }) => {
    timerEnd = onEnd;
    return 60;
  },
}));

const sequenceRandom = (values) => {
  let idx = 0;
  return vi.spyOn(Math, 'random').mockImplementation(() => {
    const current = values[Math.min(idx, values.length - 1)];
    idx += 1;
    return current;
  });
};

describe('OSPANGame scoring validity', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    timerEnd = () => {};
    telemetry.startTracking.mockReset();
    telemetry.stopTracking.mockReset();
    telemetry.recordError.mockReset();
    telemetry.recordTrialEvent.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('awards points when user answer matches displayed operation truth', () => {
    sequenceRandom([0, 0, 0.9, 0.9]);
    const onEndGame = vi.fn();

    render(
      <OSPANGame
        isActive
        onEndGame={onEndGame}
        isDemo
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
    fireEvent.click(screen.getByRole('button', { name: /verdadero|true/i }));

    act(() => {
      vi.advanceTimersByTime(600);
      timerEnd();
    });

    expect(telemetry.stopTracking).toHaveBeenCalledWith(
      'ospan_game_1',
      10,
      0,
      expect.objectContaining({
        operationAccuracy: 100,
        totalTrials: 1,
      }),
    );
    expect(telemetry.recordTrialEvent).toHaveBeenCalledWith(expect.objectContaining({
      event: 'assessment_trial_response',
      gameId: 'ospan_game_1',
      primaryConstruct: 'working_memory_capacity',
      phase: 'operation_response',
      isCorrect: true,
      response: expect.objectContaining({ answer: 'true' }),
    }));
    expect(onEndGame).toHaveBeenCalledWith(
      10,
      0,
      expect.objectContaining({ operationAccuracy: 100 }),
    );
  });

  it('counts error when user answer does not match displayed operation truth', () => {
    sequenceRandom([0, 0, 0.9, 0.1, 0]);
    const onEndGame = vi.fn();

    render(
      <OSPANGame
        isActive
        onEndGame={onEndGame}
        isDemo
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
    fireEvent.click(screen.getByRole('button', { name: /verdadero|true/i }));

    act(() => {
      vi.advanceTimersByTime(600);
      timerEnd();
    });

    expect(telemetry.recordError).toHaveBeenCalled();
    expect(telemetry.stopTracking).toHaveBeenCalledWith(
      'ospan_game_1',
      0,
      1,
      expect.objectContaining({
        operationAccuracy: 0,
        totalTrials: 1,
      }),
    );
    expect(onEndGame).toHaveBeenCalledWith(
      0,
      1,
      expect.objectContaining({ operationAccuracy: 0 }),
    );
  });
});
