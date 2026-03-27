import React, { useMemo, useEffect } from 'react';
import './GameExitModal.css';

const GameExitModal = ({ isOpen, language = 'es', onConfirm, onCancel }) => {
  const t = useMemo(() => ({
    title: language === 'en' ? 'Leave session?' : '¿Salir de la sesion?',
    body: language === 'en'
      ? 'Your current game progress will be lost.'
      : 'Se perdera el progreso actual del juego.',
    confirm: language === 'en' ? 'Leave' : 'Salir',
    cancel: language === 'en' ? 'Continue' : 'Continuar',
  }), [language]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="game-exit-modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-exit-title"
      onClick={() => onCancel?.()}
    >
      <div className="game-exit-modal-card" onClick={(event) => event.stopPropagation()}>
        <h3 id="game-exit-title">{t.title}</h3>
        <p>{t.body}</p>
        <div className="game-exit-modal-actions">
          <button type="button" className="game-exit-btn-secondary" onClick={onCancel}>
            {t.cancel}
          </button>
          <button type="button" className="game-exit-btn-danger" onClick={onConfirm} autoFocus>
            {t.confirm}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameExitModal;
