import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../context/LanguageContext';
import {
  Zap,
  Grid3x3,
  Lightbulb,
  Zap as ZapIcon,
  RotateCcw,
  Brain,
  Palette,
  GitBranch,
  Eye,
  AlertCircle
} from 'lucide-react';
import './GameGallery.css';

// Define all available games with metadata
const GAME_CATALOG = [
  {
    id: 'balloon',
    name: { es: 'Inflar el Globo', en: 'Balloon Game' },
    description: { 
      es: 'Evalúa toma de riesgos y tolerancia a la frustración',
      en: 'Assesses risk-taking and frustration tolerance'
    },
    icon: Zap,
    difficulty: 'intermediate',
    duration: 45,
    category: { es: 'Comportamiento', en: 'Behavioral' },
    skills: ['Risk Assessment', 'Decision Making'],
    enabled: true
  },
  {
    id: 'grid',
    name: { es: 'Grid Flow', en: 'Grid Flow' },
    description: {
      es: 'Optimización de ruteo y flujo de red',
      en: 'Routing and network flow optimization'
    },
    icon: Grid3x3,
    difficulty: 'intermediate',
    duration: 90,
    category: { es: 'Cognitivo', en: 'Cognitive' },
    skills: ['Routing', 'Planning'],
    enabled: true
  },
  {
    id: 'laser',
    name: { es: 'Láser y espejos', en: 'Laser & mirrors' },
    description: {
      es: 'Redirecciona haces con espejos y bifurcadores',
      en: 'Redirect beams with mirrors and bifurcators'
    },
    icon: Lightbulb,
    difficulty: 'hard',
    duration: 75,
    category: { es: 'Cognitivo', en: 'Cognitive' },
    skills: ['Problem Solving', 'Logic'],
    enabled: true
  },
  {
    id: 'gng',
    name: { es: 'Go/No-Go', en: 'Go/No-Go' },
    description: {
      es: 'Control inhibitorio y velocidad de reacción',
      en: 'Inhibitory control and reaction speed'
    },
    icon: ZapIcon,
    difficulty: 'easy',
    duration: 45,
    category: { es: 'Atención', en: 'Attention' },
    skills: ['Inhibition', 'Reaction Time'],
    enabled: true
  },
  {
    id: 'nback',
    name: { es: 'N-Back', en: 'N-Back' },
    description: {
      es: 'Memoria de trabajo y atención sostenida',
      en: 'Working memory and sustained attention'
    },
    icon: RotateCcw,
    difficulty: 'hard',
    duration: 60,
    category: { es: 'Memoria', en: 'Memory' },
    skills: ['Working Memory', 'Attention'],
    enabled: true
  },
  {
    id: 'memory',
    name: { es: 'Secuencia Memorizada', en: 'Memory Sequence' },
    description: {
      es: 'Memoria a corto plazo y velocidad de procesamiento',
      en: 'Short-term memory and processing speed'
    },
    icon: Brain,
    difficulty: 'intermediate',
    duration: 90,
    category: { es: 'Memoria', en: 'Memory' },
    skills: ['Memory', 'Processing Speed'],
    enabled: true
  },
  {
    id: 'colorword',
    name: { es: 'Stroop (Color-Palabra)', en: 'Stroop Test' },
    description: {
      es: 'Función ejecutiva y control de interferencia',
      en: 'Executive function and interference control'
    },
    icon: Palette,
    difficulty: 'hard',
    duration: 75,
    category: { es: 'Ejecutiva', en: 'Executive' },
    skills: ['Inhibition', 'Executive Function'],
    enabled: true
  },
  {
    id: 'trails',
    name: { es: 'Trail Making', en: 'Trail Making' },
    description: {
      es: 'Rastreo visual, velocidad y flexibilidad cognitiva',
      en: 'Visual scanning, speed, and cognitive flexibility'
    },
    icon: GitBranch,
    difficulty: 'intermediate',
    duration: 120,
    category: { es: 'Cognitivo', en: 'Cognitive' },
    skills: ['Visual Scanning', 'Cognitive Flexibility'],
    enabled: true
  }
];

const getDifficultyColor = (difficulty) => {
  const colors = {
    easy: '#10b981',
    intermediate: '#f59e0b',
    hard: '#ef4444'
  };
  return colors[difficulty] || '#6b7280';
};

