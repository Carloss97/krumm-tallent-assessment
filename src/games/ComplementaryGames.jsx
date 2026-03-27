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

export const MetacognitiveCalibrationGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
  const config = { telemetryId: 'cmp_meta_8', nextPath: '/game/9' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);

  const questions = useMemo(() => [
    { text: isEn ? 'Indicator A rises 18% and B drops 5%. Prioritize A?' : 'El indicador A sube 18% y B cae 5%. ¿Priorizar A?', correct: true },
    { text: isEn ? 'Three incomplete reports arrived on time. High quality?' : 'Tres reportes incompletos llegaron en tiempo. ¿Calidad alta?', correct: false },
    { text: isEn ? 'Two signals confirm a hypothesis in different periods. Robust evidence?' : 'Dos señales confirman hipótesis en distintos periodos. ¿Evidencia robusta?', correct: true },
    { text: isEn ? 'One exception invalidates the whole historical rule. Always true?' : 'Una excepción invalida toda la regla histórica. ¿Siempre cierto?', correct: false },
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
          <h2>{isEn ? 'Complementary Game 1: Metacognitive Calibration' : 'Juego complementario 1: calibracion metacognitiva'}</h2>
          <p>{isEn ? 'Answer each statement and compare certainty with outcomes to measure calibration.' : 'Responde cada afirmacion y compara tu certeza con el resultado para medir calibracion.'}</p>
          <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <h3>{isEn ? 'Question' : 'Pregunta'} {idx + 1} / {questions.length}</h3>
        <p>{questions[idx].text}</p>
        <div style={rowStyle}>
          <button className="btn" onClick={() => onAnswer(true)}>{isEn ? 'Yes' : 'Si'}</button>
          <button className="btn" onClick={() => onAnswer(false)}>{isEn ? 'No' : 'No'}</button>
        </div>
      </div>
    </div>
  );
};

export const OperationalPrioritizationGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
  const config = { telemetryId: 'cmp_ops_9', nextPath: '/game/10' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [tasks, setTasks] = useState([]);

  const items = useMemo(() => [
    { expectedPriority: 'high', title: isEn ? 'Client escalation' : 'Escalamiento de cliente' },
    { expectedPriority: 'medium', title: isEn ? 'Weekly planning deck' : 'Deck semanal de planificacion' },
    { expectedPriority: 'low', title: isEn ? 'Internal style update' : 'Actualizacion interna de estilo' },
    { expectedPriority: 'high', title: isEn ? 'Production incident review' : 'Revision de incidente en produccion' },
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
        <h2>{isEn ? 'Complementary Game 2: Operational Prioritization' : 'Juego complementario 2: priorizacion operativa'}</h2>
        <p>{isEn ? 'Choose a priority for each operational case.' : 'Selecciona prioridad para cada caso operativo.'}</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>{isEn ? 'Task' : 'Tarea'} {idx + 1} / {items.length}</h3>
      <p>{items[idx].title}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => choose('high')}>{isEn ? 'High' : 'Alta'}</button>
        <button className="btn" onClick={() => choose('medium')}>{isEn ? 'Medium' : 'Media'}</button>
        <button className="btn" onClick={() => choose('low')}>{isEn ? 'Low' : 'Baja'}</button>
      </div>
    </div></div>
  );
};

export const LearningAgilityGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
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
        <h2>{isEn ? 'Complementary Game 3: Learning Agility' : 'Juego complementario 3: agilidad de aprendizaje'}</h2>
        <p>{isEn ? 'Adjust your response as rules change round by round.' : 'Ajusta tu respuesta conforme cambian las reglas de ronda en ronda.'}</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>{isEn ? 'Round' : 'Ronda'} {round} / 5</h3>
      <p>{isEn ? 'New rule:' : 'Nueva regla:'} {round % 2 === 0 ? (isEn ? 'Classify by trend' : 'Clasificar por tendencia') : (isEn ? 'Classify by impact' : 'Clasificar por impacto')}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" onClick={() => handleResult(true)}>{isEn ? 'Correct adaptation' : 'Adaptacion correcta'}</button>
        <button className="btn" onClick={() => handleResult(false)}>{isEn ? 'Miss adaptation' : 'Adaptacion incorrecta'}</button>
      </div>
    </div></div>
  );
};

