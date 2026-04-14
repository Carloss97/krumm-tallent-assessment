import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../TelemetryContext';
import BalloonGame from './demo/BalloonGame';
import CollectPeopleGame from './demo/CollectPeopleGame';
import LaserReflectGame from './demo/LaserReflectGame';
import DemoGoNoGo from './demo/DemoGoNoGo';
import DemoNBack from './demo/DemoNBack';
import './DemoShell.css';

const ACTIVITIES = [
  { id: 'balloon', title: 'Inflar el globo', component: BalloonGame, est: 45 },
  { id: 'collect', title: 'Recoger personas', component: CollectPeopleGame, est: 60 },
  { id: 'laser', title: 'Reflejar láser', component: LaserReflectGame, est: 60 },
  { id: 'gng', title: 'Go / No-Go', component: DemoGoNoGo, est: 60 },
  { id: 'nback', title: '1-Back (memoria)', component: DemoNBack, est: 60 }
];

const TOTAL_TIME = 300; // 5 minutes

const DemoShell = () => {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [completed, setCompleted] = useState({});
  const [toast, setToast] = useState(null);
  const { setIsDemo, startTracking, stopTracking, recordTrialEvent } = useTelemetry();

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
  };

  const onComplete = (id) => {
    try {
      recordTrialEvent && recordTrialEvent({ event: 'demo_activity_complete', payload: { id, step } });
    } catch (e) {
      // noop
    }

    setToast('Actividad completada');

    setCompleted((c) => {
      const next = { ...c, [id]: true };
      const doneCount = Object.keys(next).length;
      if (doneCount >= ACTIVITIES.length) {
        handleDemoComplete(next);
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

  return (
    <div className="demo-shell">
      <header className="demo-header">
        <h2>Demo interactiva • {ACTIVITIES.length} actividades</h2>
        <div className="demo-meta">
          <div className="demo-timer">Tiempo restante: {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, '0')}</div>
          <div className="demo-progress">Actividad {step + 1} / {ACTIVITIES.length}</div>
        </div>
      </header>

      <main className="demo-main">
        <section className="demo-activity">
          {toast && <div className="demo-toast">{toast}</div>}
          <h3>{ACTIVITIES[step].title}</h3>
          <div className="demo-activity-meta">Est. {Math.floor(ACTIVITIES[step].est / 60)}:{String(ACTIVITIES[step].est % 60).padStart(2, '0')}</div>
          <ActivityComponent onComplete={() => onComplete(ACTIVITIES[step].id)} timeLeft={timeLeft} />
        </section>

        <aside className="demo-sidebar">
          <h4>Progreso</h4>
          <ol>
            {ACTIVITIES.map((a, i) => (
              <li
                key={a.id}
                className={completed[a.id] ? 'done' : i === step ? 'active' : ''}
                onClick={() => setStep(i)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setStep(i); }}
              >
                {a.title} {completed[a.id] ? '✓' : ''}
              </li>
            ))}
          </ol>
          <div className="demo-controls">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={prevActivity} disabled={step === 0}>Anterior</button>
              <button className="btn" onClick={skipActivity} disabled={step >= ACTIVITIES.length - 1}>Saltar</button>
              <button className="btn" onClick={() => { setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1)); }} disabled={step >= ACTIVITIES.length - 1}>Siguiente</button>
            </div>
            <div style={{ marginTop: 10 }}>
              <button className="btn" onClick={restart}>Reiniciar demo</button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default DemoShell;
