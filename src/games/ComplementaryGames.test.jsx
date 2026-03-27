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
  const clickStart = () => {
    fireEvent.click(screen.getByRole('button', { name: /start|comenzar/i }));
  };

  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('MetacognitiveCalibrationGame flows to next route', () => {
    wrap(<MetacognitiveCalibrationGame />);
    clickStart();
    fireEvent.click(screen.getByRole('button', { name: /yes|si/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes|si/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes|si/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes|si/i }));
    expect(navigateMock).toHaveBeenCalledWith('/game/9');
  });

  it('OperationalPrioritizationGame flows to next route', () => {
    wrap(<OperationalPrioritizationGame />);
    clickStart();
    fireEvent.click(screen.getByRole('button', { name: /high|alta/i }));
    fireEvent.click(screen.getByRole('button', { name: /high|alta/i }));
    fireEvent.click(screen.getByRole('button', { name: /high|alta/i }));
    fireEvent.click(screen.getByRole('button', { name: /high|alta/i }));
    expect(navigateMock).toHaveBeenCalledWith('/game/10');
  });

  it('LearningAgilityGame flows to next route', () => {
    wrap(<LearningAgilityGame />);
    clickStart();
    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /correct adaptation|adaptacion correcta/i }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/game/11');
  });

  it('SocialCoordinationGame flows to next route', () => {
    wrap(<SocialCoordinationGame />);
    clickStart();
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /align stakeholders|alinear stakeholders/i }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/game/12');
  });

  it('CognitiveResilienceGame flows to next route', () => {
    wrap(<CognitiveResilienceGame />);
    clickStart();
    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /maintain performance|mantener desempeno/i }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/game/13');
  });

  it('RiskUnderUncertaintyGame ends at report', () => {
    wrap(<RiskUnderUncertaintyGame />);
    clickStart();
    for (let i = 0; i < 4; i += 1) {
      fireEvent.click(screen.getByRole('button', { name: /balanced hedge|cobertura balanceada/i }));
    }
    expect(navigateMock).toHaveBeenCalledWith('/report');
  });
});
