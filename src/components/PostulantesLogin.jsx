import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import { authenticateParticipant } from '../services/backendService';
import logo from '../assets/logo.jpg';
import './PostulantesLogin.css';

export default function PostulantesLogin() {
  const [form, setForm] = useState({ token: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const telemetry = useTelemetry();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const authRes = await authenticateParticipant({ participantId: form.token.trim(), accessCode: form.password.trim() });
      try {
        telemetry && telemetry.setParticipantProfile && telemetry.setParticipantProfile({
          fullName: authRes.participant?.fullName || 'Participante',
          participantId: authRes.participant?.participantId || form.token,
          email: authRes.participant?.email || '',
          authenticatedAt: authRes.authenticatedAt || new Date().toISOString(),
          participantToken: authRes.participantToken || null,
          source: 'portal_login'
        });
      } catch (error) { void error; }
      window.dataLayer?.push({ event: 'portal_login_success' });
      navigate('/game/1');
    } catch (error) {
      setError(error?.message || 'Error al iniciar sesión. Verifica tus datos.');
      window.dataLayer?.push({ event: 'portal_login_failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="postulantes-login" role="main">
      <div className="pl-card" role="form" aria-labelledby="pl-title">
        <img src={logo} alt="Krumm" className="pl-logo" />
        <h1 id="pl-title">Portal de Postulantes</h1>
        <p className="pl-instructions">Introduce tu Token o RUT y contraseña para comenzar.</p>

        <form className="pl-form" onSubmit={handleSubmit} autoComplete="on">
          <label htmlFor="token">Token / RUT</label>
          <input id="token" name="token" type="text" value={form.token} onChange={handleChange} autoComplete="off" required />

          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />

          {error && <div className="pl-error" role="alert">{error}</div>}

          <button type="submit" className="pl-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>

          <a className="pl-link" href="/password-recovery">¿Olvidaste tu contraseña?</a>
        </form>
      </div>
    </main>
  );
}
