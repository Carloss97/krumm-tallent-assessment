import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import PitchDeckPage from './PitchDeckPage';

describe('PitchDeckPage', () => {
  it('renders a native editable React deck instead of an imported iframe/html document', () => {
    render(<PitchDeckPage />);

    expect(screen.queryByTitle('KRUMM Pitch Deck')).toBeNull();
    expect(screen.getByRole('main', { name: /krumm pitch deck/i })).toBeDefined();
    expect(screen.getByRole('heading', { name: /inteligencia de talento browser-local/i })).toBeDefined();
    expect(screen.getByText(/Modelo local, privacidad por diseño y evidencia auditable/i)).toBeDefined();
  });

  it('switches the whole pitch deck between Spanish and English copy', () => {
    render(<PitchDeckPage />);

    expect(screen.getByRole('heading', { name: /inteligencia de talento browser-local/i })).toBeDefined();

    fireEvent.click(screen.getByRole('button', { name: /english/i }));

    expect(screen.getByRole('heading', { name: /browser-local talent intelligence/i })).toBeDefined();
    expect(screen.getByText(/Local model, privacy by design and auditable evidence/i)).toBeDefined();
    expect(screen.queryByText(/Inteligencia de talento browser-local/i)).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /español/i }));

    expect(screen.getByRole('heading', { name: /inteligencia de talento browser-local/i })).toBeDefined();
  });
});
