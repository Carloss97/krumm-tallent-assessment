/* eslint-disable react-hooks/exhaustive-deps */
// TODO: Fix React Hook dependencies properly in a future refactor
// This file uses complex state management patterns that require careful dependency array handling
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
// Prefer prototype games for a higher-fidelity demo experience
import ProtoBalloon from '../games/BalloonGame';
import GridFlowGame from '../games/GridFlowGame';
import LaserPuzzleGame from '../games/LaserPuzzleGame';
import ProtoGoNoGo from '../games/GoNoGoGame';
import ProtoNBack from '../games/NBackGame';
import MemoryGame from '../games/MemoryGame';
import ColorWordGame from '../games/ColorWordGame';
import TrailMakingGame from '../games/TrailMakingGame';
import PostDemoScreen from './PostDemoScreen';
import GameGallery from './GameGallery';
import ProgressTracker from './ProgressTracker';
import { useIsMobile } from '../hooks/useMediaQuery';
import './DemoShell.css';

// Adapter wrappers so DemoShell can call games with the expected onComplete() callback
// For the demo we intentionally allow full-mode versions
const BalloonProtoWrapper = ({ onComplete, est }) => {
  return (
    <ProtoBalloon
      isActive={true}
      isDemo={true}
      showBriefing={true}
      timeLimit={est}
      onEndGame={() => { setTimeout(() => onComplete && onComplete('balloon'), 50); }}
    />
  );
};
const GridProtoWrapper = ({ onComplete, est }) => {
  return (
    <GridFlowGame
      isActive={true}
      isDemo={true}
      showBriefing={true}
      timeLimit={est}
      onEndGame={() => { 
        setTimeout(() => {
          onComplete && onComplete('grid');
        }, 50); 
      }}
    />
  );
};
const LaserProtoWrapper = ({ onComplete, est }) => {
  return (
    <LaserPuzzleGame
      isActive={true}
      isDemo={true}
      showBriefing={true}
      timeLimit={est}
      onEndGame={() => { 
        setTimeout(() => {
          onComplete && onComplete('laser');
        }, 50); 
      }}
    />
  );
};
const GoNoGoProtoWrapper = ({ onComplete, est }) => <ProtoGoNoGo isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete('gng')} />;
const NBackProtoWrapper = ({ onComplete, est }) => <ProtoNBack isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete('nback')} />;
const MemoryProtoWrapper = ({ onComplete, est }) => <MemoryGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete('memory')} />;
const ColorWordProtoWrapper = ({ onComplete, est }) => <ColorWordGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete('colorword')} />;
const TrailProtoWrapper = ({ onComplete, est }) => <TrailMakingGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete('trails')} />;

