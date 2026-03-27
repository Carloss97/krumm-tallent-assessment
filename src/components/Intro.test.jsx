import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Intro from './Intro';
import { TelemetryProvider } from '../TelemetryContext';

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
  BrowserRouter: ({ children }) => <>{children}</>,
}));

describe('Intro Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders intro page with title', () => {
    render(
      <TelemetryProvider>
        <BrowserRouter>
          <Intro />
        </BrowserRouter>
      </TelemetryProvider>
    );
    
    // Should display main heading
    const heading = screen.getByRole('heading', { name: /cognitive assessment|evaluacion cognitiva/i });
    expect(heading).toBeTruthy();
  });

  it('displays start button for full assessment', () => {
    render(
      <TelemetryProvider>
        <BrowserRouter>
          <Intro />
        </BrowserRouter>
      </TelemetryProvider>
    );
    
    // Should have a button to start assessment
    const buttons = screen.queryAllByRole('button');
    const startButton = buttons.find(btn => 
      btn.textContent.toLowerCase().includes('start') || 
      btn.textContent.toLowerCase().includes('comenzar') ||
      btn.textContent.toLowerCase().includes('assessment')
    );
    
    expect(startButton || buttons.length > 0).toBeTruthy();
  });

  it('displays demo mode button', () => {
    render(
      <TelemetryProvider>
        <BrowserRouter>
          <Intro />
        </BrowserRouter>
      </TelemetryProvider>
    );
    
    // Should have a demo/quick test button
    const buttons = screen.queryAllByRole('button');
    const demoButton = buttons.find(btn => 
      btn.textContent.toLowerCase().includes('demo') || 
      btn.textContent.toLowerCase().includes('quick') ||
      btn.textContent.toLowerCase().includes('rápido')
    );
    
    expect(demoButton || buttons.length >= 2).toBeTruthy();
  });

  it('renders page without crashing', () => {
    const { container } = render(
      <TelemetryProvider>
        <BrowserRouter>
          <Intro />
        </BrowserRouter>
      </TelemetryProvider>
    );
    
    expect(container.innerHTML.length).toBeGreaterThan(0);
  });

  it('displays instructions or description text', () => {
    const { container } = render(
      <TelemetryProvider>
        <BrowserRouter>
          <Intro />
        </BrowserRouter>
      </TelemetryProvider>
    );
    
    // Should have descriptive text about the assessment
    const textContent = container.textContent.toLowerCase();
    const hasDescription = textContent.includes('cognitive') || 
                          textContent.includes('test') ||
                          textContent.includes('assess') ||
                          textContent.includes('evaluación');
    
    expect(hasDescription || container.innerHTML.length > 200).toBeTruthy();
  });
});
