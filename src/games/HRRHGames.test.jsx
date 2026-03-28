import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  StopSignalGame,
  DecisionGameHTMX,
  RuleShiftGame,
} from './HRRHGames';

let timerEnd = () => {};

const telemetry = {
  startTracking: vi.fn(),
  stopTracking: vi.fn(),
  recordError: vi.fn(),
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

describe('HRRHGames scoring and transitions', () => {
  beforeEach(() => {
    timerEnd = () => {};
    telemetry.startTracking.mockReset();
    telemetry.stopTracking.mockReset();
    telemetry.recordError.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('StopSignal reports accuracy metadata based on objective trial outcome', () => {
    sequenceRandom([0.9]); // GO trial at start
    const onEndGame = vi.fn();

    render(
      <StopSignalGame
        isActive
        onEndGame={onEndGame}
        isDemo
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
    fireEvent.click(screen.getByRole('button', { name: /press|presionar/i }));

    act(() => {
      timerEnd();
    });

    expect(telemetry.stopTracking).toHaveBeenCalledWith(
      'sst_game_2',
      10,
      0,
      expect.objectContaining({
        correctGo: 1,
        correctStop: 0,
        accuracy: 3,
      }),
    );
    expect(onEndGame).toHaveBeenCalledWith(10, 0, expect.any(Object));
  });

  it('StopSignal auto-advances on STOP and does not freeze the trial flow', () => {
    vi.useFakeTimers();
    sequenceRandom([0.1, 0.9]); // STOP first, then GO

    render(
      <StopSignalGame
        isActive
        onEndGame={() => {}}
        isDemo
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));

    act(() => {
      vi.advanceTimersByTime(950);
    });

    expect(screen.getByRole('heading', { name: /trial\s*2\s*de\s*30|trial\s*2\s*of\s*30/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('StopSignal allows failing on STOP when pressing anyway', () => {
    sequenceRandom([0.1, 0.9]); // STOP first, then GO
    const onEndGame = vi.fn();

    render(
      <StopSignalGame
        isActive
        onEndGame={onEndGame}
        isDemo
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
    fireEvent.click(screen.getByRole('button', { name: /press|presionar/i }));

    act(() => {
      timerEnd();
    });

    expect(telemetry.recordError).toHaveBeenCalled();
    expect(telemetry.stopTracking).toHaveBeenCalledWith(
      'sst_game_2',
      0,
      1,
      expect.objectContaining({
        correctGo: 0,
        correctStop: 0,
      }),
    );
    expect(onEndGame).toHaveBeenCalledWith(0, 1, expect.any(Object));
  });

  it('Decision game penalizes wrong choices and propagates error count to final scoring', () => {
    const onEndGame = vi.fn();

    render(
      <DecisionGameHTMX
        isActive
        onEndGame={onEndGame}
        isDemo
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
    const optionButtons = screen.getAllByRole('button').filter((btn) =>
      /escalar|aclarar|ignorar|escalate|clarify|ignore/i.test(btn.textContent || ''),
    );
    fireEvent.click(optionButtons[0]);

    act(() => {
      timerEnd();
    });

    expect(telemetry.recordError).toHaveBeenCalled();
    expect(telemetry.stopTracking).toHaveBeenCalledWith(
      'dec_game_5',
      0,
      1,
      expect.objectContaining({
        accuracy: 75,
      }),
    );
    expect(onEndGame).toHaveBeenCalledWith(0, 1, expect.any(Object));
  });

  it('RuleShift transitions from block 1 to block 2 after a correct response', () => {
    sequenceRandom([0.9, 0.9]); // Stimulus BLUE + SQUARE

    render(
      <RuleShiftGame
        isActive
        onEndGame={() => {}}
        timeLimit={120}
        language="es"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
    fireEvent.click(screen.getByRole('button', { name: /azul|blue/i }));

    expect(screen.getByText(/bloque\s*2\s*de\s*3|block\s*2\s*of\s*3/i)).toBeInTheDocument();
  });
});

