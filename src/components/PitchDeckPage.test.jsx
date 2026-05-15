import React from 'react';
import fs from 'node:fs';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PitchDeckPage from './PitchDeckPage';

describe('PitchDeckPage', () => {
  it('renders the original pdf2htmlEX deck HTML directly for visual fidelity', () => {
    render(<PitchDeckPage />);

    expect(screen.getByRole('main', { name: /krumm pitch deck/i })).toBeDefined();
    expect(screen.queryByTestId('native-pitch-deck-slide')).toBeNull();

    const iframe = screen.getByTitle('KRUMM Pitch Deck');
    expect(iframe.tagName.toLowerCase()).toBe('iframe');
    expect(iframe).toHaveAttribute('srcdoc');
    expect(iframe.getAttribute('srcdoc')).toContain('Created by pdf2htmlEX');
    expect(iframe.getAttribute('srcdoc')).toContain('#pf1{display:block!important;}');
    expect(iframe.getAttribute('srcdoc')).toContain('<div id="pf1" class="pf');
  });

  it('uses working previous/next controls to select the displayed HTML page', () => {
    render(<PitchDeckPage />);

    const nextButton = screen.getByRole('button', { name: /^next$/i });
    const previousButton = screen.getByRole('button', { name: /^previous$/i });

    expect(screen.getByLabelText(/slide progress/i)).toHaveTextContent('1/10');
    expect(previousButton).toBeDisabled();

    fireEvent.click(nextButton);

    expect(screen.getByLabelText(/slide progress/i)).toHaveTextContent('2/10');
    expect(previousButton).not.toBeDisabled();
    expect(screen.getByTitle('KRUMM Pitch Deck').getAttribute('srcdoc')).toContain('#pf2{display:block!important;}');

    fireEvent.click(previousButton);

    expect(screen.getByLabelText(/slide progress/i)).toHaveTextContent('1/10');
    expect(screen.getByTitle('KRUMM Pitch Deck').getAttribute('srcdoc')).toContain('#pf1{display:block!important;}');
  });

  it('keeps fullscreen iframe sizing and button pointer-events stable', () => {
    const css = fs.readFileSync('src/components/PitchDeckPage.css', 'utf8');

    expect(css).toContain('.pitch-deck-page__deck-frame');
    expect(css).toContain('width: min(100dvw, calc(100dvh * 16 / 9));');
    expect(css).toContain('height: min(100dvh, calc(100dvw * 9 / 16));');
    expect(css).toContain('.pitch-deck-page__footer > button');
    expect(css).toContain('pointer-events: auto;');
    expect(css).not.toContain('max-width: 1280px');
    expect(css).not.toContain('foreignObject');
    expect(css).not.toContain('textLength');
  });
});
