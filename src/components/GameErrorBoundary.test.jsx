import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import GameErrorBoundary from './GameErrorBoundary';

const CrashChild = () => {
  throw new Error('Crash for test');
};

describe('GameErrorBoundary', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders fallback when child throws and exposes actions', () => {
    const onRetry = vi.fn();
    const onExit = vi.fn();
    const onErrorCapture = vi.fn();

    render(
      <GameErrorBoundary
        language="en"
        onRetry={onRetry}
        onExit={onExit}
        onErrorCapture={onErrorCapture}
      >
        <CrashChild />
      </GameErrorBoundary>
    );

    expect(screen.getByText('Unexpected game error')).toBeTruthy();
    fireEvent.click(screen.getByText('Retry game'));
    expect(onRetry).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByText('Leave session'));
    expect(onExit).toHaveBeenCalledTimes(1);
    expect(onErrorCapture).toHaveBeenCalled();
  });
});
