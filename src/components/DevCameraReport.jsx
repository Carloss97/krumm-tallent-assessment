import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  clearDevCameraReportSnapshot,
  readDevCameraReportSnapshot,
} from '../utils/devCameraReport';
import {
  getDevAccessSession,
  isDevAccessAllowedHost,
  isDevAccessConfigured,
  isDevLabEnabled,
} from '../utils/devAccess';

const shellStyle = {
  minHeight: '100vh',
  width: '100%',
  overflowY: 'auto',
  padding: '28px',
  background: 'linear-gradient(135deg, #082f49 0%, #0f172a 48%, #134e4a 100%)',
  color: '#e2e8f0',
};

const panelStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  background: 'rgba(15, 23, 42, 0.84)',
  border: '1px solid rgba(148, 163, 184, 0.25)',
  borderRadius: '24px',
  padding: '28px',
  boxShadow: '0 24px 80px rgba(0, 0, 0, 0.35)',
};

const cardStyle = {
  background: 'rgba(15, 23, 42, 0.72)',
  border: '1px solid rgba(148, 163, 184, 0.24)',
  borderRadius: '18px',
  padding: '18px',
};

const buttonStyle = {
  border: 0,
  borderRadius: '999px',
  padding: '11px 18px',
  background: 'linear-gradient(135deg, #14b8a6, #2563eb)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'rgba(148, 163, 184, 0.18)',
  border: '1px solid rgba(148, 163, 184, 0.28)',
};

const mutedText = {
  color: '#cbd5e1',
  lineHeight: 1.65,
};

const getBrowserHost = () => {
  if (typeof window === 'undefined') return 'server';
  return window.location.hostname || '';
};

