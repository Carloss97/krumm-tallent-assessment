/* eslint-disable react-hooks/exhaustive-deps */
// TODO: Fix React Hook dependencies properly in a future refactor
// This file uses complex state management patterns that require careful dependency array handling
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
import './DemoShell.css';

// Adapter wrappers so DemoShell can call games with the expected onComplete() callback
// For the demo we intentionally allow full-mode versions
const BalloonProtoWrapper = ({ onComplete, est }) => <ProtoBalloon isActive={true} isDemo={true} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const GridProtoWrapper = ({ onComplete, est }) => <GridFlowGame isActive={true} isDemo={true} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const LaserProtoWrapper = ({ onComplete, est }) => <LaserPuzzleGame isActive={true} isDemo={true} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const GoNoGoProtoWrapper = ({ onComplete, est }) => <ProtoGoNoGo isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const NBackProtoWrapper = ({ onComplete, est }) => <ProtoNBack isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const MemoryProtoWrapper = ({ onComplete, est }) => <MemoryGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const ColorWordProtoWrapper = ({ onComplete, est }) => <ColorWordGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const TrailProtoWrapper = ({ onComplete, est }) => <TrailMakingGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;

// Complete game catalog for demo selection
const ALL_GAMES = {
  balloon: {
    id: 'balloon',
    title: { es: 'Inflar el globo', en: 'Inflate the balloon' },
    instructions: {
      es: 'Infla el globo con cuidado. Cada inflado aumenta el riesgo de explotar. Pulsa comenzar para iniciar.',
      en: 'Pump the balloon carefully. Each pump increases the chance of popping. Press start to begin.'
    },
    component: BalloonProtoWrapper,
    est: 60,
    telemetryId: 'game4'
  },
  grid: {
    id: 'grid',
    title: { es: 'Grid Flow', en: 'Grid Flow' },
    instructions: {
      es: 'Optimiza el flujo de paquetes en la red. Recógelos y llévalos a su destino antes de que expire su satisfacción. Gestiona tu energía. Pulsa comenzar para iniciar.',
      en: 'Optimize packet flow in the network. Collect and deliver them to their destination before satisfaction expires. Manage your energy. Press start to begin.'
    },
    component: GridProtoWrapper,
    est: 110,
    telemetryId: 'game6'
  },
  laser: {
    id: 'laser',
    title: { es: 'Láser y espejos', en: 'Laser & mirrors' },
    instructions: {
      es: 'Guia el láser con espejos para iluminar todas las antenas. Luego aparece el bifurcador para dividir el haz. Pulsa comenzar para iniciar.',
      en: 'Guide the laser with mirrors to light all antennas. Then a bifurcator appears to split the beam. Press start to begin.'
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
  const { sessionData, setIsDemo, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();

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
    setShowPermission(true);
    setTimeLeft(TOTAL_TIME);
  };

  const handleGameSelectionChange = () => {
    setSelectedGameIds(DEMO_FIXED_IDS);
  };

  const startedAtRef = useRef(0);
  const finishedRef = useRef(false);
  const completedRef = useRef(completed);

  function handleDemoComplete(completedObj, reason = 'completed') {
    if (finishedRef.current) return;
    finishedRef.current = true;
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

    const telemetryReport = analyzeDemoTelemetry(sessionData, activityRows);
    const gameRowsById = new Map(telemetryReport.perGame.map((item) => [item.id, item]));
    const enrichedActivities = activityRows.map((activity) => ({
      ...activity,
      analytics: gameRowsById.get(activity.id) || null,
    }));

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
    setShowReport(true);

    try {
      stopTracking('demo', 0, null, { completedIds, timeUsedSec });
      recordTrialEvent({ event: 'demo_complete', payload: { completedIds, timeUsedSec, completedCount: completedIds.length } });
    } catch {
      // swallow telemetry errors
    }
  }

  useEffect(() => {
    // Only start timer if demo is running
    if (gameSelectionMode || !ACTIVITIES.length) return;
    
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [gameSelectionMode, ACTIVITIES.length]);

  useEffect(() => {
    if (gameSelectionMode || !timeLeft || timeLeft > 0) return;

    // finished by time
    handleDemoComplete(completedRef.current, 'timeout');
  }, [timeLeft, gameSelectionMode, ACTIVITIES.length]);

  useEffect(() => {
    // keep a ref to the latest completed state for cleanup callbacks
    completedRef.current = completed;
  }, [completed]);

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

  // show instructions at the start of each activity
  useEffect(() => {
     
    setShowInstructions(true);
     
    setActivityStarted(false);
  }, [step]);

  const onComplete = (id) => {
    try {
      recordTrialEvent && recordTrialEvent({ event: 'demo_activity_complete', payload: { id, step } });
    } catch {
      // noop
    }
    // brief success toast with accessible announcer
    const a = document.getElementById('demo-live-announcer');
    if (a) a.textContent = (demoCopy[language]?.activityCompletedTemplate || demoCopy.es.activityCompletedTemplate).replace('{id}', id);

    setToast(demoCopy[language]?.activityCompletedShort || demoCopy.es.activityCompletedShort);

    setCompleted((c) => {
      const next = { ...c, [id]: true };
      const doneCount = Object.keys(next).length;
      if (doneCount >= ACTIVITIES.length) {
        handleDemoComplete(next, 'completed');
      } else {
        setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1));
      }
      return next;
    });
  };

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

  if (showReport) {
    return (
      <PostDemoScreen
        summary={demoSummary}
        onRestart={restart}
      />
    );
  }

  const requestPermissions = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
      } catch {
        // ignore permission errors
      }
    }
    setShowPermission(false);
    // once permissions are handled, ensure the instructions overlay is visible for the next activity
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
            <header className="selection-header" style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)', borderRadius: '24px', margin: '0 0 40px 0', padding: '60px 24px' }}>
              <h1 style={{ fontSize: '3.5rem', marginBottom: '16px' }}>{demoCopy[language]?.interactiveDemo || demoCopy.es.interactiveDemo}</h1>
              <p style={{ fontSize: '1.25rem', opacity: 0.9 }}>{demoCopy[language]?.selectGames || demoCopy.es.selectGames}</p>
              <div style={{ marginTop: 24, display: 'inline-flex', padding: '8px 20px', background: 'rgba(255,255,255,0.1)', borderRadius: '999px', fontSize: '0.9rem', fontWeight: 600 }}>
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
                    style={{ padding: '20px 60px', fontSize: '1.2rem', borderRadius: '20px', background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
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
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* DEMO PLAYTHROUGH SCREEN */}
            <header className="demo-header" style={{ borderRadius: '20px', border: '1px solid rgba(99,102,241,0.1)', padding: '20px 24px', marginBottom: '32px' }}>
              <div className="header-top">
                <h2 style={{ color: '#1e1b4b', fontWeight: 800 }}>{demoCopy[language]?.interactiveDemo || demoCopy.es.interactiveDemo}</h2>
                <div className="demo-timer" style={{ background: '#f1f5f9', padding: '8px 16px', borderRadius: '12px', fontWeight: 700, color: timeLeft < 30 ? '#dc2626' : '#475569' }}>
                  {demoCopy[language]?.timeRemaining || demoCopy.es.timeRemaining} {Math.floor((timeLeft || TOTAL_TIME) / 60)}:{String((timeLeft || TOTAL_TIME) % 60).padStart(2, '0')}
                </div>
              </div>
              
              <ProgressTracker
                completed={Object.keys(completed)}
                total={ACTIVITIES.length}
                currentId={ACTIVITIES[step]?.id}
                games={ACTIVITIES}
              />
            </header>

            <main className="demo-main">
              <section className="demo-activity" style={{ borderRadius: '24px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9', padding: '32px' }}>
                <LiveDemoTelemetryHud
                  activeGameId={ACTIVITIES[step]?.id}
                  activeGameLabel={(ACTIVITIES[step]?.title && typeof ACTIVITIES[step].title === 'object')
                    ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es)
                    : ACTIVITIES[step]?.title}
                />
                {toast && <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="demo-toast">{toast}</motion.div>}
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                  <h3 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: '#1e1b4b' }}>{(ACTIVITIES[step]?.title && typeof ACTIVITIES[step].title === 'object') ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es) : ACTIVITIES[step]?.title}</h3>
                  <div className="demo-activity-meta" style={{ margin: 0, background: 'rgba(99,102,241,0.06)', padding: '6px 14px', borderRadius: '999px', fontSize: '0.85rem' }}>{demoCopy[language]?.estLabel || demoCopy.es.estLabel} {Math.floor(ACTIVITIES[step]?.est / 60)}:{String(ACTIVITIES[step]?.est % 60).padStart(2, '0')}</div>
                </div>

                <PermissionModal open={showPermission} onClose={() => setShowPermission(false)} onRequest={requestPermissions} />

                <AnimatePresence>
                  {showInstructions && (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="instructions-overlay" 
                      style={{ background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', borderRadius: '24px' }}
                    >
                      <motion.div 
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        className="instructions-box" 
                        style={{ borderRadius: '24px', padding: '40px', maxWidth: '540px', textAlign: 'center' }}
                      >
                        <div style={{ color: '#6366f1', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '2px', fontSize: '0.75rem', marginBottom: '12px' }}>{demoCopy[language]?.instructionsTitle || demoCopy.es.instructionsTitle}</div>
                        <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#334155', marginBottom: '32px' }}>{(ACTIVITIES[step]?.instructions && ACTIVITIES[step].instructions[language]) || (ACTIVITIES[step]?.instructions && ACTIVITIES[step].instructions.es) || (ACTIVITIES[step]?.title && typeof ACTIVITIES[step].title === 'object' ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es) : ACTIVITIES[step]?.title)}</p>
                        <button className="btn btn-primary" style={{ width: '100%', padding: '16px', borderRadius: '16px' }} onClick={() => { setShowInstructions(false); setActivityStarted(true); }}>{demoCopy[language]?.startButton || demoCopy.es.startButton}</button>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div style={{ minHeight: '580px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activityStarted && ACTIVITIES[step] ? (() => {
                    const ActivityComponent = ACTIVITIES[step].component;
                    return <ActivityComponent onComplete={() => onComplete(ACTIVITIES[step].id)} est={ACTIVITIES[step].est} />;
                  })() : (
                    <div style={{ padding: 28, textAlign: 'center', color: '#6b7280' }}>
                      <p>{demoCopy[language]?.readyMessage || demoCopy.es.readyMessage}</p>
                    </div>
                  )}
                </div>
              </section>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      <div id="demo-live-announcer" className="sr-only" role="status" aria-live="polite" />
    </div>
  );
};

export default DemoShell;
