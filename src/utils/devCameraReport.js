import {
  assertFacialWindowPrivacySafe,
  assertTelemetryPayloadPrivacySafe,
} from '../telemetry/facial/facialTelemetrySchema';

export const DEV_CAMERA_REPORT_STORAGE_KEY = 'krumm.dev.camera.report.v1';
export const DEV_CAMERA_REPORT_TYPE = 'dev_camera_report_snapshot_v1';
export const DEV_CAMERA_REPORT_VERSION = '1.0.0';

const clamp = (value, min, max) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
};

const clampPercent = (value) => Math.round(clamp(value, 0, 100));

const average = (values) => {
  const finite = values.map(Number).filter(Number.isFinite);
  if (finite.length === 0) return 0;
  return finite.reduce((sum, value) => sum + value, 0) / finite.length;
};

const sum = (values) => values
  .map(Number)
  .filter(Number.isFinite)
  .reduce((total, value) => total + value, 0);

const dedupe = (values) => Array.from(new Set((values || []).filter(Boolean)));

const getDefaultStorage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage || null;
};

const sanitizeTelemetryReport = (telemetryReport) => {
  if (!telemetryReport || typeof telemetryReport !== 'object') return null;

  const safeReport = {
    timestamp: telemetryReport.timestamp || new Date().toISOString(),
    source: telemetryReport.source || 'mediapipe_face_landmarker',
    qualityGatePassed: Boolean(telemetryReport.qualityGatePassed),
    frameCount: Number.isFinite(telemetryReport.frameCount) ? telemetryReport.frameCount : 0,
    sampleFps: Number.isFinite(telemetryReport.sampleFps) ? telemetryReport.sampleFps : undefined,
    windowMs: Number.isFinite(telemetryReport.windowMs) ? telemetryReport.windowMs : undefined,
    videoWidth: Number.isFinite(telemetryReport.videoWidth) ? telemetryReport.videoWidth : undefined,
    videoHeight: Number.isFinite(telemetryReport.videoHeight) ? telemetryReport.videoHeight : undefined,
    videoFrameRateMax: Number.isFinite(telemetryReport.videoFrameRateMax) ? telemetryReport.videoFrameRateMax : undefined,
    qualityFlags: dedupe(telemetryReport.qualityFlags || []),
  };

  if (telemetryReport.stats && typeof telemetryReport.stats === 'object') {
    safeReport.stats = {
      totalFrames: Number.isFinite(telemetryReport.stats.totalFrames) ? telemetryReport.stats.totalFrames : 0,
      faceDetectedFrames: Number.isFinite(telemetryReport.stats.faceDetectedFrames) ? telemetryReport.stats.faceDetectedFrames : 0,
      avgQualityScore: Number.isFinite(telemetryReport.stats.avgQualityScore) ? telemetryReport.stats.avgQualityScore : 0,
      blinkRate: Number.isFinite(telemetryReport.stats.blinkRate) ? telemetryReport.stats.blinkRate : 0,
      avgBlinkDuration: Number.isFinite(telemetryReport.stats.avgBlinkDuration) ? telemetryReport.stats.avgBlinkDuration : 0,
      emittedWindows: Number.isFinite(telemetryReport.stats.emittedWindows) ? telemetryReport.stats.emittedWindows : 0,
      sampleFps: Number.isFinite(telemetryReport.stats.sampleFps) ? telemetryReport.stats.sampleFps : undefined,
      windowMs: Number.isFinite(telemetryReport.stats.windowMs) ? telemetryReport.stats.windowMs : undefined,
      videoWidth: Number.isFinite(telemetryReport.stats.videoWidth) ? telemetryReport.stats.videoWidth : undefined,
      videoHeight: Number.isFinite(telemetryReport.stats.videoHeight) ? telemetryReport.stats.videoHeight : undefined,
      videoFrameRateMax: Number.isFinite(telemetryReport.stats.videoFrameRateMax) ? telemetryReport.stats.videoFrameRateMax : undefined,
    };
  }

  assertTelemetryPayloadPrivacySafe(safeReport);
  return safeReport;
};

const getSafeFacialWindows = (facialWindows = []) => {
  if (!Array.isArray(facialWindows)) return [];

  return facialWindows.filter((window) => {
    try {
      assertFacialWindowPrivacySafe(window);
      return true;
    } catch {
      return false;
    }
  });
};

