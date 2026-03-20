import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import InstructionInterstitial from '../components/InstructionInterstitial';

const VigilanceGame = () => {
  const navigate = useNavigate();
  const { startTracking, stopTracking, isDemo } = useTelemetry();

  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  
  const [round, setRound] = useState(1);
  const [gameState, setGameState] = useState('waiting'); // waiting, signal, result
  const [reactionTime, setReactionTime] = useState(null);
  const [totalReactionTime, setTotalReactionTime] = useState(0);
  const totalReactionTimeRef = useRef(0);
  const [falseStarts, setFalseStarts] = useState(0);
  const falseStartsRef = useRef(0);
  const isGoRoundRef = useRef(true);
  
  const signalStartTimeRef = useRef(null);
  const timeoutRef = useRef(null);
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const audioCtxRef = useRef(null);
  const hasEndedRef = useRef(false);
  
  const MAX_ROUNDS = 10; 
  const GAME_DURATION = 15;
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);

  useEffect(() => {
    // Initialize AudioContext
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtxRef.current = new AudioContext();
    }
    return () => {
      if (audioCtxRef.current) audioCtxRef.current.close();
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const playBeep = () => {
    if (!audioCtxRef.current) return;
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') ctx.resume();
    
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
    
    gainNode.gain.setValueAtTime(0.1, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  };

  useEffect(() => {
    if (isActive) {
      startTracking();
      initRound();
    }
    return () => clearTimeout(timeoutRef.current);
  }, [isActive, startTracking]);

  useEffect(() => {
    if (isActive && isDemo) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isActive, isDemo]);

  const endGame = () => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;
    setIsActive(false);
    
    stopTracking('game5', totalReactionTimeRef.current, falseStartsRef.current);

    setTimeout(() => {
      navigate('/game/6', { replace: true });
      window.scrollTo(0, 0);
    }, 500);
  };

  const initRound = (currentRound) => {
    setGameState('waiting');
    setReactionTime(null);
    signalStartTimeRef.current = null;
    
    if (containerRef.current) {
      containerRef.current.style.backgroundColor = '#0f172a';
    }
    
    const delay = Math.floor(Math.random() * 4000) + 2000;
    
    timeoutRef.current = setTimeout(() => {
      const goSignal = Math.random() > 0.3;
      isGoRoundRef.current = goSignal;
      if (containerRef.current) {
        containerRef.current.style.backgroundColor = goSignal ? '#16a34a' : '#dc2626';
      }
      if (textRef.current) {
        textRef.current.textContent = goSignal ? 'INTERCEPT' : 'IGNORE';
        textRef.current.style.opacity = '1';
      }
      
      if (goSignal) playBeep();
      
      signalStartTimeRef.current = performance.now();
      setGameState('signal'); 

      if (!goSignal) {
        timeoutRef.current = setTimeout(() => {
          if (signalStartTimeRef.current) {
            setGameState('result');
            setReactionTime('WITHHELD');
            signalStartTimeRef.current = null;
            if (containerRef.current) containerRef.current.style.backgroundColor = '#0f172a'; 
            if (textRef.current) textRef.current.style.opacity = '0';
            setTimeout(() => advanceRound(), 1500);
          }
        }, 1500);
      }
    }, delay);
  };

  const handleScreenClick = () => {
    if (!isActive) return;

    if (gameState === 'waiting' && !signalStartTimeRef.current) {
      clearTimeout(timeoutRef.current);
      falseStartsRef.current += 1;
      setFalseStarts(falseStartsRef.current);
      setGameState('result');
      setReactionTime('FALSE START');
      
      if (containerRef.current) containerRef.current.style.backgroundColor = '#ef4444';
      if (textRef.current) textRef.current.style.opacity = '0';
      
      setTimeout(() => advanceRound(), 1500);
    } else if (signalStartTimeRef.current) {
      const rt = Math.round(performance.now() - signalStartTimeRef.current);
      signalStartTimeRef.current = null; 
      clearTimeout(timeoutRef.current);
      
      if (isGoRoundRef.current) {
        setReactionTime(rt);
        totalReactionTimeRef.current += rt;
        setTotalReactionTime(totalReactionTimeRef.current);
        setGameState('result');
        if (containerRef.current) containerRef.current.style.backgroundColor = '#10b981';
        if (textRef.current) textRef.current.style.opacity = '0';
      } else {
        falseStartsRef.current += 1;
        setFalseStarts(falseStartsRef.current);
        setGameState('result');
        setReactionTime('INHIBITION FAILURE');
        if (containerRef.current) containerRef.current.style.backgroundColor = '#ef4444';
        if (textRef.current) textRef.current.style.opacity = '0';
      }
      
      setTimeout(() => advanceRound(), 1500);
    }
  };

  const advanceRound = () => {
    if (round >= MAX_ROUNDS) {
      endGame();
    } else {
      const next = round + 1;
      setRound(next);
      initRound(next);
    }
  };

  if (showInstructions) {
    return (
      <InstructionInterstitial 
        type="Sustained Attention"
        title="Signal Vigilance"
        description="Wait for the dark screen to flash. If the signal is GREEN (INTERCEPT), click as fast as possible. If the signal is RED (IGNORE), do NOT click. Do not anticipate."
        timeLimit="None"
        onStart={() => {
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          setShowInstructions(false);
          setIsActive(true);
        }}
      />
    );
  }

  return (
    <div 
      ref={containerRef}
      data-vigilance-container="true"
      className="flex-center" 
      onPointerDown={handleScreenClick}
      style={{ 
        width: '100%', 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#ddd6fe',
        cursor: 'crosshair',
        fontFamily: '"Courier New", Courier, monospace',
        userSelect: 'none'
      }}
    >
      <div style={{ position: 'absolute', top: '30px', left: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
        TRIAL: <span style={{color: '#4f46e5', fontWeight: 'bold'}}>{round}</span> / {MAX_ROUNDS}
      </div>
      
      {isDemo && (
        <div style={{ position: 'absolute', top: '30px', right: '40px', fontSize: '1.5rem', color: '#374151', zIndex: 50, background: 'rgba(255,255,255,0.82)', backdropFilter:'blur(8px)', padding: '8px 18px', borderRadius: '8px', border: '1px solid rgba(99,102,241,0.2)', fontWeight:'600' }}>
          T-<span style={{ color: timeLeft < 5 ? '#dc2626' : '#059669', fontWeight: 'bold' }}>{timeLeft}s</span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {gameState === 'waiting' && (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ color: '#4f46e5', fontSize: '1.1rem', letterSpacing: '4px', fontWeight:'600' }}>
            [ AWAITING STIMULUS ]
          </motion.div>
        )}

        </AnimatePresence>

        <div
          ref={textRef}
          style={{ 
            position: 'absolute',
            color: 'white', 
            fontSize: '3rem', 
            fontWeight: 'bold', 
            letterSpacing: '8px',
            opacity: 0,
            pointerEvents: 'none'
          }}
        >
          RESPOND
        </div>

        <AnimatePresence mode="wait">
          {gameState === 'result' && (
            <motion.div
              key="result"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ 
                color: reactionTime === 'FALSE START' ? '#ef4444' : '#10b981', 
                fontSize: '2.5rem', 
                fontWeight: 'bold',
                letterSpacing: '2px'
              }}
            >
              {reactionTime === 'FALSE START' ? '[ LOSS OF DISCIPLINE ]' : `[ LATENCY: ${reactionTime}ms ]`}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };
  
  export default VigilanceGame;
