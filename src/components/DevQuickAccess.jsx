import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_FLOW } from '../utils/gameFlow';
import { getLocalizedGameInstruction } from '../utils/gameFlowI18n';
import { useTelemetry } from '../TelemetryContext';

const DevQuickAccess = ({ t, language }) => {
  const navigate = useNavigate();
  const { setIsDemo, setParticipantProfile } = useTelemetry();

  const ensureQuickAccessProfile = () => {
    setIsDemo(true);
    setParticipantProfile({
      fullName: 'Acceso rapido dev',
      // eslint-disable-next-line react-hooks/purity
      participantId: `DEV-${Date.now()}`,
      email: 'dev@krumm.local',
      authenticatedAt: new Date().toISOString(),
      participantToken: null,
      preferredLanguage: language,
      source: 'dev_quick_access'
    });
  };

  const handleQuickGoToGame = (path) => {
    ensureQuickAccessProfile();
    navigate(path);
  };

  const handleQuickGoToReport = () => {
    ensureQuickAccessProfile();
    navigate('/report?dummy=true');
  };

  return (
    <section className="lv3-section lv3-dev" aria-label="Accesos de desarrollo">
      <div className="lv3-container">
        <h2>{t.devTitle}</h2>
        <p className="lv3-intro">{t.devIntro}</p>
        <div className="lv3-dev-grid">
          {GAME_FLOW.map((game) => (
            <button
              key={game.id}
              className="lv3-dev-btn"
              onClick={() => handleQuickGoToGame(game.path)}
            >
              {`${t.gameLabel} ${game.id}: ${getLocalizedGameInstruction(game, language).title || t.fallbackEval}`}
            </button>
          ))}

          <button className="lv3-dev-btn lv3-dev-report" onClick={handleQuickGoToReport}>
            {t.finalReport}
          </button>
        </div>
      </div>
    </section>
  );
};

export default DevQuickAccess;
