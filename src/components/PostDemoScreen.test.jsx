import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PostDemoScreen from './PostDemoScreen';

vi.mock('../Report', () => ({
  default: () => <div data-testid="real-report">REAL REPORT COMPONENT</div>,
}));

vi.mock('../context/LanguageContext', () => ({
  useLanguage: () => ({ language: 'es' }),
}));

const demoSummary = {
  reason: 'completed',
  timeUsedSec: 182,
  totalActivities: 3,
  completedCount: 3,
  selectedIds: ['balloon', 'grid', 'laser'],
  completedIds: ['balloon', 'grid', 'laser'],
  telemetry: {
    captureCoverage: 92,
  },
  activities: [],
};

describe('PostDemoScreen', () => {
  it('shows a blurred dummy report teaser instead of opening the real report', () => {
    render(<PostDemoScreen summary={demoSummary} onRestart={vi.fn()} />);

    expect(screen.getByText(/reporte demo bloqueado/i)).toBeInTheDocument();
    expect(screen.getByText(/contactarnos/i)).toBeInTheDocument();
    expect(screen.getAllByText(/datos referenciales/i).length).toBeGreaterThan(0);

    const realReportButton = screen.queryByRole('button', { name: /continuar al reporte|ver reporte/i });
    if (realReportButton) {
      fireEvent.click(realReportButton);
    }

    expect(screen.queryByTestId('real-report')).not.toBeInTheDocument();
  });
});
