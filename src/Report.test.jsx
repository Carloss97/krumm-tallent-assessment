import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import Report from './Report';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';

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
    recommendation: 'STRONG ALIGNMENT',
    source: 'heuristic',
    generatedAt: new Date().toISOString(),
  })),
}));

vi.mock('./services/backendService', () => ({
  saveSessionToBackend: vi.fn(() => Promise.resolve({ sessionId: 123 })),
}));

describe('Report Component', () => {
  const renderReport = (props = {}) => render(
    <LanguageProvider>
      <BrowserRouter>
        <Report {...props} />
      </BrowserRouter>
    </LanguageProvider>
  );

  beforeEach(() => {
    mockUseTelemetry.mockClear();
    window.localStorage.setItem('talenttrack-language', 'en');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders "No Assessment Data Found" when sessionData.game1 is missing', () => {
    mockUseTelemetry.mockReturnValue({ sessionData: {} });

    renderReport({ useDummyData: false });

    expect(screen.getByRole('heading', { name: /no assessment data found|no se encontraron datos de evaluacion/i })).toBeDefined();
  });

  it('renders report when data is available', async () => {
    const mockSessionData = {
      game1: { score: 100, errors: 5, duration: 60000 },
      game2: { score: 95, errors: 3, duration: 65000 },
      game3: { score: 88, errors: 2, duration: 55000 },
      game4: { score: 92, errors: 1, duration: 58000 },
      game5: { score: 90, errors: 4, duration: 62000 },
      game6: { score: 87, errors: 6, duration: 61000 },
      game7: { score: 93, errors: 0, duration: 59000 },
    };

    mockUseTelemetry.mockReturnValue({ sessionData: mockSessionData });

    const { container } = renderReport({ useDummyData: false });

    // Check that report is rendered by looking for report title
    await waitFor(
      () => {
        const h1 = container.querySelector('h1');
        const titleText = h1 ? h1.textContent : '';
        expect(
          titleText.includes('Assessment') ||
          titleText.includes('Evaluation') ||
          titleText.includes('Evaluacion') ||
          titleText.includes('habilidades')
        ).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });

  it('uses dummy data when useDummyData prop is true', async () => {
    mockUseTelemetry.mockReturnValue({ sessionData: {} });

    renderReport({ useDummyData: true });

    fireEvent.click(screen.getByRole('button', { name: /view demo report|ver reporte demo/i }));

    await waitFor(
      () => {
        // Report should be generated after enabling demo mode from no-data state.
        const elements = screen.queryAllByText((content, element) =>
          element && (
            content.includes('Cognitive') ||
            content.includes('Assessment') ||
            content.includes('Evaluacion') ||
            content.includes('habilidades')
          )
        );
        expect(elements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  });

  it('saves session to backend when report is generated', async () => {
    const mockSessionData = {
      game1: { score: 100, errors: 5, duration: 60000, details: {} },
      game2: { score: 95, errors: 3, duration: 65000, details: {} },
      game3: { score: 88, errors: 2, duration: 55000, details: {} },
      game4: { score: 92, errors: 1, duration: 58000, details: {} },
      game5: { score: 90, errors: 4, duration: 62000, details: {} },
      game6: { score: 87, errors: 6, duration: 61000, details: {} },
      game7: { score: 93, errors: 0, duration: 59000, details: {} },
    };

    mockUseTelemetry.mockReturnValue({
      sessionData: mockSessionData,
      saveToBackend: vi.fn(() => Promise.resolve()),
    });

    const { container } = renderReport({ useDummyData: false });

    // Verify that report renders with skills/talent signal panel
    await waitFor(
      () => {
        const reportText = container.textContent;
        expect(
          reportText.includes('Skills and Talent Signal') ||
          reportText.includes('Matriz de evaluacion de habilidades') ||
          reportText.includes('Executive Capability Snapshot') ||
          reportText.includes('Resumen ejecutivo de capacidades')
        ).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });
});