import React from 'react';
import { render, cleanup, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelemetryProvider } from '../TelemetryContext';

import BalloonGame from './BalloonGame';
import ColorWordGame from './ColorWordGame';
import FrustrationGame from './FrustrationGame';
import MemoryGame from './MemoryGame';
import VigilanceGame from './VigilanceGame';
import GridOptimizerGame from './GridOptimizerGame';
import LaserPuzzleGame from './LaserPuzzleGame';
import NBackGame from './NBackGame';
import TowerOfLondonGame from './TowerOfLondonGame';
import WisconsinCardSortingGame from './WisconsinCardSortingGame';
import GoNoGoGame from './GoNoGoGame';
import TrailMakingGame from './TrailMakingGame';
import CorsiBlockTappingGame from './CorsiBlockTappingGame';
import MentalRotationGame from './MentalRotationGame';

vi.mock('../hooks/useGameTimer', () => ({
  useGameTimer: () => 60,
}));

vi.mock('../utils/audio', () => ({
  playBalloonPump: vi.fn(),
  playBalloonPop: vi.fn(),
  playMemoryFlash: vi.fn(),
  playMemoryClick: vi.fn(),
}));

const GAMES = [
  ['BalloonGame', BalloonGame],
  ['ColorWordGame', ColorWordGame],
  ['FrustrationGame', FrustrationGame],
  ['MemoryGame', MemoryGame],
  ['VigilanceGame', VigilanceGame],
  ['GridOptimizerGame', GridOptimizerGame],
  ['LaserPuzzleGame', LaserPuzzleGame],
  ['NBackGame', NBackGame],
  ['TowerOfLondonGame', TowerOfLondonGame],
  ['WisconsinCardSortingGame', WisconsinCardSortingGame],
  ['GoNoGoGame', GoNoGoGame],
  ['TrailMakingGame', TrailMakingGame],
  ['CorsiBlockTappingGame', CorsiBlockTappingGame],
  ['MentalRotationGame', MentalRotationGame],
];

const renderWithTelemetry = (node) => render(<TelemetryProvider>{node}</TelemetryProvider>);

describe('Games smoke coverage', () => {
  beforeEach(() => {
    vi.useFakeTimers();

    class MockAudioContext {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        };
      }
      resume() {
        return Promise.resolve();
      }
      close() {
        return Promise.resolve();
      }
    }

    globalThis.AudioContext = MockAudioContext;
    globalThis.webkitAudioContext = MockAudioContext;
  });

  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
  });

  it.each(GAMES)('renders %s in inactive state', (_name, GameComponent) => {
    const onEndGame = vi.fn();
    const { unmount } = renderWithTelemetry(
      <GameComponent isActive={false} isDemo={false} timeLimit={60} onEndGame={onEndGame} />,
    );

    expect(onEndGame).not.toHaveBeenCalled();
    unmount();
  });

  it.each(GAMES)('renders %s in active demo state without crashing', (_name, GameComponent) => {
    const onEndGame = vi.fn();
    const { unmount } = renderWithTelemetry(
      <GameComponent isActive={true} isDemo={true} timeLimit={60} onEndGame={onEndGame} />,
    );

    act(() => {
      vi.advanceTimersByTime(50);
    });

    unmount();
  });
});
