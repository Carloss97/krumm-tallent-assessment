import React from 'react';
import { useLocation } from 'react-router-dom';
import { GAME_FLOW } from '../utils/gameFlow';
import { useLanguage } from '../context/LanguageContext';

const GlobalProgressBar = () => {
  const location = useLocation();
  const { language } = useLanguage();
  const path = location.pathname;

  // Calculate progress based on route and current game flow.
  const totalSteps = GAME_FLOW.length;
  const normalizedPath = path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
  const currentGame = GAME_FLOW.find((game) => (
    normalizedPath === game.path || normalizedPath.startsWith(`${game.path}/`)
  ));
  let currentStep = currentGame ? currentGame.id : 0;

  if (path.includes('report')) currentStep = totalSteps;

  const progressPercent = (currentStep / totalSteps) * 100;

  // Hide on Intro (0 progress) or Report
  if (currentStep === 0 || path.includes('report')) return null;

  return (
    <div className="header-bar">
      <div style={{ fontWeight: '600', color: '#3730a3', letterSpacing: '1px', fontSize: '0.85rem' }}>
        {language === 'en' ? 'ASSESSMENT PROGRESS' : 'PROGRESO DE EVALUACION'}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="progress-container">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div style={{ color: '#4f46e5', fontSize: '0.9rem', width: '40px', textAlign: 'right', fontWeight: '600' }}>
          {currentStep} / {totalSteps}
        </div>
      </div>
    </div>
  );
};

export default GlobalProgressBar;
