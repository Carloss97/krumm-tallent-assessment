import React, { useMemo } from 'react';
import { X, Zap } from 'lucide-react';
import './GameSessionHeader.css';

/**
 * Pure UI component for game session header.
 * Displays: game info, progress, timer, telemetry status, exit button.
 * No critical business logic; safe to disable via feature flag.
 */
const GameSessionHeader = ({
  gameConfig,
  gameId,
  isActive,
  timeLimit,
  language = 'es',
  telemetryStatus = {},
  onExit = null,
  isDev = false,
}) => {
  const t = useMemo(() => ({
    progress: language === 'en' ? 'Progress' : 'Progreso',
    of: language === 'en' ? 'of' : 'de',
    exit: language === 'en' ? 'Exit' : 'Salir',
    webcamActive: language === 'en' ? 'Webcam On' : 'Cámara Activa',
    webcamInactive: language === 'en' ? 'Webcam Off' : 'Cámara Inactiva',
    cursorTracking: language === 'en' ? 'Cursor Tracking' : 'Seguimiento Cursor',
  }), [language]);

  if (!gameConfig || !isActive) return null;

  const gameName = gameConfig.name || `Game ${gameId}`;
  const progress = `${gameId}/13`;
  const timeLimitDisplayed = (timeLimit && timeLimit !== 'None' && timeLimit !== 'Timed')
    ? `${timeLimit}s`
    : null;

  return (
    <header className="game-session-header">
      <div className="header-left">
        <div className="header-game-info">
          <h3 className="header-game-name">{gameName}</h3>
          <span className="header-progress">
            {t.progress}: {progress}
          </span>
        </div>
      </div>

      <div className="header-center">
        {timeLimitDisplayed && (
          <span className="header-timer">⏱️ {timeLimitDisplayed}</span>
        )}
      </div>

      <div className="header-right">
        <div className="header-telemetry">
          {telemetryStatus.webcam !== undefined && (
            <span
              className={`telemetry-badge ${telemetryStatus.webcam ? 'webcam-active' : 'webcam-inactive'}`}
              title={telemetryStatus.webcam ? t.webcamActive : t.webcamInactive}
            >
              📷
            </span>
          )}
          {telemetryStatus.cursor !== undefined && (
            <span
              className="telemetry-badge cursor-tracking"
              title={t.cursorTracking}
            >
              <Zap size={14} />
            </span>
          )}
        </div>

        {onExit && (
          <button
            type="button"
            className="header-exit-btn"
            onClick={onExit}
            title={t.exit}
            aria-label={t.exit}
          >
            <X size={18} />
          </button>
        )}
      </div>
    </header>
  );
};

export default GameSessionHeader;