function MetricCard({ label, value, helper }) {
  return (
    <div style={cardStyle}>
      <div style={{ color: '#93c5fd', fontSize: '0.78rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{ color: '#f8fafc', fontSize: '2rem', fontWeight: 900, marginTop: '8px' }}>
        {value}
      </div>
      {helper && <p style={{ ...mutedText, marginBottom: 0, fontSize: '0.92rem' }}>{helper}</p>}
    </div>
  );
}

function DisabledPanel({ title = 'Reporte dev no disponible', reason }) {
  return (
    <div style={shellStyle}>
      <section style={{ ...panelStyle, maxWidth: '760px' }}>
        <h1 style={{ marginTop: 0 }}>{title}</h1>
        <p style={mutedText}>{reason}</p>
        <Link style={buttonStyle} to="/dev/camera">Volver al laboratorio de cámara</Link>
      </section>
    </div>
  );
}

function DevCameraReport() {
  const host = useMemo(() => getBrowserHost(), []);
  const [snapshot, setSnapshot] = useState(() => readDevCameraReportSnapshot(window.localStorage));
  const enabled = isDevLabEnabled();
  const allowedHost = isDevAccessAllowedHost(host);
  const configured = isDevAccessConfigured();
  const session = getDevAccessSession(window.localStorage);

  if (!enabled) {
    return <DisabledPanel reason="La build actual no tiene habilitado VITE_ENABLE_DEV_LAB=true." />;
  }

  if (!allowedHost) {
    return <DisabledPanel reason={`Host actual: ${host || 'desconocido'}.`} />;
  }

  if (!configured) {
    return <DisabledPanel reason="Falta configurar VITE_DEV_LAB_PASSWORD_SHA256 para proteger las rutas dev." />;
  }

  if (!session) {
    return <DisabledPanel title="Sesión dev requerida" reason="Entra primero al laboratorio privado de cámara para crear una sesión local temporal." />;
  }

  if (!snapshot) {
    return (
      <div style={shellStyle}>
        <section style={{ ...panelStyle, maxWidth: '820px' }}>
          <p style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
            diagnóstico development
          </p>
          <h1 style={{ marginTop: '8px' }}>No hay diagnóstico de cámara guardado</h1>
          <p style={mutedText}>
            Este reporte no usa los datos del reporte final `/report`. Primero abre `/dev/camera`, inicia la cámara o simula una ventana segura, y luego vuelve aquí.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link style={buttonStyle} to="/dev/camera">Abrir laboratorio de cámara</Link>
            <Link style={secondaryButtonStyle} to="/report">Ver reporte final de evaluación</Link>
          </div>
        </section>
      </div>
    );
  }

  const audit = snapshot.audit || {};
  const flags = Array.isArray(audit.qualityFlags) ? audit.qualityFlags : [];
  const latestWindow = Array.isArray(snapshot.facialWindows) ? snapshot.facialWindows[0] : null;
  const profile = snapshot.captureProfile;

  const clearSnapshot = () => {
    clearDevCameraReportSnapshot(window.localStorage);
    setSnapshot(null);
  };

  return (
    <div style={shellStyle}>
      <section style={panelStyle}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '22px', flexWrap: 'wrap' }}>
          <div>
            <p style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              reporte diagnóstico de cámara
            </p>
            <h1 style={{ margin: '8px 0 6px' }}>Validación browser-local</h1>
            <p style={{ ...mutedText, margin: 0 }}>
              Este reporte valida captura local, MediaPipe, ventanas agregadas y guardas de privacidad. No reemplaza el reporte final de evaluación extendida.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link style={secondaryButtonStyle} to="/dev/camera">Volver a /dev/camera</Link>
            <button type="button" style={secondaryButtonStyle} onClick={clearSnapshot}>Borrar diagnóstico</button>
          </div>
        </header>

        <div style={{ ...cardStyle, borderColor: audit.qualityGatePassed ? 'rgba(20, 184, 166, 0.45)' : 'rgba(245, 158, 11, 0.5)', marginBottom: '18px' }}>
          <strong style={{ color: audit.qualityGatePassed ? '#5eead4' : '#fde68a' }}>
            {audit.qualityGatePassed ? 'Quality gate de cámara aprobado' : 'Quality gate de cámara requiere revisión'}
          </strong>
          <p style={{ ...mutedText, marginBottom: 0 }}>
            Guardado: {snapshot.generatedAt || 'N/A'}
            {profile?.label ? ` · Perfil: ${profile.label}` : ''}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '14px', marginBottom: '18px' }}>
          <MetricCard label="Ventanas" value={audit.facialWindowCount ?? 0} helper="Cantidad de ventanas agregadas facial_window_v1." />
          <MetricCard label="Calidad visual" value={`${audit.signalQualityScore ?? 0}%`} helper="Promedio de calidad de señal facial." />
          <MetricCard label="Cobertura facial" value={`${audit.facialCoverageScore ?? 0}%`} helper="Presencia de rostro en muestras agregadas." />
          <MetricCard label="Confianza" value={`${audit.meanWindowConfidenceScore ?? 0}%`} helper="Confianza media de interpretación por ventana." />
          <MetricCard label="Muestras" value={audit.sampleCount ?? 0} helper={`${audit.sampleFps || 'N/A'} FPS · ventana ${audit.windowMs || 'N/A'} ms`} />
          <MetricCard label="Frames cámara" value={`${audit.faceDetectedFrames ?? 0}/${audit.totalFrames ?? 0}`} helper="Frames diagnósticos con rostro detectado." />
          <MetricCard label="Parpadeos" value={`${audit.blinkRatePerMin ?? 0}/min`} helper="Estimación agregada; no es diagnóstico clínico." />
          <MetricCard label="Estabilidad" value={`${audit.visualStabilityScore ?? 0}%`} helper={`${audit.offScreenOrFaceAwayPercent ?? 0}% fuera de pantalla/cara desviada.`} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 0.9fr) minmax(320px, 1.1fr)', gap: '18px' }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Interpretación permitida</h2>
            <p style={mutedText}>
              Sólo se permite interpretar calidad/cobertura de señal observable. Estas métricas no deben usarse como conclusión psicológica, clínica ni decisión automática de contratación.
            </p>
            <ul style={{ color: '#cbd5e1', lineHeight: 1.8, paddingLeft: '20px' }}>
              <li>Video crudo almacenado: <strong>no</strong></li>
              <li>Frames/canvas/base64 almacenados: <strong>no</strong></li>
              <li>Landmarks faciales persistidos: <strong>no</strong></li>
              <li>Audio capturado: <strong>no</strong></li>
            </ul>
            {flags.length > 0 ? (
              <div style={{ marginTop: '14px', padding: '14px', borderRadius: '14px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.35)', color: '#fde68a' }}>
                <strong>Flags de calidad</strong>
                <ul style={{ margin: '8px 0 0', paddingLeft: '20px' }}>
                  {flags.map((flag) => <li key={flag}>{flag}</li>)}
                </ul>
              </div>
            ) : (
              <p style={{ color: '#86efac', fontWeight: 700 }}>Sin flags de calidad en la última captura.</p>
            )}
          </div>

          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Última ventana agregada segura</h2>
            <pre style={{ whiteSpace: 'pre-wrap', color: '#d9f99d', margin: 0, fontSize: '12px', maxHeight: '460px', overflowY: 'auto' }}>
              {latestWindow ? JSON.stringify(latestWindow, null, 2) : 'No hay ventanas faciales guardadas en este snapshot.'}
            </pre>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: '18px' }}>
          <h2 style={{ marginTop: 0 }}>Próximo paso</h2>
          <p style={mutedText}>
            Con cámara validada, el siguiente hito es integrar estas ventanas agregadas en los módulos reales de evaluación y en el reporte final como auditoría de señal/confianza, sin convertir la cámara en scoring psicológico independiente.
          </p>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link style={buttonStyle} to="/intro">Ir al flujo de evaluación</Link>
            <Link style={secondaryButtonStyle} to="/report">Abrir reporte final</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default DevCameraReport;
