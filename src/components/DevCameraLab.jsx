import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { WebcamCapture } from '../utils/webcamCapture';
import {
  assertFacialWindowPrivacySafe,
  createFacialWindow,
} from '../telemetry/facial/facialTelemetrySchema';
import {
  clearDevAccessSession,
  createDevAccessSession,
  getDevAccessSession,
  isDevAccessAllowedHost,
  isDevAccessConfigured,
  isDevLabEnabled,
  looksLikeSha256Hex,
  setDevAccessSession,
  verifyDevAccessPassword,
} from '../utils/devAccess';

const shellStyle = {
  minHeight: '100vh',
  width: '100%',
  overflowY: 'auto',
  padding: '28px',
  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 44%, #0f766e 100%)',
  color: '#e2e8f0',
};

const panelStyle = {
  maxWidth: '1180px',
  margin: '0 auto',
  background: 'rgba(15, 23, 42, 0.82)',
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

const inputStyle = {
  width: '100%',
  borderRadius: '12px',
  border: '1px solid rgba(148, 163, 184, 0.45)',
  padding: '12px 14px',
  background: 'rgba(15, 23, 42, 0.9)',
  color: '#f8fafc',
};

const buttonStyle = {
  border: 0,
  borderRadius: '999px',
  padding: '11px 18px',
  background: 'linear-gradient(135deg, #14b8a6, #2563eb)',
  color: '#fff',
  fontWeight: 700,
  cursor: 'pointer',
};

const secondaryButtonStyle = {
  ...buttonStyle,
  background: 'rgba(148, 163, 184, 0.18)',
  border: '1px solid rgba(148, 163, 184, 0.28)',
};

const linkStyle = {
  color: '#67e8f9',
  textDecoration: 'none',
  fontWeight: 700,
};

const CAMERA_PROFILES = {
  light: {
    label: 'Liviano — 3 FPS, 320×240',
    description: 'Recomendado para laptops o sesiones con lag. Suficiente para validar presencia, parpadeos y pose gruesa.',
    sampleFps: 3,
    windowMs: 5000,
    videoWidth: 320,
    videoHeight: 240,
    videoFrameRateMax: 3,
  },
  balanced: {
    label: 'Balanceado — 6 FPS, 640×480',
    description: 'Más muestras por ventana, pero puede sentirse más pesado en máquinas lentas.',
    sampleFps: 6,
    windowMs: 5000,
    videoWidth: 640,
    videoHeight: 480,
    videoFrameRateMax: 6,
  },
  high: {
    label: 'Alta carga — 8 FPS, 640×480',
    description: 'Sólo para validar estrés de rendimiento; no es necesario para QA normal.',
    sampleFps: 8,
    windowMs: 5000,
    videoWidth: 640,
    videoHeight: 480,
    videoFrameRateMax: 8,
  },
};

const getBrowserFacts = () => {
  if (typeof window === 'undefined') {
    return { host: 'server', secureContext: false, mediaDevices: false };
  }

  return {
    host: window.location.hostname,
    secureContext: window.isSecureContext === true,
    mediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
  };
};

function LoginPanel({ onAuthenticated }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const valid = await verifyDevAccessPassword(password);
      if (!valid) {
        if (looksLikeSha256Hex(password)) {
          setError('Parece que pegaste el SHA-256. Aquí debes ingresar la clave original que usaste en printf, no el hash. El hash sólo va en VITE_DEV_LAB_PASSWORD_SHA256.');
          return;
        }

        setError('Clave privada incorrecta. Ingresa la clave original usada para generar VITE_DEV_LAB_PASSWORD_SHA256. Si acabas de cambiar .env.local, reinicia npm run dev.');
        return;
      }

      const session = createDevAccessSession();
      setDevAccessSession(session, window.localStorage);
      setPassword('');
      onAuthenticated(session);
    } catch (err) {
      setError(err?.message || 'No se pudo validar la clave privada.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={shellStyle}>
      <section style={{ ...panelStyle, maxWidth: '620px' }}>
        <p style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          dev.krumm.cl
        </p>
        <h1 style={{ marginTop: 0 }}>Login de development</h1>
        <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
          Este acceso desbloquea herramientas privadas para probar características de development en navegador,
          incluyendo cámara y telemetría facial local. La clave no se guarda; sólo se conserva una sesión local temporal.
        </p>
        <p style={{ color: '#bae6fd', lineHeight: 1.6, marginTop: '12px' }}>
          En este campo escribe la clave original. Ejemplo: si configuraste el hash con
          {' '}<code>printf 'mi-clave' | sha256sum</code>, aquí debes escribir <code>mi-clave</code>,
          no el SHA-256 resultante.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '14px', marginTop: '24px' }}>
          <label htmlFor="dev-private-password" style={{ fontWeight: 700 }}>Clave privada</label>
          <input
            id="dev-private-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            style={inputStyle}
            placeholder="Ingresa la clave original, no el hash SHA-256"
          />
          {error && <div role="alert" style={{ color: '#fecaca' }}>{error}</div>}
          <button type="submit" style={buttonStyle} disabled={isSubmitting || !password}>
            {isSubmitting ? 'Validando...' : 'Entrar'}
          </button>
        </form>
      </section>
    </div>
  );
}

