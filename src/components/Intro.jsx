import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { GAME_FLOW } from '../utils/gameFlow';
import { useLanguage } from '../context/LanguageContext';
import { getLocalizedGameInstruction } from '../utils/gameFlowI18n';

const Intro = () => {
  const navigate = useNavigate();
  const { setIsDemo } = useTelemetry();
  const { language } = useLanguage();
  const [showDevTools, setShowDevTools] = useState(false);
  const isEn = language === 'en';

  const handleStart = (demo = false) => {
    setIsDemo(demo);
    navigate('/game/1');
  };

  const handleViewDummyReport = () => {
    navigate('/report?dummy=true');
  };

  const handleComplementaryBattery = () => {
    setIsDemo(false);
    navigate('/complementary/intro');
  };

  const handleDirectGameAccess = (gameNumber) => {
    setIsDemo(false); // Set to full mode for direct access
    navigate(`/game/${gameNumber}`);
  };

  const handleFutureLabAccess = () => {
    setIsDemo(false);
    navigate('/future/lab');
  };

  const games = GAME_FLOW.map((game) => ({
    number: game.id,
    name: getLocalizedGameInstruction(game, language).title,
    type: getLocalizedGameInstruction(game, language).type,
  }));

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ padding: '60px', textAlign: 'center', maxWidth: '800px' }}
      >
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px' }}>{isEn ? 'Cognitive Assessment' : 'Evaluación Cognitiva'}</h1>
        <p style={{ marginBottom: '40px', color: '#374151', lineHeight: '1.8', fontSize: '1.1rem' }}>
          {isEn
            ? `Welcome to the HR-focused cognitive assessment platform. You will complete ${GAME_FLOW.length} evidence-based tasks designed to evaluate memory, inhibition, flexibility, attention, decision quality under pressure, judgment, calibration, prioritization, agility, coordination, resilience, and uncertainty management.`
            : `Bienvenido a la plataforma de evaluación cognitiva para RRHH. Completarás ${GAME_FLOW.length} tareas basadas en evidencia para evaluar memoria, inhibición, flexibilidad, atención, calidad de decisión bajo presión, juicio, calibración, priorización, agilidad, coordinación, resiliencia y manejo de incertidumbre.`}
        </p>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', marginBottom: '30px' }}>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px' }} onClick={() => handleStart(false)}>
            {isEn ? 'Begin Assessment' : 'Comenzar evaluación'}
          </button>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid #7c3aed' }} onClick={() => handleStart(true)}>
            {isEn ? 'Quick Demo' : 'Demo rápida'}
          </button>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }} onClick={handleViewDummyReport}>
            {isEn ? 'View Demo Report' : 'Ver reporte demo'}
          </button>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px', background: 'rgba(14, 165, 233, 0.12)', color: '#0369a1', border: '1px solid #0284c7' }} onClick={handleComplementaryBattery}>
            {isEn ? 'Complementary Battery (6 Games)' : 'Batería complementaria (6 juegos)'}
          </button>
        </div>

        {/* Development Tools Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <button
            className="btn"
            style={{
              fontSize: '0.9rem',
              padding: '8px 16px',
              background: 'rgba(107, 114, 128, 0.1)',
              color: '#6b7280',
              border: '1px solid #6b7280'
            }}
            onClick={() => setShowDevTools(!showDevTools)}
          >
            {(showDevTools ? (isEn ? 'Hide' : 'Ocultar') : (isEn ? 'Show' : 'Mostrar')) + ` ${isEn ? 'Development Tools' : 'herramientas de desarrollo'}`}
          </button>
        </div>

        {/* Development Tools */}
        {showDevTools && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '12px' }}
          >
            <h3 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.2rem' }}>{isEn ? 'Direct Game Access (Development)' : 'Acceso directo a juegos (desarrollo)'}</h3>
            <div style={{ marginBottom: '12px' }}>
              <button
                className="btn"
                style={{
                  fontSize: '0.85rem',
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#047857',
                  border: '1px solid rgba(4, 120, 87, 0.7)'
                }}
                onClick={handleFutureLabAccess}
              >
                {isEn ? 'Open Future Assessment Lab (High Priority Modules)' : 'Abrir laboratorio de evaluaciones futuras (módulos prioritarios)'}
              </button>
            </div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {games.map((game) => (
                <button
                  key={game.number}
                  className="btn"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    textAlign: 'left'
                  }}
                  onClick={() => handleDirectGameAccess(game.number)}
                >
                  <div style={{ fontWeight: 'bold' }}>{isEn ? 'Game' : 'Juego'} {game.number}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{game.name}</div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{game.type}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Intro;