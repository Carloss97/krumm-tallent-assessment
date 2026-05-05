import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Circle } from 'lucide-react';
import './ProgressTracker.css';

const ProgressTracker = ({ 
  completed = [], 
  total = 0, 
  currentId = null,
  games = [],
  compact = false
}) => {
  const { language } = useLanguage();

  const completionPercentage = useMemo(() => {
    return total > 0 ? Math.round((completed.length / total) * 100) : 0;
  }, [completed.length, total]);

  const getGameName = (id) => {
    const game = games.find(g => g.id === id);
    if (!game) return id;
    return game.title && typeof game.title === 'object' 
      ? (game.title[language] || game.title.es)
      : (game.name || id);
  };

  if (compact) {
    return (
      <div className="progress-tracker-compact">
        <div className="progress-games-compact">
          {games.map((game) => {
            const isCompleted = completed.includes(game.id);
            const isCurrent = currentId === game.id;
            return (
              <div 
                key={game.id} 
                className={`game-dot ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                title={getGameName(game.id)}
              >
                {isCompleted && <CheckCircle2 size={12} className="dot-icon" />}
              </div>
            );
          })}
        </div>
        <div className="progress-percentage-compact">{completionPercentage}%</div>
      </div>
    );
  }

  return (
    <div className="progress-tracker">
      {/* Main progress bar */}
      <div className="progress-main">
        <div className="progress-info">
          <span className="progress-label">
            {language === 'es' ? 'Progreso de Evaluación' : 'Assessment Progress'}
          </span>
          <span className="progress-count">
            {completed.length} / {total}
          </span>
        </div>
        
        <div className="progress-bar-container">
          <motion.div
            className="progress-bar-fill"
            initial={{ width: 0 }}
            animate={{ width: `${completionPercentage}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Individual game indicators */}
      {games.length > 0 && (
        <div className="progress-games">
          {games.map((game, index) => {
            const isCompleted = completed.includes(game.id);
            const isCurrent = currentId === game.id;
            
            return (
              <motion.div
                key={game.id}
                className={`game-indicator ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                title={getGameName(game.id)}
              >
                <div className="indicator-circle">
                  {isCompleted ? (
                    <CheckCircle2 size={18} className="check-icon" />
                  ) : (
                    <Circle size={18} className={isCurrent ? 'current-icon' : 'pending-icon'} />
                  )}
                  {isCurrent && (
                    <motion.div
                      className="current-pulse"
                      animate={{ opacity: [0.3, 0.8, 0.3], scale: [1, 1.3, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className="indicator-label">{index + 1}</span>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats summary */}
      <div className="progress-stats">
        <div className="stat-item">
          <span className="stat-label">
            {language === 'es' ? 'Completadas' : 'Completed'}
          </span>
          <span className="stat-value">{completed.length}</span>
        </div>
        
        <div className="stat-item">
          <span className="stat-label">
            {language === 'es' ? 'Restantes' : 'Remaining'}
          </span>
          <span className="stat-value">{Math.max(0, total - completed.length)}</span>
        </div>
      </div>
    </div>
  );
};

export default ProgressTracker;
