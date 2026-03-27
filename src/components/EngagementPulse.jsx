import React, { useEffect, useMemo, useRef, useState } from 'react';
import './EngagementPulse.css';

const MS_PER_SECOND = 1000;

const getMessages = (language) => {
  const isEn = language === 'en';
  return {
    title: isEn ? 'Engagement Pulse' : 'Pulso de Engagement',
    subtitle: isEn ? 'Mission-based flow' : 'Flujo por misiones',
    progressLabel: isEn ? 'Assessment progress' : 'Progreso de bateria',
    focusLabel: isEn ? 'Focus streak' : 'Racha de enfoque',
    focusUnit: isEn ? 's' : 's',
    neutralGuard: isEn
      ? 'No extra score for rushing: prioritize consistent accuracy.'
      : 'No hay puntaje extra por correr: prioriza precision consistente.',
    dismiss: isEn ? 'Hide' : 'Ocultar',
    milestoneUnlocked: isEn ? 'Milestone unlocked' : 'Hito desbloqueado',
    missionTemplates: isEn
      ? [
          'Complete this module with stable pace.',
          'Keep your decision rhythm stable for 20s.',
          'Stay focused until the next transition.'
        ]
      : [
          'Completa este modulo con ritmo estable.',
          'Mantiene un ritmo de decision estable por 20s.',
          'Sosten el enfoque hasta la siguiente transicion.'
        ],
    badges: isEn
      ? ['Warmup', 'Flow', 'Momentum', 'Consistency']
      : ['Calentamiento', 'Flujo', 'Impulso', 'Consistencia'],
  };
};

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const EngagementPulse = ({
  gameId,
  totalGames,
  isActive,
  timeLimit,
  language = 'es',
  onMilestoneUnlocked,
}) => {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const unlockedRef = useRef(new Set());
  const copy = useMemo(() => getMessages(language), [language]);

  useEffect(() => {
    if (!isActive) return undefined;

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, MS_PER_SECOND);

    return () => clearInterval(timer);
  }, [isActive]);

  const sessionProgress = useMemo(() => {
    if (!totalGames || totalGames <= 0) return 0;
    return clamp((gameId / totalGames) * 100, 0, 100);
  }, [gameId, totalGames]);

  const gameProgress = useMemo(() => {
    if (typeof timeLimit !== 'number' || timeLimit <= 0) {
      return clamp((elapsedSeconds / 120) * 100, 0, 100);
    }
    return clamp((elapsedSeconds / timeLimit) * 100, 0, 100);
  }, [elapsedSeconds, timeLimit]);

  const milestoneIndex = useMemo(() => {
    if (gameProgress >= 75) return 3;
    if (gameProgress >= 50) return 2;
    if (gameProgress >= 25) return 1;
    return 0;
  }, [gameProgress]);

  useEffect(() => {
    if (!isActive) return;

    if (!unlockedRef.current.has(milestoneIndex)) {
      unlockedRef.current.add(milestoneIndex);
      if (onMilestoneUnlocked) {
        onMilestoneUnlocked({
          type: 'engagement_milestone',
          gameId,
          milestone: copy.badges[milestoneIndex],
          milestoneIndex,
          elapsedSeconds,
          gameProgress,
          sessionProgress,
        });
      }
    }
  }, [
    isActive,
    milestoneIndex,
    gameId,
    elapsedSeconds,
    gameProgress,
    sessionProgress,
    copy.badges,
    onMilestoneUnlocked,
  ]);

  const missionText = copy.missionTemplates[milestoneIndex] || copy.missionTemplates[0];

  if (!isActive || dismissed) return null;

  return (
    <aside className="engagement-pulse" aria-live="polite">
      <div className="engagement-header">
        <div>
          <p className="engagement-kicker">{copy.subtitle}</p>
          <h4>{copy.title}</h4>
        </div>
        <button
          type="button"
          className="engagement-dismiss"
          onClick={() => setDismissed(true)}
          aria-label={copy.dismiss}
        >
          x
        </button>
      </div>

      <div className="engagement-block">
        <div className="engagement-row">
          <span>{copy.progressLabel}</span>
          <strong>{Math.round(sessionProgress)}%</strong>
        </div>
        <div className="engagement-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(sessionProgress)}>
          <div className="engagement-fill" style={{ width: `${sessionProgress}%` }} />
        </div>
      </div>

      <div className="engagement-block">
        <div className="engagement-row">
          <span>{copy.focusLabel}</span>
          <strong>{elapsedSeconds}{copy.focusUnit}</strong>
        </div>
        <p className="engagement-mission">{missionText}</p>
      </div>

      <div className="engagement-badge">
        <span>{copy.milestoneUnlocked}</span>
        <strong>{copy.badges[milestoneIndex]}</strong>
      </div>

      <p className="engagement-guard">{copy.neutralGuard}</p>
    </aside>
  );
};

export default EngagementPulse;

