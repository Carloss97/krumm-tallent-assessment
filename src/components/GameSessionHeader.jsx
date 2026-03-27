import React, { useMemo, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './GameSessionHeader.css';

/**
 * Pure UI component for game session header.
 * Displays: game name, timer (live countdown), exit button.
 * No critical business logic; safe to disable via feature flag.
 */
const GameSessionHeader = ({
  gameConfig,
  gameId,
  isActive,
  timeLimit,
  language = 'es',
  errorMessage = '',
  onExit = null,
}) => {
  const t = useMemo(() => ({
    exit: language === 'en' ? 'Exit' : 'Salir',
  }), [language]);

  const [remainingTime, setRemainingTime] = useState(null);

  useEffect(() => {
    if (!isActive || !timeLimit || timeLimit === 'None' || timeLimit === 'Timed') {
      return;
    }

    const initialTime = parseInt(timeLimit, 10);
    if (isNaN(initialTime)) return;

    setRemainingTime(initialTime);

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev && prev > 0) return prev - 1;
        return 0;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, timeLimit]);

  if (!gameConfig || !isActive) return null;

  const gameName = gameConfig.name || `Game ${gameId}`;

  const getTimerColor = () => {
    if (!remainingTime) return 'normal';
    if (remainingTime <= 5) return 'critical';
    if (remainingTime <= 10) return 'warning';
    return 'normal';
  };

  return (
    <header className="game-session-header">
      <div className="header-content">
        <div className="header-game-info">
          <h3 className="header-game-name">{gameName}</h3>
        </div>
        {errorMessage && (
          <span className="header-error-pill" role="status">
            {errorMessage}
          </span>
        )}
      </div>

      {remainingTime !== null && (
        <span className={`header-timer timer-${getTimerColor()}`}>
          {remainingTime}s
        </span>
      )}

      <div className="header-right">
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
