import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MemoryGame from './MemoryGame';

vi.mock('../TelemetryContext', () => ({
  useTelemetry: vi.fn(() => ({
    recordError: vi.fn(),
    recordMove: vi.fn(),
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
    sessionData: {}
  })),
}));

vi.mock('../hooks/useGameTimer', () => ({
  useGameTimer: () => 60,
}));

vi.mock('../utils/audio', () => ({
  playMemoryFlash: vi.fn(),
  playMemoryClick: vi.fn(),
}));

describe('MemoryGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stage complete view when inactive', () => {
    const { container } = render(
      <MemoryGame
        isActive={false}
        isDemo={false}
        timeLimit={60}
        onEndGame={vi.fn()}
      />
    );

    expect(container.textContent.toUpperCase()).toContain('STAGE');
  });

  it('supports demo mode while inactive', () => {
    const { container } = render(
      <MemoryGame
        isActive={false}
        isDemo={true}
        timeLimit={30}
        onEndGame={vi.fn()}
      />
    );

    expect(container.textContent.toUpperCase()).toContain('COMPLETE');
  });
});
