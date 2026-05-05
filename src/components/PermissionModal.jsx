import React from 'react';
import { useLanguage } from '../context/LanguageContext';

const PermissionModal = ({ open, onClose, onRequest }) => {
  const { language } = useLanguage();
  if (!open) return null;

  const copy = {
    es: {
      title: 'Permisos de cámara y micrófono',
      body: 'Para generar el informe de la demo, solicitamos permiso para usar la cámara y el micrófono durante la sesión.',
      continue: 'Continuar sin permisos',
      request: 'Solicitar permisos',
      note: 'Puedes rechazar y seguir con la demo, pero el informe será menos preciso.'
    },
    en: {
      title: 'Camera & microphone permissions',
      body: 'To generate the demo report, we request permission to use your camera and microphone during the session.',
      continue: 'Continue without permissions',
      request: 'Request permissions',
      note: 'You can decline and continue, but the report will be less precise.'
    }
  };

  const c = copy[language] || copy.es;

  return (
    <div className="permission-overlay">
      <div className="permission-modal">
        <h3>{c.title}</h3>
        <p>{c.body}</p>
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button className="btn btn-ghost" onClick={onClose}>{c.continue}</button>
          <button className="btn" onClick={onRequest}>{c.request}</button>
        </div>
        <p style={{ marginTop: 10, color: '#6b7280' }}>{c.note}</p>
      </div>
    </div>
  );
};

export default PermissionModal;
