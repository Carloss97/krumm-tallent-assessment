import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import { CheckCircle2, Circle } from 'lucide-react';
import './ProgressTracker.css';

const ProgressTracker = ({ 
  completed = [], 
  total = 0, 
  currentId = null,
  games = []
}) => {
  const { language } = useLanguage();

  const completionPercentage = useMemo(() => {
    return total > 0 ? Math.round((completed.length / total) * 100) : 0;
  }, [completed.length, total]);

  const getGameName = (id) => {
    const game = games.find(g => g.id === id);
    if (!game) return id;
    return game.name && typeof game.name === 'object' 
      ? (game.name[language] || game.name.es)
      : game.name;
  };

  return (
    <div className="progress-tracker">
      {/* Main progress bar */}
      <div className="progress-main">
        <div className="progress-info">
          <span className="progress-label">
            {language === 'es' ? 'Progreso' : 'Progress'}
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
          <span className="progress-percentage">
            {completionPercentage}%
          </span>
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
                    <CheckCircle2 size={20} className="check-icon" />
                  ) : (
                    <Circle size={20} className={isCurrent ? 'current-icon' : 'pending-icon'} />
                  )}
                </div>
                <span className="indicator-label">{index + 1}</span>
                
                {isCurrent && (
                  <motion.div
                    className="current-pulse"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Stats summary */}
      <div className="progress-stats">
        <motion.div
          className="stat-item"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <span className="stat-label">
            {language === 'es' ? 'Completadas' : 'Completed'}
          </span>
          <span className="stat-value">{completed.length}</span>
        </motion.div>
        
        <motion.div
          className="stat-item"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <span className="stat-label">
            {language === 'es' ? 'Restantes' : 'Remaining'}
          </span>
          <span className="stat-value">{Math.max(0, total - completed.length)}</span>
        </motion.div>
      </div>
    </div>
  );
};

export default ProgressTracker;