// Complete game catalog for demo selection
const ALL_GAMES = {
  balloon: {
    id: 'balloon',
    title: { es: 'Balloon Risk Task', en: 'Balloon Risk Task' },
    instructions: {
      es: 'Iniciando protocolo de evaluación de riesgo. Debe gestionar el equilibrio entre recompensa acumulada y probabilidad de colapso del sistema (explosión). Optimice el ratio de captura de puntos. Pulsa comenzar para iniciar.',
      en: 'Initiating risk assessment protocol. You must manage the balance between accumulated reward and the probability of system collapse (pop). Optimize the point capture ratio. Press start to begin.'
    },
    component: BalloonProtoWrapper,
    est: 60,
    telemetryId: 'game4'
  },
  grid: {
    id: 'grid',
    title: { es: 'Grid Flow', en: 'Grid Flow' },
    instructions: {
      es: 'Juego 2 · Grid Flow. Primero aprenderás a mover el operador, recoger un paquete y llevarlo a su nodo. Luego aparecerán energía, estaciones de carga y rutas con obstáculos. Cada nivel agrega una regla antes de subir la dificultad.',
      en: 'Game 2 · Grid Flow. First you will move the operator, pick up one packet, and deliver it to its node. Then energy, recharge stations, and blocked routes appear. Each level adds one rule before difficulty increases.'
    },
    component: GridProtoWrapper,
    est: 110,
    telemetryId: 'game6'
  },
  laser: {
    id: 'laser',
    title: { es: 'Laser Puzzle', en: 'Laser Puzzle' },
    instructions: {
      es: 'Juego 3 · Laser Puzzle. Comenzarás con espejos simples para redirigir un haz. Después se suman bifurcadores para dividir la señal y portales para saltar obstáculos. El briefing de cada fase explica solo la mecánica nueva.',
      en: 'Game 3 · Laser Puzzle. You start with simple mirrors to redirect a beam. Then bifurcators split the signal and portals jump over blockers. Each phase briefing explains only the new mechanic.'
    },
    component: LaserProtoWrapper,
    est: 100,
    telemetryId: 'game7'
  },
  gng: {
    id: 'gng',
    title: { es: 'Go / No-Go', en: 'Go / No-Go' },
    instructions: {
      es: 'Responde rápidamente a las señales Go y evita las señales No-Go. Pulsa comenzar para iniciar.',
      en: 'Respond quickly to Go signals and withhold response on No-Go signals. Press start to begin.'
    },
    component: GoNoGoProtoWrapper,
    est: 45
  },
  nback: {
    id: 'nback',
    title: { es: 'N-Back', en: 'N-Back' },
    instructions: {
      es: 'Recuerda la posición o la letra N pasos atrás y responde cuando coincida. Usa las teclas M = Match y N = No-Match, o los botones en pantalla. Pulsa comenzar para iniciar.',
      en: 'Remember the position or letter N steps back and respond when it matches. Use the keys M = Match and N = No-Match, or the on-screen buttons. Press start to begin.'
    },
    component: NBackProtoWrapper,
    est: 60
  },
  memory: {
    id: 'memory',
    title: { es: 'Secuencia Memorizada', en: 'Memory Sequence' },
    instructions: {
      es: 'Observa y memoriza la secuencia de cuadrados iluminados. Después, repite la secuencia pulsando en el mismo orden. Pulsa comenzar para iniciar.',
      en: 'Watch and memorize the sequence of illuminated squares. Then, repeat the sequence by tapping in the same order. Press start to begin.'
    },
    component: MemoryProtoWrapper,
    est: 90
  },
  colorword: {
    id: 'colorword',
    title: { es: 'Test Stroop (Color-Palabra)', en: 'Stroop Test' },
    instructions: {
      es: 'Elige el color de la palabra, NO el color escrito. Por ejemplo, si ves "ROJO" escrito en azul, elige azul. Pulsa comenzar para iniciar.',
      en: 'Choose the color of the word, NOT the written color. For example, if you see "RED" written in blue, choose blue. Press start to begin.'
    },
    component: ColorWordProtoWrapper,
    est: 75
  },
  trails: {
    id: 'trails',
    title: { es: 'Trail Making', en: 'Trail Making Test' },
    instructions: {
      es: 'Conecta los números en orden ascendente lo más rápido posible. En la Parte B, alterna entre números y letras (1-A-2-B-3-C...). Pulsa comenzar para iniciar.',
      en: 'Connect the numbers in ascending order as quickly as possible. In Part B, alternate between numbers and letters (1-A-2-B-3-C...). Press start to begin.'
    },
    component: TrailProtoWrapper,
    est: 120
  }
};

const DEMO_FIXED_IDS = ['balloon', 'grid', 'laser'];
// Default selection (short demo)
const DEFAULT_ACTIVITIES = DEMO_FIXED_IDS;

// Record mode: optimized for video recording / screencasts
const isRecordMode = () => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.get('record') === 'true';
};

const RECORD_TIMERS = {
  balloon: 30,
  grid: 40,
  laser: 35,
};

