import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';

const colors = ['red', 'green', 'blue', 'yellow'];
const shapes = ['circle', 'triangle', 'square', 'star'];
const numbers = [1, 2, 3, 4];

const WisconsinCardSortingGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { recordError, startTracking, stopTracking } = useTelemetry();
  
  const [cards, setCards] = useState([]);
  const [stimulusCards, setStimulusCards] = useState([]);
  const [currentCard, setCurrentCard] = useState(null);
  const [currentRule, setCurrentRule] = useState('color');
  const [ruleChanges, setRuleChanges] = useState(0);
  const [score, setScore] = useState(0);
  const [correctStreak, setCorrectStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [perseverativeErrors, setPerseverativeErrors] = useState(0);
  const [feedback, setFeedback] = useState(null);
  
  const reactionTimes = useRef([]);
  const cardStartTimeRef = useRef(null);
  const lastRuleRef = useRef(null);
  const hasEndedRef = useRef(false);

  const MAX_CATEGORIES = isDemo ? 3 : 6;
  const CARDS_PER_CATEGORY = 10;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    const avgReactionTime = reactionTimes.current.length > 0 ? Math.round(reactionTimes.current.reduce((a, b) => a + b, 0) / reactionTimes.current.length) : 0;
    stopTracking('game10', score, totalErrors, { categoriesCompleted: ruleChanges, totalCorrect, totalErrors, perseverativeErrors, avgReactionTime });
    onEndGame(score, totalErrors, { categoriesCompleted: ruleChanges, totalCorrect, totalErrors, perseverativeErrors, avgReactionTime });
  }, [onEndGame, score, totalErrors, ruleChanges, totalCorrect, perseverativeErrors, stopTracking]);

  const timeLeft = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const generateCard = () => ({
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: shapes[Math.floor(Math.random() * shapes.length)],
    number: numbers[Math.floor(Math.random() * numbers.length)]
  });

  const nextCard = useCallback(() => {
    setCards(prev => {
      if (prev.length === 0) { endGame(); return []; }
      const newDeck = [...prev];
      setCurrentCard(newDeck.shift());
      cardStartTimeRef.current = Date.now();
      setFeedback(null);
      return newDeck;
    });
  }, [endGame]);

  const initializeGame = useCallback(() => {
    const stimuli = [];
    colors.forEach(c => shapes.forEach(s => numbers.forEach(n => stimuli.push({ color: c, shape: s, number: n }))));
    setStimulusCards(stimuli.sort(() => Math.random() - 0.5).slice(0, 4));
    
    const deck = Array.from({ length: 64 }, generateCard);
    setCards(deck);
  }, []);

  useEffect(() => {
    if (isActive) {
      hasEndedRef.current = false;
      startTracking();
      reactionTimes.current = [];
      setCurrentRule('color');
      setRuleChanges(0);
      setScore(0);
      setCorrectStreak(0);
      setTotalCorrect(0);
      setTotalErrors(0);
      setPerseverativeErrors(0);
      initializeGame();
    }
  }, [isActive, initializeGame, startTracking]);
  
  useEffect(() => {
    if(isActive && cards.length > 0 && !currentCard) {
        nextCard();
    }
  }, [isActive, cards, currentCard, nextCard])

  const changeRule = useCallback(() => {
    const rules = ['color', 'shape', 'number'];
    let newRule;
    do { newRule = rules[Math.floor(Math.random() * rules.length)]; } while (newRule === currentRule);
    
    setCurrentRule(newRule);
    setRuleChanges(prev => prev + 1);
    setCorrectStreak(0);

    if (ruleChanges + 1 >= MAX_CATEGORIES) endGame();
  }, [currentRule, ruleChanges, MAX_CATEGORIES, endGame]);

  const handleCardClick = (stimulusIndex) => {
    if (!currentCard || feedback) return;

    // eslint-disable-next-line react-hooks/purity
    reactionTimes.current.push(Date.now() - cardStartTimeRef.current);
    const stimulusCard = stimulusCards[stimulusIndex];
    const isCorrect = (() => {
        switch (currentRule) {
            case 'color': return currentCard.color === stimulusCard.color;
            case 'shape': return currentCard.shape === stimulusCard.shape;
            case 'number': return currentCard.number === stimulusCard.number;
            default: return false;
        }
    })();

    if (isCorrect) {
      setTotalCorrect(p => p + 1);
      setCorrectStreak(p => p + 1);
      setScore(p => p + 10);
      setFeedback('correct');
      if (correctStreak + 1 >= CARDS_PER_CATEGORY) changeRule();
    } else {
      setTotalErrors(p => p + 1);
      setCorrectStreak(0);
      setFeedback('incorrect');
      if (lastRuleRef.current && lastRuleRef.current !== currentRule) setPerseverativeErrors(p => p + 1);
      recordError();
    }

    lastRuleRef.current = currentRule;
    setTimeout(() => nextCard(), 1000);
  };

  const renderCard = (card, isStimulus = false, index = null) => {
    if (!card) return null;
    const size = isStimulus ? 80 : 100;
    const shapeSize = isStimulus ? 20 : 25;
    return (
      <motion.div
        key={isStimulus ? `stimulus-${index}` : 'current'} initial={{ scale: 0 }} animate={{ scale: 1 }} whileHover={isStimulus ? { scale: 1.05 } : {}}
        onClick={isStimulus ? () => handleCardClick(index) : undefined}
        style={{ width: size, height: size, backgroundColor: 'white', border: '2px solid #d1d5db', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: isStimulus ? 'pointer' : 'default', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', margin: '5px' }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          {Array.from({ length: card.number }, (_, i) => (
            <div key={i} style={{ width: shapeSize, height: shapeSize, backgroundColor: card.color, margin: '2px',
                clipPath: card.shape === 'circle' ? 'circle()' : card.shape === 'triangle' ? 'polygon(50% 0%, 0% 100%, 100% 100%)' : card.shape === 'star' ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' : 'none',
                border: card.shape === 'square' ? `2px solid ${card.color}` : 'none'
            }}/>
          ))}
        </div>
      </motion.div>
    );
  };

  if (!isActive) {
      return <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="glass-panel" style={{ padding:'40px', textAlign:'center', border:'1px solid #10b981' }}><div style={{ color:'#10b981', fontSize:'2rem', marginBottom:'16px' }}>[ STAGE COMPLETE ]</div><p style={{ color:'#64748b', textTransform:'uppercase', letterSpacing:'2px' }}>Awaiting Next Sequence...</p></motion.div>
  }
  
  const accuracy = totalCorrect + totalErrors > 0 ? Math.round((totalCorrect / (totalCorrect + totalErrors)) * 100) : 0;

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: '"Courier New", Courier, monospace' }}>
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>CATEGORIES: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{ruleChanges}</span> / {MAX_CATEGORIES}</div>
      <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>SCORE: <span style={{ color: '#059669', fontWeight: 'bold' }}>{score}</span></div>
      {isDemo && <div style={{ position: 'absolute', top: '80px', right: '40px', fontSize: '1.2rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '6px 12px', borderRadius: '6px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>T-<span style={{ color: timeLeft < 15 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span></div>}
      
      <div style={{ marginBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '5px' }}>Sorting by: <span style={{ fontWeight: 'bold', color: '#4f46e5' }}>{currentRule.toUpperCase()}</span></div>
        <div style={{ fontSize: '0.9rem', color: '#9ca3af' }}>Accuracy: {accuracy}% â€¢ Correct: {totalCorrect} â€¢ Errors: {totalErrors}</div>
        <div style={{ fontSize: '0.8rem', color: '#9ca3af' }}>Streak: {correctStreak} / {CARDS_PER_CATEGORY}</div>
      </div>
      
      <div style={{ marginBottom: '40px' }}>
        <div style={{ fontSize: '1rem', color: '#6b7280', marginBottom: '10px', textAlign: 'center' }}>MATCH THIS CARD:</div>
        {renderCard(currentCard)}
      </div>
      
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', maxWidth: '400px' }}>
        {stimulusCards.map((card, index) => renderCard(card, true, index))}
      </div>
      
      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{ position: 'absolute', bottom: '100px', backgroundColor: feedback === 'correct' ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)', color: 'white', padding: '10px 20px', borderRadius: '8px', fontSize: '1.2rem', fontWeight: 'bold' }}
          >
            {feedback === 'correct' ? 'Correct!' : 'Incorrect'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WisconsinCardSortingGame;
