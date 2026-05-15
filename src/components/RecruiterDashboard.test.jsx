import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import RecruiterDashboard from './RecruiterDashboard';

vi.mock('../services/backendService', () => ({
  getCurrentToken: vi.fn(() => 'recruiter-token'),
  clearToken: vi.fn(),
  getRecruiterSessions: vi.fn(),
  getRecruiterAnalyticsV2: vi.fn(),
}));

vi.mock('../utils/qaMode', () => ({
  getQaMode: vi.fn(() => false),
}));

vi.mock('../utils/gameShellHealth', () => ({
  getGameShellHealthSnapshot: vi.fn(() => ({
    totalRuntimeErrors: 0,
    totalRecoveries: 0,
    totalExits: 0,
    errorsByGameId: {},
    events: [],
  })),
  getGameShellErrorTrend24h: vi.fn(() => []),
  getGameShellRecoveryTrend24h: vi.fn(() => []),
  resetGameShellHealth: vi.fn(() => ({
    totalRuntimeErrors: 0,
    totalRecoveries: 0,
    totalExits: 0,
    errorsByGameId: {},
    events: [],
  })),
}));

const backendService = await import('../services/backendService');

const renderDashboard = () => render(
  <MemoryRouter>
    <RecruiterDashboard />
  </MemoryRouter>
);

describe('RecruiterDashboard edge-local model governance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    backendService.getRecruiterAnalyticsV2.mockResolvedValue({
      totalSessions: 1,
      last24hSessions: 1,
      recommendationDistribution: {},
      quality: { status: 'OK', syntheticOutcomes: false, outcomeSource: 'aggregate_metadata_only' },
      calibration: null,
      kpiSnapshot: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('summarizes metadata-only edge model outputs for recruiter review', async () => {
    backendService.getRecruiterSessions.mockResolvedValue({
      sessions: [{
        id: 'session-edge-001',
        participant_id: 'candidate-edge-001',
        participant_email: 'candidate@example.test',
        created_at: '2026-05-14T12:00:00.000Z',
        payload: {
          sessionData: {
            telemetry: {
              game1: { score: 82, duration: 60000 },
              game2: { score: 76, duration: 58000 },
            },
            edgeLocalModelOutput: {
              type: 'edge_local_model_output_v1',
              scorePercent: 74,
              confidenceScore: 68,
              decisionPolicy: 'human_review_only',
              qualityFlags: ['low_light'],
              caveats: ['Low lighting reduced facial signal quality.'],
              model: {
                calibrationStatus: 'baseline_not_validated',
              },
              privacy: {
                source: 'aggregate_metadata_only',
                rawVideoStored: false,
                rawFramesStored: false,
                landmarksStored: false,
                audioCaptured: false,
              },
            },
          },
        },
      }],
    });

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/edge model governance/i)).toBeDefined();
      expect(screen.getAllByText((_, element) => element?.textContent === '1/1 human review only').length).toBeGreaterThan(0);
      expect(screen.getAllByText(/baseline_not_validated/i).length).toBeGreaterThan(0);
      expect(screen.getAllByText('74%').length).toBeGreaterThan(0);
      expect(screen.getAllByText('68%').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByText(/metadata-only/i).length).toBeGreaterThan(0);
    expect(screen.queryByText(/rawFrame|faceLandmarks|data:image|base64/i)).toBeNull();
    expect(screen.queryByText(/hire decision|lie detection|personality inference/i)).toBeNull();
  });
});
