import React from 'react';
import { useLocation } from 'react-router-dom';

const GlobalProgressBar = () => {
  const location = useLocation();
  const path = location.pathname;

  // Calculate progress based on route
  let currentStep = 0;
  let totalSteps = 14;

  if (path.includes('game/1')) currentStep = 1;
  else if (path.includes('game/2')) currentStep = 2;
  else if (path.includes('game/3')) currentStep = 3;
  else if (path.includes('game/4')) currentStep = 4;
  else if (path.includes('game/5')) currentStep = 5;
  else if (path.includes('game/6')) currentStep = 6;
  else if (path.includes('game/7')) currentStep = 7;
  else if (path.includes('game/8')) currentStep = 8;
  else if (path.includes('game/9')) currentStep = 9;
  else if (path.includes('game/10')) currentStep = 10;
  else if (path.includes('game/11')) currentStep = 11;
  else if (path.includes('game/12')) currentStep = 12;
  else if (path.includes('game/13')) currentStep = 13;
  else if (path.includes('game/14')) currentStep = 14;
  else if (path.includes('report')) currentStep = totalSteps;

  const progressPercent = (currentStep / totalSteps) * 100;

  // Hide on Intro (0 progress) or Report
  if (currentStep === 0 || path.includes('report')) return null;

  return (
    <div className="header-bar">
      <div style={{ fontWeight: '600', color: '#3730a3', letterSpacing: '1px', fontSize: '0.85rem' }}>
        ASSESSMENT PROGRESS
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
