/**
 * Webcam Capture Utility v3
 *
 * Browser-local webcam orchestration for privacy-safe facial telemetry.
 * The camera stream is processed locally with MediaPipe FaceLandmarker and only
 * aggregate `facial_window_v1` metadata is emitted to TelemetryContext.
 * Raw video, frames, canvas pixels, ImageData, base64, and landmarks are not
 * stored or passed through callbacks.
 */

import { createFaceLandmarkerClient, FACE_LANDMARKER_SOURCE } from '../telemetry/facial/faceLandmarkerClient';
import { extractFacialFrameFeatures } from '../telemetry/facial/facialFeatureExtractor';
import { createFacialWindowAggregator } from '../telemetry/facial/facialWindowAggregator';
import { assertFacialWindowPrivacySafe, createFacialWindow } from '../telemetry/facial/facialTelemetrySchema';

const DEFAULT_SAMPLE_FPS = 6;
const DEFAULT_WINDOW_MS = 5000;
const MAX_SAMPLE_FPS = 10;
const MIN_SAMPLE_FPS = 1;

const clamp = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const round = (value, decimals = 3) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  const factor = 10 ** decimals;
  const rounded = Math.round(n * factor) / factor;
  return Object.is(rounded, -0) ? 0 : rounded;
};

const defaultScheduleFrame = (fn, delayMs) => setTimeout(fn, delayMs);
const defaultClearScheduledFrame = (id) => clearTimeout(id);
const defaultNow = () => Date.now();

const safeArray = (value) => (Array.isArray(value) ? value : []);

const buildRuntimeUnavailableWindow = ({ gameId, sessionId, timestampMs, source, flags }) => createFacialWindow({
  sessionId,
  gameId,
  windowIndex: 0,
  startedAtMs: timestampMs,
  endedAtMs: timestampMs,
  durationMs: 0,
  sampleCount: 0,
  source,
  quality: {
    facePresenceRatio: 0,
    meanDetectionConfidence: 0,
    meanIlluminationScore: 0,
    signalQualityScore: 0,
    multipleFaceRatio: 0,
    flags,
  },
  facialSignals: {
    blinkRatePerMin: 0,
    visualStabilityScore: 0,
    offScreenOrFaceAwayRatio: 1,
  },
  confidence: {
    windowConfidence: 0,
    interpretationAllowed: false,
    reasonIfLowConfidence: flags.includes('facial_model_unavailable')
      ? 'facial model unavailable'
      : 'webcam capture unavailable',
  },
});

export class WebcamCapture {
  constructor(onFrameCapture = null, options = {}) {
    this.videoElement = null;
    this.stream = null;
    this.isCapturing = false;
    this.onFrameCapture = onFrameCapture;

    this.gameId = options.gameId ?? null;
    this.sessionId = options.sessionId ?? null;
    this.sampleFps = clamp(options.sampleFps ?? DEFAULT_SAMPLE_FPS, MIN_SAMPLE_FPS, MAX_SAMPLE_FPS);
    this.sampleIntervalMs = Math.max(50, Math.round(1000 / this.sampleFps));
    this.windowMs = Math.max(1000, Number(options.windowMs) || DEFAULT_WINDOW_MS);
    this.source = options.source || FACE_LANDMARKER_SOURCE;
    this.logger = options.logger || console;

    this.now = options.now || defaultNow;
    this.scheduleFrame = options.scheduleFrame || defaultScheduleFrame;
    this.clearScheduledFrame = options.clearScheduledFrame || defaultClearScheduledFrame;
    this.shouldScheduleNextFrame = options.scheduleNextFrame !== false;
    this.captureTimerId = null;

    this.extractFeatures = options.extractFeatures || extractFacialFrameFeatures;
    this.faceLandmarkerClient = options.faceLandmarkerClient || createFaceLandmarkerClient({
      wasmBaseUrl: options.wasmBaseUrl,
      modelAssetPath: options.modelAssetPath,
      delegate: options.delegate,
      logger: this.logger,
      importTasksVision: options.importTasksVision,
    });
    this.facialWindowAggregator = options.facialWindowAggregator || createFacialWindowAggregator({
      sessionId: this.sessionId,
      gameId: this.gameId,
      source: this.source,
      windowMs: this.windowMs,
      minSamples: Math.max(3, Math.floor(this.sampleFps * 1.5)),
    });

    this.runtimeQualityFlags = new Set();
    this.emittedWindowKeys = new Set();
    this.modelInitialization = null;

    // Compatibility counters. `webcamFrames` should no longer store 30fps frames,
    // but callers may still read these stats for diagnostics.
    this.frameHistory = [];
    this.maxHistoryFrames = 0;
    this.stats = {
      totalFrames: 0,
      faceDetectedFrames: 0,
      avgQualityScore: 0,
      blinkRate: 0,
      avgBlinkDuration: 0,
      headPoseDrift: null,
      emittedWindows: 0,
      sampleFps: this.sampleFps,
      windowMs: this.windowMs,
    };
  }

