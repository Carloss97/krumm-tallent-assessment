import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PitchDeckPage from './PitchDeckPage';

describe('PitchDeckPage', () => {
  it('rebuilds the original pitch deck as a native SVG/React slide instead of iframe/html import', () => {
    render(<PitchDeckPage />);

    expect(screen.queryByTitle('KRUMM Pitch Deck')).toBeNull();
    expect(screen.getByRole('main', { name: /krumm pitch deck/i })).toBeDefined();

    const slide = screen.getByTestId('native-pitch-deck-slide');
    expect(slide.tagName.toLowerCase()).toBe('svg');
    expect(slide).toHaveAttribute('viewBox', '0 0 960 540');
    expect(within(slide).getAllByText(/The Behavioral Truth in B2B Hiring/i).length).toBeGreaterThan(0);
    expect(within(slide).getByText(/Empirical Talent Validation based on Biometrics and Gamification/i)).toBeDefined();
    expect(slide.querySelector('image')).toBeTruthy();
  });

  it('switches the rebuilt deck between original English and Spanish copy', () => {
    render(<PitchDeckPage />);

    expect(screen.getAllByText(/The Behavioral Truth in B2B Hiring/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /español/i }));

    expect(screen.getAllByText(/La verdad conductual en contratación B2B/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Validación empírica de talento basada en biometría y gamificación/i)).toBeDefined();
    expect(screen.queryAllByText(/The Behavioral Truth in B2B Hiring/i)).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: /english/i }));

    expect(screen.getAllByText(/The Behavioral Truth in B2B Hiring/i).length).toBeGreaterThan(0);
  });

  it('keeps the original slide sequence reachable from native controls', () => {
    render(<PitchDeckPage />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getByText(/Hiring is Broken/i)).toBeDefined();
    expect(screen.getAllByText(/Subjective Bias/i).length).toBeGreaterThan(0);
  });
});
