import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
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
  { id: 'balloon', title: { es: 'Inflar el globo', en: 'Inflate the balloon' }, component: BalloonProtoWrapper, est: 60 },
  { id: 'grid', title: { es: 'Optimizar rejilla', en: 'Optimize grid' }, component: GridProtoWrapper, est: 75 },
  { id: 'laser', title: { es: 'Puzzle láser', en: 'Laser puzzle' }, component: LaserProtoWrapper, est: 60 },
  { id: 'gng', title: { es: 'Go / No-Go', en: 'Go / No-Go' }, component: GoNoGoProtoWrapper, est: 45 },
  { id: 'nback', title: { es: 'N-Back', en: 'N-Back' }, component: NBackProtoWrapper, est: 60 }
];

const TOTAL_TIME = 300; // 5 minutes target (sum of est ≈ 300s)

const DemoShell = () => {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [completed, setCompleted] = useState({});
  const [showPermission, setShowPermission] = useState(true);
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [showInstructions, setShowInstructions] = useState(true);
  const [activityStarted, setActivityStarted] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [toast, setToast] = useState(null);
  const { setIsDemo, startTracking, stopTracking, recordTrialEvent } = useTelemetry();
  const { language } = useLanguage();

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
    // show blurred report / contact screen
    setShowReport(true);
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
      // reset activity state so instructions show for next activity
      setActivityStarted(false);
      setShowInstructions(true);
      if (doneCount >= ACTIVITIES.length) {
        handleDemoComplete(next);
      } else {
        setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1));
      }
      return next;
    });
  };

  const skipActivity = () => {
    setActivityStarted(false);
    setShowInstructions(true);
    setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1));
  };

  const prevActivity = () => {
    setStep((s) => Math.max(0, s - 1));
  };

  const restart = () => {
    setStep(0);
    setTimeLeft(TOTAL_TIME);
    setCompleted({});
    setShowReport(false);
    setShowInstructions(true);
    setActivityStarted(false);
  };

  const ActivityComponent = ACTIVITIES[step].component;

  useEffect(() => {
    // when changing step, reset activity state so instructions show
    setActivityStarted(false);
    setShowInstructions(true);
  }, [step]);

  const requestPermissions = async () => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
        // immediately stop tracks — we only wanted the permission prompt
        if (s && s.getTracks) s.getTracks().forEach(t => t.stop());
        setPermissionStatus('granted');
      } catch (e) {
        setPermissionStatus('denied');
      }
    } else {
      setPermissionStatus('unsupported');
    }
    setShowPermission(false);
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
        <main className="demo-main">
          {showReport ? (
            <PostDemoScreen completedIds={Object.keys(completed)} />
          ) : (
            <section className="demo-activity">
              {toast && <div className="demo-toast">{toast}</div>}
              <h3>{ACTIVITIES[step].title}</h3>
              <div className="demo-activity-meta">Est. {Math.floor(ACTIVITIES[step].est / 60)}:{String(ACTIVITIES[step].est % 60).padStart(2, '0')}</div>

              {/* Permission modal shown at start */}
              <PermissionModal open={showPermission} onClose={() => setShowPermission(false)} onRequest={requestPermissions} />

              {/* Instructions overlay before starting each activity */}
              {showInstructions && (
                <div className="instructions-overlay">
                  <div className="instructions-box">
                    <h4>Instrucciones</h4>
                    <p>{ACTIVITIES[step].title} — sigue las instrucciones en pantalla. Cuando estés listo, pulsa comenzar.</p>
                    <div style={{ marginTop: 12 }}>
                      <button className="btn" onClick={() => { setShowInstructions(false); setActivityStarted(true); }}>Comenzar actividad</button>
                      <button className="btn btn-ghost" style={{ marginLeft: 8 }} onClick={() => { setShowInstructions(false); setActivityStarted(true); }}>Omitir instrucciones</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Activity is mounted only after starting */}
              {activityStarted ? (
                <ActivityComponent onComplete={() => onComplete(ACTIVITIES[step].id)} est={ACTIVITIES[step].est} />
              ) : (
                <div style={{ padding: 28, textAlign: 'center', color: '#6b7280' }}>
                  <p>Actividad preparada. Lee las instrucciones y pulsa comenzar.</p>
                  <div style={{ marginTop: 12 }}>
                    <button className="btn" onClick={() => { setShowInstructions(true); }}>Ver instrucciones</button>
                  </div>
                </div>
              )}

              <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button className="btn" onClick={prevActivity} disabled={step === 0}>Anterior</button>
                <button className="btn" onClick={skipActivity} disabled={step >= ACTIVITIES.length - 1}>Saltar</button>
                <button className="btn" onClick={() => { setActivityStarted(false); setShowInstructions(true); setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1)); }} disabled={step >= ACTIVITIES.length - 1}>Siguiente</button>
              </div>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <button className="btn" onClick={restart}>Reiniciar demo</button>
              </div>
            </section>
          )}
        </main>
  );
};

export default DemoShell;
