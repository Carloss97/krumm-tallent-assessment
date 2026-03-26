import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, beforeEach, vi } from 'vitest';
import { TelemetryProvider } from '../TelemetryContext';
import {
  MetacognitiveCalibrationGame,
  OperationalPrioritizationGame,
  LearningAgilityGame,
  SocialCoordinationGame,
  CognitiveResilienceGame,
  RiskUnderUncertaintyGame,
} from './ComplementaryGames';

const navigateMock = vi.fn();

vi.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}));

const wrap = (node) => render(<TelemetryProvider>{node}</TelemetryProvider>);

describe('Complementary battery games', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('MetacognitiveCalibrationGame flows to next route', () => {
    wrap(<MetacognitiveCalibrationGame />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes' }));
    expect(navigateMock).toHaveBeenCalledWith('/game/9');
  });

  it('OperationalPrioritizationGame flows to next route', () => {
    wrap(<OperationalPrioritizationGame />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    fireEvent.click(screen.getByRole('button', { name: 'High' }));
    expect(navigateMock).toHaveBeenCalledWith('/game/10');
  });

  it('LearningAgilityGame flows to next route', () => {
    wrap(<LearningAgilityGame />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Correct adaptation' }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/game/11');
  });

  it('SocialCoordinationGame flows to next route', () => {
    wrap(<SocialCoordinationGame />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Align stakeholders' }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/game/12');
  });

  it('CognitiveResilienceGame flows to next route', () => {
    wrap(<CognitiveResilienceGame />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Maintain performance' }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/game/13');
  });

  it('RiskUnderUncertaintyGame ends at report', () => {
    wrap(<RiskUnderUncertaintyGame />);
    fireEvent.click(screen.getByRole('button', { name: /start/i }));
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Balanced hedge' }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/report');
  });
});
