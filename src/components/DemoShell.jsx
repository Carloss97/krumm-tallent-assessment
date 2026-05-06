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
import PermissionModal from './PermissionModal';
import PostDemoScreen from './PostDemoScreen';
import GameGallery from './GameGallery';
import ProgressTracker from './ProgressTracker';
import LiveDemoTelemetryHud from './LiveDemoTelemetryHud';
import { analyzeDemoTelemetry } from '../utils/advancedTelemetryAnalytics';
import { useWebcamCapture } from '../hooks/useWebcamCapture';
import './DemoShell.css';

// Adapter wrappers so DemoShell can call games with the expected onComplete() callback
// For the demo we intentionally allow full-mode versions
const BalloonProtoWrapper = ({ onComplete, est }) => (
  <ProtoBalloon
    isActive={true}
    isDemo={true}
    showBriefing={false}
    timeLimit={est}
    onEndGame={() => { setTimeout(() => onComplete && onComplete('balloon'), 50); }}
  />
);
const GridProtoWrapper = ({ onComplete, est }) => (
  <GridFlowGame
    isActive={true}
    isDemo={true}
    showBriefing={false}
    timeLimit={est}
    onEndGame={() => { 
      console.log('[GridFlow-WRAPPER] onEndGame fired, calling onComplete in 50ms');
      setTimeout(() => {
        console.log('[GridFlow-WRAPPER] Calling onComplete callback for grid');
        onComplete && onComplete('grid');
      }, 50); 
    }}
  />
);
const LaserProtoWrapper = ({ onComplete, est }) => (
  <LaserPuzzleGame
    isActive={true}
    isDemo={true}
    showBriefing={false}
    timeLimit={est}
    onEndGame={() => { 
      console.log('[LaserPuzzle-WRAPPER] onEndGame fired, calling onComplete in 50ms');
      setTimeout(() => {
        console.log('[LaserPuzzle-WRAPPER] Calling onComplete callback for laser');
        onComplete && onComplete('laser');
      }, 50); 
    }}
  />
);
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
      es: 'Iniciando protocolo de optimización de ruteo logístico. Debe asegurar la integridad de los paquetes de datos y transferirlos a los nodos de descarga correspondientes antes de que la latencia (satisfacción) degrade la operación. Gestione el consumo energético del sistema. Pulsa comenzar para iniciar.',
      en: 'Initiating logistic routing optimization protocol. You must ensure data packet integrity and transfer them to the corresponding download nodes before latency (satisfaction) degrades the operation. Manage system energy consumption. Press start to begin.'
    },
    component: GridProtoWrapper,
    est: 110,
    telemetryId: 'game6'
  },
  laser: {
    id: 'laser',
    title: { es: 'Laser Puzzle', en: 'Laser Puzzle' },
    instructions: {
      es: 'Iniciando fase de calibración óptica. Utilice las unidades de reflexión para alinear el haz de fotones con los receptores de señal. Despliegue el módulo de bifurcación para cubrir múltiples objetivos. Optimice la secuencia de ruteo para máxima precisión. Pulsa comenzar para iniciar.',
      en: 'Starting optical calibration phase. Use reflection units to align the photon beam with signal receivers. Deploy the bifurcation module to cover multiple targets. Optimize routing sequence for maximum precision. Press start to begin.'
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

const DEMO_FIXED_IDS = ['balloon', 'laser', 'grid'];
// Default selection (short demo)
const DEFAULT_ACTIVITIES = DEMO_FIXED_IDS;

const DemoShell = () => {
  const [gameSelectionMode, setGameSelectionMode] = useState(true);
  const [selectedGameIds, setSelectedGameIds] = useState(DEFAULT_ACTIVITIES);
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [completed, setCompleted] = useState({});
  const [toast, setToast] = useState(null);
  // Demo-specific UI state
  const [showPermission, setShowPermission] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [activityStarted, setActivityStarted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [demoSummary, setDemoSummary] = useState(null);
  const { sessionData, setIsDemo, startTracking, stopTracking, recordTrialEvent, recordWebcamFrame, setConsent } = useTelemetry();
  const { language } = useLanguage();
  const isEn = language === 'en';
  
  // Use a ref as a lock to prevent double-incrementing step
  const completingRef = useRef(null);

  const videoRef = useWebcamCapture({
    isActive: !gameSelectionMode && !showReport,
    shouldCapture: !gameSelectionMode && !showReport,
    onFrameCapture: recordWebcamFrame
  });

  // Build ACTIVITIES from selected games
  const ACTIVITIES = useMemo(() => {
    return selectedGameIds.map(id => ALL_GAMES[id]).filter(Boolean);
  }, [selectedGameIds]);

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
    setShowPermission(true); // Always ask for permissions when demo starts
    setTimeLeft(TOTAL_TIME);
    setActivityStarted(false);
    setShowInstructions(false); // Hide instructions until permissions are handled
  };

  const handleGameSelectionChange = () => {
    setSelectedGameIds(DEMO_FIXED_IDS);
  };

  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);
  const completedRef = useRef(completed);

  const handleDemoComplete = useCallback((completedObj, reason = 'completed') => {
    if (finishedRef.current) {
      console.log('[DEMO-TRACE] handleDemoComplete guard: already finished, skipping');
      return;
    }
    finishedRef.current = true;
    console.log('[DEMO-TRACE] handleDemoComplete executing with reason:', reason);
    
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

    console.log('[DEMO-TRACE] Analyzing telemetry with sessionData:', Object.keys(sessionData || {}));
    const telemetryReport = analyzeDemoTelemetry(sessionData, activityRows);
    const gameRowsById = new Map(telemetryReport.perGame.map((item) => [item.id, item]));
    const enrichedActivities = activityRows.map((activity) => ({
      ...activity,
      analytics: gameRowsById.get(activity.id) || null,
    }));

    console.log('[DEMO-TRACE] Calling setDemoSummary with summary object');
    setDemoSummary({
      reason,
      timeUsedSec,
      totalActivities: ACTIVITIES.length,
      completedCount: completedIds.length,
      selectedIds: selectedGameIds,
      completedIds,
      activities: enrichedActivities,
      telemetry: telemetryReport,
    });

    try {
      stopTracking('demo', 0, null, { completedIds, timeUsedSec });
      recordTrialEvent({ event: 'demo_complete', payload: { completedIds, timeUsedSec, completedCount: completedIds.length } });
    } catch {
      // swallow telemetry errors
    }
  }, [ACTIVITIES, sessionData, selectedGameIds, stopTracking, recordTrialEvent]);

  useEffect(() => {
    // Only start timer if demo is running
    if (gameSelectionMode || !ACTIVITIES.length || showPermission || !activityStarted) return;
    
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [gameSelectionMode, ACTIVITIES.length, showPermission, activityStarted]);

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
    console.log(`[DEMO-TRACE] step useEffect fired: step=${step}, ACTIVITIES.length=${ACTIVITIES.length}`);

    if (step === 0) {
      console.log(`[DEMO-TRACE] Showing instructions for first activity`);
      setShowInstructions(true);
      setActivityStarted(false);
      return;
    }

    if (step < ACTIVITIES.length) {
      console.log(`[DEMO-TRACE] Auto-starting activity at step ${step}`);
      setShowInstructions(false);
      setActivityStarted(true);
    }
  }, [step, ACTIVITIES.length]);

  const onComplete = useCallback((id) => {
    // Prevent double-counting or race conditions
    if (completed[id] || completingRef.current === id) {
      console.log(`[DEMO-TRACE] onComplete debounced for ${id} (already completed or processing)`);
      return;
    }
    completingRef.current = id;

    console.log(`[DEMO-TRACE] onComplete called for: ${id}, current step: ${step}, activities remaining: ${ACTIVITIES.length - (Object.keys(completed).length + 1)}`);

    try {
      recordTrialEvent && recordTrialEvent({ event: 'demo_activity_complete', payload: { id, step } });
    } catch {
      // noop
    }

    setToast(isEn ? `Protocol ${id} completed` : `Protocolo ${id} completado`);

    const nextCompleted = { ...completed, [id]: true };
    const doneCount = Object.keys(nextCompleted).length;
    console.log(`[DEMO-TRACE] Game completed count: ${doneCount}/${ACTIVITIES.length}`);

    setCompleted(nextCompleted);

    // Use a slight delay to allow game completion animation before showing transition
    setTimeout(() => {
      if (doneCount >= ACTIVITIES.length) {
        console.log(`[DEMO-TRACE] All activities complete, showing report`);
        handleDemoComplete(nextCompleted, 'completed');
      } else {
        const nextStep = step + 1;
        console.log(`[DEMO-TRACE] Advancing to next activity: step ${step} → ${nextStep}, ACTIVITIES[${nextStep}]=${ACTIVITIES[nextStep]?.id}`);
        setToast(isEn ? 'Preparing next assessment module...' : 'Preparando siguiente módulo...');
        setStep((prevStep) => prevStep + 1);
      }
      // Always clear the lock after transition
      completingRef.current = null;
    }, 1500);
  }, [completed, step, ACTIVITIES, ACTIVITIES.length, isEn, recordTrialEvent, handleDemoComplete]);

  const restart = () => {
    finishedRef.current = false;
    startedAtRef.current = Date.now();
    setStep(0);
    setTimeLeft(TOTAL_TIME);
    setCompleted({});
    setDemoSummary(null);
    setShowReport(false);
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

  const requestPermissions = async () => {
    let cursorConsent = true; // Assume cursor consent if they proceed
    let webcamConsent = false;
    
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: false, video: true });
        if (s) {
          webcamConsent = true;
          if (s.getTracks) s.getTracks().forEach(t => t.stop());
        }
      } catch (error) {
        console.warn('Webcam permission denied:', error);
      }
    }
    
    setConsent(cursorConsent, webcamConsent);
    setShowPermission(false);
    setShowInstructions(true);
    setActivityStarted(false);
  };

  const continueWithoutPermissions = () => {
    setConsent(true, false);
    setShowPermission(false);
    setShowInstructions(true);
    setActivityStarted(false);
  };

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
            <header className="selection-header" style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)', borderRadius: '0 0 48px 48px', margin: '0 0 40px 0', padding: '80px 24px' }}>
              <h1 style={{ fontSize: '3.5rem', marginBottom: '16px', color: 'white' }}>{demoCopy[language]?.interactiveDemo || demoCopy.es.interactiveDemo}</h1>
              <p style={{ fontSize: '1.25rem', opacity: 0.9, color: 'white' }}>{demoCopy[language]?.selectGames || demoCopy.es.selectGames}</p>
              <div style={{ marginTop: 24, display: 'inline-flex', padding: '8px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600, color: 'white' }}>
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
              />

              {selectedGameIds.length > 0 && (
                <div className="selection-actions" style={{ border: 'none', marginTop: '48px' }}>
                  <motion.button
                    whileHover={{ scale: 1.05, boxShadow: '0 20px 40px -10px rgba(99,102,241,0.5)' }}
                    whileTap={{ scale: 0.95 }}
                    className="btn btn-primary"
                    onClick={handleStartDemo}
                    style={{ padding: '20px 60px', fontSize: '1.2rem', borderRadius: '20px' }}
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
              <LiveDemoTelemetryHud
                activeGameId={ACTIVITIES[step]?.id}
                activeGameLabel={(ACTIVITIES[step]?.title && typeof ACTIVITIES[step].title === 'object')
                  ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es)
                  : ACTIVITIES[step]?.title}
              />
              
              {toast && <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="demo-toast">{toast}</motion.div>}

              <PermissionModal
                open={showPermission}
                onClose={continueWithoutPermissions}
                onRequest={requestPermissions}
              />

              <AnimatePresence>
                {showInstructions && !showPermission && (
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
                {activityStarted && ACTIVITIES[step] && !showInstructions && !showPermission ? (() => {
                  const ActivityComponent = ACTIVITIES[step].component;
                  return <ActivityComponent key={ACTIVITIES[step].id} onComplete={() => onComplete(ACTIVITIES[step].id)} est={ACTIVITIES[step].est} />;
                })() : (
                  <div style={{ textAlign: 'center', color: '#64748b' }}>
                    {showPermission ? null : <p>{demoCopy[language]?.readyMessage || demoCopy.es.readyMessage}</p>}
                  </div>
                )}
              </div>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="demo-live-announcer" className="sr-only" role="status" aria-live="polite" />
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
    </div>
  );
};

export default DemoShell;
