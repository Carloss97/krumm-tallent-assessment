import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import GameExitModal from './GameExitModal';

describe('GameExitModal', () => {
  it('renders when open and triggers cancel on overlay click', () => {
    const onCancel = vi.fn();
    const onConfirm = vi.fn();

    const { container } = render(
      <GameExitModal
        isOpen={true}
        language="en"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );

    expect(screen.getByText('Leave session?')).toBeTruthy();
    const overlay = container.querySelector('.game-exit-modal-overlay');
    fireEvent.click(overlay);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('triggers cancel on Escape key', () => {
    const onCancel = vi.fn();

    render(
      <GameExitModal
        isOpen={true}
        language="en"
        onCancel={onCancel}
        onConfirm={vi.fn()}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
