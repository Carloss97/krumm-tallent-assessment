import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import Report from './Report';
import { BrowserRouter } from 'react-router-dom';
import { LanguageProvider } from './context/LanguageContext';
import { saveSessionToBackend, getCurrentToken } from './services/backendService';
import { createFacialWindow } from './telemetry/facial/facialTelemetrySchema';
import {
  DEV_CAMERA_REPORT_STORAGE_KEY,
  saveDevCameraReportSnapshot,
} from './utils/devCameraReport';

const { mockUseTelemetry } = vi.hoisted(() => ({
  mockUseTelemetry: vi.fn(),
}));

vi.mock('./TelemetryContext', () => ({
  TelemetryProvider: ({ children }) => <div>{children}</div>,
  useTelemetry: mockUseTelemetry,
}));

vi.mock('./services/aiReportService', () => ({
  generateAIReport: vi.fn(() => Promise.resolve(null)),
  getLastAIFailureReason: vi.fn(() => 'mocked-ai-failure'),
  getLastAIDebugTrace: vi.fn(() => []),
  checkGeminiHealth: vi.fn(() => Promise.resolve({ ok: true, message: 'mock-health-ok' })),
  generateHeuristicReport: vi.fn(() => ({
    summary: 'Test heuristic summary for cognitive assessment',
    strengths: ['Strong cognitive flexibility', 'Good working memory'],
    areasToMonitor: ['Stress resilience under pressure', 'Risk assessment in high-stakes scenarios'],
    careerRecommendations: [
      { role: 'Project Manager', fit: 'Excellent organizational skills' },
      { role: 'Data Analyst', fit: 'Strong analytical thinking' }
    ],
    confidenceScore: 75,
    recommendation: 'STRONG ALIGNMENT',
    source: 'heuristic',
    generatedAt: new Date().toISOString(),
  })),
}));

vi.mock('./services/backendService', () => ({
  saveSessionToBackend: vi.fn(() => Promise.resolve({ sessionId: 123 })),
  getCurrentToken: vi.fn(() => null),
}));

