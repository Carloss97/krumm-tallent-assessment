import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React, { useEffect } from 'react';
import { TelemetryProvider, useTelemetry } from './TelemetryContext';

// Helper component to test the context
const TestComponent = ({ action }) => {
  const telemetry = useTelemetry();
  
  useEffect(() => {
    if (action) {
      action(telemetry);
    }
  }, [action, telemetry]);

  return (
    <div data-testid="telemetry-display">
      Score: {telemetry.getCurrentTelemetry().score}
      Errors: {telemetry.getCurrentTelemetry().errors}
    </div>
  );
};

describe('TelemetryContext', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts tracking and resets data', () => {
    let telemetryInstance;
    render(
      <TelemetryProvider>
        <TestComponent action={(t) => { telemetryInstance = t; }} />
      </TelemetryProvider>
    );

    act(() => {
      telemetryInstance.startTracking();
    });

    const data = telemetryInstance.getCurrentTelemetry();
    expect(data.score).toBe(0);
    expect(data.errors).toBe(0);
    expect(data.mouseMovements).toHaveLength(0);
  });

  it('records errors when tracking is active', () => {
    let telemetryInstance;
    render(
      <TelemetryProvider>
        <TestComponent action={(t) => { telemetryInstance = t; }} />
      </TelemetryProvider>
    );

    act(() => {
      telemetryInstance.startTracking();
      telemetryInstance.recordError();
    });

    expect(telemetryInstance.getCurrentTelemetry().errors).toBe(1);
  });

  it('stops tracking and saves session data', () => {
    let telemetryInstance;
    render(
      <TelemetryProvider>
        <TestComponent action={(t) => { telemetryInstance = t; }} />
      </TelemetryProvider>
    );

    act(() => {
      telemetryInstance.startTracking();
      vi.advanceTimersByTime(1000);
      telemetryInstance.stopTracking('game1', 100, 5);
    });

    expect(telemetryInstance.sessionData.game1).toBeDefined();
    expect(telemetryInstance.sessionData.game1.score).toBe(100);
    expect(telemetryInstance.sessionData.game1.errors).toBe(5);
    expect(telemetryInstance.sessionData.game1.duration).toBeGreaterThanOrEqual(1000);
  });

  it('stops tracking and uses current errors if finalErrors is null', () => {
    let telemetryInstance;
    render(
      <TelemetryProvider>
        <TestComponent action={(t) => { telemetryInstance = t; }} />
      </TelemetryProvider>
    );

    act(() => {
      telemetryInstance.startTracking();
      telemetryInstance.recordError();
      telemetryInstance.stopTracking('game1', 100, null);
    });

    expect(telemetryInstance.sessionData.game1.errors).toBe(1);
  });

  it('records mouse movements when active', () => {
    render(
      <TelemetryProvider>
        <div data-testid="capture-area" style={{ width: '100px', height: '100px' }}>
            Test Area
        </div>
      </TelemetryProvider>
    );

    // We need to access telemetry to start tracking
    // For simplicity in this test, we'll use a wrapper that starts it
    const StartWrapper = ({ children }) => {
        const { startTracking } = useTelemetry();
        useEffect(() => { startTracking(); }, [startTracking]);
        return children;
    };

    let telemetryInstance;
    render(
      <TelemetryProvider>
        <StartWrapper>
            <TestComponent action={(t) => { telemetryInstance = t; }} />
        </StartWrapper>
      </TelemetryProvider>
    );

    const display = screen.getByTestId('telemetry-display');
    
    act(() => {
        fireEvent.mouseMove(display, { clientX: 10, clientY: 20 });
    });

    expect(telemetryInstance.getCurrentTelemetry().mouseMovements).toHaveLength(1);
    expect(telemetryInstance.getCurrentTelemetry().mouseMovements[0]).toMatchObject({ x: 10, y: 20 });
  });

  it('throttles mouse movement recording', () => {
    const StartWrapper = ({ children }) => {
        const { startTracking } = useTelemetry();
        useEffect(() => { startTracking(); }, [startTracking]);
        return children;
    };

    let telemetryInstance;
    render(
      <TelemetryProvider>
        <StartWrapper>
            <TestComponent action={(t) => { telemetryInstance = t; }} />
        </StartWrapper>
      </TelemetryProvider>
    );

    const display = screen.getByTestId('telemetry-display');
    
    act(() => {
        fireEvent.mouseMove(display, { clientX: 10, clientY: 20 });
        vi.advanceTimersByTime(20);
        fireEvent.mouseMove(display, { clientX: 15, clientY: 25 });
        vi.advanceTimersByTime(40); // Total 60ms since first
        fireEvent.mouseMove(display, { clientX: 20, clientY: 30 });
    });

    // Should have 2: first one, and the one after 60ms. The 20ms one should be throttled.
    expect(telemetryInstance.getCurrentTelemetry().mouseMovements).toHaveLength(2);
  });

  it('records clicks when active', () => {
    const StartWrapper = ({ children }) => {
        const { startTracking } = useTelemetry();
        useEffect(() => { startTracking(); }, [startTracking]);
        return children;
    };

    let telemetryInstance;
    render(
      <TelemetryProvider>
        <StartWrapper>
            <TestComponent action={(t) => { telemetryInstance = t; }} />
        </StartWrapper>
      </TelemetryProvider>
    );

    const display = screen.getByTestId('telemetry-display');
    
    act(() => {
        fireEvent.click(display, { clientX: 50, clientY: 60 });
    });

    expect(telemetryInstance.getCurrentTelemetry().clicks).toHaveLength(1);
    expect(telemetryInstance.getCurrentTelemetry().clicks[0]).toMatchObject({ x: 50, y: 60 });
  });

  it('does not record telemetry when tracking is inactive', () => {
    let telemetryInstance;
    render(
      <TelemetryProvider>
        <TestComponent action={(t) => { telemetryInstance = t; }} />
      </TelemetryProvider>
    );

    const display = screen.getByTestId('telemetry-display');
    
    act(() => {
        telemetryInstance.recordError();
        fireEvent.mouseMove(display, { clientX: 10, clientY: 20 });
        fireEvent.click(display, { clientX: 50, clientY: 60 });
    });

    const data = telemetryInstance.getCurrentTelemetry();
    expect(data.errors).toBe(0);
    expect(data.mouseMovements).toHaveLength(0);
    expect(data.clicks).toHaveLength(0);
  });
});
