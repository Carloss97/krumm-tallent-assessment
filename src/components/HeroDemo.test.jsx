import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroDemo from './HeroDemo';
import { TelemetryProvider } from '../TelemetryContext';

describe('HeroDemo', () => {
  it('renders and advances after quiz selection', async () => {
    render(
      <TelemetryProvider>
        <HeroDemo />
      </TelemetryProvider>
    );

    // Check header
    expect(screen.getByText(/Demostración interactiva|Interactive demo/i)).toBeInTheDocument();

    // Find a quiz option button and click it
    const optionButtons = await screen.findAllByRole('button');
    // There will be multiple buttons; find one that is not Next/Close
    const nextButton = screen.getByText(/Siguiente|Next/i);
    const quizOption = optionButtons.find(b => b !== nextButton && b.textContent && b.textContent.length > 1);
    if (quizOption) {
      fireEvent.click(quizOption);
    }

    // Click next
    fireEvent.click(nextButton);

    // Progress should show 2 / 3
    expect(await screen.findByText(/2 \/ 3/)).toBeInTheDocument();
  });
});
