import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NBackGame from './NBackGame';

vi.mock('../utils/audio', () => ({
  playMemoryFlash: vi.fn(),
  playNBackHit: vi.fn(),
  playNBackMiss: vi.fn(),
}));

vi.mock('../TelemetryContext', () => ({
  useTelemetry: vi.fn(() => ({
    recordError: vi.fn(),
    startTracking: vi.fn(),
    stopTracking: vi.fn(),
  })),
}));

vi.mock('../hooks/useGameTimer', () => ({
  useGameTimer: () => 60,
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

describe('NBackGame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders stage complete view when inactive', () => {
    const { container } = render(
      <NBackGame
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
      <NBackGame
        isActive={false}
        isDemo={true}
        timeLimit={30}
        onEndGame={vi.fn()}
      />
    );

    expect(container.textContent.toUpperCase()).toContain('COMPLETE');
  });
});