export function buildDevCameraSignalAudit(facialWindows = [], telemetryReport = null) {
  const safeWindows = getSafeFacialWindows(facialWindows);
  const sanitizedReport = sanitizeTelemetryReport(telemetryReport);
  const stats = sanitizedReport?.stats || {};
  const qualityFlags = dedupe([
    ...safeWindows.flatMap((window) => window?.quality?.flags || []),
    ...(sanitizedReport?.qualityFlags || []),
  ]);

  const facialWindowCount = safeWindows.length;
  const totalFrames = Number.isFinite(stats.totalFrames)
    ? stats.totalFrames
    : (Number.isFinite(sanitizedReport?.frameCount) ? sanitizedReport.frameCount : 0);
  const faceDetectedFrames = Number.isFinite(stats.faceDetectedFrames) ? stats.faceDetectedFrames : 0;
  const signalQualityScore = clampPercent(average(safeWindows.map((window) => window?.quality?.signalQualityScore)));
  const facialCoverageScore = clampPercent(average(safeWindows.map((window) => (window?.quality?.facePresenceRatio || 0) * 100)));
  const meanWindowConfidenceScore = clampPercent(average(safeWindows.map((window) => (window?.confidence?.windowConfidence || 0) * 100)));
  const blinkRatePerMin = Math.round(average(safeWindows.map((window) => window?.facialSignals?.blinkRatePerMin)));
  const visualStabilityScore = clampPercent(average(safeWindows.map((window) => window?.facialSignals?.visualStabilityScore)));
  const offScreenOrFaceAwayPercent = clampPercent(average(safeWindows.map((window) => (window?.facialSignals?.offScreenOrFaceAwayRatio || 0) * 100)));
  const sampleCount = sum(safeWindows.map((window) => window?.sampleCount));
  const sampleFps = sanitizedReport?.sampleFps || stats.sampleFps || null;
  const windowMs = sanitizedReport?.windowMs || stats.windowMs || null;

  const qualityGatePassed = Boolean(sanitizedReport?.qualityGatePassed)
    || (facialWindowCount > 0 && signalQualityScore >= 60 && facialCoverageScore >= 70);

  return {
    facialWindowCount,
    sampleCount,
    totalFrames,
    faceDetectedFrames,
    sampleFps,
    windowMs,
    videoWidth: sanitizedReport?.videoWidth || stats.videoWidth || null,
    videoHeight: sanitizedReport?.videoHeight || stats.videoHeight || null,
    videoFrameRateMax: sanitizedReport?.videoFrameRateMax || stats.videoFrameRateMax || null,
    signalQualityScore,
    facialCoverageScore,
    meanWindowConfidenceScore,
    blinkRatePerMin,
    visualStabilityScore,
    offScreenOrFaceAwayPercent,
    qualityGatePassed,
    qualityFlags,
  };
}

export function buildDevCameraReportSnapshot({
  facialWindows = [],
  telemetryReport = null,
  captureProfile = null,
  generatedAt = new Date().toISOString(),
} = {}) {
  const safeWindows = getSafeFacialWindows(facialWindows).slice(0, 12);
  const safeTelemetryReport = sanitizeTelemetryReport(telemetryReport);
  const safeCaptureProfile = captureProfile && typeof captureProfile === 'object'
    ? {
        id: captureProfile.id || null,
        label: captureProfile.label || null,
        sampleFps: Number.isFinite(captureProfile.sampleFps) ? captureProfile.sampleFps : undefined,
        windowMs: Number.isFinite(captureProfile.windowMs) ? captureProfile.windowMs : undefined,
        videoWidth: Number.isFinite(captureProfile.videoWidth) ? captureProfile.videoWidth : undefined,
        videoHeight: Number.isFinite(captureProfile.videoHeight) ? captureProfile.videoHeight : undefined,
      }
    : null;

  const snapshot = {
    type: DEV_CAMERA_REPORT_TYPE,
    version: DEV_CAMERA_REPORT_VERSION,
    generatedAt,
    captureProfile: safeCaptureProfile,
    telemetryReport: safeTelemetryReport,
    facialWindows: safeWindows,
    audit: buildDevCameraSignalAudit(safeWindows, safeTelemetryReport),
  };

  assertTelemetryPayloadPrivacySafe(snapshot);
  return snapshot;
}

export function saveDevCameraReportSnapshot(input = {}, storage = getDefaultStorage()) {
  const snapshot = buildDevCameraReportSnapshot(input);
  if (storage) {
    storage.setItem(DEV_CAMERA_REPORT_STORAGE_KEY, JSON.stringify(snapshot));
  }
  return snapshot;
}

export function readDevCameraReportSnapshot(storage = getDefaultStorage()) {
  if (!storage) return null;

  try {
    const raw = storage.getItem(DEV_CAMERA_REPORT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.type !== DEV_CAMERA_REPORT_TYPE || parsed?.version !== DEV_CAMERA_REPORT_VERSION) {
      return null;
    }
    assertTelemetryPayloadPrivacySafe(parsed);
    getSafeFacialWindows(parsed.facialWindows).forEach(assertFacialWindowPrivacySafe);
    return parsed;
  } catch {
    storage.removeItem(DEV_CAMERA_REPORT_STORAGE_KEY);
    return null;
  }
}

export function clearDevCameraReportSnapshot(storage = getDefaultStorage()) {
  if (!storage) return;
  storage.removeItem(DEV_CAMERA_REPORT_STORAGE_KEY);
}