const RECORD_INSTRUCTIONS = {
  balloon: {
    es: 'Infla el globo para acumular puntos. Cada bombeo aumenta el riesgo de explosion.',
    en: 'Pump the balloon to earn points. Each pump increases the risk of popping.',
  },
  grid: {
    es: 'Recoge paquetes y entregalos en su destino. Gestiona tu energia.',
    en: 'Collect packages and deliver them. Manage your energy.',
  },
  laser: {
    es: 'Coloca espejos y bifurcadores para guiar el haz de luz a las antenas.',
    en: 'Place mirrors and splitters to guide the laser beam to the antennas.',
  },
};

const DemoShell = () => {
  const [gameSelectionMode, setGameSelectionMode] = useState(() => !isRecordMode());
  const [selectedGameIds, setSelectedGameIds] = useState(DEFAULT_ACTIVITIES);
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [completed, setCompleted] = useState({});
  const [toast, setToast] = useState(null);
  // Demo-specific UI state: public demo intentionally skips camera/microphone
  // prompts and report-generation telemetry. The final report is a locked dummy
  // preview handled by PostDemoScreen.
  const [showInstructions, setShowInstructions] = useState(true);
  const [activityStarted, setActivityStarted] = useState(false);
  const [demoSummary, setDemoSummary] = useState(null);
  const { setIsDemo, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const isEn = language === 'en';
  const isMobile = useIsMobile();
  const recordMode = isRecordMode();
  
  // Use a ref as a lock to prevent double-incrementing step
  const completingRef = useRef(null);

  // Build ACTIVITIES from selected games, applying record-mode overrides
  const ACTIVITIES = useMemo(() => {
    return selectedGameIds.map(id => {
      const game = ALL_GAMES[id];
      if (!game) return null;
      if (!recordMode) return game;
      return {
        ...game,
        est: RECORD_TIMERS[id] || game.est,
        instructions: RECORD_INSTRUCTIONS[id] || game.instructions,
      };
    }).filter(Boolean);
  }, [selectedGameIds, recordMode]);

  // Calculate total time from selected games
  const TOTAL_TIME = useMemo(() => {
    return ACTIVITIES.reduce((sum, game) => sum + game.est, 0);
  }, [ACTIVITIES]);

  // Initialize timeLeft when TOTAL_TIME changes
  useEffect(() => {
    if (timeLeft === null) {
      setTimeLeft(TOTAL_TIME);
    }
  }, [TOTAL_TIME, timeLeft]);

  useEffect(() => {
    if (step >= ACTIVITIES.length && ACTIVITIES.length > 0) {
      setStep(0);
    }
  }, [step, ACTIVITIES.length]);

  const demoCopy = {
    es: {
      interactiveDemo: 'Demo interactiva',
      selectGames: 'Selecciona tus juegos',
      demoLockNotice: 'Demo corta: solo 3 juegos disponibles.',
      lockedGameLabel: 'No disponible en demo',
      activitiesLabel: 'actividades',
      timeRemaining: 'Tiempo restante:',
      progressTitle: 'Progreso',
      activityLabel: 'Actividad',
      estLabel: 'Est.',
      previous: 'Anterior',
      skip: 'Saltar',
      next: 'Siguiente',
      restart: 'Reiniciar demo',
      instructionsTitle: 'Instrucciones',
      startButton: 'Comenzar actividad',
      continueButton: 'Continuar a demo',
      readyMessage: 'Actividad preparada. Lee las instrucciones y pulsa comenzar.',
      activityCompletedTemplate: 'Actividad {id} completada',
      activityCompletedShort: 'Actividad completada',
      noGamesSelected: 'Selecciona al menos un juego para continuar'
    },
    en: {
      interactiveDemo: 'Interactive demo',
      selectGames: 'Select your games',
      demoLockNotice: 'Short demo: only 3 games available.',
      lockedGameLabel: 'Not available in demo',
      activitiesLabel: 'activities',
      timeRemaining: 'Time remaining:',
      progressTitle: 'Progress',
      activityLabel: 'Activity',
      estLabel: 'Est.',
      previous: 'Previous',
      skip: 'Skip',
      next: 'Next',
      restart: 'Restart demo',
      instructionsTitle: 'Instructions',
      startButton: 'Start activity',
      continueButton: 'Continue to demo',
      readyMessage: 'Activity ready. Read the instructions and press start.',
      activityCompletedTemplate: 'Activity {id} completed',
      activityCompletedShort: 'Activity completed',
      noGamesSelected: 'Select at least one game to continue'
    }
  };

  const handleStartDemo = () => {
    setGameSelectionMode(false);
    setTimeLeft(TOTAL_TIME);
    setActivityStarted(false);
    setShowInstructions(true);
  };

  const handleGameSelectionChange = () => {
    setSelectedGameIds(DEMO_FIXED_IDS);
  };

  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);
  const completionLockRef = useRef(false);
  const completedRef = useRef(completed);

  const handleDemoComplete = useCallback((completedObj, reason = 'completed') => {
    if (completionLockRef.current) {
      return;
    }
    completionLockRef.current = true;
    
    const completedIds = Object.keys(completedObj || {});
    const timeUsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);

    const activityRows = ACTIVITIES.map((activity, index) => ({
      id: activity.id,
      title: activity.title,
      est: activity.est,
      order: index + 1,
      status: completedIds.includes(activity.id) ? 'completed' : 'not_completed',
      telemetryId: activity.telemetryId || activity.id,
    }));

    const demoTelemetryPlaceholder = {
      mode: 'dummy_preview',
      captureCoverage: null,
      note: 'Public demo does not generate a real telemetry report.',
    };
    const enrichedActivities = activityRows.map((activity) => ({
      ...activity,
      analytics: null,
    }));

    setDemoSummary({
      reason,
      timeUsedSec,
      totalActivities: ACTIVITIES.length,
      completedCount: completedIds.length,
      selectedIds: selectedGameIds,
      completedIds,
      activities: enrichedActivities,
      telemetry: demoTelemetryPlaceholder,
    });
    try {
      stopTracking('demo', 0, null, { completedIds, timeUsedSec });
      recordTrialEvent({ event: 'demo_complete', payload: { completedIds, timeUsedSec, completedCount: completedIds.length } });
    } catch {
      // swallow telemetry errors
    }

    // Mark finished only after summary and telemetry recorded
    finishedRef.current = true;
  }, [ACTIVITIES, selectedGameIds, stopTracking, recordTrialEvent]);

  useEffect(() => {
    // Only start timer if demo is running
    if (gameSelectionMode || !ACTIVITIES.length || !activityStarted) return;
    
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [gameSelectionMode, ACTIVITIES.length, activityStarted]);

  useEffect(() => {
    if (gameSelectionMode || !timeLeft || timeLeft > 0) return;

    // finished by time
    handleDemoComplete(completedRef.current, 'timeout');
  }, [timeLeft, gameSelectionMode, ACTIVITIES.length]);

  useEffect(() => {
    // keep a ref to the latest completed state for cleanup callbacks
    completedRef.current = completed;
  }, [completed]);

  // showReport is no longer needed; we render PostDemoScreen directly when demoSummary exists

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 1400);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    // mark this session as demo and start tracking
    try {
      setIsDemo(true);
      startTracking('demo');
      startedAtRef.current = Date.now();
    } catch {
      // noop
    }

    // In record mode, auto-start the demo (skip game selection screen)
    if (recordMode) {
      const timer = setTimeout(() => {
        handleStartDemo();
      }, 600);
      return () => {
        clearTimeout(timer);
        setIsDemo(false);
        if (!finishedRef.current) {
          const completedCount = Object.keys(completedRef.current || {}).length;
          const timeUsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
          try {
            stopTracking('demo', 0, null, { reason: 'unmount', completedCount, timeUsedSec });
            recordTrialEvent({ event: 'demo_abandon', payload: { completedCount, timeUsedSec } });
          } catch {
            // silent
          }
          finishedRef.current = true;
        }
      };
    }

    return () => {
      setIsDemo(false);
      if (!finishedRef.current) {
        // user left before finishing
        const completedCount = Object.keys(completedRef.current || {}).length;
        const timeUsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
        try {
          stopTracking('demo', 0, null, { reason: 'unmount', completedCount, timeUsedSec });
          recordTrialEvent({ event: 'demo_abandon', payload: { completedCount, timeUsedSec } });
        } catch {
          // silent
        }
        finishedRef.current = true;
      }
    };
  }, []);

  // Only the first activity uses the instructions gate; later rounds auto-start.
  useEffect(() => {
    completingRef.current = null; // Unlock for next activity

    if (step === 0) {
      setShowInstructions(true);
      setActivityStarted(false);
      return;
    }

    if (step < ACTIVITIES.length) {
      setShowInstructions(false);
      setActivityStarted(true);
    }
  }, [step, ACTIVITIES.length]);

  // NOTE: Removed inline debug wrapper to avoid remounts on every render.

  const onComplete = useCallback((id) => {
    // Prevent double-counting or race conditions
    if (completed[id] || completingRef.current === id) {
      return;
    }
    completingRef.current = id;


    try {
      recordTrialEvent && recordTrialEvent({ event: 'demo_activity_complete', payload: { id, step } });
    } catch {
      // noop
    }

    setToast(isEn ? `Protocol ${id} completed` : `Protocolo ${id} completado`);

    const nextCompleted = { ...completed, [id]: true };
    const doneCount = Object.keys(nextCompleted).length;

    setCompleted(nextCompleted);

    // Short delay to allow brief completion animation, then transition quickly
    setTimeout(() => {
      if (doneCount >= ACTIVITIES.length) {
        handleDemoComplete(nextCompleted, 'completed');
      } else {
        setToast(isEn ? 'Preparing next assessment module...' : 'Preparando siguiente módulo...');
        setStep((prevStep) => prevStep + 1);
      }
      // Always clear the lock after transition
      completingRef.current = null;
    }, 200);
  }, [completed, step, ACTIVITIES, ACTIVITIES.length, isEn, recordTrialEvent, handleDemoComplete]);

  const restart = () => {
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    setStep(0);
    setTimeLeft(TOTAL_TIME);
    setCompleted({});
    setDemoSummary(null);
    setGameSelectionMode(true);
  };

  if (demoSummary) {
    return (
      <PostDemoScreen
        summary={demoSummary}
        onRestart={restart}
      />
    );
  }

  return (
    <div className="demo-shell">
      <AnimatePresence mode="wait">
        {/* GAME SELECTION SCREEN */}
        {gameSelectionMode ? (
          <motion.div 
            key="selection"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="demo-selection"
          >
            <header className="selection-header" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: isMobile ? '0 0 24px 24px' : '0 0 48px 48px', margin: '0 0 40px 0', padding: isMobile ? '40px 20px' : '80px 24px' }}>
              <h1 style={{ fontSize: isMobile ? '2rem' : '3.5rem', marginBottom: '16px', color: 'white' }}>{demoCopy[language]?.interactiveDemo || demoCopy.es.interactiveDemo}</h1>
              <p style={{ fontSize: isMobile ? '1rem' : '1.25rem', opacity: 0.9, color: 'white' }}>{demoCopy[language]?.selectGames || demoCopy.es.selectGames}</p>
              <div style={{ marginTop: isMobile ? 16 : 24, display: 'inline-flex', padding: isMobile ? '8px 16px' : '8px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
                {demoCopy[language]?.demoLockNotice || demoCopy.es.demoLockNotice}
              </div>
            </header>

            <main className="selection-main">
              <GameGallery
                selectedGames={selectedGameIds}
                onSelectionChange={handleGameSelectionChange}
                maxGames={DEMO_FIXED_IDS.length}
                availableGameIds={DEMO_FIXED_IDS}
                lockedLabel={demoCopy[language]?.lockedGameLabel || demoCopy.es.lockedGameLabel}
                lockSelection={true}
                compactLayout={isMobile}
              />

              {selectedGameIds.length > 0 && (
                <div className="selection-actions" style={{ border: 'none', marginTop: '48px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(99,102,241,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    onClick={handleStartDemo}
                    style={{ padding: isMobile ? '16px 28px' : '20px 60px', fontSize: isMobile ? '1rem' : '1.2rem', borderRadius: '20px' }}
                  >
                    {demoCopy[language]?.continueButton || demoCopy.es.continueButton}
                    {' '}
                    ({ACTIVITIES.length} {demoCopy[language]?.activitiesLabel || demoCopy.es.activitiesLabel})
                  </motion.button>
                </div>
              )}
            </main>
          </motion.div>
        ) : (
          <motion.div 
            key="playing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="demo-game-container"
          >
            {/* COMPACT FLOATING HEADER */}
            <div className="demo-floating-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <h2 style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0 }}>{demoCopy[language]?.interactiveDemo || demoCopy.es.interactiveDemo}</h2>
                <div className="demo-timer-compact" style={{ color: timeLeft < 30 ? '#ef4444' : '#64748b' }}>
                  {Math.floor((timeLeft || TOTAL_TIME) / 60)}:{String((timeLeft || TOTAL_TIME) % 60).padStart(2, '0')}
                </div>
                {recordMode && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(239,68,68,0.15)', borderRadius: '6px', padding: '3px 10px', fontSize: '0.7rem', fontWeight: 700, color: '#ef4444', letterSpacing: '1px', animation: 'pulse 2s infinite' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                    REC
                  </div>
                )}
              </div>
              <ProgressTracker
                completed={Object.keys(completed)}
                total={ACTIVITIES.length}
                currentId={ACTIVITIES[step]?.id}
                games={ACTIVITIES}
                compact={true}
              />
            </div>

            <main className="demo-fullscreen-main">
              {toast && <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="demo-toast">{toast}</motion.div>}

              <AnimatePresence>
                {showInstructions && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="instructions-overlay"
                  >
                    <motion.div 
                      initial={{ scale: 0.9, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      className="instructions-box"
                    >
                      <div style={{ color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem', marginBottom: '12px' }}>{demoCopy[language]?.instructionsTitle || demoCopy.es.instructionsTitle}</div>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: '1.5rem', fontWeight: 850 }}>{(ACTIVITIES[step]?.title && typeof ACTIVITIES[step].title === 'object' ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es) : ACTIVITIES[step]?.title)}</h4>
                      <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#334155', marginBottom: '32px' }}>{(ACTIVITIES[step]?.instructions && ACTIVITIES[step].instructions[language]) || (ACTIVITIES[step]?.instructions && ACTIVITIES[step].instructions.es)}</p>
                      <button className="btn btn-primary" style={{ width: '100%', padding: '18px', borderRadius: '16px' }} onClick={() => { setShowInstructions(false); setActivityStarted(true); }}>{demoCopy[language]?.startButton || demoCopy.es.startButton}</button>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="game-stage">
                {activityStarted && ACTIVITIES[step] && !showInstructions ? (() => {
                  const currentActivity = ACTIVITIES[step];
                  const ActivityComponent = currentActivity.component;
                  const currentId = currentActivity.id;
                  return <ActivityComponent key={currentId} onComplete={() => onComplete(currentId)} est={currentActivity.est} />;
                })() : (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    <p>{demoCopy[language]?.readyMessage || demoCopy.es.readyMessage}</p>
                  </div>
                )}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="demo-live-announcer" className="sr-only" role="status" aria-live="polite" />
    </div>
  );
};

export default DemoShell;
