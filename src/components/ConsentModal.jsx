import React, { useState, useCallback } from 'react';
import { useLanguage } from '../context/LanguageContext';
import './ConsentModal.css';

/**
 * ConsentModal v2
 * 
 * Modal de consentimiento granular para recopilar datos telemétricos.
 * - Cursor tracking
 * - Webcam tracking
 * 
 * GDPR-compliant:
 * - Consentimiento explícito y granular
 * - Derecho de revocación
 * - Información clara de propósito
 * - Idioma accesible
 */
const ConsentModal = ({ isOpen, onConsentsReady, isDemo = false, language: languageFromProps }) => {
  const { language: globalLanguage, setLanguage } = useLanguage();
  const [cursorConsent, setCursorConsent] = useState(true); // Recomendado por defecto
  const [webcamConsent, setWebcamConsent] = useState(false); // Conservador
  const [hasReadPrivacy, setHasReadPrivacy] = useState(false);
  const selectedLanguage = languageFromProps || globalLanguage || 'es';
  const [permissionError, setPermissionError] = useState('');

  const texts = {
    es: {
      title: 'Consentimiento para Evaluación',
      intro: 'Para mejorar la calidad de tu evaluación, nos gustaría capturar algunos datos sobre tu interacción:',
      cursorTitle: '📱 Movimiento del Cursor',
      cursorDesc: 'Capturamos la posición, velocidad y patrones de tu cursor. Esto nos ayuda a entender tu velocidad de procesamiento y precisión. No grabamos contenido de pantalla.',
      webcamTitle: '📹 Webcam (Opcional)',
      webcamDesc: 'Si lo permites, capturamos video para medir: parpadeo, postura y nivel de atención. Esto es opcional y completamente reversible.',
      privacyTitle: 'Tu Privacidad',
      privacyText: 'Los datos se cifran en tránsito y reposo. Se retienen máximo 30 días tras la evaluación. Tienes derecho a solicitar acceso, corrección o borrado en cualquier momento.',
      dataUsage: 'Uso de Datos',
      dataUsageText: 'Los datos se usan SOLO para evaluación de habilidades cognitivas y laborales. No se comparten con terceros sin consentimiento explícito.',
      privacyCheck: '✓ He leído y acepto la política de privacidad',
      continue: 'Continuar con la Evaluación',
      revokeAnytime: 'Puedes revocar este consentimiento en cualquier momento.',
      webcamDenied: 'No se pudo acceder a la cámara. Continuaremos solo con telemetría de cursor.'
    },
    en: {
      title: 'Evaluation Consent',
      intro: 'To improve your assessment quality, we\'d like to capture some data about your interaction:',
      cursorTitle: '📱 Cursor Movement',
      cursorDesc: 'We capture cursor position, speed, and patterns. This helps us understand your processing speed and precision. We do not record screen content.',
      webcamTitle: '📹 Webcam (Optional)',
      webcamDesc: 'If allowed, we capture video to measure: blink rate, posture, and attention level. This is optional and fully reversible.',
      privacyTitle: 'Your Privacy',
      privacyText: 'Data is encrypted in transit and at rest. Retained for maximum 30 days after assessment. You have the right to request access, correction, or deletion anytime.',
      dataUsage: 'Data Usage',
      dataUsageText: 'Data is used ONLY for cognitive and job-relevant skills assessment. Not shared with third parties without explicit consent.',
      privacyCheck: '✓ I have read and accept the privacy policy',
      continue: 'Continue with Assessment',
      revokeAnytime: 'You can revoke this consent at any time.',
      webcamDenied: 'Camera access was denied. We will continue with cursor telemetry only.'
    }
  };

  const text = texts[selectedLanguage];

  const handleConsent = useCallback(async () => {
    if (!hasReadPrivacy && !isDemo) {
      alert(selectedLanguage === 'en'
        ? 'Please confirm you have read the privacy policy.'
        : 'Por favor, confirma que has leido la politica de privacidad.');
      return;
    }

    setPermissionError('');
    let webcamAllowed = webcamConsent;

    // Pre-flight permission request so we can gracefully fallback before starting the game.
    if (webcamConsent && !isDemo && typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        stream.getTracks().forEach((track) => track.stop());
      } catch {
        webcamAllowed = false;
        setPermissionError(selectedLanguage === 'en'
          ? 'Camera access was denied. We will continue with cursor telemetry only.'
          : 'No se pudo acceder a la camara. Continuaremos solo con telemetria de cursor.');
      }
    }

    onConsentsReady({
      cursor: cursorConsent,
      webcam: webcamAllowed,
      requestedWebcam: webcamConsent,
      timestamp: new Date().toISOString()
    });
  }, [cursorConsent, webcamConsent, hasReadPrivacy, isDemo, onConsentsReady, selectedLanguage]);

  if (!isOpen) return null;

  return (
    <div className="consent-modal-overlay">
      <div className="consent-modal">
        {/* Header con idioma */}
        <div className="consent-header">
          <h1>{text.title}</h1>
          <div className="language-switcher">
            <button 
              className={selectedLanguage === 'es' ? 'active' : ''} 
              onClick={() => setLanguage('es')}
            >
              ES
            </button>
            <button 
              className={selectedLanguage === 'en' ? 'active' : ''} 
              onClick={() => setLanguage('en')}
            >
              EN
            </button>
          </div>
        </div>

        {/* Introducción */}
        <div className="consent-section intro">
          <p>{text.intro}</p>
        </div>

        {/* Cursor Consent */}
        <div className="consent-section consent-item">
          <div className="consent-checkbox">
            <input
              type="checkbox"
              id="cursor-consent"
              checked={cursorConsent}
              onChange={(e) => setCursorConsent(e.target.checked)}
              disabled={isDemo}
            />
            <label htmlFor="cursor-consent">{text.cursorTitle}</label>
          </div>
          <p className="consent-description">{text.cursorDesc}</p>
        </div>

        {/* Webcam Consent */}
        <div className="consent-section consent-item">
          <div className="consent-checkbox">
            <input
              type="checkbox"
              id="webcam-consent"
              checked={webcamConsent}
              onChange={(e) => setWebcamConsent(e.target.checked)}
            />
            <label htmlFor="webcam-consent">{text.webcamTitle}</label>
          </div>
          <p className="consent-description">{text.webcamDesc}</p>
        </div>

        {/* Privacy Info */}
        <div className="consent-section privacy-info">
          <h3>{text.privacyTitle}</h3>
          <p>{text.privacyText}</p>

          <h3>{text.dataUsage}</h3>
          <p>{text.dataUsageText}</p>

          <p className="revoke-notice">{text.revokeAnytime}</p>
          {permissionError && <p className="permission-error">{permissionError}</p>}
        </div>

        {/* Privacy Policy Acknowledgment */}
        {!isDemo && (
          <div className="consent-section privacy-checkbox">
            <label>
              <input
                type="checkbox"
                checked={hasReadPrivacy}
                onChange={(e) => setHasReadPrivacy(e.target.checked)}
              />
              <span>{text.privacyCheck}</span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="consent-actions">
          <button 
            className="consent-button primary"
            onClick={handleConsent}
            disabled={!hasReadPrivacy && !isDemo}
          >
            {text.continue}
          </button>
        </div>

        {/* Footer */}
        <div className="consent-footer">
          <small>
            {isDemo ? '(Modo Demo - Consentimiento simulado)' : '(Consentimiento requerido para continuar)'}
          </small>
        </div>
      </div>
    </div>
  );
};

export default ConsentModal;
