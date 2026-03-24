import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const COLORS = [
  { name: 'Red', value: '#ef4444' },
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Green', value: '#10b981' },
  { name: 'Yellow', value: '#eab308' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Cyan', value: '#06b6d4' }
];

const ColorWordGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();
  
  const MAX_ROUNDS = isDemo ? 3 : 15;

  const [round, setRound] = useState(0);
  const [wordText, setWordText] = useState('');
  const [wordColor, setWordColor] = useState('');
  const [options, setOptions] = useState([]);
  
  const scoreRef = useRef(0);
  const hasEndedRef = useRef(false);

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    stopTracking('game1', scoreRef.current, 0, { rounds: scoreRef.current });
    onEndGame(scoreRef.current);
  }, [onEndGame, stopTracking]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const generateRound = useCallback((currentRound) => {
    if (currentRound >= MAX_ROUNDS || hasEndedRef.current) {
      endGame();
      return;
    }
    
    const textObj = COLORS[Math.floor(Math.random() * COLORS.length)];
    let colorObj = COLORS[Math.floor(Math.random() * COLORS.length)];
    
    // 30% chance they match
    if (Math.random() > 0.7) {
      colorObj = textObj;
    }

    setWordText(textObj.name);
    setWordColor(colorObj.value);

    let opts = new Set();
    opts.add(colorObj);
    opts.add(textObj);
    while(opts.size < 4) {
      opts.add(COLORS[Math.floor(Math.random() * COLORS.length)]);
    }
    
    const shuffledOpts = Array.from(opts).sort(() => Math.random() - 0.5);
    setOptions(shuffledOpts);
  }, [MAX_ROUNDS, endGame]);

  useEffect(() => {
    if (isActive) {
      scoreRef.current = 0;
      hasEndedRef.current = false;
      startTracking();
      // eslint-disable-next-line react-hooks/set-state-in-effect
      generateRound(0);
    }
  }, [isActive, generateRound, startTracking]);

  const handleChoice = (colorVal) => {
    if (hasEndedRef.current || !isActive) return;
    
    if (colorVal === wordColor) {
      scoreRef.current += 1;
    } else {
      recordError();
    }

    const nextRound = round + 1;
    setRound(nextRound);
    generateRound(nextRound);
  };
  
  if (!isActive) {
      return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-panel"
            style={{ padding: '40px', textAlign: 'center', border: '1px solid #10b981' }}
          >
            <div style={{ color: '#10b981', fontSize: '2rem', marginBottom: '16px' }}>[ STAGE COMPLETE ]</div>
            <p style={{ color: '#64748b', textTransform: 'uppercase', letterSpacing: '2px' }}>Awaiting Next Sequence...</p>
          </motion.div>
      )
  }

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '2rem', color: '#94a3b8', zIndex: 50, background: 'rgba(15,23,42,0.8)', padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
        T-<span style={{ color: timeLeft < 10 ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>{timeLeft}s</span>
      </div>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '2rem', color: '#64748b', zIndex: 50, background: 'rgba(15,23,42,0.8)', padding: '10px 20px', borderRadius: '8px', border: '1px solid #334155' }}>
        SEQ: <span style={{color: '#f8fafc', fontWeight: 'bold'}}>{round}</span> / {MAX_ROUNDS}
      </div>

      <AnimatePresence mode="wait">
          <motion.div 
            key={round}
            initial={{ opacity: 0, filter: 'blur(10px)' }}
            animate={{ opacity: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            style={{ textAlign: 'center', width: '100%', maxWidth: '800px' }}
          >
            <div style={{ 
              marginBottom: '20px', 
              fontSize: '0.8rem', 
              color: '#475569', 
              textTransform: 'uppercase', 
              letterSpacing: '4px' 
            }}>
              [ Stimulus Rendered ]
            </div>
            
            <div style={{
              backgroundColor: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(99,102,241,0.25)',
              padding: '60px',
              borderRadius: '8px',
              marginBottom: '40px',
              boxShadow: '0 4px 20px rgba(99,102,241,0.1)'
            }}>
              <h1 style={{ 
                fontSize: '5rem', 
                color: wordColor, 
                textTransform: 'uppercase', 
                letterSpacing: '8px',
                margin: 0,
                textShadow: `0 0 30px ${wordColor}60`
              }}>
                {wordText}
              </h1>
            </div>

            <div style={{ 
              display: 'flex', 
              gap: '16px', 
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              {options.map((opt, i) => (
                <button
                  key={i}
                  data-color-btn={opt.value}
                  onClick={() => handleChoice(opt.value)}
                  style={{
                    padding: '20px 40px',
                    fontSize: '1rem',
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    fontWeight: 'bold',
                    backgroundColor: `${opt.value}15`, 
                    color: opt.value,
                    border: `1px solid ${opt.value}50`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    width: '180px',
                    textShadow: `0 0 10px ${opt.value}80`,
                    boxShadow: `0 4px 15px rgba(0,0,0,0.2)`
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = `${opt.value}25`;
                    e.currentTarget.style.borderColor = opt.value;
                    e.currentTarget.style.boxShadow = `0 0 20px ${opt.value}40`;
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = `${opt.value}15`;
                    e.currentTarget.style.borderColor = `${opt.value}50`;
                    e.currentTarget.style.boxShadow = `0 4px 15px rgba(0,0,0,0.2)`;
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  }}
                >
                  {opt.name}
                </button>
              ))}
            </div>
          </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ColorWordGame;
