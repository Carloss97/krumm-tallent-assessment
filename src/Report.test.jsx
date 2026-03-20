import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { TelemetryProvider, useTelemetry } from './TelemetryContext';
import Report from './Report';
import { BrowserRouter } from 'react-router-dom';

describe('Report Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('renders "No Assessment Data Found" when sessionData.game1 is missing', () => {
    render(
      <TelemetryProvider>
        <BrowserRouter>
          <Report />
        </BrowserRouter>
      </TelemetryProvider>
    );
    expect(screen.getByText(/No Assessment Data Found/i)).toBeDefined();
  });

  it('renders analyzing state and then the report when game1 data exists', async () => {
    const SetSessionData = () => {
        const { stopTracking, startTracking } = useTelemetry();
        React.useEffect(() => {
            startTracking();
            stopTracking('game1', 10, 2);
        }, [startTracking, stopTracking]);
        return null;
    };

    render(
      <TelemetryProvider>
        <BrowserRouter>
          <SetSessionData />
          <Report />
        </BrowserRouter>
      </TelemetryProvider>
    );

    // Should show analyzing first
    expect(screen.getByText(/Analyzing Telemetry Data/i)).toBeDefined();

    // Fast-forward 3.5 seconds
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Now should show the report
    expect(screen.getByText(/Candidate Evaluation Matrix/i)).toBeDefined();
    expect(screen.getByText(/Cognitive Flexibility/i)).toBeDefined();
  });

  it('calculates correct metrics based on session data', () => {
    const SetFullSessionData = () => {
        const { stopTracking, startTracking } = useTelemetry();
        React.useEffect(() => {
            startTracking();
            stopTracking('game1', 12, 1); // High flexibility, Excellent stress
            stopTracking('game2', 0, 2);  // High Tolerance
            stopTracking('game3', 4, 0);  // Exceptional memory
            stopTracking('game4', 100, 0); // Risk Averse
            stopTracking('game5', 1000, 0); // avgRt 200 (1000/5), Sharp vigilance
            stopTracking('game6', 600, 2); // Efficient Planner, Sharp Selective
            stopTracking('game7', 95, 2); // Expert Spatial
        }, [startTracking, stopTracking]);
        return null;
    };

    render(
      <TelemetryProvider>
        <BrowserRouter>
          <SetFullSessionData />
          <Report />
        </BrowserRouter>
      </TelemetryProvider>
    );

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Check for "Highly Recommended" since all metrics are high
    expect(screen.getByText('Highly Recommended')).toBeDefined();
    
    // Check specific values
    expect(screen.getByText('High')).toBeDefined(); // Cognitive Flexibility
    expect(screen.getByText('High Tolerance')).toBeDefined(); // Frustration Tolerance
    expect(screen.getByText('Exceptional')).toBeDefined(); // Working Memory
  });
});
