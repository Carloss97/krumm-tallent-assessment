import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authenticateRecruiter } from '../services/backendService';
import './RecruiterLogin.css';

const RecruiterLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

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

  return (
    <div className="recruiter-login-page">
      <div className="login-background"></div>

      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>👥 Recruiter Access</h1>
            <p>View assessment analytics and insights</p>
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
                required
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
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              disabled={isLoading}
              className="submit-btn"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
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