const getDifficultyLabel = (difficulty, language) => {
  const labels = {
    easy: language === 'es' ? 'Fácil' : 'Easy',
    intermediate: language === 'es' ? 'Intermedio' : 'Intermediate',
    hard: language === 'es' ? 'Difícil' : 'Hard'
  };
  return labels[difficulty] || difficulty;
};

const GameGallery = ({
  selectedGames = [],
  onSelectionChange,
  maxGames = 8,
  availableGameIds = null,
  lockedLabel = null,
  lockSelection = false,
}) => {
  const { language } = useLanguage();
  const [filterCategory, setFilterCategory] = useState(null);

  const toggleGameSelection = (gameId) => {
    if (lockSelection) return;
    if (Array.isArray(availableGameIds) && !availableGameIds.includes(gameId)) return;
    if (selectedGames.includes(gameId)) {
      onSelectionChange(selectedGames.filter(id => id !== gameId));
    } else if (selectedGames.length < maxGames) {
      onSelectionChange([...selectedGames, gameId]);
    }
  };

  const filteredGames = filterCategory
    ? GAME_CATALOG.filter(g => g.category[language] === filterCategory || g.category.es === filterCategory)
    : GAME_CATALOG;

  const categories = [...new Set(GAME_CATALOG.map(g => g.category[language] || g.category.es))];

  const totalDuration = selectedGames.reduce((sum, id) => {
    const game = GAME_CATALOG.find(g => g.id === id);
    return sum + (game?.duration || 0);
  }, 0);

  return (
    <div className="game-gallery">
      <div className="gallery-header">
        <h3>{language === 'es' ? 'Selecciona tus juegos' : 'Select your games'}</h3>
        <p className="gallery-subtitle">
          {selectedGames.length} / {maxGames} {language === 'es' ? 'seleccionados' : 'selected'} 
          {' • '} 
          {Math.floor(totalDuration / 60)}:{String(totalDuration % 60).padStart(2, '0')}
        </p>
      </div>

      <div className="gallery-filters">
        {categories.map(cat => (
          <button
            key={cat}
            className={`filter-btn ${filterCategory === cat ? 'active' : ''}`}
            onClick={() => setFilterCategory(filterCategory === cat ? null : cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="gallery-grid">
        <AnimatePresence>
          {filteredGames.map((game) => {
            const isSelected = selectedGames.includes(game.id);
            const isAvailable = !Array.isArray(availableGameIds) || availableGameIds.includes(game.id);
            const isLimitReached = !isSelected && selectedGames.length >= maxGames;
            const isDisabled = !isAvailable || isLimitReached;
            const IconComponent = game.icon;
            const disabledMessage = !isAvailable
              ? (lockedLabel || (language === 'es' ? 'No disponible en demo' : 'Not available in demo'))
              : (language === 'es' ? 'Límite alcanzado' : 'Limit reached');

            return (
              <motion.div
                key={game.id}
                className={`game-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && toggleGameSelection(game.id)}
                whileHover={!isDisabled ? { scale: 1.02, y: -4 } : {}}
                whileTap={!isDisabled ? { scale: 0.98 } : {}}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                aria-disabled={isDisabled}
              >
                {isSelected && (
                  <div className="selection-badge">
                    <span>✓</span>
                  </div>
                )}

                <div className="card-icon">
                  <IconComponent size={32} />
                </div>

                <h4>{game.name[language] || game.name.es}</h4>
                <p className="card-description">{game.description[language] || game.description.es}</p>

                <div className="card-meta">
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(game.difficulty) }}
                  >
                    {getDifficultyLabel(game.difficulty, language)}
                  </span>
                  <span className="duration-badge">
                    {game.duration}s
                  </span>
                </div>

                <div className="card-skills">
                  {game.skills.map(skill => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>

                {isDisabled && (
                  <div className="disabled-overlay">
                    <AlertCircle size={20} />
                    <span>{disabledMessage}</span>
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {selectedGames.length === 0 && (
        <div className="gallery-empty">
          <AlertCircle size={48} />
          <p>{language === 'es' ? 'Selecciona al menos un juego para continuar' : 'Select at least one game to continue'}</p>
        </div>
      )}
    </div>
  );
};

export default GameGallery;
