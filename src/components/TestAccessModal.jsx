import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { authenticateParticipant } from '../services/backendService';
import './TestAccessModal.css';

const TestAccessModal = ({ isOpen = true, onClose = () => {} }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const telemetry = useTelemetry();
  const { setIsDemo, setParticipantProfile, recordTrialEvent } = telemetry || {};

  const [participantId, setParticipantId] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      recordTrialEvent && recordTrialEvent({ event: 'cta_test_login_attempt', participantId });

      const authRes = await authenticateParticipant({ participantId: participantId.trim(), accessCode: accessCode.trim() });

      setIsDemo && setIsDemo(false);
      setParticipantProfile && setParticipantProfile({
        fullName: authRes.participant.fullName,
        participantId: authRes.participant.participantId,
        email: authRes.participant.email,
        authenticatedAt: authRes.authenticatedAt,
        participantToken: authRes.participantToken,
        preferredLanguage: language,
        source: 'landing_credentials_quick'
      });

      recordTrialEvent && recordTrialEvent({ event: 'cta_test_login_success', participantId });

      onClose();
      navigate(`/game/1?lang=${language}`);
    } catch (err) {
      const msg = err?.message || (language === 'en' ? 'Unable to validate credentials.' : 'No fue posible validar tus credenciales.');
      setError(msg);
      recordTrialEvent && recordTrialEvent({ event: 'cta_test_login_failed', participantId, error: msg });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tam-overlay" role="dialog" aria-modal="true">
      <div className="tam-card">
        <button className="tam-close" onClick={onClose} aria-label="Close">✕</button>
        <h2>{language === 'en' ? 'Start test' : 'Iniciar prueba'}</h2>
        <p className="tam-desc">{language === 'en' ? 'Enter the credentials provided by your company.' : 'Ingresa las credenciales entregadas por tu empresa.'}</p>

        <form className="tam-form" onSubmit={handleSubmit}>
          <label htmlFor="tam-participantId">{language === 'en' ? 'Participant ID' : 'ID de participante'}</label>
          <input id="tam-participantId" name="participantId" value={participantId} onChange={(e) => setParticipantId(e.target.value)} placeholder={language === 'en' ? 'KRUMM-2026-001' : 'KRUMM-2026-001'} required />

          <label htmlFor="tam-accessCode">{language === 'en' ? 'Access code' : 'Código de acceso'}</label>
          <input id="tam-accessCode" name="accessCode" type="password" value={accessCode} onChange={(e) => setAccessCode(e.target.value)} placeholder="••••••" required minLength={4} />

          {error && <div className="tam-error">{error}</div>}

          <div className="tam-actions">
            <button type="submit" className="tam-submit" disabled={isSubmitting}>{isSubmitting ? (language === 'en' ? 'Validating...' : 'Validando...') : (language === 'en' ? 'Start test' : 'Iniciar prueba')}</button>
            <button type="button" className="tam-ghost" onClick={onClose}>{language === 'en' ? 'Cancel' : 'Cancelar'}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TestAccessModal;
