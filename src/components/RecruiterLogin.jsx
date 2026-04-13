import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateRecruiter, setQaAuthToken } from '../services/backendService';
import { getQaMode } from '../utils/qaMode';
import './RecruiterLogin.css';

const RecruiterLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isQaMode] = useState(() => getQaMode());
  const [showDevQuickAccess, setShowDevQuickAccess] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const host = (window.location.hostname || '').toLowerCase();
    const raw = import.meta.env.VITE_ALLOWED_DEV_HOSTS || 'localhost,127.0.0.1,::1,dev.krumm.cl';
    const allowed = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
    const matchesAllowed = allowed.includes(host) || allowed.some(p => p.startsWith('*.') && host.endsWith(p.replace('*.', '')));
    const isLocalSuffix = host.endsWith('.local');
    setShowDevQuickAccess(matchesAllowed || isLocalSuffix || window.location.port === '5173');
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Quick QA/demo access only when the host is allowed for dev access
    if (showDevQuickAccess && String(email).trim().toLowerCase() === 'recruiter@krumm.io' && password === 'demo-password') {
      setQaAuthToken();
      setIsLoading(false);
      navigate('/recruiter/dashboard?qa=1');
      return;
    }

    if (isQaMode) {
      setQaAuthToken();
      setIsLoading(false);
      navigate('/recruiter/dashboard?qa=1');
      return;
    }

    try {
      await authenticateRecruiter({
        email: email.trim(),
        password
      });

      navigate('/recruiter/dashboard');
    } catch (err) {
      setError(err.message || 'Login failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // QA toggle removed from UI; QA mode persists via localStorage if previously set

  const handleQaDirectAccess = () => {
    setQaAuthToken();
    navigate('/recruiter/dashboard?qa=1');
  };

  useEffect(() => {
    // If this page is opened in production/non-dev host, redirect to home
    if (typeof window === 'undefined') return;
    if (!showDevQuickAccess) {
      navigate('/');
    }
  }, [showDevQuickAccess, navigate]);

  return (
    <div className="recruiter-login-page">
      <div className="login-background"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>👥 Recruiter Access</h1>
            <p>View assessment analytics and insights</p>
            {/* QA toggle removed from Login UI */}
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="recruiter@krumm.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required={!isQaMode}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required={!isQaMode}
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
            >
              {isLoading ? 'Signing In...' : (isQaMode ? 'Enter QA Dashboard' : 'Sign In')}
            </button>

            {isQaMode && (
              <button
                type="button"
                className="submit-btn"
                style={{ marginTop: '10px', background: '#0ea5e9' }}
                onClick={handleQaDirectAccess}
              >
                Continue Offline (QA)
              </button>
            )}
          </form>

          <div className="demo-credentials">
            <p className="demo-label">Demo Credentials:</p>
            <code>
              📧 recruiter@krumm.io
              <br />
              🔑 demo-password
            </code>
          </div>

          <div className="access-note">
            <p>
              <strong>🔐 Privacy Note:</strong> This dashboard uses encrypted access tokens.
              Raw participant data (video, audio, biometric traces) is never displayed.
              All data access is logged and audited.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecruiterLogin;