export const SocialCoordinationGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
  const config = { telemetryId: 'cmp_social_11', nextPath: '/game/12' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);

  const scenarios = [
    isEn ? 'Team A blocked by missing requirement from Team B' : 'Equipo A bloqueado por requisito faltante de Equipo B',
    isEn ? 'Two stakeholders disagree on delivery order' : 'Dos stakeholders no coinciden en el orden de entrega',
    isEn ? 'Critical bug discovered near release' : 'Bug critico detectado cerca del release',
    isEn ? 'Support team overloaded with urgent tickets' : 'Equipo de soporte sobrecargado con tickets urgentes',
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
        <h2>{isEn ? 'Complementary Game 4: Social Coordination' : 'Juego complementario 4: coordinacion social'}</h2>
        <p>{isEn ? 'Choose actions to coordinate teams under operational conflict.' : 'Elige acciones para coordinar equipos bajo conflicto operativo.'}</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>{isEn ? 'Scenario' : 'Escenario'} {step + 1} / {scenarios.length}</h3>
      <p>{scenarios[step]}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => choose('align')}>{isEn ? 'Align stakeholders' : 'Alinear stakeholders'}</button>
        <button className="btn" onClick={() => choose('partial')}>{isEn ? 'Local optimization' : 'Optimizacion local'}</button>
        <button className="btn" onClick={() => choose('none')}>{isEn ? 'Defer decision' : 'Diferir decision'}</button>
      </div>
    </div></div>
  );
};

export const CognitiveResilienceGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
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
        <h2>{isEn ? 'Complementary Game 5: Cognitive Resilience' : 'Juego complementario 5: resiliencia cognitiva'}</h2>
        <p>{isEn ? 'Maintain consistent performance under interruptions and cognitive load.' : 'Mantener desempeno consistente frente a interrupciones y carga cognitiva.'}</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>{isEn ? 'Wave' : 'Ola'} {wave} / 5</h3>
      <p>{isEn ? 'Interruption intensity:' : 'Intensidad de interrupcion:'} {wave % 2 === 0 ? (isEn ? 'High' : 'Alta') : (isEn ? 'Moderate' : 'Moderada')}</p>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button className="btn" onClick={() => respond(true)}>{isEn ? 'Maintain performance' : 'Mantener desempeno'}</button>
        <button className="btn" onClick={() => respond(false)}>{isEn ? 'Performance drop' : 'Caida de desempeno'}</button>
      </div>
    </div></div>
  );
};

export const RiskUnderUncertaintyGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
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
        <h2>{isEn ? 'Complementary Game 6: Risk Under Uncertainty' : 'Juego complementario 6: riesgo bajo incertidumbre'}</h2>
        <p>{isEn ? 'Select risk strategies with partial information.' : 'Selecciona estrategias de riesgo con informacion parcial.'}</p>
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <h3>{isEn ? 'Decision turn' : 'Turno de decision'} {turn} / 4</h3>
      <p>{isEn ? 'Projected upside 18%, downside 9%, confidence interval widening.' : 'Upside proyectado 18%, downside 9%, intervalo de confianza ampliandose.'}</p>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
        <button className="btn" onClick={() => choose('balanced')}>{isEn ? 'Balanced hedge' : 'Cobertura balanceada'}</button>
        <button className="btn" onClick={() => choose('aggressive')}>{isEn ? 'Aggressive push' : 'Impulso agresivo'}</button>
        <button className="btn" onClick={() => choose('conservative')}>{isEn ? 'Conservative hold' : 'Sostener conservador'}</button>
      </div>
    </div></div>
  );
};
