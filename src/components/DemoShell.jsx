import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
// Prefer prototype games for a higher-fidelity demo experience
import ProtoBalloon from '../games/BalloonGame';
import GridOptimizerGame from '../games/GridOptimizerGame';
import LaserPuzzleGame from '../games/LaserPuzzleGame';
import ProtoGoNoGo from '../games/GoNoGoGame';
import ProtoNBack from '../games/NBackGame';
import PermissionModal from './PermissionModal';
import PostDemoScreen from './PostDemoScreen';
import './DemoShell.css';

// Adapter wrappers so DemoShell can call prototypes with the expected onComplete() callback
// For the demo we intentionally allow more attempts — run full-mode versions
const BalloonProtoWrapper = ({ onComplete, est }) => <ProtoBalloon isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const GridProtoWrapper = ({ onComplete, est }) => <GridOptimizerGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const LaserProtoWrapper = ({ onComplete, est }) => <LaserPuzzleGame isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const GoNoGoProtoWrapper = ({ onComplete, est }) => <ProtoGoNoGo isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;
const NBackProtoWrapper = ({ onComplete, est }) => <ProtoNBack isActive={true} isDemo={false} timeLimit={est} onEndGame={() => onComplete && onComplete()} />;

const ACTIVITIES = [
  {
    id: 'balloon',
    title: { es: 'Inflar el globo', en: 'Inflate the balloon' },
    instructions: {
      es: 'Infla el globo con cuidado. Cada inflado aumenta el riesgo de explotar. Pulsa comenzar para iniciar.',
      en: 'Pump the balloon carefully. Each pump increases the chance of popping. Press start to begin.'
    },
    component: BalloonProtoWrapper,
    est: 60
  },
  {
    id: 'grid',
    title: { es: 'Optimizar rejilla', en: 'Optimize grid' },
    instructions: {
      es: 'Lleva los bloques de color a su destino lo antes posible. En niveles superiores evita quedarte sin energía. Pulsa comenzar para iniciar.',
      en: 'Carry colored blocks to their destination as quickly as possible. In higher levels avoid running out of energy. Press start to begin.'
    },
    component: GridProtoWrapper,
    est: 75
  },
  {
    id: 'laser',
    title: { es: 'Puzzle láser', en: 'Laser puzzle' },
    instructions: {
      es: 'Resuelve el puzzle láser dirigiendo los haces para alcanzar el objetivo. Reflectores desvían el haz, bifurcadores lo dividen en dos y portales teletransportan el haz a la otra entrada. Pulsa comenzar para iniciar.',
      en: 'Solve the laser puzzle by directing beams to reach the target. Reflectors change the beam direction, bifurcators split the beam into two paths, and portals teleport the beam to the paired portal. Press start to begin.'
    },
    component: LaserProtoWrapper,
    est: 60
  },
  {
    id: 'gng',
    title: { es: 'Go / No-Go', en: 'Go / No-Go' },
    instructions: {
      es: 'Responde rápidamente a las señales Go y evita las señales No-Go. Pulsa comenzar para iniciar.',
      en: 'Respond quickly to Go signals and withhold response on No-Go signals. Press start to begin.'
    },
    component: GoNoGoProtoWrapper,
    est: 45
  },
  {
    id: 'nback',
    title: { es: 'N-Back', en: 'N-Back' },
    instructions: {
      es: 'Recuerda la posición o la letra N pasos atrás y responde cuando coincida. Usa las teclas M = Match y N = No-Match, o los botones en pantalla. Pulsa comenzar para iniciar.',
      en: 'Remember the position or letter N steps back and respond when it matches. Use the keys M = Match and N = No-Match, or the on-screen buttons. Press start to begin.'
    },
    component: NBackProtoWrapper,
    est: 60
  }
];

const TOTAL_TIME = 300; // 5 minutes target (sum of est ≈ 300s)

