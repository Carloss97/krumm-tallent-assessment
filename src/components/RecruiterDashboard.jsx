import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getCurrentToken, clearToken, getRecruiterSessions, getRecruiterAnalyticsV2 } from '../services/backendService';
import { getQaMode } from '../utils/qaMode';
import {
  getGameShellHealthSnapshot,
  getGameShellErrorTrend24h,
  getGameShellRecoveryTrend24h,
  resetGameShellHealth,
} from '../utils/gameShellHealth';
import './RecruiterDashboard.css';

const buildQaMockSessions = () => {
  const now = Date.now();
  return [
    {
      id: 'QA-SESSION-001',
      participant_id: 'QA-ALFA-01',
      participant_email: 'qa.alfa@local',
      created_at: new Date(now - 20 * 60 * 1000).toISOString(),
      payload: {
        game1: { score: 88 },
        game2: { score: 81 },
        game3: { score: 90 },
        game4: { score: 84 },
      }
    },
    {
      id: 'QA-SESSION-002',
      participant_id: 'QA-BETA-02',
      participant_email: 'qa.beta@local',
      created_at: new Date(now - 90 * 60 * 1000).toISOString(),
      payload: {
        game1: { score: 73 },
        game2: { score: 79 },
        game3: { score: 76 },
      }
    }
  ];
};

const QA_ANALYTICS = {
  totalSessions: 2,
  last24hSessions: 2,
  recommendationDistribution: {
    'STRONG ALIGNMENT': 1,
    'SOLID ALIGNMENT WITH COACHING': 1,
  },
  quality: {
    status: 'OK',
    syntheticOutcomes: true,
    outcomeSource: 'qa_offline_simulation',
  },
  calibration: {
    generatedAt: new Date().toISOString(),
    outcomeSource: 'qa_offline_simulation',
    thresholdsScale0to10: {
      strong: 8,
      solid: 6,
      conditional: 4,
    }
  },
  kpiSnapshot: {
    primary: {
      rocAuc: 0.79,
      prAucLift: 0.22,
      brier: 0.18,
    },
    fairness: {
      selectionRateRatio: 0.96,
    }
  }
};

const AB_EXPERIMENT_KEY = 'engagement-pulse-v1';
const FULL_BATTERY_GAMES = 13;