function DisabledPanel({ reason }) {
  return (
    <div style={shellStyle}>
      <section style={{ ...panelStyle, maxWidth: '720px' }}>
        <h1>Development lab no disponible en este host</h1>
        <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>{reason}</p>
        <p style={{ color: '#94a3b8', lineHeight: 1.6 }}>
          Por defecto sólo se permite en localhost, 127.0.0.1 y dev.krumm.cl. Configura
          VITE_ENABLE_DEV_LAB, VITE_DEV_LAB_ALLOWED_HOSTS y VITE_DEV_LAB_PASSWORD_SHA256 para habilitarlo.
        </p>
      </section>
    </div>
  );
}

function DevCameraLab() {
  const [session, setSession] = useState(() => getDevAccessSession(window.localStorage));
  const [status, setStatus] = useState('idle');
  const [statusMessage, setStatusMessage] = useState('Listo para pedir permiso de cámara.');
  const [captureProfile, setCaptureProfile] = useState('light');
  const [facialWindows, setFacialWindows] = useState([]);
  const [telemetryReport, setTelemetryReport] = useState(null);
  const videoRef = useRef(null);
  const captureRef = useRef(null);
  const browserFacts = useMemo(() => getBrowserFacts(), []);
  const selectedCaptureProfile = CAMERA_PROFILES[captureProfile] || CAMERA_PROFILES.light;

  const enabled = isDevLabEnabled();
  const allowedHost = isDevAccessAllowedHost(browserFacts.host);
  const configured = isDevAccessConfigured();

  const stopCamera = useCallback(() => {
    captureRef.current?.cleanup?.();
    captureRef.current = null;
    setStatus((previous) => (previous === 'capturing' ? 'stopped' : previous));
    setStatusMessage('Captura detenida. Tracks de cámara liberados.');
  }, []);

  useEffect(() => () => {
    captureRef.current?.cleanup?.();
    captureRef.current = null;
  }, []);

  const handleFacialWindow = useCallback((windowPayload) => {
    try {
      assertFacialWindowPrivacySafe(windowPayload);
      setFacialWindows((previous) => [windowPayload, ...previous].slice(0, 8));
      setStatusMessage(`Ventana agregada recibida: calidad ${windowPayload.quality?.signalQualityScore ?? 0}/100, cobertura ${Math.round((windowPayload.quality?.facePresenceRatio ?? 0) * 100)}%.`);
    } catch (error) {
      setStatus('privacy_error');
      setStatusMessage(`Ventana descartada por privacidad: ${error?.message || error}`);
    }
  }, []);

  const startCamera = async () => {
    if (!videoRef.current) return;

    stopCamera();
    setStatus('starting');
    setStatusMessage('Solicitando permiso de cámara e inicializando FaceLandmarker local...');

    const capture = new WebcamCapture(handleFacialWindow, {
      gameId: 'dev_camera_lab',
      sessionId: `dev-camera-${Date.now()}`,
      sampleFps: selectedCaptureProfile.sampleFps,
      windowMs: selectedCaptureProfile.windowMs,
      videoWidth: selectedCaptureProfile.videoWidth,
      videoHeight: selectedCaptureProfile.videoHeight,
      videoFrameRateMax: selectedCaptureProfile.videoFrameRateMax,
      logger: console,
    });

    captureRef.current = capture;
    const initialized = await capture.initialize(videoRef.current);

    if (!initialized) {
      setStatus('unavailable');
      setTelemetryReport(capture.getTelemetryReport?.() || null);
      setStatusMessage('No se pudo abrir la cámara o el navegador no entregó permisos. Revisa HTTPS, permisos del sitio y disponibilidad del dispositivo.');
      return;
    }

    capture.startCapture();
    setStatus('capturing');
    setTelemetryReport(capture.getTelemetryReport?.() || null);
    setStatusMessage('Capturando localmente. Espera 5 segundos para ver la primera ventana agregada.');
  };

  const refreshReport = () => {
    setTelemetryReport(captureRef.current?.getTelemetryReport?.() || null);
  };

  const injectSyntheticWindow = () => {
    const now = Date.now();
    handleFacialWindow(createFacialWindow({
      gameId: 'dev_camera_lab',
      sessionId: `dev-synthetic-${now}`,
      windowIndex: facialWindows.length,
      startedAtMs: now - 5000,
      endedAtMs: now,
      durationMs: 5000,
      sampleCount: 6,
      quality: {
        facePresenceRatio: 0.92,
        meanDetectionConfidence: 0.86,
        meanIlluminationScore: 0.78,
        signalQualityScore: 84,
        flags: [],
      },
      facialSignals: {
        blinkRatePerMin: 14,
        visualStabilityScore: 81,
        offScreenOrFaceAwayRatio: 0.04,
      },
      confidence: {
        windowConfidence: 0.82,
        interpretationAllowed: true,
        reasonIfLowConfidence: null,
      },
    }));
  };

  const logout = () => {
    stopCamera();
    clearDevAccessSession(window.localStorage);
    setSession(null);
  };

  if (!enabled) {
    return <DisabledPanel reason="La build actual no tiene habilitado VITE_ENABLE_DEV_LAB=true." />;
  }

  if (!allowedHost) {
    return <DisabledPanel reason={`Host actual: ${browserFacts.host || 'desconocido'}.`} />;
  }

  if (!configured) {
    return <DisabledPanel reason="Falta configurar VITE_DEV_LAB_PASSWORD_SHA256 con el hash SHA-256 de tu clave privada." />;
  }

  if (!session) {
    return <LoginPanel onAuthenticated={setSession} />;
  }

  const latestWindow = facialWindows[0] || null;

  return (
    <div style={shellStyle}>
      <section style={panelStyle}>
        <header style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', marginBottom: '22px' }}>
          <div>
            <p style={{ color: '#67e8f9', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', margin: 0 }}>
              dev.krumm.cl privado
            </p>
            <h1 style={{ margin: '8px 0 6px' }}>Development Browser Lab</h1>
            <p style={{ color: '#cbd5e1', margin: 0, lineHeight: 1.6 }}>
              Panel para probar en navegador las características de development: cámara, permisos,
              MediaPipe local, ventanas agregadas de telemetría y accesos rápidos a módulos experimentales.
            </p>
          </div>
          <button type="button" style={secondaryButtonStyle} onClick={logout}>Cerrar sesión</button>
        </header>

        {!browserFacts.secureContext && (
          <div role="alert" style={{ ...cardStyle, borderColor: '#f59e0b', color: '#fde68a', marginBottom: '18px' }}>
            La cámara sólo funciona en HTTPS o localhost. Abre este panel desde https://dev.krumm.cl/dev/camera.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1.1fr) minmax(280px, 0.9fr)', gap: '18px' }}>
          <div style={cardStyle}>
            <h2 style={{ marginTop: 0 }}>Prueba de cámara local</h2>
            <p style={{ color: '#cbd5e1', lineHeight: 1.6 }}>
              El video se usa sólo dentro del navegador. No se envían frames, imágenes, canvas,
              blobs, base64 ni landmarks. El callback sólo recibe ventanas agregadas `facial_window_v1`.
            </p>

            <label htmlFor="camera-profile" style={{ display: 'grid', gap: '8px', color: '#e2e8f0', fontWeight: 700, marginBottom: '14px' }}>
              Perfil de rendimiento
              <select
                id="camera-profile"
                value={captureProfile}
                onChange={(event) => setCaptureProfile(event.target.value)}
                disabled={status === 'capturing' || status === 'starting'}
                style={inputStyle}
              >
                {Object.entries(CAMERA_PROFILES).map(([key, profile]) => (
                  <option key={key} value={key}>{profile.label}</option>
                ))}
              </select>
              <span style={{ color: '#93c5fd', fontWeight: 500, lineHeight: 1.5 }}>
                {selectedCaptureProfile.description}
              </span>
            </label>

            <video
              ref={videoRef}
              data-testid="dev-camera-preview"
              playsInline
              muted
              autoPlay
              style={{
                width: '100%',
                minHeight: '280px',
                background: '#020617',
                borderRadius: '18px',
                objectFit: 'cover',
                border: '1px solid rgba(148, 163, 184, 0.28)',
              }}
            />

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '14px' }}>
              <button type="button" style={buttonStyle} onClick={startCamera} disabled={status === 'starting'}>
                {status === 'starting' ? 'Iniciando...' : 'Iniciar prueba de cámara'}
              </button>
              <button type="button" style={secondaryButtonStyle} onClick={stopCamera}>Detener cámara</button>
              <button type="button" style={secondaryButtonStyle} onClick={refreshReport}>Actualizar diagnóstico</button>
              <button type="button" style={secondaryButtonStyle} onClick={injectSyntheticWindow}>Simular ventana segura</button>
            </div>

            <div style={{ marginTop: '14px', color: '#cbd5e1' }}>
              <strong>Estado:</strong> {status} · {statusMessage}
            </div>
          </div>

          <aside style={{ display: 'grid', gap: '18px' }}>
            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Entorno</h2>
              <ul style={{ color: '#cbd5e1', lineHeight: 1.8, paddingLeft: '20px' }}>
                <li>Host: <strong>{browserFacts.host}</strong></li>
                <li>Contexto seguro: <strong>{browserFacts.secureContext ? 'sí' : 'no'}</strong></li>
                <li>getUserMedia: <strong>{browserFacts.mediaDevices ? 'disponible' : 'no disponible'}</strong></li>
                <li>Ventanas recibidas: <strong>{facialWindows.length}</strong></li>
              </ul>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Qué se está midiendo</h2>
              <ul style={{ color: '#cbd5e1', lineHeight: 1.7, paddingLeft: '20px', marginBottom: 0 }}>
                <li><strong>Presencia de rostro:</strong> porcentaje de muestras donde se detecta una cara.</li>
                <li><strong>Parpadeos:</strong> estimación agregada por minuto desde blendshapes de ojos.</li>
                <li><strong>Pose de cabeza:</strong> yaw/pitch/roll son giro horizontal, inclinación vertical y rotación; <strong>yaw no significa bostezo</strong>.</li>
                <li><strong>Estabilidad visual:</strong> variación de la pose y ratio fuera de pantalla/cara desviada.</li>
                <li><strong>Calidad/confianza:</strong> baja con poca luz, baja cobertura, muchas caras o pocas muestras.</li>
              </ul>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Accesos development</h2>
              <div style={{ display: 'grid', gap: '10px' }}>
                <Link style={linkStyle} to="/demo">Abrir demo pública</Link>
                <Link style={linkStyle} to="/future/lab">Future Assessment Lab</Link>
                <Link style={linkStyle} to="/pitch">Pitch deck embebido</Link>
                <Link style={linkStyle} to="/report">Reporte local</Link>
              </div>
            </div>

            <div style={cardStyle}>
              <h2 style={{ marginTop: 0 }}>Diagnóstico local</h2>
              <pre style={{ whiteSpace: 'pre-wrap', color: '#bae6fd', margin: 0, fontSize: '12px' }}>
                {telemetryReport ? JSON.stringify(telemetryReport, null, 2) : 'Sin diagnóstico todavía.'}
              </pre>
            </div>
          </aside>
        </div>

        <div style={{ ...cardStyle, marginTop: '18px' }}>
          <h2 style={{ marginTop: 0 }}>Última ventana agregada segura</h2>
          <pre style={{ whiteSpace: 'pre-wrap', color: '#d9f99d', margin: 0, fontSize: '12px', maxHeight: '360px', overflowY: 'auto' }}>
            {latestWindow ? JSON.stringify(latestWindow, null, 2) : 'Aún no hay ventanas. Inicia la cámara o usa la simulación segura.'}
          </pre>
        </div>
      </section>
    </div>
  );
}

export default DevCameraLab;
