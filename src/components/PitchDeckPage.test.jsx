import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, it, expect, vi } from 'vitest';
import PitchDeckPage from './PitchDeckPage';

describe('PitchDeckPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads deck HTML into srcdoc without bundling the raw deck into the JS chunk', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      text: vi.fn().mockResolvedValue('<!doctype html><html><body>pdf2htmlEX</body></html>'),
    });

    render(<PitchDeckPage />);

    const frame = screen.getByTitle('KRUMM Pitch Deck');

    expect(frame).toHaveAttribute('srcdoc');
    expect(frame).not.toHaveAttribute('src');

    await waitFor(() => {
      expect(frame.getAttribute('srcdoc')).toContain('pdf2htmlEX');
    });
  });
});
