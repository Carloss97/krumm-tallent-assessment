import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TelemetryProvider } from '../TelemetryContext';

// Mock audio utilities and game timer - must be before any game imports
vi.mock('../utils/audio', () => ({
  playBalloonPump: vi.fn(),
  playBalloonPop: vi.fn(),
  playMemoryFlash: vi.fn(),
  playMemoryClick: vi.fn(),
}));

vi.mock('../hooks/useGameTimer', () => ({
  useGameTimer: () => 60,
}));

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

const renderWithTelemetry = (node) => render(<TelemetryProvider>{node}</TelemetryProvider>);

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

describe('Games smoke coverage', () => {
  beforeEach(() => {
    class MockAudioContext {
      constructor() {
        this.state = 'running';
        this.currentTime = 0;
        this.destination = {};
      }
      createOscillator() {
        return {
          type: 'sine',
          frequency: { setValueAtTime: () => {} },
          connect: () => {},
          start: () => {},
          stop: () => {},
        };
      }
      createGain() {
        return {
          gain: {
            setValueAtTime: () => {},
            exponentialRampToValueAtTime: () => {},
          },
          connect: () => {},
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
    delete globalThis.AudioContext;
    delete globalThis.webkitAudioContext;
  });

  it.each(GAMES)('renders %s without crashing', (_name, GameComponent) => {
    const { unmount } = renderWithTelemetry(
      <GameComponent isActive={false} isDemo={false} timeLimit={60} onEndGame={() => {}} />,
    );
    unmount();

    const { unmount: unmount2 } = renderWithTelemetry(
      <GameComponent isActive={true} isDemo={false} timeLimit={60} onEndGame={() => {}} />,
    );
    unmount2();
  });
});