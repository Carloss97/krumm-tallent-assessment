import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import { authenticateParticipant } from '../services/backendService';
import logo from '../assets/logo.jpg';
import './CandidateLogin.css';

export default function CandidateLogin() {
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
    if (telemetry?.recordTrialEvent) telemetry.recordTrialEvent({ event: 'candidate_login_submit' });
    try {
      const authRes = await authenticateParticipant({ participantId: form.token.trim(), accessCode: form.password.trim() });
      if (telemetry?.setParticipantProfile) telemetry.setParticipantProfile({
        fullName: authRes.participant?.fullName || 'Participante',
        participantId: authRes.participant?.participantId || form.token,
        email: authRes.participant?.email || '',
        authenticatedAt: authRes.authenticatedAt || new Date().toISOString(),
        participantToken: authRes.participantToken || null,
        source: 'candidate_portal'
      });
      window.dataLayer?.push({ event: 'candidate_login_success' });
      if (telemetry?.recordTrialEvent) telemetry.recordTrialEvent({ event: 'candidate_login_success' });
      navigate('/game/1');
    } catch (err) {
      setError(err?.message || 'Error al iniciar sesión. Verifica tus datos.');
      window.dataLayer?.push({ event: 'candidate_login_failed' });
      if (telemetry?.recordTrialEvent) telemetry.recordTrialEvent({ event: 'candidate_login_failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="candidate-login" role="main">
      <div className="cl-card" role="form" aria-labelledby="cl-title">
        <img src={logo} alt="Krumm" className="cl-logo" />
        <h1 id="cl-title">Portal de Postulantes</h1>
        <p className="cl-instructions">Introduce tu Token/RUT y contraseña para comenzar. Si no tienes credenciales, contacta al reclutador.</p>

        <form className="cl-form" onSubmit={handleSubmit} autoComplete="on">
          <label htmlFor="token">Token / RUT</label>
          <input id="token" name="token" type="text" value={form.token} onChange={handleChange} autoComplete="off" required />

          <label htmlFor="password">Contraseña</label>
          <input id="password" name="password" type="password" value={form.password} onChange={handleChange} required />

          {error && <div className="cl-error" role="alert">{error}</div>}

          <button type="submit" className="cl-submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>

        </form>
      </div>
    </main>
  );
}