describe('Report Component', () => {
  const renderReport = (props = {}) => render(
    <LanguageProvider>
      <BrowserRouter>
        <Report {...props} />
      </BrowserRouter>
    </LanguageProvider>
  );

  beforeEach(() => {
    mockUseTelemetry.mockClear();
    saveSessionToBackend.mockClear();
    getCurrentToken.mockReset();
    getCurrentToken.mockReturnValue(null);
    window.localStorage.removeItem(DEV_CAMERA_REPORT_STORAGE_KEY);
    window.localStorage.setItem('talenttrack-language', 'en');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('renders "No Assessment Data Found" when sessionData.game1 is missing', () => {
    mockUseTelemetry.mockReturnValue({ sessionData: {} });

    renderReport({ useDummyData: false });

    expect(screen.getByRole('heading', { name: /no assessment data found|no se encontraron datos de evaluaci[oó]n/i })).toBeDefined();
  });

  it('links to the dev camera diagnostic when /report has no assessment data but a camera snapshot exists', () => {
    saveDevCameraReportSnapshot({
      facialWindows: [createFacialWindow({
        gameId: 'dev_camera_lab',
        sampleCount: 6,
        quality: { facePresenceRatio: 1, signalQualityScore: 90 },
        confidence: { windowConfidence: 0.9, interpretationAllowed: true },
      })],
      telemetryReport: { qualityGatePassed: true, stats: { totalFrames: 10, faceDetectedFrames: 10 } },
    });
    mockUseTelemetry.mockReturnValue({ sessionData: {} });

    renderReport({ useDummyData: false });

    expect(screen.getByText(/diagnóstico de cámara de development|development camera diagnostic/i)).toBeDefined();
    expect(screen.getByRole('link', { name: /view camera diagnostic|ver diagnóstico de cámara/i })).toHaveAttribute('href', '/dev/report');
  });

  it('renders report when data is available', async () => {
    const mockSessionData = {
      game1: { score: 100, errors: 5, duration: 60000 },
      game2: { score: 95, errors: 3, duration: 65000 },
      game3: { score: 88, errors: 2, duration: 55000 },
      game4: { score: 92, errors: 1, duration: 58000 },
      game5: { score: 90, errors: 4, duration: 62000 },
      game6: { score: 87, errors: 6, duration: 61000 },
      game7: { score: 93, errors: 0, duration: 59000 },
    };

    mockUseTelemetry.mockReturnValue({ sessionData: mockSessionData });

    const { container } = renderReport({ useDummyData: false });

    // Check that report is rendered by looking for report title
    await waitFor(
      () => {
        const h1 = container.querySelector('h1');
        const titleText = h1 ? h1.textContent : '';
        expect(
          titleText.includes('Assessment') ||
          titleText.includes('Evaluation') ||
          titleText.includes('Evaluación') ||
          titleText.includes('habilidades')
        ).toBeTruthy();
      },
      { timeout: 10000 },
    );
  });

  it('uses dummy data when useDummyData prop is true', async () => {
    mockUseTelemetry.mockReturnValue({ sessionData: {} });

    renderReport({ useDummyData: true });

    fireEvent.click(screen.getByRole('button', { name: /view demo report|ver reporte demo/i }));

    await waitFor(
      () => {
        // Report should be generated after enabling demo mode from no-data state.
        const elements = screen.queryAllByText((content, element) =>
          element && (
            content.includes('Cognitive') ||
            content.includes('Assessment') ||
            content.includes('Evaluación') ||
            content.includes('habilidades')
          )
        );
        expect(elements.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  });

  it('saves session to backend when report is generated', async () => {
    const mockSessionData = {
      game1: { score: 100, errors: 5, duration: 60000, details: {} },
      game2: { score: 95, errors: 3, duration: 65000, details: {} },
      game3: { score: 88, errors: 2, duration: 55000, details: {} },
      game4: { score: 92, errors: 1, duration: 58000, details: {} },
      game5: { score: 90, errors: 4, duration: 62000, details: {} },
      game6: { score: 87, errors: 6, duration: 61000, details: {} },
      game7: { score: 93, errors: 0, duration: 59000, details: {} },
    };

    getCurrentToken.mockReturnValue('test-token');
    mockUseTelemetry.mockReturnValue({
      sessionData: mockSessionData,
      participantProfile: { participantId: 'participant-123' },
      getSessionMetadata: vi.fn(() => ({ startedAt: '2026-05-13T00:00:00.000Z' })),
      saveToBackend: vi.fn(() => Promise.resolve()),
    });

    renderReport({ useDummyData: false });

    await waitFor(
      () => {
        expect(saveSessionToBackend).toHaveBeenCalledWith(expect.objectContaining({
          participant: { participantId: 'participant-123' },
          sessionData: expect.objectContaining({
            participantId: 'participant-123',
            telemetry: mockSessionData,
            assessmentFeatureVector: expect.objectContaining({
              type: 'assessment_feature_vector_v1',
              session: expect.objectContaining({
                participantId: 'participant-123',
              }),
              aggregate: expect.objectContaining({
                completedGameCount: 7,
              }),
            }),
            edgeLocalModelOutput: expect.objectContaining({
              type: 'edge_local_model_output_v1',
              decisionPolicy: 'human_review_only',
            }),
          }),
        }));
      },
      { timeout: 10000 },
    );
  });

  it('blocks unsafe telemetry payloads before backend persistence', async () => {
    const mockSessionData = {
      game1: {
        score: 100,
        errors: 0,
        duration: 60000,
        facialWindows: [],
        diagnostic: { rawFrame: 'data:image/png;base64,unsafe' },
      },
      game2: { score: 95, errors: 1, duration: 65000 },
      game3: { score: 88, errors: 2, duration: 55000 },
      game4: { score: 92, errors: 1, duration: 58000 },
      game5: { score: 90, errors: 4, duration: 62000 },
      game6: { score: 87, errors: 6, duration: 61000 },
      game7: { score: 93, errors: 0, duration: 59000 },
    };

    getCurrentToken.mockReturnValue('test-token');
    mockUseTelemetry.mockReturnValue({
      sessionData: mockSessionData,
      participantProfile: { participantId: 'participant-unsafe' },
      getSessionMetadata: vi.fn(() => ({ startedAt: '2026-05-13T00:00:00.000Z' })),
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    renderReport({ useDummyData: false });

    await waitFor(
      () => {
        expect(screen.getByText(/talent signal context|contexto de la señal de talento/i)).toBeDefined();
      },
      { timeout: 10000 },
    );
    expect(warnSpy).toHaveBeenCalledWith(
      '[Report] blocked unsafe telemetry payload before persistence',
      expect.stringContaining('rawFrame'),
    );
    expect(saveSessionToBackend).not.toHaveBeenCalled();
  });

  it('shows local edge model output governance without automated hiring claims', async () => {
    const mockSessionData = {
      game1: { score: 82, errors: 1, duration: 60000 },
      game2: { score: 78, errors: 2, duration: 65000 },
      game3: { score: 74, errors: 1, duration: 55000 },
    };

    mockUseTelemetry.mockReturnValue({ sessionData: mockSessionData });

    renderReport({ useDummyData: false });

    await waitFor(
      () => {
        expect(screen.getByText(/local model output|salida del modelo local/i)).toBeDefined();
        expect(screen.getByText(/human review only|revisión humana obligatoria/i)).toBeDefined();
        expect(screen.getByText(/baseline_not_validated/i)).toBeDefined();
      },
      { timeout: 10000 },
    );
    expect(screen.queryByText(/hire decision|decisión automática de contratación/i)).toBeNull();
    expect(screen.queryByText(/lie detection|detección de mentiras/i)).toBeNull();
  });

  it('shows local signal audit caveats when facial coverage is low', async () => {
    const lowQualityWindow = createFacialWindow({
      durationMs: 5000,
      sampleCount: 8,
      quality: {
        facePresenceRatio: 0.42,
        meanDetectionConfidence: 0.5,
        meanIlluminationScore: 0.36,
        signalQualityScore: 38,
        flags: ['insufficient_facial_coverage', 'low_light'],
      },
      confidence: {
        windowConfidence: 0.42,
        interpretationAllowed: false,
      },
    });
    const mockSessionData = {
      game1: { score: 70, errors: 1, duration: 60000, facialWindows: [lowQualityWindow] },
      game2: { score: 72, errors: 1, duration: 65000, facialWindows: [lowQualityWindow] },
      game3: { score: 68, errors: 2, duration: 55000, facialWindows: [lowQualityWindow] },
    };

    mockUseTelemetry.mockReturnValue({ sessionData: mockSessionData });

    renderReport({ useDummyData: false });

    await waitFor(
      () => {
        expect(screen.getByText(/local signal audit|auditoría de señales locales/i)).toBeDefined();
        expect(screen.getByText(/facial coverage is low|cobertura facial baja/i)).toBeDefined();
        expect(screen.getByText(/quality flag: low_light|flag de calidad: low_light/i)).toBeDefined();
      },
      { timeout: 10000 },
    );
  });

  it('shows camera/model failure caveats in the report signal audit', async () => {
    const unavailableWindow = createFacialWindow({
      durationMs: 0,
      sampleCount: 0,
      quality: {
        facePresenceRatio: 0,
        meanDetectionConfidence: 0,
        signalQualityScore: 0,
        flags: ['camera_denied', 'facial_model_unavailable'],
      },
      confidence: {
        windowConfidence: 0,
        interpretationAllowed: false,
        reasonIfLowConfidence: 'webcam capture unavailable',
      },
    });
    const mockSessionData = {
      game1: { score: 70, errors: 1, duration: 60000, facialWindows: [unavailableWindow] },
      game2: { score: 72, errors: 1, duration: 65000, facialWindows: [unavailableWindow] },
      game3: { score: 68, errors: 2, duration: 55000, facialWindows: [unavailableWindow] },
    };

    mockUseTelemetry.mockReturnValue({ sessionData: mockSessionData });

    renderReport({ useDummyData: false });

    await waitFor(
      () => {
        expect(screen.getByText(/camera or the local facial model was unavailable|la cámara o el modelo facial local no estuvo disponible/i)).toBeDefined();
        expect(screen.getByText(/quality flag: camera_denied|flag de calidad: camera_denied/i)).toBeDefined();
      },
      { timeout: 10000 },
    );
  });
});