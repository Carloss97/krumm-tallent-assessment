import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { normalizeVideoInputDevices } from '../telemetry/cameraDevices.js';
import { buildGestureInsights } from '../telemetry/gestureInsights.js';
import { computeInsightsFromAUs } from '../telemetry/insightMetrics.js';
import { computeEnhancedAUs, resetAUCache } from '../telemetry/auEnhancer.js';
import { setAUBaseline } from '../telemetry/auProcessor.js';
import { estimateGaze, resetGazeEstimator, calibrateGazeCenter } from '../telemetry/gazeEstimator.js';
import { useFaceLandmarkerWorker } from '../telemetry/useFaceLandmarkerWorker.js';
import { estimateUpperBodyPosture, resetUpperBodyPostureState, calibrateUpperBodyPostureUpright } from '../telemetry/upperBodyPosture.js';
import { useMoveNet } from '../telemetry/useMoveNet.js';
import { buildCalibrationProfile } from '../telemetry/microgestureFeatures.js';
import { requestCameraWithFallback, stopStream } from '../telemetry/adaptiveCapture.js';
import { adaptiveCalibrationSamples, estimateLightingQuality, canCalibrate } from '../telemetry/lightingAdapter.js';
import { runEdgeAIInference } from '../telemetry/edgeAiEngine.js';
import { createEmotionTemporalSmoother } from '../telemetry/emotionTemporalSmoother.js';
import Dashboard from './Dashboard.jsx';
import { getRecommendedConfig } from '../telemetry/deviceCapabilities.js';
import { sanitizeFaceSampleForAggregation } from '../telemetry/samplePrivacy.js';
import { useLanguage } from '../i18n/LanguageContext.jsx';

const DEVICE_CONFIG = getRecommendedConfig();
const MIN_SAMPLES_FOR_REPORT = 20;

function clamp(v, min = 0, max = 1) { return Math.min(max, Math.max(min, Number.isFinite(v) ? v : min)); }
function formatPercent(v) { return `${Math.round(clamp(v) * 100)}%`; }
function hasEnoughSamples(t) { return (t?.sampleCount ?? 0) >= MIN_SAMPLES_FOR_REPORT; }
function appendBounded(list, item, max = 900) { return [...list, item].slice(-max); }