  /**
   * Inicializar captura de webcam y modelo local. Si MediaPipe falla, la cámara
   * puede seguir abierta y la app emite metadata de baja confianza en vez de crashear.
   */
  async initialize(videoElement) {
    try {
      this.videoElement = videoElement;

      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
        this.runtimeQualityFlags.add('camera_denied');
        this.emitRuntimeUnavailable(['camera_denied']);
        return false;
      }

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: this.sampleFps, max: MAX_SAMPLE_FPS },
          facingMode: 'user',
        },
        audio: false,
      });

      this.videoElement.srcObject = this.stream;

      await new Promise((resolve) => {
        const markReady = () => {
          try {
            const playResult = this.videoElement.play?.();
            if (playResult?.then) {
              playResult.then(() => resolve(true)).catch(() => resolve(true));
              return;
            }
          } catch {
            // Continue: tests and some browsers can reject autoplay on hidden video.
          }
          resolve(true);
        };

        if (this.videoElement.readyState >= 1) {
          markReady();
          return;
        }

        this.videoElement.onloadedmetadata = markReady;
      });

      this.modelInitialization = await this.faceLandmarkerClient.initialize?.();
      if (this.modelInitialization && this.modelInitialization.ok === false) {
        safeArray(this.modelInitialization.flags).forEach((flag) => this.runtimeQualityFlags.add(flag));
      }

      return true;
    } catch (error) {
      this.runtimeQualityFlags.add('camera_denied');
      this.emitRuntimeUnavailable(['camera_denied']);
      this.logger?.error?.('Webcam initialization failed:', error);
      return false;
    }
  }

  /**
   * Iniciar sampleo controlado. Emite ventanas agregadas, no frames crudos.
   */
  startCapture() {
    if (!this.videoElement) return false;

    this.isCapturing = true;
    this.stats = {
      ...this.stats,
      totalFrames: 0,
      faceDetectedFrames: 0,
      avgQualityScore: 0,
      blinkRate: 0,
      avgBlinkDuration: 0,
      headPoseDrift: null,
      emittedWindows: 0,
    };
    this.facialWindowAggregator.reset?.();
    this.emittedWindowKeys.clear();

    if (this.runtimeQualityFlags.has('facial_model_unavailable')) {
      this.emitRuntimeUnavailable([...this.runtimeQualityFlags]);
    }

    this.captureFrame();
    return true;
  }

  emitRuntimeUnavailable(flags = [...this.runtimeQualityFlags]) {
    this.emitFacialWindow(buildRuntimeUnavailableWindow({
      gameId: this.gameId,
      sessionId: this.sessionId,
      timestampMs: this.now(),
      source: this.source,
      flags: Array.from(new Set(flags.filter(Boolean))),
    }));
  }

  /**
   * Parar captura y emitir la ventana parcial agregada, si existe.
   */
  stopCapture() {
    this.isCapturing = false;
    if (this.captureTimerId !== null) {
      this.clearScheduledFrame(this.captureTimerId);
      this.captureTimerId = null;
    }
    this.flushPendingWindows();
  }

  scheduleNextCapture() {
    if (!this.isCapturing || !this.shouldScheduleNextFrame) return;
    if (this.captureTimerId !== null) {
      this.clearScheduledFrame(this.captureTimerId);
    }
    this.captureTimerId = this.scheduleFrame(() => this.captureFrame(), this.sampleIntervalMs);
  }

  /**
   * Toma una muestra local con FaceLandmarker. No usa ni guarda ImageData/canvas.
   */
  async captureFrame() {
    if (!this.isCapturing || !this.videoElement) return;

    const timestampMs = this.now();

    try {
      const detectionResult = this.faceLandmarkerClient.detectForVideo?.(this.videoElement, timestampMs) || {
        faceLandmarks: [],
        faceBlendshapes: [],
        facialTransformationMatrixes: [],
      };

      if (detectionResult.error) {
        this.runtimeQualityFlags.add(detectionResult.error);
      }

      const features = detectionResult.error
        ? {
            type: 'facial_frame_features_v1',
            timestampMs,
            source: this.source,
            facePresent: false,
            faceCount: 0,
            detectionConfidence: 0,
            illuminationScore: 0,
            blinkDetected: false,
            blinkScore: 0,
            blinkAsymmetry: 0,
            headPose: null,
          }
        : this.extractFeatures(detectionResult, {
            timestampMs,
            source: this.source,
          });

      this.updateStatsFromFeature(features);

      const facialWindow = this.facialWindowAggregator.addSample(features);
      if (facialWindow) {
        this.emitFacialWindow(facialWindow);
      }
    } catch (error) {
      this.runtimeQualityFlags.add('facial_capture_error');
      this.logger?.error?.('Frame capture error:', error);
    } finally {
      this.scheduleNextCapture();
    }
  }

  updateStatsFromFeature(features) {
    this.stats.totalFrames += 1;
    if (features?.facePresent) {
      this.stats.faceDetectedFrames += 1;
    }

    const quality = round(((features?.detectionConfidence ?? 0) * 70) + ((features?.illuminationScore ?? 0) * 30), 0);
    this.stats.avgQualityScore = this.stats.totalFrames > 0
      ? Math.round(((this.stats.avgQualityScore * (this.stats.totalFrames - 1)) + quality) / this.stats.totalFrames)
      : quality;
  }

  getWindowKey(window) {
    return `${window?.type || 'window'}:${window?.gameId || ''}:${window?.windowIndex ?? ''}:${window?.startedAtMs ?? ''}:${window?.endedAtMs ?? ''}`;
  }

  withRuntimeFlags(window) {
    const runtimeFlags = [...this.runtimeQualityFlags].filter(Boolean);
    if (runtimeFlags.length === 0) return window;

    const flags = Array.from(new Set([...(window?.quality?.flags || []), ...runtimeFlags]));
    return createFacialWindow({
      ...window,
      quality: {
        ...(window?.quality || {}),
        flags,
      },
      confidence: {
        ...(window?.confidence || {}),
        interpretationAllowed: false,
        reasonIfLowConfidence: window?.confidence?.reasonIfLowConfidence || runtimeFlags[0],
      },
    });
  }

  emitFacialWindow(window) {
    if (!window) return;
    const safeWindow = this.withRuntimeFlags(window);
    assertFacialWindowPrivacySafe(safeWindow);

    const key = this.getWindowKey(safeWindow);
    if (this.emittedWindowKeys.has(key)) return;
    this.emittedWindowKeys.add(key);

    this.stats.emittedWindows += 1;
    if (this.onFrameCapture) {
      this.onFrameCapture(safeWindow);
    }
  }

  flushPendingWindows() {
    const windows = this.facialWindowAggregator.flush?.() || [];
    windows.forEach((window) => this.emitFacialWindow(window));
  }

  /**
   * Obtener quality gate status basado en ventanas/muestras agregadas.
   */
  passesQualityGate(threshold = 60) {
    return this.stats.avgQualityScore >= threshold
      && this.stats.totalFrames > 0
      && this.stats.faceDetectedFrames >= (this.stats.totalFrames * 0.7);
  }

  /**
   * Obtener reporte diagnóstico local. No contiene frames ni landmarks.
   */
  getTelemetryReport() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.stats,
      qualityGatePassed: this.passesQualityGate(),
      frameCount: this.stats.totalFrames,
      source: this.source,
      sampleFps: this.sampleFps,
      windowMs: this.windowMs,
      qualityFlags: [...this.runtimeQualityFlags],
    };
  }

  /**
   * Compatibility method. Head pose now lives in aggregate windows.
   */
  getAverageHeadPose() {
    return null;
  }

  /**
   * Limpiar recursos: timers, ventana parcial, modelo y tracks de cámara.
   */
  cleanup() {
    try {
      this.stopCapture();
    } catch (error) {
      this.logger?.warn?.('Dropping unsafe pending webcam telemetry window during cleanup:', error?.message || error);
    } finally {
      try {
        if (this.videoElement?.pause) {
          this.videoElement.pause();
        }
      } catch {
        // noop
      }

      if (this.stream) {
        this.stream.getTracks().forEach((track) => track.stop());
        this.stream = null;
      }

      if (this.videoElement) {
        this.videoElement.srcObject = null;
      }

      this.faceLandmarkerClient.dispose?.();
      this.frameHistory = [];
    }
  }
}

export default WebcamCapture;
