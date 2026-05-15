import React from 'react';
import fs from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PitchDeckPage from './PitchDeckPage';
import { PITCH_DECK_SLIDES } from './pitchDeckContent';

const TRANSLATION_EXCEPTIONS = new Set([
  'AI',
  'B2B',
  'CEO',
  'CPO',
  'CTO',
  'KRUMM',
  'LatAm',
  'Carlos Saldivia',
  'Gabriel Caro',
  'Cermaq',
  'Edge AI',
  'HR Tech',
  'SaaS',
  'TAM',
  'SAM',
  'SOM',
  '$32B',
  '$2.5B',
  '$100M',
  '10:1',
]);

const collectLocalizedStrings = (value, output = []) => {
  if (!value) return output;
  if (typeof value === 'string') return output;
  if (Array.isArray(value)) {
    value.forEach((item) => collectLocalizedStrings(item, output));
    return output;
  }
  if (typeof value === 'object') {
    if (typeof value.en === 'string' && typeof value.es === 'string') {
      output.push(value);
    }
    Object.values(value).forEach((child) => collectLocalizedStrings(child, output));
  }
  return output;
};

describe('PitchDeckPage', () => {
  it('renders a native full-viewport 16:9 deck without iframe/html import or SVG text distortion', () => {
    render(<PitchDeckPage />);

    expect(screen.queryByTitle('KRUMM Pitch Deck')).toBeNull();
    expect(screen.getByRole('main', { name: /krumm pitch deck/i })).toBeDefined();

    const slide = screen.getByTestId('native-pitch-deck-slide');
    expect(slide.tagName.toLowerCase()).toBe('svg');
    expect(slide).toHaveAttribute('viewBox', '0 0 960 540');
    expect(slide.querySelector('image')).toBeTruthy();
    expect(slide.querySelectorAll('foreignObject').length).toBeGreaterThan(0);
    expect(slide.querySelectorAll('text')).toHaveLength(0);
    expect(slide.querySelector('[textLength], [lengthAdjust]')).toBeNull();
  });

  it('switches to reviewed Spanish copy without horizontally squeezing translated text', () => {
    render(<PitchDeckPage />);

    expect(screen.getAllByText(/The Behavioral Truth in B2B Hiring/i).length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole('button', { name: /español/i }));

    const slide = screen.getByTestId('native-pitch-deck-slide');
    expect(screen.getAllByText(/La verdad conductual en la contratación B2B/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Validación empírica de talento basada en biometría y gamificación/i)).toBeDefined();
    expect(screen.queryByText(/The Behavioral Truth in B2B Hiring/i)).toBeNull();
    expect(slide.querySelector('[textLength], [lengthAdjust]')).toBeNull();
  });

  it('keeps the original slide sequence reachable from native controls with standardized block typography', () => {
    render(<PitchDeckPage />);

    fireEvent.click(screen.getByRole('button', { name: /^next$/i }));

    const slide = screen.getByTestId('native-pitch-deck-slide');
    expect(screen.getAllByText(/Hiring is Broken/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Subjective Bias/i)).toBeDefined();
    expect(screen.getByText(/The Human-to-Human Gap/i)).toBeDefined();
    expect(slide.querySelectorAll('.pitch-deck-block').length).toBeGreaterThanOrEqual(3);
  });

  it('keeps typography standardized in CSS instead of per-line PDF font-size extraction', () => {
    const css = fs.readFileSync('src/components/PitchDeckPage.css', 'utf8');

    expect(css).toContain('width: min(100dvw, calc(100dvh * 16 / 9));');
    expect(css).toContain('height: min(100dvh, calc(100dvw * 9 / 16));');
    expect(css).toContain('.pitch-deck-block--title');
    expect(css).toContain('.pitch-deck-block--body');
    expect(css).toContain('.pitch-deck-table');
    expect(css).toContain('font-size: var(--deck-font-title);');
    expect(css).not.toContain('max-width: 1280px');
    expect(css).not.toContain('overflow: auto;');
    expect(css).not.toContain('.pitch-deck-page__slide text');
  });

  it('has reviewed Spanish translations for all translatable deck strings', () => {
    const localizedStrings = PITCH_DECK_SLIDES.flatMap((slide) => collectLocalizedStrings(slide));
    const missingSpanish = localizedStrings.filter(({ es }) => !es || !es.trim());
    const untranslated = localizedStrings.filter(({ en, es }) => {
      if (TRANSLATION_EXCEPTIONS.has(en.trim())) return false;
      if (!/[A-Za-z]/.test(en)) return false;
      return en.trim().toLowerCase() === es.trim().toLowerCase();
    });

    expect(missingSpanish).toHaveLength(0);
    expect(untranslated).toHaveLength(0);
  });

  it('uses a structured slide model rather than extracted PDF text spans', () => {
    PITCH_DECK_SLIDES.forEach((slide) => {
      expect(slide.blocks.length).toBeGreaterThan(0);
      expect(slide.elements).toBeUndefined();
      slide.blocks.forEach((block) => {
        expect(block.variant).toMatch(/^(title|subtitle|body|card|metric|table|small|kicker)$/);
        expect(block.fontSize).toBeUndefined();
        expect(block.fontFamily).toBeUndefined();
      });
    });
  });
});