export default function CameraDemo() {
  const { t } = useLanguage();
  
  const videoRef = useRef(null);
  const faceSamplesRef = useRef([]);
  const gazeSamplesRef = useRef([]);
  const postureSamplesRef = useRef([]);
  const upperBodySamplesRef = useRef([]);
  const edgeAIResultRef = useRef(null);
  const sessionStartRef = useRef(0);
  const calibrationTimerRef = useRef(null);
  const streamRef = useRef(null);
  const emotionSmootherRef = useRef(createEmotionTemporalSmoother());
  const lastMoveNetMetricsKeyRef = useRef('');

  const [isCameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [cameraDevices, setCameraDevices] = useState([]);
  const [showMesh, setShowMesh] = useState(true);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProfile, setCalibrationProfile] = useState(null);
  const [latestFaceSample, setLatestFaceSample] = useState(null);
  const [latestLandmarks, setLatestLandmarks] = useState(null);
  const [latestGaze, setLatestGaze] = useState(null);
  const [latestPose, setLatestPose] = useState(null);
  const [moveNetPose, setMoveNetPose] = useState(null);
  const [lastQuality, setLastQuality] = useState({});
  const [, setBlendshapeNames] = useState([]);
  const [manualCalStatus, setManualCalStatus] = useState(null);

  const recordFaceSample = useCallback((sample, landmarks) => {
    if (!sample?.blendshapes) return;
    const safeSample = sanitizeFaceSampleForAggregation(sample);
    faceSamplesRef.current = [...faceSamplesRef.current, safeSample];
    setLatestFaceSample(safeSample);
    setLatestLandmarks(landmarks ?? null);
    if (landmarks) {
      try {
        const gaze = estimateGaze(landmarks);
        setLatestGaze(gaze);
        gazeSamplesRef.current = appendBounded(gazeSamplesRef.current, { ...gaze, timestamp: safeSample.timestamp });
        const posture = estimateUpperBodyPosture(landmarks);
        setLatestPose(posture);
        postureSamplesRef.current = appendBounded(postureSamplesRef.current, { ...posture, timestamp: safeSample.timestamp });
      } catch { /* optional */ }
    }
    setLastQuality(safeSample.quality ?? {});
    if (safeSample.blendshapes) setBlendshapeNames(Object.keys(safeSample.blendshapes).sort());
  }, []);

  const faceWorker = useFaceLandmarkerWorker({
    videoRef, active: isCameraActive, onSample: recordFaceSample,
    fps: DEVICE_CONFIG?.fpsTarget ?? 15,
    preferredDelegate: DEVICE_CONFIG?.mediapipeDelegate ?? 'GPU',
  });

  const moveNetSample = useCallback((sample) => {
    if (sample?.metrics) {
      const metrics = sample.metrics;
      const metricsKey = [
        metrics.confidence,
        metrics.symmetry,
        metrics.shoulderAngle,
        metrics.upperBodyCoverage,
        metrics.armActivity,
        metrics.armsVisible,
      ].map((value) => Number(value ?? 0).toFixed(3)).join('|');
      if (metricsKey !== lastMoveNetMetricsKeyRef.current) {
        lastMoveNetMetricsKeyRef.current = metricsKey;
        setMoveNetPose(metrics);
      }
      upperBodySamplesRef.current = appendBounded(upperBodySamplesRef.current, {
        timestamp: sample.timestamp ?? performance.now(),
        confidence: metrics.confidence,
        armActivity: metrics.armActivity,
        upperBodyCoverage: metrics.upperBodyCoverage,
      });
    }
  }, []);

  const moveNet = useMoveNet({
    videoRef, active: isCameraActive, fps: 8, onSample: moveNetSample,
  });

  const refreshCameraDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) { setCameraDevices([]); return []; }
    const all = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = all.filter((d) => d.kind === 'videoinput');
    const normalized = normalizeVideoInputDevices(videoDevices);
    setCameraDevices(normalized);
    if (!selectedDeviceId && normalized.length > 0) setSelectedDeviceId(normalized[0].deviceId);
    return normalized;
  }, [selectedDeviceId]);

  // Refresh camera devices on mount
  useEffect(() => {
    refreshCameraDevices();
  }, [refreshCameraDevices]);

  const attachCameraStream = useCallback(async (stream) => {
    if (streamRef.current) stopStream(streamRef.current);
    streamRef.current = stream;
    if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error('getUserMedia no disponible.');
      const { stream } = await requestCameraWithFallback(selectedDeviceId, 'medium');
      await attachCameraStream(stream);
      await refreshCameraDevices().catch(() => []);
      faceSamplesRef.current = [];
      gazeSamplesRef.current = [];
      postureSamplesRef.current = [];
      upperBodySamplesRef.current = [];
      lastMoveNetMetricsKeyRef.current = '';
      resetAUCache();
      resetGazeEstimator();
      resetUpperBodyPostureState();
      emotionSmootherRef.current.reset();
      sessionStartRef.current = performance.now();
      setCalibrationProfile(null);
      setIsCalibrating(false);
      setLatestFaceSample(null);
      setLatestLandmarks(null);
      setBlendshapeNames([]);
      setCameraActive(true);
    } catch (err) { setCameraError(err?.message ?? String(err)); setCameraActive(false); }
  }, [selectedDeviceId, attachCameraStream, refreshCameraDevices]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) { stopStream(streamRef.current); streamRef.current = null; }
    setCameraActive(false);
    setLatestFaceSample(null);
    setLatestLandmarks(null);
    setMoveNetPose(null);
    lastMoveNetMetricsKeyRef.current = '';
  }, []);

  const handleCalibrateGazeCenter = useCallback(() => {
    const result = calibrateGazeCenter(latestLandmarks);
    setManualCalStatus(result.ok ? 'Mirada calibrada al centro' : 'No hay iris/rostro suficiente para calibrar mirada');
  }, [latestLandmarks]);

  const handleCalibratePostureUpright = useCallback(() => {
    const result = calibrateUpperBodyPostureUpright(latestLandmarks);
    setManualCalStatus(result.ok ? 'Postura erguida calibrada' : 'No hay rostro suficiente para calibrar postura');
  }, [latestLandmarks]);

  const switchCamera = useCallback(async (deviceId) => {
    setSelectedDeviceId(deviceId);
    if (!isCameraActive) return;
    try {
      const { stream } = await requestCameraWithFallback(deviceId, 'medium');
      await attachCameraStream(stream);
      await refreshCameraDevices().catch(() => []);
    } catch (err) { setCameraError(err?.message ?? String(err)); }
  }, [isCameraActive, attachCameraStream, refreshCameraDevices]);

  const startCalibration = useCallback(() => {
    setIsCalibrating(true);
    setCalibrationProfile(null);
    const light = estimateLightingQuality(faceSamplesRef.current);
    const adapt = adaptiveCalibrationSamples(light);
    const duration = adapt.durationMs;
    calibrationTimerRef.current = setTimeout(() => {
      const samples = faceSamplesRef.current;
      const check = canCalibrate(samples, { minSamples: adapt.minSamples, minPresenceRatio: 0.2, minConfidence: 0.3 });
      if (!check.eligible) {
        setCalibrationProfile({ eligible: false, caveats: [check.reason], usableSampleCount: samples.length });
        setIsCalibrating(false);
        return;
      }
      const actualSamples = samples.filter((s) => s?.quality?.facePresent);
      const firstTs = actualSamples[0]?.timestamp ?? samples[0]?.timestamp ?? performance.now();
      const lastTs = samples[samples.length - 1]?.timestamp ?? firstTs + duration;
      const profile = buildCalibrationProfile(samples, { from: firstTs, to: lastTs });
      setCalibrationProfile(profile);
      if (profile.eligible) { setAUBaseline(computeEnhancedAUs(samples)); }
      setIsCalibrating(false);
    }, duration);
  }, []);

  const cancelCalibration = useCallback(() => {
    if (calibrationTimerRef.current) { clearTimeout(calibrationTimerRef.current); calibrationTimerRef.current = null; }
    setIsCalibrating(false);
  }, []);

  useEffect(() => () => { if (calibrationTimerRef.current) clearTimeout(calibrationTimerRef.current); }, []);

  // Telemetry computation
  const telemetry = useMemo(() => {
    const allSamples = faceSamplesRef.current;
    const recentSamples = allSamples.slice(-60);
    const recentCount = recentSamples.length;
    const presentSamples = recentSamples.filter((s) => s?.quality?.facePresent);
    const facePresenceRatio = recentCount ? presentSamples.length / recentCount : 0;
    const confidences = presentSamples.map((s) => s?.quality?.confidence ?? 0);
    const meanConfidence = confidences.length ? confidences.reduce((s, v) => s + v, 0) / confidences.length : 0;
    const fpsEstimate = allSamples.length ? allSamples.length / Math.max(1, (performance.now() - (sessionStartRef.current || performance.now())) / 1000) : 0;
    const insights = buildGestureInsights(recentSamples);
    if (recentSamples.length > 0 && insights.auScores) {
      const auMetrics = computeInsightsFromAUs(insights.auScores, facePresenceRatio, {
        gaze: latestGaze,
        posture: latestPose,
        upperBody: moveNetPose,
        task: null,
      });
      Object.assign(insights, auMetrics);
    }
    if (recentSamples.length > 0) {
      const enhanced = computeEnhancedAUs(recentSamples);
      insights.enhancedAUs = enhanced;
    }
    return { sampleCount: allSamples.length, recentCount, facePresenceRatio, meanConfidence, fpsEstimate, insights };
  }, [latestFaceSample, latestGaze, latestPose, moveNetPose]);

  const edgeAIResult = useMemo(() => {
    const samples = faceSamplesRef.current;
    if (!samples.length || samples.length < 2) return null;
    try {
      const result = runEdgeAIInference({
        faceSamples: samples,
        pointerSamples: [],
        taskEvents: [],
        calibrationProfile,
        runtime: { delegate: faceWorker.delegate ?? 'CPU' },
        latestGaze,
        latestPosture: latestPose,
        moveNetPose,
        gameSummary: null,
        gameCorrelation: null,
      });
      return { ...result, emotions: emotionSmootherRef.current.smooth(result.emotions, { timestamp: latestFaceSample?.timestamp ?? null }) };
    } catch (e) { console.error('Edge AI inference failed:', e); return null; }
  }, [latestFaceSample, calibrationProfile, faceWorker.delegate, faceSamplesRef.current?.length, latestGaze, latestPose, moveNetPose]);

  useEffect(() => {
    edgeAIResultRef.current = edgeAIResult;
  }, [edgeAIResult]);

  const edgeChannels = edgeAIResult?.calibratedChannels ?? edgeAIResult?.channels ?? {};
  const edgeConfidence = edgeAIResult?.confidence;
  const edgeComposite = edgeAIResult?.composite;
  const insightItems = telemetry.insights?.items ?? [];
  const auEntries = Object.entries(telemetry.insights?.enhancedAUs ?? {}).sort((a, b) => (b[1]?.intensity ?? 0) - (a[1]?.intensity ?? 0));
  const activeAUCount = auEntries.filter(([, v]) => (v?.intensity ?? 0) > 0.04).length;
  const auRegionSummary = telemetry.insights?.auRegionActivation ?? {};
  const gameSummary = null;
  const gameCorrelation = null;
  const statusClassName = isCameraActive ? (faceWorker.status === 'tracking' ? 'ready' : 'pending') : 'inactive';
  const calStatusLabel = calibrationProfile?.eligible === true ? t('Calibrado', 'Calibrated') : calibrationProfile?.eligible === false ? t('No elegible', 'Not eligible') : t('Pendiente', 'Pending');

  return (
    <div className="camera-demo-page">
      <div className="camera-demo-header">
        <h1>{t('Demo Cámara KRUMM', 'KRUMM Camera Demo')}</h1>
        <p>{t('Activa la cámara para ver detección facial en tiempo real con MediaPipe Face Landmarker, mesh 468 puntos, estimación de mirada, postura y MoveNet para cuerpo superior.', 'Activate camera to see real-time face detection with MediaPipe Face Landmarker, 468-point mesh, gaze estimation, posture, and MoveNet upper body tracking.')}</p>
        <p className="camera-demo-privacy">{t('Privacidad: todo el procesamiento es local en el navegador. No se graba video ni se envían datos a servidores.', 'Privacy: all processing is local in the browser. No video is recorded and no data is sent to servers.')}</p>
      </div>
      
      <main className="camera-demo-main">
        <section className="camera-demo-controls" aria-label={t('Controles de cámara', 'Camera controls')}>
          <div className="camera-controls-grid">
            {isCameraActive ? (
              <>
                <div className="control-group">
                  <label htmlFor="camera-select">{t('Cámara:', 'Camera:')}</label>
                  <select
                    id="camera-select"
                    value={selectedDeviceId}
                    onChange={(e) => switchCamera(e.target.value)}
                    disabled={cameraDevices.length <= 1}
                  >
                    {cameraDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Cámara ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="control-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={showMesh}
                      onChange={(e) => setShowMesh(e.target.checked)}
                    />
                    {t('Mostrar mesh facial', 'Show face mesh')}
                  </label>
                </div>
                
                <div className="control-group">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={stopCamera}
                  >
                    {t('Detener cámara', 'Stop camera')}
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="control-group">
                  <label htmlFor="camera-select">{t('Cámara:', 'Camera:')}</label>
                  <select
                    id="camera-select"
                    value={selectedDeviceId}
                    onChange={(e) => setSelectedDeviceId(e.target.value)}
                    disabled={cameraDevices.length === 0}
                  >
                    {cameraDevices.map((d) => (
                      <option key={d.deviceId} value={d.deviceId}>
                        {d.label || `Cámara ${d.deviceId.slice(0, 8)}`}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="control-group">
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={startCamera}
                    disabled={cameraDevices.length === 0}
                  >
                    {t('Activar cámara', 'Start camera')}
                  </button>
                </div>
              </>
            )}
            
            {cameraError && (
              <div className="camera-error" role="alert">
                {t('Error:', 'Error:')} {cameraError}
              </div>
            )}
          </div>
        </section>

        {/* Dashboard siempre renderizado para que videoRef exista antes de startCamera */}
        <Dashboard
          videoRef={videoRef}
          isCameraActive={isCameraActive}
          showMesh={showMesh}
          setShowMesh={setShowMesh}
          telemetry={telemetry}
          faceWorker={faceWorker}
          statusClassName={statusClassName}
          lastQuality={lastQuality}
          calibrationProfile={calibrationProfile}
          calStatusLabel={calStatusLabel}
          insightItems={insightItems}
          auEntries={auEntries}
          activeAUCount={activeAUCount}
          edgeAIResult={edgeAIResult}
          edgeChannels={edgeChannels}
          edgeConfidence={edgeConfidence}
          edgeComposite={edgeComposite}
          latestLandmarks={latestLandmarks}
          latestGaze={latestGaze}
          auRegionSummary={auRegionSummary}
          gameSummary={gameSummary}
          gameCorrelation={gameCorrelation}
          latestPose={latestPose}
          moveNetPose={moveNetPose}
          moveNet={moveNet}
          onCalibrateGazeCenter={handleCalibrateGazeCenter}
          onCalibratePostureUpright={handleCalibratePostureUpright}
          manualCalStatus={manualCalStatus}
        />

        {isCameraActive && (
          <>
            <section className="camera-demo-calibration" aria-label={t('Calibración', 'Calibration')}>
              <div className="calibration-grid">
                <div className="cal-item">
                  <strong>{t('Calibración:', 'Calibration:')}</strong>
                  <span className={calibrationProfile?.eligible === true ? 'cal-ok' : calibrationProfile?.eligible === false ? 'cal-fail' : 'cal-pending'}>
                    {calStatusLabel}
                  </span>
                </div>
                <div className="cal-item">
                  {isCalibrating ? (
                    <button type="button" className="btn-secondary" onClick={cancelCalibration}>
                      {t('Cancelar calibración', 'Cancel calibration')}
                    </button>
                  ) : calibrationProfile?.eligible !== true ? (
                    <button type="button" className="btn-primary" onClick={startCalibration}>
                      {t('Iniciar calibración', 'Start calibration')}
                    </button>
                  ) : (
                    <span className="cal-ok">{t('Completada', 'Completed')}</span>
                  )}
                </div>
                <div className="cal-item">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCalibrateGazeCenter}
                    disabled={!latestLandmarks}
                  >
                    {t('Calibrar mirada centro', 'Calibrate gaze center')}
                  </button>
                </div>
                <div className="cal-item">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCalibratePostureUpright}
                    disabled={!latestLandmarks}
                  >
                    {t('Calibrar postura erguida', 'Calibrate upright posture')}
                  </button>
                </div>
                {manualCalStatus && <div className="cal-status">{manualCalStatus}</div>}
              </div>
            </section>
          </>
        )}

        {!isCameraActive && (
          <section className="camera-demo-features" aria-labelledby="features-title">
            <h2 id="features-title">{t('Funciones disponibles', 'Available features')}</h2>
            <div className="features-grid">
              <article className="feature-card">
                <h3>📷 {t('Detección facial MediaPipe', 'MediaPipe Face Detection')}</h3>
                <p>{t('Face Landmarker con 468 landmarks en tiempo real (GPU/CPU).', 'Face Landmarker with 468 landmarks in real-time (GPU/CPU).')}</p>
              </article>
              <article className="feature-card">
                <h3>🧬 {t('Mesh facial interactivo', 'Interactive Face Mesh')}</h3>
                <p>{t('Visualización de 468 puntos con conexiones, regiones AU, suavizado temporal.', '468-point visualization with connections, AU regions, temporal smoothing.')}</p>
              </article>
              <article className="feature-card">
                <h3>👁️ {t('Estimación de mirada', 'Gaze Estimation')}</h3>
                <p>{t('Vector de dirección ocular, punto de foco en pantalla, calibración centro.', 'Eye direction vector, screen focus point, center calibration.')}</p>
              </article>
              <article className="feature-card">
                <h3>🧍 {t('Postura corporal superior', 'Upper Body Posture')}</h3>
                <p>{t('Head pose (pitch/yaw/roll), hombros, alineación, calibración erguida.', 'Head pose (pitch/yaw/roll), shoulders, alignment, upright calibration.')}</p>
              </article>
              <article className="feature-card">
                <h3>🏃 {t('MoveNet cuerpo superior', 'MoveNet Upper Body')}</h3>
                <p>{t('17 keypoints pose, brazos, cobertura, actividad, confianza, simetría.', '17 keypoints pose, arms, coverage, activity, confidence, symmetry.')}</p>
              </article>
              <article className="feature-card">
                <h3>🧠 {t('Edge AI: AUs + emociones', 'Edge AI: AUs + Emotions')}</h3>
                <p>{t('17 Action Units, blendshapes, clasificador emociones suavizado temporal.', '17 Action Units, blendshapes, emotion classifier with temporal smoothing.')}</p>
              </article>
              <article className="feature-card">
                <h3>🔧 {t('Calibración adaptativa', 'Adaptive Calibration')}</h3>
                <p>{t('Perfil de iluminación, línea base AUs, calidad de captura, umbrales dinámicos.', 'Lighting profile, AU baseline, capture quality, dynamic thresholds.')}</p>
              </article>
              <article className="feature-card">
                <h3>🔒 {t('Privacidad por diseño', 'Privacy by Design')}</h3>
                <p>{t('Solo agregados locales. Sin video, frames, landmarks ni datos crudos exportados.', 'Local aggregates only. No video, frames, landmarks, or raw data exported.')}</p>
              </article>
            </div>
          </section>
        )}

        <section className="camera-demo-links">
          <Link to="/postulaciones-demo" className="btn-secondary">
            {t('Ir a Postulaciones Demo', 'Go to Postulaciones Demo')}
          </Link>
          <Link to="/postulaciones-demo/hr" className="btn-secondary">
            {t('Ver Dashboard HR', 'View HR Dashboard')}
          </Link>
        </section>
      </main>
    </div>
  );
}