import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';

const shellStyle = {
  width: '100%',
  minHeight: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
};

const cardStyle = {
  width: '100%',
  maxWidth: '920px',
  background: 'linear-gradient(155deg, rgba(255,255,255,0.92), rgba(236,246,255,0.96))',
  border: '1px solid rgba(148,163,184,0.32)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 16px 38px rgba(30,41,59,0.14)',
};

const rowStyle = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '10px',
  marginTop: '12px',
};

const missionBadgeStyle = {
  fontSize: '0.73rem',
  fontWeight: 700,
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
  color: '#1d4ed8',
  background: 'rgba(59,130,246,0.12)',
  border: '1px solid rgba(59,130,246,0.26)',
  borderRadius: '999px',
  display: 'inline-block',
  padding: '6px 10px',
  marginBottom: '12px',
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

function MissionHeader({ language, title, subtitle, progress, rewardLabel }) {
  const isEn = language === 'en';
  const pct = Math.max(0, Math.min(100, Math.round(progress)));
  return (
    <div style={{ marginBottom: '14px' }}>
      <span style={missionBadgeStyle}>{isEn ? 'Mission Layer' : 'Capa de mision'}</span>
      <h2 style={{ margin: '0 0 6px 0', color: '#0f172a' }}>{title}</h2>
      <p style={{ margin: '0 0 10px 0', color: '#334155' }}>{subtitle}</p>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px', height: '8px', borderRadius: '999px', background: 'rgba(59,130,246,0.16)' }}>
          <div style={{ width: `${pct}%`, height: '100%', borderRadius: '999px', background: 'linear-gradient(90deg, #38bdf8, #2563eb)' }} />
        </div>
        <strong style={{ color: '#1e3a8a', fontSize: '0.86rem' }}>{rewardLabel}</strong>
      </div>
    </div>
  );
}

export const MetacognitiveCalibrationGame = ({ language = 'es' }) => {
  const isEn = language === 'en';
  const config = { telemetryId: 'cmp_meta_8', nextPath: '/game/9' };
  const { start, finishGame } = useComplementaryFlow(config);
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState([]);

  const questions = useMemo(() => [
    { text: isEn ? 'Signal A rises 18% while B drops 5%, with stable quality. Prioritize A now?' : 'La senal A sube 18% y B cae 5%, con calidad estable. ¿Priorizar A ahora?', truth: 'yes' },
    { text: isEn ? 'A report arrives on time but incomplete. Is quality high?' : 'Un reporte llega a tiempo pero incompleto. ¿La calidad es alta?', truth: 'no' },
    { text: isEn ? 'Two independent sources confirm the same trend. Is this strong evidence?' : 'Dos fuentes independientes confirman la misma tendencia. ¿Es evidencia fuerte?', truth: 'yes' },
    { text: isEn ? 'One exception appears in data. Does it invalidate all previous history?' : 'Aparece una excepcion en los datos. ¿Invalida todo el historico previo?', truth: 'no' },
  ], [isEn]);

  const evaluate = (choice) => {
    const q = questions[idx];
    const confidence = 60 + ((idx % 4) * 10);
    const correct = choice === q.truth;
    const partial = choice === 'depends' && (q.truth === 'yes' || q.truth === 'no');

    const next = [...answers, { confidence, correct, partial }];
    setAnswers(next);

    if (idx === questions.length - 1) {
      const score = Math.round((next.reduce((s, i) => s + (i.correct ? 1 : i.partial ? 0.4 : 0), 0) / questions.length) * 100);
      const errors = questions.length - next.filter((a) => a.correct).length;
      finishGame(score, errors, { trials: questions.length, calibratedChoices: next.filter((a) => a.partial).length }, 'metacognitive', next);
      return;
    }

    setIdx((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}>
        <div style={cardStyle}>
          <MissionHeader
            language={language}
            title={isEn ? 'Complementary Game 1: Metacognitive Calibration' : 'Juego complementario 1: calibracion metacognitiva'}
            subtitle={isEn ? 'Align confidence, evidence quality, and response certainty.' : 'Alinea confianza, calidad de evidencia y certeza de respuesta.'}
            progress={0}
            rewardLabel={isEn ? 'Reward: Calibration Medal' : 'Recompensa: Medalla de calibracion'}
          />
          <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div style={shellStyle}>
      <div style={cardStyle}>
        <MissionHeader
          language={language}
          title={isEn ? `Question ${idx + 1}/${questions.length}` : `Pregunta ${idx + 1}/${questions.length}`}
          subtitle={questions[idx].text}
          progress={((idx + 1) / questions.length) * 100}
          rewardLabel={isEn ? `Streak ${answers.filter((a) => a.correct).length}` : `Racha ${answers.filter((a) => a.correct).length}`}
        />
        <div style={rowStyle}>
          <button className="btn" onClick={() => evaluate('yes')}>{isEn ? 'Yes' : 'Si'}</button>
          <button className="btn" onClick={() => evaluate('depends')}>{isEn ? 'Depends' : 'Depende'}</button>
          <button className="btn" onClick={() => evaluate('no')}>{isEn ? 'No' : 'No'}</button>
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
    { expectedPriority: 'critical', title: isEn ? 'Client escalation with legal risk' : 'Escalamiento de cliente con riesgo legal' },
    { expectedPriority: 'high', title: isEn ? 'Weekly planning brief with executive review' : 'Informe semanal con revision ejecutiva' },
    { expectedPriority: 'low', title: isEn ? 'Internal style consistency update' : 'Actualizacion interna de estilo' },
    { expectedPriority: 'critical', title: isEn ? 'Production incident impacting revenue' : 'Incidente de produccion con impacto en ingresos' },
  ], [isEn]);

  const choose = (assignedPriority) => {
    const base = 4200 + (idx * 520);
    const deadline = idx % 2 === 0 ? 5600 : 7600;
    const next = [
      ...tasks,
      {
        expectedPriority: items[idx].expectedPriority,
        assignedPriority,
        completedWithinMs: base,
        deadlineMs: deadline,
      },
    ];
    setTasks(next);

    if (idx === items.length - 1) {
      const weighted = next.reduce((acc, item) => {
        if (item.expectedPriority === item.assignedPriority) return acc + 1;
        if ((item.expectedPriority === 'critical' && item.assignedPriority === 'high') || (item.expectedPriority === 'high' && item.assignedPriority === 'critical')) return acc + 0.6;
        return acc;
      }, 0);
      const score = Math.round((weighted / next.length) * 100);
      const errors = next.length - next.filter((t) => t.expectedPriority === t.assignedPriority).length;
      finishGame(score, errors, { tasks: next.length, weightedScore: score }, 'prioritization', next);
      return;
    }

    setIdx((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <MissionHeader
          language={language}
          title={isEn ? 'Complementary Game 2: Operational Prioritization' : 'Juego complementario 2: priorizacion operativa'}
          subtitle={isEn ? 'Prioritize tasks balancing urgency, blockers, and business impact.' : 'Prioriza tareas equilibrando urgencia, bloqueos e impacto de negocio.'}
          progress={0}
          rewardLabel={isEn ? 'Reward: Ops Commander' : 'Recompensa: Comandante ops'}
        />
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <MissionHeader
        language={language}
        title={isEn ? `Task ${idx + 1}/${items.length}` : `Tarea ${idx + 1}/${items.length}`}
        subtitle={items[idx].title}
        progress={((idx + 1) / items.length) * 100}
        rewardLabel={isEn ? `Perfect picks ${tasks.filter((t) => t.expectedPriority === t.assignedPriority).length}` : `Aciertos ${tasks.filter((t) => t.expectedPriority === t.assignedPriority).length}`}
      />
      <div style={rowStyle}>
        <button className="btn" onClick={() => choose('critical')}>{isEn ? 'Critical' : 'Critica'}</button>
        <button className="btn" onClick={() => choose('high')}>{isEn ? 'High' : 'Alta'}</button>
        <button className="btn" onClick={() => choose('medium')}>{isEn ? 'Medium' : 'Media'}</button>
        <button className="btn" onClick={() => choose('low')}>{isEn ? 'Low' : 'Baja'}</button>
        <button className="btn" onClick={() => choose('defer')}>{isEn ? 'Defer' : 'Posponer'}</button>
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

  const handleResult = (quality) => {
    const accuracyMap = {
      excellent: 88 + round,
      good: 72 + round,
      weak: 50 + round,
      wrong: 38 + round,
    };
    const entry = {
      accuracy: accuracyMap[quality],
      adaptationMs: 2600 - round * 190,
      quality,
    };
    const next = [...records, entry];
    setRecords(next);

    if (round >= 5) {
      const avgAcc = next.reduce((s, r) => s + r.accuracy, 0) / next.length;
      const score = Math.round(avgAcc);
      const errors = next.filter((r) => r.accuracy < 60).length;
      finishGame(score, errors, { rounds: next.length, highAdaptationRounds: next.filter((r) => r.quality === 'excellent').length }, 'learningAgility', next);
      return;
    }

    setRound((prev) => prev + 1);
  };

  if (!started) {
    return (
      <div style={shellStyle}><div style={cardStyle}>
        <MissionHeader
          language={language}
          title={isEn ? 'Complementary Game 3: Learning Agility' : 'Juego complementario 3: agilidad de aprendizaje'}
          subtitle={isEn ? 'Adapt rapidly as governing rules mutate each round.' : 'Adaptate rapido cuando las reglas cambian en cada ronda.'}
          progress={0}
          rewardLabel={isEn ? 'Reward: Agility Chain' : 'Recompensa: Cadena de agilidad'}
        />
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <MissionHeader
        language={language}
        title={isEn ? `Round ${round}/5` : `Ronda ${round}/5`}
        subtitle={round % 2 === 0 ? (isEn ? 'Rule focus: causal trend' : 'Foco de regla: tendencia causal') : (isEn ? 'Rule focus: business outcome' : 'Foco de regla: impacto de negocio')}
        progress={(round / 5) * 100}
        rewardLabel={isEn ? `Combo ${records.filter((r) => r.quality === 'excellent').length}` : `Combo ${records.filter((r) => r.quality === 'excellent').length}`}
      />
      <div style={rowStyle}>
        <button className="btn" onClick={() => handleResult('excellent')}>{isEn ? 'Correct adaptation' : 'Adaptacion correcta'}</button>
        <button className="btn" onClick={() => handleResult('good')}>{isEn ? 'Partial adaptation' : 'Adaptacion parcial'}</button>
        <button className="btn" onClick={() => handleResult('weak')}>{isEn ? 'Slow adaptation' : 'Adaptacion lenta'}</button>
        <button className="btn" onClick={() => handleResult('wrong')}>{isEn ? 'Rule conflict' : 'Conflicto de regla'}</button>
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
    isEn ? 'Team A is blocked by missing requirement from Team B.' : 'Equipo A bloqueado por requisito faltante de Equipo B.',
    isEn ? 'Two teams disagree on delivery order.' : 'Dos equipos no coinciden en el orden de entrega.',
    isEn ? 'A critical bug appears before release while support queue rises.' : 'Aparece un error critico antes de la entrega mientras sube la cola de soporte.',
    isEn ? 'Support team overloaded with urgent tickets and unclear responsibilities.' : 'Soporte sobrecargado con tickets urgentes y responsabilidades difusas.',
  ];

  const choose = (quality) => {
    const gainMap = { align: 25, mediate: 18, partial: 10, defer: 4, fracture: 0 };
    const nextScore = score + (gainMap[quality] || 0);
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
        <MissionHeader
          language={language}
          title={isEn ? 'Complementary Game 4: Social Coordination' : 'Juego complementario 4: coordinacion social'}
          subtitle={isEn ? 'Resolve multi-team friction with actionable alignment moves.' : 'Resuelve friccion multi-equipo con acciones concretas de alineacion.'}
          progress={0}
          rewardLabel={isEn ? 'Reward: Coordination Crest' : 'Recompensa: Escudo de coordinacion'}
        />
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <MissionHeader
        language={language}
        title={isEn ? `Scenario ${step + 1}/${scenarios.length}` : `Escenario ${step + 1}/${scenarios.length}`}
        subtitle={scenarios[step]}
        progress={((step + 1) / scenarios.length) * 100}
        rewardLabel={isEn ? `Alignment points ${score}` : `Puntos de alineacion ${score}`}
      />
      <div style={rowStyle}>
        <button className="btn" onClick={() => choose('align')}>{isEn ? 'Align teams' : 'Alinear equipos'}</button>
        <button className="btn" onClick={() => choose('mediate')}>{isEn ? 'Mediate commitments' : 'Mediar compromisos'}</button>
        <button className="btn" onClick={() => choose('partial')}>{isEn ? 'Local optimization' : 'Optimizacion local'}</button>
        <button className="btn" onClick={() => choose('defer')}>{isEn ? 'Defer decision' : 'Diferir decision'}</button>
        <button className="btn" onClick={() => choose('fracture')}>{isEn ? 'Escalate conflict' : 'Escalar conflicto'}</button>
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

  const respond = (quality) => {
    const gainMap = { stable: 20, recover: 15, partial: 9, drop: 4 };
    const nextScore = score + (gainMap[quality] || 0);
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
        <MissionHeader
          language={language}
          title={isEn ? 'Complementary Game 5: Cognitive Resilience' : 'Juego complementario 5: resiliencia cognitiva'}
          subtitle={isEn ? 'Maintain decision quality through interruptions and workload spikes.' : 'Mantener calidad de decisiones ante interrupciones y picos de carga.'}
          progress={0}
          rewardLabel={isEn ? 'Reward: Resilience Core' : 'Recompensa: Nucleo de resiliencia'}
        />
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <MissionHeader
        language={language}
        title={isEn ? `Wave ${wave}/5` : `Ola ${wave}/5`}
        subtitle={wave % 2 === 0 ? (isEn ? 'Interruption profile: high + frequent' : 'Perfil de interrupcion: alta + frecuente') : (isEn ? 'Interruption profile: moderate + irregular' : 'Perfil de interrupcion: moderada + irregular')}
        progress={(wave / 5) * 100}
        rewardLabel={isEn ? `Recovery points ${score}` : `Puntos de recuperacion ${score}`}
      />
      <div style={rowStyle}>
        <button className="btn" onClick={() => respond('stable')}>{isEn ? 'Maintain performance' : 'Mantener desempeno'}</button>
        <button className="btn" onClick={() => respond('recover')}>{isEn ? 'Recover quickly' : 'Recuperar rapido'}</button>
        <button className="btn" onClick={() => respond('partial')}>{isEn ? 'Partial drop' : 'Caida parcial'}</button>
        <button className="btn" onClick={() => respond('drop')}>{isEn ? 'Performance drop' : 'Caida de desempeno'}</button>
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
    const gainMap = { balanced: 22, adaptive: 19, aggressive: 14, conservative: 11, avoidant: 4 };
    const nextScore = score + (gainMap[profile] || 0);
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
        <MissionHeader
          language={language}
          title={isEn ? 'Complementary Game 6: Risk Under Uncertainty' : 'Juego complementario 6: riesgo bajo incertidumbre'}
          subtitle={isEn ? 'Interpret uncertainty and choose a risk strategy with clear trade-offs.' : 'Interpreta la incertidumbre y elige una estrategia de riesgo con compensaciones claras.'}
          progress={0}
          rewardLabel={isEn ? 'Reward: Risk Navigator' : 'Recompensa: Navegante de riesgo'}
        />
        <button className="btn" onClick={() => { start(); setStarted(true); }}>{isEn ? 'Start' : 'Comenzar'}</button>
      </div></div>
    );
  }

  return (
    <div style={shellStyle}><div style={cardStyle}>
      <MissionHeader
        language={language}
        title={isEn ? `Decision turn ${turn}/4` : `Turno de decision ${turn}/4`}
        subtitle={isEn ? 'Projected upside 18%, downside 9%, and confidence band is widening.' : 'Upside proyectado 18%, downside 9%, y la banda de confianza se amplia.'}
        progress={(turn / 4) * 100}
        rewardLabel={isEn ? `Risk points ${score}` : `Puntos de riesgo ${score}`}
      />
      <div style={rowStyle}>
        <button className="btn" onClick={() => choose('balanced')}>{isEn ? 'Balanced hedge' : 'Cobertura balanceada'}</button>
        <button className="btn" onClick={() => choose('adaptive')}>{isEn ? 'Adaptive split' : 'Ajuste adaptativo'}</button>
        <button className="btn" onClick={() => choose('aggressive')}>{isEn ? 'Aggressive push' : 'Impulso agresivo'}</button>
        <button className="btn" onClick={() => choose('conservative')}>{isEn ? 'Conservative hold' : 'Mantener postura conservadora'}</button>
        <button className="btn" onClick={() => choose('avoidant')}>{isEn ? 'Avoid committing' : 'Evitar decision'}</button>
      </div>
    </div></div>
  );
};

