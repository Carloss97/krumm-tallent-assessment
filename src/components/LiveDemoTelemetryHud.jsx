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
      subtitle: 'Señales locales observables; no es una conclusión psicológica',
      maximize: 'Maximizar',
      minimize: 'Minimizar',
      coverage: 'Cobertura',
      stability: 'Estabilidad',
      fatigue: 'Tiempo',
      readiness: 'Continuidad',
      face: 'Rostro',
      signal: 'Señal',
      blink: 'Parp/min',
      visual: 'Visual',
      windows: 'Ventanas',
      flags: 'Flags',
      percentHint: 'Cobertura = densidad de datos locales.\nEstabilidad = consistencia del movimiento.\nTiempo = deriva temporal, no diagnóstico.\nContinuidad = indicador operativo para seguir la tarea.\nRostro/Señal = calidad local agregada, no rasgo psicológico.',
      noConsent: 'Sin permisos de datos',
      active: 'Analizando...',
      tooltips: {
        coverage: 'Densidad de puntos de datos capturados por segundo.',
        stability: 'Consistencia del movimiento observada localmente.',
        fatigue: 'Deriva temporal operacional; no diagnostica fatiga clínica.',
        readiness: 'Señal operativa de continuidad basada en cobertura y estabilidad local.',
        face: 'Porcentaje promedio de presencia facial en ventanas agregadas.',
        signal: 'Calidad agregada de detección/iluminación; se degrada si la señal es mala.'
      }
    },
    en: {
      badge: 'Live report',
      subtitle: 'Observable local signals; not a psychological conclusion',
      maximize: 'Maximize',
      minimize: 'Minimize',
      coverage: 'Coverage',
      stability: 'Stability',
      fatigue: 'Time',
      readiness: 'Continuity',
      face: 'Face',
      signal: 'Signal',
      blink: 'Blink/min',
      visual: 'Visual',
      windows: 'Windows',
      flags: 'Flags',
      percentHint: 'Coverage = local data density.\nStability = movement consistency.\nTime = temporal drift, not diagnosis.\nContinuity = operational signal for continuing the task.\nFace/Signal = aggregate local quality, not a psychological trait.',
      noConsent: 'No data consent',
      active: 'Analyzing...',
      tooltips: {
        coverage: 'Density of data points captured per second.',
        stability: 'Movement consistency observed locally.',
        fatigue: 'Operational time drift; not a clinical fatigue diagnosis.',
        readiness: 'Operational continuity signal based on local coverage and stability.',
        face: 'Average face presence ratio across aggregate facial windows.',
        signal: 'Aggregate detection/lighting quality; degraded when signal is poor.'
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

  const hasData = snapshot.cursorEvents > 0 || snapshot.webcamFrames > 0 || snapshot.facialWindowCount > 0;

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
          <MetricPill label={c.signal} value={`${snapshot.webcamQuality}%`} tone="green" tooltip={c.tooltips.signal} />
          <MetricPill label={c.face} value={`${snapshot.facePresencePercent || 0}%`} tone="amber" tooltip={c.tooltips.face} />
          <MetricPill label={c.readiness} value={`${snapshot.readinessScore}%`} tone="violet" tooltip={c.tooltips.readiness} />
        </div>
      )}

      <div className="demo-hud-minirow">
        <div className="mini-stat"><span>Moves</span> <strong>{snapshot.cursorEvents}</strong></div>
        <div className="mini-stat"><span>Clicks</span> <strong>{snapshot.clickEvents}</strong></div>
        <div className="mini-stat"><span>Trials</span> <strong>{snapshot.trialEvents}</strong></div>
        <div className="mini-stat"><span>{c.windows}</span> <strong>{snapshot.facialWindowCount || 0}</strong></div>
        <div className="mini-stat"><span>{c.blink}</span> <strong>{snapshot.blinkRatePerMin || 0}</strong></div>
        <div className="mini-stat"><span>{c.visual}</span> <strong>{snapshot.visualStabilityScore || 0}%</strong></div>
      </div>

      <div className="demo-hud-explainer">
        {c.percentHint}
      </div>

      <div style={{ marginTop: '14px', fontSize: '0.6rem', color: '#64748b', fontStyle: 'italic', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
        {language === 'es' 
          ? '* Señales audit-only procesadas localmente. No infieren personalidad, salud mental ni decisión de contratación.' 
          : '* Audit-only signals processed locally. They do not infer personality, mental health, or hiring decisions.'}
      </div>

      {Array.isArray(snapshot.signals) && snapshot.signals.length > 0 && (
        <div className="demo-hud-signals">
          {snapshot.signals.slice(0, 2).map((signal) => (
            <span key={typeof signal === 'string' ? signal : JSON.stringify(signal)}>
              {typeof signal === 'string' ? signal : (signal?.label || signal?.title || 'signal')}
            </span>
          ))}
        </div>
      )}
    </aside>
  );
};

export default LiveDemoTelemetryHud;