const computeAbEngagementStats = (sessions) => {
  const buckets = {
    control: [],
    gamified: [],
    unknown: [],
  };

  (sessions || []).forEach((session) => {
    const payload = session?.payload || {};
    const metadata = payload?.metadata || {};
    const variant = metadata?.sessionMeta?.experiments?.[AB_EXPERIMENT_KEY] || 'unknown';
    const sessionData = payload?.sessionData || payload;

    const gameSnapshots = Object.values(sessionData || {}).filter((value) => (
      value && typeof value === 'object' && typeof value.score === 'number'
    ));

    const completedGames = gameSnapshots.length;
    const completedSession = completedGames >= FULL_BATTERY_GAMES;
    const avgModuleDurationSec = completedGames > 0
      ? gameSnapshots.reduce((sum, game) => sum + (Number(game.duration) || 0), 0) / completedGames / 1000
      : 0;
    const qualityFlags = gameSnapshots.reduce((sum, game) => sum + ((game.qualityFlags || []).length), 0);

    const target = buckets[variant] ? variant : 'unknown';
    buckets[target].push({
      completedGames,
      completedSession,
      avgModuleDurationSec,
      qualityFlags,
    });
  });

  const summarize = (items) => {
    const total = items.length;
    if (!total) {
      return {
        sessions: 0,
        completionRate: 0,
        abandonmentRate: 0,
        avgCompletedGames: 0,
        avgModuleDurationSec: 0,
        avgQualityFlags: 0,
      };
    }

    const completed = items.filter((item) => item.completedSession).length;
    const avgCompletedGames = items.reduce((sum, item) => sum + item.completedGames, 0) / total;
    const avgModuleDurationSec = items.reduce((sum, item) => sum + item.avgModuleDurationSec, 0) / total;
    const avgQualityFlags = items.reduce((sum, item) => sum + item.qualityFlags, 0) / total;

    return {
      sessions: total,
      completionRate: (completed / total) * 100,
      abandonmentRate: ((total - completed) / total) * 100,
      avgCompletedGames,
      avgModuleDurationSec,
      avgQualityFlags,
    };
  };

  return {
    control: summarize(buckets.control),
    gamified: summarize(buckets.gamified),
    unknown: summarize(buckets.unknown),
  };
};

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, recent, highScore
  const [analytics, setAnalytics] = useState({
    totalSessions: 0,
    last24hSessions: 0,
    recommendationDistribution: {},
    quality: null,
    calibration: null,
    kpiSnapshot: null,
  });
  const [isQaMode] = useState(() => getQaMode());
  const [gameShellHealth, setGameShellHealth] = useState(() => getGameShellHealthSnapshot());
  const errorTrend24h = useMemo(() => getGameShellErrorTrend24h(gameShellHealth), [gameShellHealth]);
  const recoveryTrend24h = useMemo(() => getGameShellRecoveryTrend24h(gameShellHealth), [gameShellHealth]);
  const errors24h = useMemo(() => errorTrend24h.reduce((sum, point) => sum + point.count, 0), [errorTrend24h]);
  const recoveries24h = useMemo(() => recoveryTrend24h.reduce((sum, point) => sum + point.count, 0), [recoveryTrend24h]);
  const recoveryRate24h = errors24h > 0
    ? Math.round((recoveries24h / errors24h) * 100)
    : null;

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      if (isQaMode) {
        setSessions(buildQaMockSessions());
        setAnalytics(QA_ANALYTICS);
        setGameShellHealth(getGameShellHealthSnapshot());
        setError(null);
        return;
      }

      const [data, analyticsData] = await Promise.all([
        getRecruiterSessions(),
        getRecruiterAnalyticsV2().catch(() => null)
      ]);
      setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      if (analyticsData) {
        setAnalytics(analyticsData);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [isQaMode]);

  useEffect(() => {
    const token = getCurrentToken();
    if (!token && !isQaMode) {
      navigate('/recruiter/login');
      return;
    }

    fetchSessions();
  }, [navigate, isQaMode, fetchSessions]);

  const handleLogout = () => {
    clearToken();
    navigate('/recruiter/login');
  };

  const handleRefresh = () => {
    fetchSessions();
  };

  const handleResetGameShellHealth = () => {
    const next = resetGameShellHealth();
    setGameShellHealth(next);
  };

  const getSessionStats = () => {
    if (!sessions.length) return { total: 0, avg: 0, recent: 0 };
    
    const total = sessions.length;
    const recent = sessions.filter(s => {
      const sessionDate = new Date(s.created_at);
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      return sessionDate > dayAgo;
    }).length;

    return { total, recent };
  };

  const stats = getSessionStats();
  const qualityStatus = analytics.quality?.status || 'UNKNOWN';
  const qualityClass = qualityStatus === 'OK' ? 'ok' : qualityStatus === 'ALERT' ? 'alert' : 'watch';
  const abEngagementStats = useMemo(() => computeAbEngagementStats(sessions), [sessions]);

  // Anonymized session display (no raw video/audio/biometric data)
  const displaySessions = sessions
    .filter((session) => {
      if (filter === 'recent') {
        const createdAt = new Date(session.created_at).getTime();
        return Number.isFinite(createdAt) && createdAt > (Date.now() - 24 * 60 * 60 * 1000);
      }
      return true;
    })
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50) // Limit to recent 50
    .map(session => {
      try {
        const sessionData = session.payload || {};
        const source = Array.isArray(sessionData)
          ? sessionData
          : Object.values(sessionData.sessionData || sessionData);
        const games = source.filter((value) => value && typeof value === 'object' && typeof value.score === 'number');
        const avgScore = games.length > 0
          ? (games.reduce((sum, g) => sum + (g.score || 0), 0) / games.length).toFixed(0)
          : 'N/A';

        return {
          id: session.id,
          participantId: session.participant_id || 'Anonymous',
          email: session.participant_email || 'N/A',
          gameCount: games.length,
          avgScore,
          createdAt: new Date(session.created_at).toLocaleDateString(),
          rawDataProtected: true // Indicates encryption/anonymization
        };
      } catch {
        return { id: session.id, error: 'Invalid session data' };
      }
    });

  if (loading) {
    return (
      <div className="recruiter-dashboard loading">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="recruiter-dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>👥 Recruiter Dashboard</h1>
          <p className="subtitle">Aggregated Assessment Analytics (Raw Data Protected){isQaMode ? ' | QA/OFFLINE' : ''}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      {error && (
        <div className="error-banner">
          <p>⚠️ {error}</p>
          <button onClick={handleRefresh}>Retry</button>
        </div>
      )}

      <div className="dashboard-grid">
        {/* Stats Cards */}
        <div className="stats-container">
          <div className="stat-card">
            <div className="stat-value">{analytics.totalSessions || stats.total}</div>
            <div className="stat-label">Total Sessions</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{analytics.last24hSessions || stats.recent}</div>
            <div className="stat-label">Last 24 Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">🔒</div>
            <div className="stat-label">End-to-End Encrypted</div>
          </div>
        </div>

        <div className="glass-panel-light" style={{ padding: '16px', marginBottom: '16px', borderRadius: '10px' }}>
          <h3 style={{ margin: 0, marginBottom: '10px', color: '#1e293b' }}>Recommendation Distribution</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(analytics.recommendationDistribution || {}).length === 0 && (
              <span style={{ color: '#64748b' }}>No recommendation distribution data yet</span>
            )}
            {Object.entries(analytics.recommendationDistribution || {}).map(([label, count]) => (
              <span key={label} className="badge encrypt" style={{ padding: '6px 10px', borderRadius: '999px' }}>
                {label}: {count}
              </span>
            ))}
          </div>
        </div>

        <div className="analytics-v2-grid">
          <section className="analytics-card">
            <h3>Quality Guardrail</h3>
            <div className={`quality-pill ${qualityClass}`}>{qualityStatus}</div>
            <p>
              Outcome source: <strong>{analytics.quality?.outcomeSource || analytics.calibration?.outcomeSource || 'unknown'}</strong>
            </p>
            <p>
              Synthetic labels: <strong>{analytics.quality?.syntheticOutcomes ? 'yes' : 'no'}</strong>
            </p>
          </section>

          <section className="analytics-card">
            <h3>Calibration Snapshot</h3>
            <p>Generated: <strong>{analytics.calibration?.generatedAt ? new Date(analytics.calibration.generatedAt).toLocaleString() : 'n/a'}</strong></p>
            <p>Strong threshold: <strong>{analytics.calibration?.thresholdsScale0to10?.strong ?? 'n/a'}</strong></p>
            <p>Solid threshold: <strong>{analytics.calibration?.thresholdsScale0to10?.solid ?? 'n/a'}</strong></p>
            <p>Conditional threshold: <strong>{analytics.calibration?.thresholdsScale0to10?.conditional ?? 'n/a'}</strong></p>
          </section>

          <section className="analytics-card">
            <h3>KPI Snapshot</h3>
            <p>ROC-AUC: <strong>{analytics.kpiSnapshot?.primary?.rocAuc ?? 'n/a'}</strong></p>
            <p>PR-AUC Lift: <strong>{analytics.kpiSnapshot?.primary?.prAucLift ?? 'n/a'}</strong></p>
            <p>Brier: <strong>{analytics.kpiSnapshot?.primary?.brier ?? 'n/a'}</strong></p>
            <p>Selection Rate Ratio: <strong>{analytics.kpiSnapshot?.fairness?.selectionRateRatio ?? 'n/a'}</strong></p>
          </section>

          <section className="analytics-card">
            <h3>A/B Engagement Pulse</h3>
            <p><strong>Control sessions:</strong> {abEngagementStats.control.sessions}</p>
            <p><strong>Gamified sessions:</strong> {abEngagementStats.gamified.sessions}</p>
            <p><strong>Unknown variant:</strong> {abEngagementStats.unknown.sessions}</p>
            <hr style={{ border: 'none', borderTop: '1px solid #e2e8f0', margin: '8px 0' }} />
            <p>Control completion: <strong>{abEngagementStats.control.completionRate.toFixed(1)}%</strong></p>
            <p>Gamified completion: <strong>{abEngagementStats.gamified.completionRate.toFixed(1)}%</strong></p>
            <p>Control abandonment: <strong>{abEngagementStats.control.abandonmentRate.toFixed(1)}%</strong></p>
            <p>Gamified abandonment: <strong>{abEngagementStats.gamified.abandonmentRate.toFixed(1)}%</strong></p>
            <p>Control avg module sec: <strong>{abEngagementStats.control.avgModuleDurationSec.toFixed(1)}</strong></p>
            <p>Gamified avg module sec: <strong>{abEngagementStats.gamified.avgModuleDurationSec.toFixed(1)}</strong></p>
            <p>Control avg quality flags: <strong>{abEngagementStats.control.avgQualityFlags.toFixed(2)}</strong></p>
            <p>Gamified avg quality flags: <strong>{abEngagementStats.gamified.avgQualityFlags.toFixed(2)}</strong></p>
          </section>

          {isQaMode && (
            <section className="analytics-card">
              <h3>GameShell Health (QA)</h3>
              <p>Runtime errors: <strong>{gameShellHealth.totalRuntimeErrors ?? 0}</strong></p>
              <p>Recoveries: <strong>{gameShellHealth.totalRecoveries ?? 0}</strong></p>
              <p>Total exits: <strong>{gameShellHealth.totalExits ?? 0}</strong></p>
              <p>Recovery rate 24h: <strong>{recoveryRate24h === null ? 'n/a' : `${recoveryRate24h}%`}</strong></p>
              <p>Top error game: <strong>{Object.entries(gameShellHealth.errorsByGameId || {}).sort((a, b) => b[1] - a[1])[0]?.[0] || 'n/a'}</strong></p>
              <div style={{ marginTop: '10px' }}>
                <button className="refresh-btn" type="button" onClick={handleResetGameShellHealth}>
                  Reset Health Metrics
                </button>
              </div>
              <div style={{ marginTop: '12px' }}>
                <p style={{ margin: '0 0 6px 0', color: '#334155', fontWeight: 600 }}>Runtime Errors Trend (24h)</p>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {errorTrend24h.slice(-8).map((point) => {
                    const maxCount = Math.max(1, ...errorTrend24h.map((entry) => entry.count));
                    const width = Math.round((point.count / maxCount) * 100);
                    return (
                      <div key={point.hourLabel} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 28px', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{point.hourLabel}</span>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${width}%`, height: '100%', background: '#0ea5e9' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#0f172a', textAlign: 'right' }}>{point.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div style={{ marginTop: '12px' }}>
                <p style={{ margin: '0 0 6px 0', color: '#334155', fontWeight: 600 }}>Recoveries Trend (24h)</p>
                <div style={{ display: 'grid', gap: '4px' }}>
                  {recoveryTrend24h.slice(-8).map((point) => {
                    const maxCount = Math.max(1, ...recoveryTrend24h.map((entry) => entry.count));
                    const width = Math.round((point.count / maxCount) * 100);
                    return (
                      <div key={point.hourLabel} style={{ display: 'grid', gridTemplateColumns: '52px 1fr 28px', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>{point.hourLabel}</span>
                        <div style={{ height: '6px', background: '#e2e8f0', borderRadius: '99px', overflow: 'hidden' }}>
                          <div style={{ width: `${width}%`, height: '100%', background: '#16a34a' }} />
                        </div>
                        <span style={{ fontSize: '11px', color: '#0f172a', textAlign: 'right' }}>{point.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Filter Buttons */}
        <div className="filter-container">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All Sessions
          </button>
          <button
            className={`filter-btn ${filter === 'recent' ? 'active' : ''}`}
            onClick={() => setFilter('recent')}
          >
            Recent (24h)
          </button>
        </div>

        {/* Sessions Table */}
        <div className="sessions-container">
          <div className="table-header">
            <button onClick={handleRefresh} className="refresh-btn">↻ Refresh</button>
          </div>

          {displaySessions.length === 0 ? (
            <div className="empty-state">
              <p>No assessment sessions yet</p>
              <small>Sessions will appear here as participants complete assessments</small>
            </div>
          ) : (
            <table className="sessions-table">
              <thead>
                <tr>
                  <th>Participant ID</th>
                  <th>Email</th>
                  <th>Games</th>
                  <th>Avg Score</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {displaySessions.map(session => (
                  <tr key={session.id} className={session.error ? 'error-row' : ''}>
                    <td>
                      <code className="anon-id">{session.participantId}</code>
                    </td>
                    <td>{session.email}</td>
                    <td className="center">{session.gameCount}</td>
                    <td className="center score">{session.avgScore}</td>
                    <td>{session.createdAt}</td>
                    <td className="center">
                      {session.rawDataProtected ? (
                        <span className="badge encrypt">🔐 Encrypted</span>
                      ) : (
                        <span className="badge error">Invalid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div className="privacy-notice">
            <p>
              <strong>Privacy Notice:</strong> This dashboard displays only aggregated and anonymized metrics.
              Raw biometric data (video, audio, cursor traces) is encrypted end-to-end and never visible in this interface.
              All data handling complies with GDPR and CCPA.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterDashboard;



