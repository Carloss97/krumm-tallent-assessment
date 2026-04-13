import React, { useState, useEffect } from 'react';
import BalloonGame from './demo/BalloonGame';
import CollectPeopleGame from './demo/CollectPeopleGame';
import LaserReflectGame from './demo/LaserReflectGame';
import './DemoShell.css';

const ACTIVITIES = [
  { id: 'balloon', title: 'Inflar el globo', component: BalloonGame, est: 60 },
  { id: 'collect', title: 'Recoger personas', component: CollectPeopleGame, est: 120 },
  { id: 'laser', title: 'Reflejar láser', component: LaserReflectGame, est: 90 }
];

const TOTAL_TIME = 300; // 5 minutes

const DemoShell = () => {
  const [step, setStep] = useState(0);
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [completed, setCompleted] = useState({});

  useEffect(() => {
    const t = setInterval(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (timeLeft === 0) {
      // finished by time
    }
  }, [timeLeft]);

  const onComplete = (id) => {
    setCompleted((c) => ({ ...c, [id]: true }));
    setStep((s) => Math.min(ACTIVITIES.length - 1, s + 1));
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
          <h3>{ACTIVITIES[step].title}</h3>
          <ActivityComponent onComplete={() => onComplete(ACTIVITIES[step].id)} timeLeft={timeLeft} />
        </section>

        <aside className="demo-sidebar">
          <h4>Progreso</h4>
          <ol>
            {ACTIVITIES.map((a, i) => (
              <li key={a.id} className={completed[a.id] ? 'done' : i === step ? 'active' : ''}>{a.title} {completed[a.id] ? '✓' : ''}</li>
            ))}
          </ol>
          <div className="demo-controls">
            <button className="btn" onClick={restart}>Reiniciar demo</button>
          </div>
        </aside>
      </main>
    </div>
  );
};

export default DemoShell;
