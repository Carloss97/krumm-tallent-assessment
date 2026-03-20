import { render, act, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { TelemetryProvider, useTelemetry } from '../TelemetryContext';
import LiveTelemetryChart from './LiveTelemetryChart';
import { MemoryRouter } from 'react-router-dom';

// Mock Recharts to avoid JSDOM issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  LineChart: ({ children, data }) => <div data-testid="line-chart" data-data-length={data.length}>{children}</div>,
  Line: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
}));

describe('LiveTelemetryChart', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders null when not on game 2 path', () => {
    const { container } = render(
      <TelemetryProvider>
        <MemoryRouter initialEntries={['/game/1']}>
          <LiveTelemetryChart />
        </MemoryRouter>
      </TelemetryProvider>
    );
    // The TelemetryProvider wraps everything in a div
    expect(container.querySelector('[style*="bottom: 20px"]')).toBeNull();
  });

  it('renders chart when on game 2 path', () => {
    render(
      <TelemetryProvider>
        <MemoryRouter initialEntries={['/game/2']}>
          <LiveTelemetryChart />
        </MemoryRouter>
      </TelemetryProvider>
    );
    expect(screen.getByText(/Live Telemetry/i)).toBeDefined();
  });

  it('updates data over time when tracking is active', () => {
    const StartTracking = () => {
        const { startTracking } = useTelemetry();
        React.useEffect(() => { startTracking(); }, [startTracking]);
        return null;
    };

    render(
      <TelemetryProvider>
        <MemoryRouter initialEntries={['/game/2']}>
          <StartTracking />
          <LiveTelemetryChart />
        </MemoryRouter>
      </TelemetryProvider>
    );

    act(() => {
      vi.advanceTimersByTime(500); // 5 intervals of 100ms
    });

    const chart = screen.getByTestId('line-chart');
    // It should have some data points now.
    expect(parseInt(chart.getAttribute('data-data-length'))).toBeGreaterThan(0);
  });
});
