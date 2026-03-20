import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const LiveTelemetryChart = () => {
  const location = useLocation();
  const { getCurrentTelemetry } = useTelemetry();
  const [data, setData] = useState([]);


  useEffect(() => {
    const intervalId = setInterval(() => {
      const telemetry = getCurrentTelemetry();
      if (!telemetry || !telemetry.startTime) return;

      const now = Date.now();
      const relativeTime = now - telemetry.startTime;

      // Calculate recent cursor velocity
      let velocity = 0;
      const moves = telemetry.mouseMovements;
      if (moves.length >= 2) {
        const p1 = moves[moves.length - 2];
        const p2 = moves[moves.length - 1];
        if (now - p2.timestamp < 500) { // Only calculate if cursor is actively moving
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dt = p2.timestamp - p1.timestamp;
          if (dt > 0) {
            velocity = Math.sqrt(dx * dx + dy * dy) / dt;
          }
        }
      }

      setData(prev => {
        const newData = [...prev, { time: relativeTime, velocity: velocity * 10, errors: telemetry.errors * 10 }];
        // Keep last 50 data points (~5 seconds window at 100ms interval)
        if (newData.length > 50) return newData.slice(newData.length - 50);
        return newData;
      });
    }, 100);

    return () => clearInterval(intervalId);
  }, [getCurrentTelemetry]);

  // Only show on Game 2 as requested (Must be placed AFTER all hooks to prevent React crash)
  if (location.pathname !== '/game/2') {
    return null;
  }

  return (
    <div style={{
      position: 'absolute',
      bottom: '20px',
      left: '20px',
      width: '300px',
      height: '150px',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '12px',
      padding: '12px',
      zIndex: 100,
      pointerEvents: 'none' // Don't block game clicks
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase' }}>Live Telemetry</span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <span style={{ fontSize: '0.65rem', color: '#10b981' }}>■ Velocity</span>
          <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>■ Stress/Error</span>
        </div>
      </div>
      <div style={{ width: '100%', height: 'calc(100% - 20px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis hide domain={[0, 100]} />
            <Line type="basis" dataKey="velocity" stroke="#10b981" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line type="stepAfter" dataKey="errors" stroke="#ef4444" strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LiveTelemetryChart;
