import React, { useEffect, useState } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { buildEdgeLocalLiveInsight } from '../services/edgeLocalInferenceService';
import './LiveDemoTelemetryHud.css';

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = String(safeSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const MetricPill = ({ label, value, tone = 'neutral' }) => (
  <div className={`demo-hud-pill tone-${tone}`}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
); 

const LiveDemoTelemetryHud = ({ activeGameId = null, activeGameLabel = '' }) => {
  const { getCurrentTelemetry } = useTelemetry();
  const [snapshot, setSnapshot] = useState(null);

  useEffect(() => {
    const tick = () => {
      const current = getCurrentTelemetry();
      setSnapshot(buildEdgeLocalLiveInsight(current));
    };

    tick();
    const interval = setInterval(tick, 800);
    return () => clearInterval(interval);
  }, [getCurrentTelemetry, activeGameId]);

  if (!snapshot) {
    return null;
  }

  return (
    <aside className="demo-hud" aria-label="Live telemetry insights">
      <div className="demo-hud-topline">
        <span className="demo-hud-badge">Local only</span>
        <span className="demo-hud-elapsed">{formatClock(snapshot.elapsedSec)}</span>
      </div>

      <div className="demo-hud-title">{activeGameLabel || 'Demo activity'}</div>
      <div className="demo-hud-subtitle">Processing telemetry on-device</div>

      <div className="demo-hud-grid">
        <MetricPill label="Coverage" value={`${snapshot.coverageScore}%`} tone="blue" />
        <MetricPill label="Stability" value={`${snapshot.stabilityScore}%`} tone="green" />
        <MetricPill label="Fatigue" value={`${snapshot.fatigueScore}%`} tone="amber" />
        <MetricPill label="Readiness" value={`${snapshot.readinessScore}%`} tone="violet" />
      </div>

      <div className="demo-hud-minirow">
        <span>Moves {snapshot.cursorEvents}</span>
        <span>Clicks {snapshot.clickEvents}</span>
        <span>Trials {snapshot.trialEvents}</span>
        <span>Webcam {snapshot.webcamQuality}%</span>
      </div>

      {Array.isArray(snapshot.signals) && snapshot.signals.length > 0 && (
        <div className="demo-hud-signals">
          {snapshot.signals.slice(0, 2).map((signal) => (
            <span key={signal}>{signal}</span>
          ))}
        </div>
      )}
    </aside>
  );
};

export default LiveDemoTelemetryHud;
