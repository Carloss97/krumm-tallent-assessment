import React, { useEffect, useState } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { buildEdgeLocalLiveInsight } from '../services/edgeLocalInferenceService';
import { useLanguage } from '../context/LanguageContext';
import './LiveDemoTelemetryHud.css';

const formatClock = (seconds) => {
  const safeSeconds = Math.max(0, Math.floor(seconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = String(safeSeconds % 60).padStart(2, '0');
  return `${mins}:${secs}`;
};

const MetricPill = ({ label, value, tone = 'neutral', tooltip = '' }) => (
  <div className={`demo-hud-pill tone-${tone}`} title={tooltip}>
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
); 

const LiveDemoTelemetryHud = ({ activeGameId = null, activeGameLabel = '' }) => {
  const { language } = useLanguage();
  const { getCurrentTelemetry, consentState } = useTelemetry();
  const [snapshot, setSnapshot] = useState(null);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const copy = {
    es: {
      badge: 'Informe en vivo',
      subtitle: 'Análisis de comportamiento en tiempo real',
      maximize: 'Maximizar',
      minimize: 'Minimizar',
      coverage: 'Cobertura',
      stability: 'Estabilidad',
      fatigue: 'Fatiga',
      readiness: 'Aptitud',
      noConsent: 'Sin permisos de datos',
      active: 'Analizando...',
      tooltips: {
        coverage: 'Densidad de puntos de datos capturados por segundo.',
        stability: 'Calidad y precisión del movimiento detectado.',
        fatigue: 'Indicadores de fatiga cognitiva y visual.',
        readiness: 'Nivel de aptitud para la tarea basado en el perfil.'
      }
    },
    en: {
      badge: 'Live report',
      subtitle: 'Real-time behavioral analysis',
      maximize: 'Maximize',
      minimize: 'Minimize',
      coverage: 'Coverage',
      stability: 'Stability',
      fatigue: 'Fatigue',
      readiness: 'Readiness',
      noConsent: 'No data consent',
      active: 'Analyzing...',
      tooltips: {
        coverage: 'Density of data points captured per second.',
        stability: 'Quality and precision of detected motion.',
        fatigue: 'Indicators of cognitive and visual fatigue.',
        readiness: 'Task readiness level based on profile.'
      }
    }
  };
  const c = copy[language] || copy.es;

  useEffect(() => {
    const tick = () => {
      const current = getCurrentTelemetry();
      // Ensure we are getting the latest data from the ref
      const insight = buildEdgeLocalLiveInsight(current);
      if (insight) {
        setSnapshot(insight);
      }
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [getCurrentTelemetry, activeGameId]);

  if (!snapshot) {
    return null;
  }

  if (isMinimized) {
    return (
      <aside 
        className="demo-hud minimized" 
        onClick={() => setIsMinimized(false)} 
        style={{ cursor: 'pointer', pointerEvents: 'auto', zIndex: 1000 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="status-indicator-dot pulse-green"></div>
          <span className="demo-hud-badge" style={{ fontSize: '0.65rem' }}>{c.badge}</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'white' }}>{snapshot.readinessScore}% {c.readiness.toUpperCase()}</span>
        </div>
      </aside>
    );
  }

  const hasData = snapshot.cursorEvents > 0 || snapshot.webcamFrames > 0;

  return (
    <aside className="demo-hud" aria-label="Live telemetry insights" style={{ pointerEvents: 'auto', zIndex: 1000 }}>
      <div className="demo-hud-topline">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className={`status-indicator-dot ${hasData ? 'pulse-green' : 'gray'}`}></div>
          <span className="demo-hud-badge">{c.badge}</span>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span className="demo-hud-elapsed">{formatClock(snapshot.elapsedSec)}</span>
          <button 
            onClick={(e) => { e.stopPropagation(); setIsMinimized(true); }}
            className="hud-toggle-btn"
            title={c.minimize}
          >
            —
          </button>
        </div>
      </div>

      <div className="demo-hud-title">{activeGameLabel || 'Demo activity'}</div>
      <div className="demo-hud-subtitle">{c.subtitle}</div>

      {!consentState.cursor && !consentState.webcam ? (
        <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '12px', border: '1px solid rgba(239, 68, 68, 0.2)', color: '#ef4444', fontSize: '0.7rem', textAlign: 'center', fontWeight: 700 }}>
          {c.noConsent}
        </div>
      ) : (
        <div className="demo-hud-grid">
          <MetricPill label={c.coverage} value={`${snapshot.coverageScore}%`} tone="blue" tooltip={c.tooltips.coverage} />
          <MetricPill label={c.stability} value={`${snapshot.stabilityScore}%`} tone="green" tooltip={c.tooltips.stability} />
          <MetricPill label={c.fatigue} value={`${snapshot.fatigueScore}%`} tone="amber" tooltip={c.tooltips.fatigue} />
          <MetricPill label={c.readiness} value={`${snapshot.readinessScore}%`} tone="violet" tooltip={c.tooltips.readiness} />
        </div>
      )}

      <div className="demo-hud-minirow">
        <div className="mini-stat"><span>Moves</span> <strong>{snapshot.cursorEvents}</strong></div>
        <div className="mini-stat"><span>Clicks</span> <strong>{snapshot.clickEvents}</strong></div>
        <div className="mini-stat"><span>Trials</span> <strong>{snapshot.trialEvents}</strong></div>
        <div className="mini-stat"><span>Frames</span> <strong>{snapshot.webcamFrames}</strong></div>
        <div className="mini-stat"><span>Signal</span> <strong>{snapshot.webcamQuality}%</strong></div>
      </div>

      <div style={{ marginTop: '14px', fontSize: '0.6rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
        {language === 'es' 
          ? '* Los porcentajes indican densidad de datos y estabilidad conductual detectada localmente.' 
          : '* Percentages indicate data density and behavioral stability detected locally.'}
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
