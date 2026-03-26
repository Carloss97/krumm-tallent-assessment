import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';

const shellStyle = {
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px'
};

const cardStyle = {
  width: '100%',
  maxWidth: '860px',
  background: 'rgba(255,255,255,0.76)',
  border: '1px solid rgba(148,163,184,0.35)',
  borderRadius: '14px',
  padding: '24px'
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '10px',
  marginTop: '10px'
};

function useComplementaryFlow(config) {
  const navigate = useNavigate();
  const { startTracking, stopTracking, recordFutureModuleData } = useTelemetry();

  const finishGame = (score, errors, details, moduleName, moduleData) => {
    stopTracking(config.telemetryId, score, errors, details);
    if (moduleName && Array.isArray(moduleData)) {
      recordFutureModuleData(moduleName, moduleData);
    }
    navigate(config.nextPath);
  };

  return {
    start: () => startTracking(config.telemetryId),
    finishGame,
  };
}

export const MetacognitiveCalibrationGame = () => {
  const config = { telemetryId: 'cmp_meta_8', nextPath: '/game/9' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);

  const questions = useMemo(() => [
    { text: 'El indicador A sube 18% y B cae 5%. ¿Priorizar A?', correct: true },
    { text: 'Tres reportes incompletos llegaron en tiempo. ¿Calidad alta?', correct: false },
    { text: 'Dos señales confirman hipótesis en distintos periodos. ¿Evidencia robusta?', correct: true },
    { text: 'Una excepción invalida toda la regla histórica. ¿Siempre cierto?', correct: false },
  ], []);

  const onAnswer = (choice) => {
    const q = questions[idx];
    const confidence = 70 + ((idx % 3) * 10);
    const item = { confidence, correct: choice === q.correct };
    const next = [...answers, item];
    setAnswers(next);
    if (idx === questions.length - 1) {
      const score = next.filter((a) => a.correct).length * 25;
      const errors = questions.length - (score / 25);
      finishGame(score, errors, { trials: questions.length }, 'metacognitive', next);
      return;
    }
    setIdx(idx + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <h2>Complementary Game 1: Metacognitive Calibration</h2>
          <p>Responde cada afirmacion y compara tu certeza con el resultado para medir calibracion.</p>
          <button className="btn" onClick={() => { start(); setStarted(true); }}>Start</button>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <h3>Question {idx + 1} / {questions.length}</h3>
        <p>{questions[idx].text}</p>
        <div style={rowStyle}>
          <button className="btn" onClick={() => onAnswer(true)}>Yes</button>
          <button className="btn" onClick={() => onAnswer(false)}>No</button>
        </div>
      </div>
    </div>
  );
};

export const OperationalPrioritizationGame = () => {
  const config = { telemetryId: 'cmp_ops_9', nextPath: '/game/10' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [tasks, setTasks] = useState([]);

  const items = useMemo(() => [
    { expectedPriority: 'high', title: 'Client escalation' },
    { expectedPriority: 'medium', title: 'Weekly planning deck' },
    { expectedPriority: 'low', title: 'Internal style update' },
    { expectedPriority: 'high', title: 'Production incident review' },
  ], []);

  const choose = (assignedPriority) => {
    const base = 4500 + (idx * 600);
    const deadline = idx % 2 === 0 ? 6000 : 8000;
    const next = [
      ...tasks,
      {
        expectedPriority: items[idx].expectedPriority,
        assignedPriority,
        completedWithinMs: base,
        deadlineMs: deadline,
      }
    ];
    setTasks(next);

    if (idx === items.length - 1) {
      const correct = next.filter((t) => t.expectedPriority === t.assignedPriority).length;
      const score = Math.round((correct / next.length) * 100);
      finishGame(score, next.length - correct, { tasks: next.length }, 'prioritization', next);
      return;
    }

    setIdx(idx + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <h2>Complementary Game 2: Operational Prioritization</h2>
        <p>Selecciona prioridad para cada caso operativo.</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>Start</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>Task {idx + 1} / {items.length}</h3>
      <p>{items[idx].title}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => choose('high')}>High</button>
        <button className="btn" onClick={() => choose('medium')}>Medium</button>
        <button className="btn" onClick={() => choose('low')}>Low</button>
      </div>
    </div></div>
  );
};

export const LearningAgilityGame = () => {
  const config = { telemetryId: 'cmp_agility_10', nextPath: '/game/11' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [round, setRound] = useState(1);
  const [records, setRecords] = useState([]);

  const handleResult = (success) => {
    const entry = {
      accuracy: success ? 70 + round * 5 : 45 + round * 3,
      adaptationMs: 2400 - round * 220,
    };
    const next = [...records, entry];
    setRecords(next);

    if (round >= 5) {
      const avgAcc = next.reduce((s, r) => s + r.accuracy, 0) / next.length;
      const score = Math.round(avgAcc);
      const errors = next.filter((r) => r.accuracy < 60).length;
      finishGame(score, errors, { rounds: next.length }, 'learningAgility', next);
      return;
    }

    setRound((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <h2>Complementary Game 3: Learning Agility</h2>
        <p>Ajusta tu respuesta conforme cambian las reglas de ronda en ronda.</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>Start</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>Round {round} / 5</h3>
      <p>New rule: {round % 2 === 0 ? 'Classify by trend' : 'Classify by impact'}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" onClick={() => handleResult(true)}>Correct adaptation</button>
        <button className="btn" onClick={() => handleResult(false)}>Miss adaptation</button>
      </div>
    </div></div>
  );
};

export const SocialCoordinationGame = () => {
  const config = { telemetryId: 'cmp_social_11', nextPath: '/game/12' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const scenarios = [
    'Team A blocked by missing requirement from Team B',
    'Two stakeholders disagree on delivery order',
    'Critical bug discovered near release',
    'Support team overloaded with urgent tickets',
  ];

  const choose = (quality) => {
    const gain = quality === 'align' ? 25 : quality === 'partial' ? 12 : 0;
    const nextScore = score + gain;
    setScore(nextScore);
    if (step === scenarios.length - 1) {
      finishGame(nextScore, Math.floor((100 - nextScore) / 20), { scenarios: scenarios.length }, null, null);
      return;
    }
    setStep((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <h2>Complementary Game 4: Social Coordination</h2>
        <p>Elige acciones para coordinar equipos bajo conflicto operativo.</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>Start</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>Scenario {step + 1} / {scenarios.length}</h3>
      <p>{scenarios[step]}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => choose('align')}>Align stakeholders</button>
        <button className="btn" onClick={() => choose('partial')}>Local optimization</button>
        <button className="btn" onClick={() => choose('none')}>Defer decision</button>
      </div>
    </div></div>
  );
};

export const CognitiveResilienceGame = () => {
  const config = { telemetryId: 'cmp_resilience_12', nextPath: '/game/13' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [wave, setWave] = useState(1);
  const [score, setScore] = useState(0);

  const respond = (stable) => {
    const delta = stable ? 20 : 6;
    const nextScore = score + delta;
    setScore(nextScore);

    if (wave >= 5) {
      finishGame(nextScore, Math.floor((100 - nextScore) / 15), { waves: 5 }, null, null);
      return;
    }

    setWave((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <h2>Complementary Game 5: Cognitive Resilience</h2>
        <p>Mantener desempeno consistente frente a interrupciones y carga cognitiva.</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>Start</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>Wave {wave} / 5</h3>
      <p>Interruption intensity: {wave % 2 === 0 ? 'High' : 'Moderate'}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" onClick={() => respond(true)}>Maintain performance</button>
        <button className="btn" onClick={() => respond(false)}>Performance drop</button>
      </div>
    </div></div>
  );
};

export const RiskUnderUncertaintyGame = () => {
  const config = { telemetryId: 'cmp_risk_13', nextPath: '/report' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [turn, setTurn] = useState(1);
  const [score, setScore] = useState(0);

  const choose = (profile) => {
    const gain = profile === 'balanced' ? 22 : profile === 'aggressive' ? 14 : 10;
    const nextScore = score + gain;
    setScore(nextScore);
    if (turn >= 4) {
      finishGame(nextScore, Math.floor((100 - nextScore) / 18), { turns: 4 }, null, null);
      return;
    }
    setTurn((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <h2>Complementary Game 6: Risk Under Uncertainty</h2>
        <p>Selecciona estrategias de riesgo con informacion parcial.</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>Start</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>Decision Turn {turn} / 4</h3>
      <p>Projected upside 18%, downside 9%, confidence interval widening.</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => choose('balanced')}>Balanced hedge</button>
        <button className="btn" onClick={() => choose('aggressive')}>Aggressive push</button>
        <button className="btn" onClick={() => choose('conservative')}>Conservative hold</button>
      </div>
    </div></div>
  );
};
