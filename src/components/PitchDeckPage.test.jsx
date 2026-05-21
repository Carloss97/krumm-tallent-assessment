import React from 'react';
import fs from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Mock framer-motion before importing PitchDeckPage to avoid jsdom hangs
vi.mock('framer-motion', () => {
  const React = require('react');
  return {
    motion: {
      img: React.forwardRef((props, ref) => React.createElement('img', { ref, ...props })),
      div: React.forwardRef((props, ref) => React.createElement('div', { ref, ...props })),
      button: React.forwardRef((props, ref) => React.createElement('button', { ref, ...props })),
      section: React.forwardRef((props, ref) => React.createElement('section', { ref, ...props })),
    },
    AnimatePresence: ({ children }) => children,
  };
});

import PitchDeckPage from './PitchDeckPage';

describe('PitchDeckPage', () => {
  it('renders a high-resolution PDF image carousel instead of the low-res scaled HTML iframe', () => {
    render(<PitchDeckPage />);

    expect(screen.getByRole('main', { name: /krumm pitch deck/i })).toBeDefined();
    expect(screen.queryByTitle('KRUMM Pitch Deck')).toBeNull();
    expect(screen.queryByTestId('native-pitch-deck-slide')).toBeNull();

    const slide = screen.getByRole('img', { name: /slide 1/i });
    expect(slide).toHaveAttribute('src', expect.stringContaining('/src/assets/pitchdeck/highres/page-01.webp'));
    expect(slide).toHaveAttribute('width', '3840');
    expect(slide).toHaveAttribute('height', '2160');
    expect(slide).toHaveAttribute('decoding', 'async');
  });

  it('uses working previous/next controls to select the displayed high-resolution page', () => {
    render(<PitchDeckPage />);

    const nextButton = screen.getByRole('button', { name: /^Next →$/ });
    const previousButton = screen.getByRole('button', { name: /^← Prev$/ });

    expect(screen.getByLabelText(/slide progress/i)).toHaveTextContent('1/10');
    expect(previousButton).toBeDisabled();

    fireEvent.click(nextButton);

    expect(screen.getByLabelText(/slide progress/i)).toHaveTextContent('2/10');
    expect(previousButton).not.toBeDisabled();
    expect(screen.getByRole('img', { name: /slide 2/i })).toHaveAttribute(
      'src',
      expect.stringContaining('/src/assets/pitchdeck/highres/page-02.webp'),
    );

    fireEvent.click(previousButton);

    expect(screen.getByLabelText(/slide progress/i)).toHaveTextContent('1/10');
    expect(screen.getByRole('img', { name: /slide 1/i })).toHaveAttribute(
      'src',
      expect.stringContaining('/src/assets/pitchdeck/highres/page-01.webp'),
    );
  });

  it('keeps fullscreen image sizing and button pointer-events stable', () => {
    const css = fs.readFileSync('src/components/PitchDeckPage.css', 'utf8');

    expect(css).toContain('.pitch-deck-page__deck-image');
    expect(css).toContain('width: min(100dvw, calc(100dvh * 16 / 9));');
    expect(css).toContain('height: min(100dvh, calc(100dvw * 9 / 16));');
    expect(css).toContain('image-rendering: auto;');
    expect(css).toContain('.pitch-deck-page__footer > button');
    expect(css).toContain('pointer-events: auto;');
    expect(css).not.toContain('max-width: 1280px');
    expect(css).not.toContain('foreignObject');
    expect(css).not.toContain('textLength');
  });
});