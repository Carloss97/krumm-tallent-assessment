import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { describe, it, beforeEach, afterEach, vi } from 'vitest';
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

const renderWithTelemetry = (node) => render(<TelemetryProvider>{node}</TelemetryProvider>);

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

  it('smoke test - BalloonGame renders', () => {
    const { unmount } = renderWithTelemetry(
      <BalloonGame isActive={false} isDemo={false} timeLimit={60} onEndGame={() => {}} />,
    );
    unmount();
  });
});