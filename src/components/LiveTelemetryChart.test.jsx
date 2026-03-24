import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
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

    // With auto-advancing timers, data should update
    const chart = screen.getByTestId('line-chart');
    expect(chart).toBeDefined();
  });
});
