import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import Report from './Report';
import { BrowserRouter } from 'react-router-dom';

const { mockUseTelemetry } = vi.hoisted(() => ({
  mockUseTelemetry: vi.fn(),
}));

vi.mock('./TelemetryContext', () => ({
  TelemetryProvider: ({ children }) => <div>{children}</div>,
  useTelemetry: mockUseTelemetry,
}));

vi.mock('./services/aiReportService', () => ({
  generateAIReport: vi.fn(() => Promise.resolve(null)),
  generateHeuristicReport: vi.fn(() => ({
    summary: 'Test heuristic summary for cognitive assessment',
    strengths: ['Strong cognitive flexibility', 'Good working memory'],
    areasToMonitor: ['Stress resilience under pressure', 'Risk assessment in high-stakes scenarios'],
    careerRecommendations: [
      { role: 'Project Manager', fit: 'Excellent organizational skills' },
      { role: 'Data Analyst', fit: 'Strong analytical thinking' }
    ],
    confidenceScore: 75,
    recommendation: 'HIGHLY RECOMMEND',
    source: 'heuristic',
    generatedAt: new Date().toISOString(),
  })),
}));

vi.mock('./services/backendService', () => ({
  saveSessionToBackend: vi.fn(() => Promise.resolve({ sessionId: 123 })),
}));

describe('Report Component', () => {
  beforeEach(() => {
    vi.useRealTimers();
    mockUseTelemetry.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders "No Assessment Data Found" when sessionData.game1 is missing', () => {
    mockUseTelemetry.mockReturnValue({ sessionData: {} });

    render(
      <BrowserRouter>
        <Report />
      </BrowserRouter>
    );
    expect(screen.getByText(/No Assessment Data Found/i)).toBeDefined();
  });

  it('renders analyzing state and then the report when game1 data exists', async () => {
    mockUseTelemetry.mockReturnValue({
      sessionData: {
        game1: { score: 10, errors: 2, duration: 30000 },
        game2: { score: 15, errors: 1, duration: 25000 },
        game3: { score: 3, errors: 0, duration: 20000 },
        game4: { score: 200, errors: 1, duration: 60000 },
        game5: { score: 2500, errors: 0, duration: 30000 },
        game6: { score: 400, errors: 1, duration: 45000 },
        game7: { score: 80, errors: 1, duration: 35000 }
      }
    });

    render(
      <BrowserRouter>
        <Report />
      </BrowserRouter>
    );

    // Should show analyzing first
    expect(screen.getByText(/Analyzing Telemetry Data/i)).toBeDefined();

    // Wait for the analyzing state to finish and report to appear
    await waitFor(() => {
      expect(screen.getByText(/Candidate Evaluation Matrix/i)).toBeDefined();
    }, { timeout: 4000 });

    expect(screen.getByText('Strong cognitive flexibility')).toBeDefined();
  }, 15000);

  it('calculates correct metrics based on session data', async () => {
    mockUseTelemetry.mockReturnValue({
      sessionData: {
        game1: { score: 12, errors: 1, duration: 30000 },
        game2: { score: 18, errors: 2, duration: 25000 },
        game3: { score: 4, errors: 0, duration: 20000 },
        game4: { score: 245, errors: 1, duration: 60000 },
        game5: { score: 2850, errors: 0, duration: 30000 },
        game6: { score: 420, errors: 2, duration: 45000 },
        game7: { score: 85, errors: 1, duration: 35000 }
      }
    });

    render(
      <BrowserRouter>
        <Report />
      </BrowserRouter>
    );

    // Wait for the report to load
    await waitFor(() => {
      expect(screen.getByText(/Candidate Evaluation Matrix/i)).toBeDefined();
    }, { timeout: 4000 });

    // Check for "HIGHLY RECOMMEND" since all metrics are high
    expect(screen.getByText('HIGHLY RECOMMEND')).toBeDefined();
    
    // Check specific content from the mock
    expect(screen.getByText('Strong cognitive flexibility')).toBeDefined();
    expect(screen.getByText('Project Manager')).toBeDefined();
  }, 15000);
});
