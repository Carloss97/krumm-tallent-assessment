import React, { useEffect, useRef, useState } from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import GameShell from './components/GameShell';
import { LanguageProvider } from './context/LanguageContext';
import { TelemetryProvider, useTelemetry } from './TelemetryContext';
import { buildAssessmentFeatureVectorV1 } from './telemetry/features/assessmentFeatureVector';
import { buildSessionPersistencePayload } from './telemetry/persistence/sessionPersistencePayload';
import { assertFacialWindowPrivacySafe } from './telemetry/facial/facialTelemetrySchema';

const {
  mockCreateFaceLandmarkerClient,
  mockFaceLandmarkerClient,
  mockExtractFacialFrameFeatures,
} = vi.hoisted(() => {
  const client = {
    initialize: vi.fn(),
    detectForVideo: vi.fn(),
    dispose: vi.fn(),
  };
  return {
    mockFaceLandmarkerClient: client,
    mockCreateFaceLandmarkerClient: vi.fn(() => client),
    mockExtractFacialFrameFeatures: vi.fn(),
  };
});

vi.mock('./telemetry/facial/faceLandmarkerClient', () => ({
  FACE_LANDMARKER_SOURCE: 'mediapipe_face_landmarker',
  createFaceLandmarkerClient: mockCreateFaceLandmarkerClient,
}));

vi.mock('./telemetry/facial/facialFeatureExtractor', () => ({
  extractFacialFrameFeatures: mockExtractFacialFrameFeatures,
}));

const originalMediaDevicesDescriptor = Object.getOwnPropertyDescriptor(navigator, 'mediaDevices');

const setMediaDevices = (value) => {
  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value,
  });
};

const restoreMediaDevices = () => {
  if (originalMediaDevicesDescriptor) {
    Object.defineProperty(navigator, 'mediaDevices', originalMediaDevicesDescriptor);
    return;
  }
  delete navigator.mediaDevices;
};

const createMockStream = () => ({
  getTracks: vi.fn(() => [{ stop: vi.fn() }]),
});

const latestSessionData = (snapshots) => snapshots[snapshots.length - 1] || {};

const SessionObserver = ({ onSessionData }) => {
  const { sessionData } = useTelemetry();

  useEffect(() => {
    onSessionData(sessionData);
  }, [onSessionData, sessionData]);

  return null;
};

const ProbeAssessmentGame = ({ isActive, onDone }) => {
  const { startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const startedRef = useRef(false);

  useEffect(() => {
    if (!isActive || startedRef.current) return;
    startedRef.current = true;
    startTracking('ospan_game_1');
    recordTrialEvent({
      event: 'probe_trial_response',
      reactionTimeMs: 420,
      isCorrect: true,
    });
  }, [isActive, recordTrialEvent, startTracking]);

  return (
    <button
      type="button"
      disabled={!isActive}
      onClick={() => {
        stopTracking('ospan_game_1', 82, 0, { operationAccuracy: 90, recallAccuracy: 86 });
        onDone();
      }}
    >
      finish-probe-game
    </button>
  );
};

const BrowserE2EHarness = ({ onSessionData }) => {
  const [showGame, setShowGame] = useState(true);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <TelemetryProvider>
          <SessionObserver onSessionData={onSessionData} />
          {showGame ? (
            <GameShell gameId={1}>
              <ProbeAssessmentGame onDone={() => setShowGame(false)} />
            </GameShell>
          ) : (
            <div>probe-complete</div>
          )}
        </TelemetryProvider>
      </BrowserRouter>
    </LanguageProvider>
  );
};