const DemoShell = () => {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [completed, setCompleted] = useState({});
  const [toast, setToast] = useState(null);
  // Demo-specific UI state
  const [showPermission, setShowPermission] = useState(true);
  const [showInstructions, setShowInstructions] = useState(true);
  const [activityStarted, setActivityStarted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const { setIsDemo, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();
  const navigate = useNavigate();

  const demoCopy = {
    es: {
      interactiveDemo: 'Demo interactiva',
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
      readyMessage: 'Actividad preparada. Lee las instrucciones y pulsa comenzar.',
      activityCompletedTemplate: 'Actividad {id} completada',
      activityCompletedShort: 'Actividad completada'
    },
    en: {
      interactiveDemo: 'Interactive demo',
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
      readyMessage: 'Activity ready. Read the instructions and press start.',
      activityCompletedTemplate: 'Activity {id} completed',
      activityCompletedShort: 'Activity completed'
    }
  };

  const startedAtRef = useRef(Date.now());
  const finishedRef = useRef(false);
  const completedRef = useRef(completed);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      // finished by time
      handleDemoComplete(completedRef.current);
      navigate('/report');
    }
  }, [timeLeft]);

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
    } catch (e) {
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
        } catch (e) {
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

  const handleDemoComplete = (completedObj) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const completedIds = Object.keys(completedObj || {});
    const timeUsedSec = Math.round((Date.now() - startedAtRef.current) / 1000);
    try {
      stopTracking('demo', 0, null, { completedIds, timeUsedSec });
      recordTrialEvent({ event: 'demo_complete', payload: { completedIds, timeUsedSec, completedCount: completedIds.length } });
    } catch (e) {
      // swallow telemetry errors
    }
  };

  const onComplete = (id) => {
    try {
      recordTrialEvent && recordTrialEvent({ event: 'demo_activity_complete', payload: { id, step } });
    } catch (e) {
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
        handleDemoComplete(next);
        navigate('/report');
      } else {
        setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1));
      }
      return next;
    });
  };

  const skipActivity = () => {
    setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1));
  };

  const prevActivity = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const restart = () => {
    setStep(0);
    setTimeLeft(TOTAL_TIME);
    setCompleted({});
  };

  const ActivityComponent = ACTIVITIES[step].component;

  if (showReport) {
    return <PostDemoScreen completedIds={Object.keys(completed)} />;
  }

  const requestPermissions = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
      } catch (e) {
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
      <header className="demo-header">
        <h2>{demoCopy[language]?.interactiveDemo || demoCopy.es.interactiveDemo} • {ACTIVITIES.length} {demoCopy[language]?.activitiesLabel || demoCopy.es.activitiesLabel}</h2>
        <div className="demo-meta">
          <div className="demo-timer">{demoCopy[language]?.timeRemaining || demoCopy.es.timeRemaining} {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
          <div className="demo-progress">{demoCopy[language]?.activityLabel || demoCopy.es.activityLabel} {step + 1} / {ACTIVITIES.length}</div>
        </div>
      </header>

      <main className="demo-main">
        <section className="demo-activity">
          {toast && <div className="demo-toast">{toast}</div>}
          <h3>{(ACTIVITIES[step].title && typeof ACTIVITIES[step].title === 'object') ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es) : ACTIVITIES[step].title}</h3>
          <div className="demo-activity-meta">{demoCopy[language]?.estLabel || demoCopy.es.estLabel} {Math.floor(ACTIVITIES[step].est / 60)}:{String(ACTIVITIES[step].est % 60).padStart(2, '0')}</div>

          <PermissionModal open={showPermission} onClose={() => setShowPermission(false)} onRequest={requestPermissions} />

          {showInstructions && (
            <div className="instructions-overlay">
              <div className="instructions-box">
                <h4>{demoCopy[language]?.instructionsTitle || demoCopy.es.instructionsTitle}</h4>
                <p>{(ACTIVITIES[step].instructions && ACTIVITIES[step].instructions[language]) || (ACTIVITIES[step].instructions && ACTIVITIES[step].instructions.es) || (ACTIVITIES[step].title && typeof ACTIVITIES[step].title === 'object' ? (ACTIVITIES[step].title[language] || ACTIVITIES[step].title.es) : ACTIVITIES[step].title)}</p>
                <div style={{ marginTop: 12 }}>
                  <button className="btn" onClick={() => { setShowInstructions(false); setActivityStarted(true); }}>{demoCopy[language]?.startButton || demoCopy.es.startButton}</button>
                </div>
              </div>
            </div>
          )}

          {activityStarted ? (
            <ActivityComponent onComplete={() => onComplete(ACTIVITIES[step].id)} est={ACTIVITIES[step].est} />
          ) : (
            <div style={{ padding: 28, textAlign: 'center', color: '#6b7280' }}>
              <p>{demoCopy[language]?.readyMessage || demoCopy.es.readyMessage}</p>
            </div>
          )}

          {/* Dev navigation buttons removed for demo deployment */}
        </section>
      </main>
    </div>
  );
};

export default DemoShell;
