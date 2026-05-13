import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import PitchDeckPage from './PitchDeckPage';

describe('PitchDeckPage', () => {
  it('embeds the deck HTML directly instead of navigating an iframe to the site', () => {
    render(<PitchDeckPage />);

    const frame = screen.getByTitle('KRUMM Pitch Deck');

    expect(frame).toHaveAttribute('srcdoc');
    expect(frame).not.toHaveAttribute('src');
    expect(frame.getAttribute('srcdoc')).toContain('pdf2htmlEX');
  });
});