describe('assessment browser/dev camera telemetry path', () => {
  beforeEach(() => {
    window.localStorage.setItem('talenttrack-language', 'en');
    mockCreateFaceLandmarkerClient.mockClear();
    mockFaceLandmarkerClient.initialize.mockReset();
    mockFaceLandmarkerClient.detectForVideo.mockReset();
    mockFaceLandmarkerClient.dispose.mockReset();
    mockExtractFacialFrameFeatures.mockReset();

    mockFaceLandmarkerClient.initialize.mockResolvedValue({ ok: true, flags: [] });
    mockFaceLandmarkerClient.detectForVideo.mockReturnValue({});
    mockExtractFacialFrameFeatures.mockImplementation((_result, { timestampMs, source }) => ({
      type: 'facial_frame_features_v1',
      timestampMs,
      source,
      facePresent: true,
      faceCount: 1,
      detectionConfidence: 0.92,
      illuminationScore: 0.82,
      blinkDetected: false,
      blinkScore: 0.1,
      blinkAsymmetry: 0.02,
      headPose: { yawDeg: 1, pitchDeg: 2, rollDeg: 0.5 },
    }));

    vi.spyOn(window.HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve());
    vi.spyOn(window.HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    restoreMediaDevices();
    vi.restoreAllMocks();
    window.localStorage.removeItem('talenttrack-language');
  });

  it('requests camera, stores facialWindows, fuses them into assessment_feature_vector_v1, and persists aggregate-only payloads', async () => {
    const getUserMedia = vi.fn(() => Promise.resolve(createMockStream()));
    setMediaDevices({ getUserMedia });
    const sessionSnapshots = [];

    render(<BrowserE2EHarness onSessionData={(sessionData) => sessionSnapshots.push(sessionData)} />);

    fireEvent.click(screen.getByLabelText(/webcam/i));
    fireEvent.click(screen.getByLabelText(/privacy policy|pol[ií]tica de privacidad/i));
    fireEvent.click(screen.getByRole('button', { name: /continue with assessment|continuar con la evaluación/i }));

    await waitFor(() => expect(getUserMedia).toHaveBeenCalledWith({ video: true, audio: false }));
    await waitFor(() => expect(screen.getByRole('button', { name: 'finish-probe-game' })).toBeEnabled());
    await waitFor(() => expect(getUserMedia).toHaveBeenCalledTimes(2));

    const video = document.querySelector('video');
    expect(video).toBeTruthy();
    video.onloadedmetadata?.();

    await waitFor(() => expect(mockFaceLandmarkerClient.initialize).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockFaceLandmarkerClient.detectForVideo).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'finish-probe-game' }));

    await waitFor(() => expect(screen.getByText('probe-complete')).toBeDefined());
    await waitFor(() => {
      const sessionData = latestSessionData(sessionSnapshots);
      expect(sessionData.ospan_game_1?.facialWindows?.length).toBeGreaterThan(0);
    });

    const sessionData = latestSessionData(sessionSnapshots);
    const gameSession = sessionData.ospan_game_1;
    const [facialWindow] = gameSession.facialWindows;

    expect(getUserMedia.mock.calls[1][0]).toMatchObject({
      audio: false,
      video: expect.objectContaining({
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 },
      }),
    });
    expect(assertFacialWindowPrivacySafe(facialWindow)).toBe(true);
    expect(gameSession.webcamFrames).toHaveLength(0);
    expect(gameSession.facialWindowCount).toBeGreaterThan(0);
    expect(gameSession.webcamQualityScore).toBeGreaterThan(0);
    expect(gameSession.qualityFlags).not.toContain('face_not_detected');
    expect(gameSession.qualityFlags).not.toContain('insufficient_webcam_signal');

    const featureVector = buildAssessmentFeatureVectorV1(sessionData, {
      sessionId: 'session-e2e',
      participantId: 'candidate-e2e',
      generatedAtMs: 123,
    });
    expect(featureVector).toMatchObject({
      type: 'assessment_feature_vector_v1',
      privacy: {
        rawVideoStored: false,
        rawFramesStored: false,
        landmarksStored: false,
        audioCaptured: false,
      },
      games: [
        expect.objectContaining({
          gameId: 'ospan_game_1',
          facial: expect.objectContaining({
            windowCount: gameSession.facialWindows.length,
          }),
        }),
      ],
    });

    const persistencePayload = buildSessionPersistencePayload({
      participant: { participantId: 'candidate-e2e' },
      telemetry: sessionData,
      reportData: sessionData,
      metadata: { sessionId: 'session-e2e', startedAt: '2026-05-14T00:00:00.000Z' },
      generatedAtMs: 123,
    });
    expect(persistencePayload.sessionData.assessmentFeatureVector.type).toBe('assessment_feature_vector_v1');
    expect(() => assertFacialWindowPrivacySafe(persistencePayload.sessionData.telemetry.ospan_game_1.facialWindows[0])).not.toThrow();
    expect(JSON.stringify(persistencePayload)).not.toMatch(/"rawFrame"|"faceLandmarks"|"normalizedLandmarks"|"srcObject"|data:image/i);
  });
});
