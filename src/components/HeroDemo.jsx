import React, { useEffect, useState, useRef } from 'react';
import { useTelemetry } from '../TelemetryContext';
import './HeroDemo.css';

const QuizActivity = ({ onComplete, language = 'es' }) => {
  const q = {
    es: {
      question: '¿Qué comportamiento muestra mayor foco?',
      options: ['Cambiar rápido entre tareas', 'Respuesta sostenida a objetivo', 'Clics aleatorios frecuentes'],
      correct: 1
    },
    en: {
      question: 'Which behavior indicates focus?',
      options: ['Quickly switching tasks', 'Sustained response to target', 'Frequent random clicks'],
      correct: 1
    }
  }[language || 'es'];

  const [selected, setSelected] = useState(null);
  return (
    <div className="hd-activity hd-quiz" aria-live="polite">
      <h3>{q.question}</h3>
      <div className="hd-options">
        {q.options.map((opt, i) => (
          <button key={i} className={`hd-option ${selected === i ? 'selected' : ''}`} onClick={() => setSelected(i)}>
            {opt}
          </button>
        ))}
      </div>
      <div className="hd-controls">
        <button className="hd-next" onClick={() => onComplete({ type: 'quiz', selected })} disabled={selected === null}>
          {language === 'en' ? 'Next' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

const PriorityActivity = ({ onComplete, language = 'es' }) => {
  const items = language === 'en'
    ? ['Deliver on time', 'Keep quality high', 'Support teammates']
    : ['Entregar a tiempo', 'Mantener alta calidad', 'Apoyar al equipo'];

  const [chosen, setChosen] = useState([]);
  const handlePick = (i) => {
    if (chosen.includes(i)) return;
    setChosen((c) => [...c, i]);
  };

  return (
    <div className="hd-activity hd-priority">
      <h3>{language === 'en' ? 'Choose priorities (1 = most important)' : 'Elige prioridades (1 = más importante)'} </h3>
      <div className="hd-priority-list">
        {items.map((it, i) => (
          <button key={i} className={`hd-priority-item ${chosen.includes(i) ? 'picked' : ''}`} onClick={() => handlePick(i)}>
            <span className="hd-pill">{chosen.indexOf(i) >= 0 ? chosen.indexOf(i) + 1 : '-'}</span>
            <span>{it}</span>
          </button>
        ))}
      </div>
      <div className="hd-controls">
        <button className="hd-next" onClick={() => onComplete({ type: 'priority', order: chosen })} disabled={chosen.length === 0}>
          {language === 'en' ? 'Next' : 'Siguiente'}
        </button>
      </div>
    </div>
  );
};

const ReactionActivity = ({ onComplete, language = 'es' }) => {
  const [status, setStatus] = useState('ready');
  const [msg, setMsg] = useState(language === 'en' ? 'Get ready...' : 'Prepárate...');
  const startRef = useRef(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    const delay = 800 + Math.random() * 1200;
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now();
      setStatus('go');
      setMsg(language === 'en' ? 'Click now!' : '¡Haz clic!');
    }, delay);

    return () => clearTimeout(timeoutRef.current);
  }, [language]);

  const handleClick = () => {
    if (status !== 'go') return;
    const rt = Date.now() - startRef.current;
    onComplete({ type: 'reaction', reactionTime: rt });
  };

  return (
    <div className="hd-activity hd-reaction" onClick={handleClick} role="button" tabIndex={0}>
      <h3>{language === 'en' ? 'Reaction test' : 'Prueba de reacción'}</h3>
      <div className={`hd-reaction-target ${status}`}>{msg}</div>
      <div className="hd-hint">{language === 'en' ? 'Click the target as soon as it changes.' : 'Haz clic en cuanto cambie.'}</div>
    </div>
  );
};

const HeroDemo = () => {
  const telemetry = useTelemetry();
  const language = telemetry?.participantProfile?.preferredLanguage || 'es';
  const [step, setStep] = useState(0);
  const total = 3;

  useEffect(() => {
    // start lightweight tracking for hero demo
    try {
      telemetry.startTracking && telemetry.startTracking('hero-demo');
      telemetry.recordTrialEvent && telemetry.recordTrialEvent({ event: 'demo_started', timestamp: Date.now() });
    } catch (e) {
      // swallow
    }

    return () => {
      try {
        telemetry.recordTrialEvent && telemetry.recordTrialEvent({ event: 'demo_unmounted', timestamp: Date.now() });
        telemetry.stopTracking && telemetry.stopTracking('hero-demo', 0, null, { completed: step >= total - 1 });
      } catch (e) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleComplete = (result) => {
    // record event
    telemetry.recordTrialEvent && telemetry.recordTrialEvent({ event: 'demo.activity_completed', detail: result, step });

    if (step < total - 1) setStep((s) => s + 1);
    else {
      telemetry.recordTrialEvent && telemetry.recordTrialEvent({ event: 'demo_completed', timestamp: Date.now() });
      telemetry.stopTracking && telemetry.stopTracking('hero-demo', 0, null, { completed: true });
    }
  };

  return (
    <div className="hero-demo" aria-label="Demo interactiva">
      <div className="hd-header">
        <strong>{language === 'en' ? 'Interactive demo' : 'Demostración interactiva'}</strong>
        <span className="hd-sub">{language === 'en' ? '3 actividades rápidas — ~2 minutos' : '3 actividades rápidas — ~2 minutos'}</span>
      </div>

      <div className="hd-body">
        {step === 0 && <QuizActivity onComplete={handleComplete} language={language} />}
        {step === 1 && <PriorityActivity onComplete={handleComplete} language={language} />}
        {step === 2 && <ReactionActivity onComplete={handleComplete} language={language} />}
      </div>

      <div className="hd-footer">
        <div className="hd-progress">{`${Math.min(step + 1, total)} / ${total}`}</div>
      </div>
    </div>
  );
};

export default HeroDemo;
