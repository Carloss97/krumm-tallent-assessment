import React from 'react';
import fs from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PitchDeckPage from './PitchDeckPage';
import { PITCH_DECK_SLIDES } from './pitchDeckContent';

describe('PitchDeckPage', () => {
  it('rebuilds the original pitch deck as a native SVG/React slide instead of iframe/html import', () => {
    render(<PitchDeckPage />);

    expect(screen.queryByTitle('KRUMM Pitch Deck')).toBeNull();
    expect(screen.getByRole('main', { name: /krumm pitch deck/i })).toBeDefined();

    const slide = screen.getByTestId('native-pitch-deck-slide');
    expect(slide.tagName.toLowerCase()).toBe('svg');
    expect(slide).toHaveAttribute('viewBox', '0 0 960 540');
    const title = Array.from(slide.querySelectorAll('text')).find((node) => /The Behavioral Truth in B2B Hiring/i.test(node.textContent));
    expect(title).toHaveAttribute('font-size', '19.5');
    const subtitle = Array.from(slide.querySelectorAll('text')).find((node) => /Empirical Talent Validation based on Biometrics and Gamification/i.test(node.textContent));
    expect(subtitle).toHaveAttribute('font-size', '15');
    expect(slide.querySelector('image')).toBeTruthy();
  });

  it('switches the rebuilt deck between original English and Spanish copy', () => {
    render(<PitchDeckPage />);

    expect(screen.getAllByText(/The Behavioral Truth in B2B Hiring/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /español/i }));

    const spanishTitle = Array.from(screen.getByTestId('native-pitch-deck-slide').querySelectorAll('text')).find((node) => /La verdad conductual en contratación B2B/i.test(node.textContent));
    expect(spanishTitle).toHaveAttribute('textLength', '316.27');
    expect(spanishTitle).toHaveAttribute('lengthAdjust', 'spacingAndGlyphs');
    expect(screen.getByText(/Validación empírica de talento basada en biometría y gamificación/i)).toBeDefined();
    expect(screen.queryAllByText(/The Behavioral Truth in B2B Hiring/i)).toHaveLength(0);

    fireEvent.click(screen.getByRole('button', { name: /english/i }));

    expect(screen.getAllByText(/The Behavioral Truth in B2B Hiring/i).length).toBeGreaterThan(0);
  });

  it('keeps the original slide sequence reachable from native controls', () => {
    render(<PitchDeckPage />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));

    expect(screen.getAllByText(/Hiring is/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/^Broken$/i)).toBeDefined();
    expect(screen.getAllByText(/Subjective Bias/i).length).toBeGreaterThan(0);
  });

  it('uses PDF-native text metrics and full-viewport slide sizing instead of a capped small rectangle', () => {
    const css = fs.readFileSync('src/components/PitchDeckPage.css', 'utf8');
    const allFontSizes = PITCH_DECK_SLIDES.flatMap((slide) => slide.elements.map((element) => element.fontSize));

    expect(Math.min(...allFontSizes)).toBeGreaterThanOrEqual(5);
    expect(PITCH_DECK_SLIDES[0].elements[0].fontSize).toBeLessThan(24);
    expect(css).toContain('width: min(100dvw, calc(100dvh * 16 / 9));');
    expect(css).toContain('height: min(100dvh, calc(100dvw * 9 / 16));');
    expect(css).toContain('max-width: none;');
    expect(css).not.toContain('max-width: 1280px');
    expect(css).not.toContain('overflow: auto;');
  });
});
