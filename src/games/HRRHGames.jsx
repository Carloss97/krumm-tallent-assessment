import React, { useState, useRef, useCallback } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import './HRRHGames.css';

const pickRandom = (items) => items[Math.floor(Math.random() * items.length)];

/**
 * Stop-Signal Task (SST) - Inhibicion
 */
export const StopSignalGame = ({ isActive, onEndGame, isDemo, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctGo, setCorrectGo] = useState(0);
  const [correctStop, setCorrectStop] = useState(0);
  const [errors, setErrors] = useState(0);
  const [isStopTrial, setIsStopTrial] = useState(false);
  const [tempoTag, setTempoTag] = useState('balanced');
  const hasEndedRef = useRef(false);

  const MAX_TRIALS = isDemo ? 30 : 80;
  const STOP_PROBABILITY = 0.4;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('sst_game_2', score, errors, {
      correctGo,
      correctStop,
      accuracy: Math.round(((correctGo + correctStop) / MAX_TRIALS) * 100),
      tempoTag,
    });
    onEndGame(score, errors, { correctGo, correctStop });
  }, [score, errors, correctGo, correctStop, stopTracking, onEndGame, MAX_TRIALS, tempoTag]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const rollTrial = useCallback((trialIndex) => {
    const stopSignal = Math.random() < STOP_PROBABILITY;
    setIsStopTrial(stopSignal);
    setTempoTag(trialIndex % 5 === 0 ? 'burst' : stopSignal ? 'inhibit' : 'go-flow');
  }, []);

  const nextTrial = useCallback(() => {
    if (trial >= MAX_TRIALS) {
      endGame();
      return;
    }
    const next = trial + 1;
    setTrial(next);
    rollTrial(next);
  }, [trial, MAX_TRIALS, endGame, rollTrial]);

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setTrial(1);
    setScore(0);
    setCorrectGo(0);
    setCorrectStop(0);
    setErrors(0);
    rollTrial(1);
    setGameState('running');
    startTracking('sst_game_2');
  }, [startTracking, rollTrial]);

  const handleGoClick = useCallback(() => {
    if (isStopTrial) {
      setErrors((prev) => prev + 1);
      recordError();
    } else {
      setCorrectGo((prev) => prev + 1);
      setScore((prev) => prev + 10);
    }
    nextTrial();
  }, [isStopTrial, nextTrial, recordError]);

  const handleStopClick = useCallback(() => {
    if (isStopTrial) {
      setCorrectStop((prev) => prev + 1);
      setScore((prev) => prev + 10);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }
    nextTrial();
  }, [isStopTrial, nextTrial, recordError]);

  const handleMiss = useCallback(() => {
    setErrors((prev) => prev + 1);
    recordError();
    nextTrial();
  }, [recordError, nextTrial]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>{isEn ? 'Impulse Control (SST)' : 'Control de Impulso (SST)'}</h2>
          <p>
            {isEn ? 'When you see ' : 'Cuando veas '}<strong>GO</strong>{isEn ? ', press quickly.' : ', presiona rapido.'}
          </p>
          <p>
            {isEn ? 'When you see ' : 'Cuando veas '}<strong>STOP</strong>{isEn ? ', do not press and continue to next trial.' : ', no presiones y continua al siguiente trial.'}
          </p>
          <p style={{ fontSize: '0.9rem', color: '#64748b' }}>
            {isEn ? 'Tip: focus on accuracy first, then speed.' : 'Tip: prioriza precision primero y luego velocidad.'}
          </p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Trial' : 'Trial'} {trial} {isEn ? 'of' : 'de'} {MAX_TRIALS}</h3>
        <div className={`signal ${isStopTrial ? 'stop' : 'go'}`}>
          {isStopTrial ? 'STOP' : 'GO'}
        </div>
            <div className="buttons-group">
              {!isStopTrial && <button onClick={handleGoClick} className="btn btn-go">{isEn ? 'Press' : 'Presionar'}</button>}
              {isStopTrial && <button onClick={handleStopClick} className="btn btn-stop">{isEn ? 'Continue (no press)' : 'Continuar (sin presionar)'}</button>}
              <button onClick={handleMiss} className="btn btn-error">{isEn ? 'I missed it' : 'No alcance'}</button>
            </div>
            <p className="score">Score: {score} | {isEn ? 'Correct' : 'Correctos'}: {correctGo + correctStop} | {isEn ? 'Tempo' : 'Ritmo'}: {tempoTag}</p>
      </div>
    </div>
  );
};

/**
 * Task Switching - Flexibilidad Cognitiva
 */
export const TaskSwitchingGame = ({ isActive, onEndGame, isDemo, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [trial, setTrial] = useState(1);
  const [errors, setErrors] = useState(0);
  const [stimulus, setStimulus] = useState({ color: 'RED', shape: 'CIRCLE' });
  const hasEndedRef = useRef(false);

  const MAX_TRIALS = isDemo ? 40 : 100;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('tsw_game_3', score, errors, {
      accuracy: Math.round(((MAX_TRIALS - errors) / MAX_TRIALS) * 100),
    });
    onEndGame(score, errors, {});
  }, [score, errors, stopTracking, onEndGame, MAX_TRIALS]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const generateStimulus = useCallback(() => {
    setStimulus({
      color: pickRandom(['RED', 'BLUE', 'GREEN']),
      shape: pickRandom(['CIRCLE', 'SQUARE', 'TRIANGLE']),
    });
  }, []);

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setTrial(1);
    setScore(0);
    setErrors(0);
    generateStimulus();
    setGameState('running');
    startTracking('tsw_game_3');
  }, [generateStimulus, startTracking]);

  const nextTrial = useCallback(() => {
    if (trial >= MAX_TRIALS) {
      endGame();
      return;
    }
    setTrial((prev) => prev + 1);
    generateStimulus();
  }, [trial, MAX_TRIALS, endGame, generateStimulus]);

  const currentRule = trial % 2 === 0 ? 'COLOR' : 'SHAPE';

  const handleSelection = useCallback((answer) => {
    const expected = currentRule === 'COLOR' ? stimulus.color : stimulus.shape;
    if (answer === expected) {
      setScore((prev) => prev + 10);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }
    nextTrial();
  }, [currentRule, stimulus, recordError, nextTrial]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Task Switching</h2>
          <p>{isEn ? 'Each trial tells you the active rule. Follow ONLY that rule.' : 'Cada trial te indica la regla activa. Sigue SOLO esa regla.'}</p>
          <p><strong>{isEn ? 'COLOR' : 'COLOR'}:</strong> {isEn ? 'choose RED/BLUE/GREEN.' : 'elige ROJO/AZUL/VERDE.'} <strong>{isEn ? 'SHAPE' : 'FORMA'}:</strong> {isEn ? 'choose CIRCLE/SQUARE/TRIANGLE.' : 'elige CIRCULO/CUADRADO/TRIANGULO.'}</p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Trial' : 'Trial'} {trial} {isEn ? 'of' : 'de'} {MAX_TRIALS}</h3>
        <div className="task-display">
          <p className="rule">{currentRule === 'COLOR' ? (isEn ? 'RULE: COLOR' : 'REGLA: COLOR') : (isEn ? 'RULE: SHAPE' : 'REGLA: FORMA')}</p>
          <div className="stimulus">{stimulus.shape} - {stimulus.color}</div>
          <p className="rule" style={{ marginTop: '8px', opacity: 0.9 }}>
            {isEn ? 'Answer only by the current rule shown above.' : 'Responde solo segun la regla actual mostrada arriba.'}
          </p>
        </div>
        <div className="buttons-group">
          <button onClick={() => handleSelection('RED')} className="btn btn-option">{isEn ? 'RED' : 'ROJO'}</button>
          <button onClick={() => handleSelection('BLUE')} className="btn btn-option">{isEn ? 'BLUE' : 'AZUL'}</button>
          <button onClick={() => handleSelection('GREEN')} className="btn btn-option">{isEn ? 'GREEN' : 'VERDE'}</button>
          <button onClick={() => handleSelection('CIRCLE')} className="btn btn-option">{isEn ? 'CIRCLE' : 'CIRCULO'}</button>
          <button onClick={() => handleSelection('SQUARE')} className="btn btn-option">{isEn ? 'SQUARE' : 'CUADRADO'}</button>
          <button onClick={() => handleSelection('TRIANGLE')} className="btn btn-option">{isEn ? 'TRIANGLE' : 'TRIANGULO'}</button>
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};

/**
 * CPT Corto - Atencion sostenida
 */
export const CPTGame = ({ isActive, onEndGame, isDemo, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [block, setBlock] = useState(1);
  const [errors, setErrors] = useState(0);
  const [currentLetter, setCurrentLetter] = useState('A');
  const [targetLetter, setTargetLetter] = useState('X');
  const hasEndedRef = useRef(false);

  const MAX_BLOCKS = isDemo ? 3 : 5;
  const LETTERS = ['A', 'B', 'X', 'C', 'D', 'X', 'E', 'K', 'M'];
  const TARGETS = ['X', 'K'];

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('cpt_game_4', score, errors, {
      blocksCompleted: block,
      activeTarget: targetLetter,
    });
    onEndGame(score, errors, {});
  }, [score, errors, block, stopTracking, onEndGame, targetLetter]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const nextBlock = useCallback(() => {
    if (block >= MAX_BLOCKS) {
      endGame();
      return;
    }
    setBlock((prev) => prev + 1);
    setCurrentLetter(pickRandom(LETTERS));
    setTargetLetter(pickRandom(TARGETS));
  }, [block, MAX_BLOCKS, endGame]);

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setBlock(1);
    setScore(0);
    setErrors(0);
    setCurrentLetter(pickRandom(LETTERS));
    setTargetLetter(pickRandom(TARGETS));
    setGameState('running');
    startTracking('cpt_game_4');
  }, [startTracking]);

  const handleSeeX = useCallback(() => {
    if (currentLetter === targetLetter) {
      setScore((prev) => prev + 10);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }
    nextBlock();
  }, [currentLetter, targetLetter, recordError, nextBlock]);

  const handleNotX = useCallback(() => {
    if (currentLetter !== targetLetter) {
      setScore((prev) => prev + 10);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }
    nextBlock();
  }, [currentLetter, targetLetter, recordError, nextBlock]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Continuous Performance Test</h2>
          <p>{isEn ? 'Watch the current target letter and decide fast.' : 'Observa la letra objetivo actual y decide rapido.'}</p>
          <p>{isEn ? 'If the displayed letter matches target, tap "I see". If not, tap "Not".' : 'Si la letra mostrada coincide con el objetivo, toca "Veo". Si no coincide, toca "No es".'}</p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Block' : 'Bloque'} {block} {isEn ? 'of' : 'de'} {MAX_BLOCKS}</h3>
        <p className="rule">{isEn ? 'Target letter' : 'Letra objetivo'}: <strong>{targetLetter}</strong></p>
        <div className="letter-stimulus">{currentLetter}</div>
        <div className="buttons-group">
          <button onClick={handleSeeX} className="btn btn-correct">{isEn ? `I see ${targetLetter}` : `Veo ${targetLetter}`}</button>
          <button onClick={handleNotX} className="btn btn-error">{isEn ? `Not ${targetLetter}` : `No es ${targetLetter}`}</button>
        </div>
        <p className="score">Score: {score} | {isEn ? 'Errors' : 'Errores'}: {errors}</p>
      </div>
    </div>
  );
};

/**
 * Decision Under Time Pressure
 */
export const DecisionGameHTMX = ({ isActive, onEndGame, isDemo, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [scenario, setScenario] = useState(0);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const scenarios = [
    {
      domain: isEn ? 'Coordination' : 'Coordinacion',
      textEn: 'A team member is not sharing key information before a deadline.',
      textEs: 'Un miembro del equipo no comparte informacion clave antes de una entrega.',
      optionsEn: ['Escalate immediately', 'Clarify blockers first', 'Ignore and continue', 'Map impact and sequence owners'],
      optionsEs: ['Escalar de inmediato', 'Aclarar bloqueos primero', 'Ignorar y continuar', 'Mapear impacto y secuencia de owners'],
      best: 1,
    },
    {
      domain: isEn ? 'Prioritization' : 'Priorizacion',
      textEn: 'Two urgent requests arrive simultaneously.',
      textEs: 'Llegan dos solicitudes urgentes al mismo tiempo.',
      optionsEn: ['Do both superficially', 'Prioritize by impact and deadline', 'Wait for more data', 'Split ownership by critical path'],
      optionsEs: ['Hacer ambas superficialmente', 'Priorizar por impacto y fecha', 'Esperar mas datos', 'Dividir ownership por ruta critica'],
      best: 1,
    },
    {
      domain: isEn ? 'Risk' : 'Riesgo',
      textEn: 'A client asks for a risky shortcut.',
      textEs: 'Un cliente pide un atajo riesgoso.',
      optionsEn: ['Accept without checks', 'Propose safe alternative with trade-off', 'Reject without explanation', 'Pilot in controlled scope first'],
      optionsEs: ['Aceptar sin revisar', 'Proponer alternativa segura con trade-off', 'Rechazar sin explicar', 'Pilotear en alcance controlado primero'],
      best: 1,
    },
    {
      domain: isEn ? 'Incident' : 'Incidente',
      textEn: 'Critical bug appears minutes before release.',
      textEs: 'Aparece un bug critico minutos antes del release.',
      optionsEn: ['Ship anyway', 'Contain scope and communicate plan', 'Delay indefinitely', 'Roll back and shadow-test fix'],
      optionsEs: ['Lanzar igual', 'Acotar alcance y comunicar plan', 'Retrasar indefinidamente', 'Rollback y prueba sombra del fix'],
      best: 1,
    },
  ];

  const MAX_SCENARIOS = isDemo ? 4 : 8;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('dec_game_5', score, errors, {
      scenariosCompleted: scenario + 1,
      accuracy: Math.round(((MAX_SCENARIOS - errors) / MAX_SCENARIOS) * 100),
    });
    onEndGame(score, errors, {});
  }, [score, errors, scenario, stopTracking, onEndGame, MAX_SCENARIOS]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setScore(0);
    setErrors(0);
    setScenario(0);
    setGameState('running');
    startTracking('dec_game_5');
  }, [startTracking]);

  const handleDecision = useCallback((selectedIndex) => {
    const current = scenarios[scenario % scenarios.length];
    if (selectedIndex === current.best) {
      setScore((prev) => prev + 20);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }

    if (scenario + 1 >= MAX_SCENARIOS) {
      endGame();
      return;
    }
    setScenario((prev) => prev + 1);
  }, [scenario, scenarios, MAX_SCENARIOS, endGame, recordError]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Decision Making Under Pressure</h2>
          <p>{isEn ? 'Read the situation and choose the BEST action.' : 'Lee la situacion y elige la MEJOR accion.'}</p>
          <p>{isEn ? 'Prioritize impact, feasibility and communication quality.' : 'Prioriza impacto, factibilidad y calidad de comunicacion.'}</p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  const currentScenario = scenarios[scenario % scenarios.length];
  const options = isEn ? currentScenario.optionsEn : currentScenario.optionsEs;

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Scenario' : 'Escenario'} {scenario + 1} {isEn ? 'of' : 'de'} {MAX_SCENARIOS}</h3>
        <p className="rule">{isEn ? 'Domain' : 'Dominio'}: {currentScenario.domain}</p>
        <div className="scenario-box">
          <p>{isEn ? currentScenario.textEn : currentScenario.textEs}</p>
        </div>
        <p className="rule" style={{ marginTop: '10px' }}>
          {isEn ? 'Question: What should you do first?' : 'Pregunta: ?Que deberias hacer primero?'}
        </p>
        <div className="buttons-group">
          {options.map((label, idx) => (
            <button key={label} onClick={() => handleDecision(idx)} className="btn btn-option">{label}</button>
          ))}
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};

/**
 * Rule Shift + Exceptions
 */
export const RuleShiftGame = ({ isActive, onEndGame, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [block, setBlock] = useState(1);
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const [stimulus, setStimulus] = useState({ color: 'RED', shape: 'CIRCLE' });
  const hasEndedRef = useRef(false);

  const generateStimulus = useCallback(() => {
    setStimulus({ color: pickRandom(['RED', 'BLUE']), shape: pickRandom(['CIRCLE', 'SQUARE']) });
  }, []);

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('rsh_game_6', score, errors, {
      blocksCompleted: block,
      accuracy: Math.round(((3 - errors) / 3) * 100),
    });
    onEndGame(score, errors, {});
  }, [score, errors, block, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setBlock(1);
    setScore(0);
    setErrors(0);
    generateStimulus();
    setGameState('running');
    startTracking('rsh_game_6');
  }, [generateStimulus, startTracking]);

  const expectedAnswer = useCallback(() => {
    if (block === 1) return stimulus.color;
    if (block === 2) return stimulus.shape;
    return stimulus.color === 'RED' ? 'RED' : stimulus.shape;
  }, [block, stimulus]);

  const handleSelection = useCallback((answer) => {
    if (answer === expectedAnswer()) {
      setScore((prev) => prev + 15);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }

    if (block >= 3) {
      endGame();
      return;
    }

    setBlock((prev) => prev + 1);
    generateStimulus();
  }, [expectedAnswer, recordError, block, endGame, generateStimulus]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Rule Shift + Exceptions</h2>
          <p>{isEn ? 'Rules change by block. Read the active rule before answering.' : 'Las reglas cambian por bloque. Lee la regla activa antes de responder.'}</p>
          <p><strong>{isEn ? 'Block 1:' : 'Bloque 1:'}</strong> {isEn ? 'classify by COLOR.' : 'clasifica por COLOR.'}</p>
          <p><strong>{isEn ? 'Block 2:' : 'Bloque 2:'}</strong> {isEn ? 'classify by SHAPE.' : 'clasifica por FORMA.'}</p>
          <p><strong>{isEn ? 'Block 3:' : 'Bloque 3:'}</strong> {isEn ? 'if RED, choose RED; otherwise choose SHAPE.' : 'si es ROJO, elige ROJO; si no, elige FORMA.'}</p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Block' : 'Bloque'} {block} {isEn ? 'of' : 'de'} 3</h3>
        <div className="rule-display">
          {block === 1 && <p>{isEn ? 'Rule: COLOR' : 'Regla: COLOR'}</p>}
          {block === 2 && <p>{isEn ? 'Rule: SHAPE' : 'Regla: FORMA'}</p>}
          {block === 3 && <p>{isEn ? 'Rule: if RED -> RED, else SHAPE' : 'Regla: si ROJO -> ROJO, si no -> FORMA'}</p>}
        </div>
        <div className="stimulus">{stimulus.shape} - {stimulus.color}</div>
          <p className="rule" style={{ marginTop: '8px', opacity: 0.9 }}>
            {isEn ? 'Answer only by the current rule shown above.' : 'Responde solo segun la regla actual mostrada arriba.'}
          </p>
        <div className="buttons-group">
          <button onClick={() => handleSelection('RED')} className="btn btn-option">{isEn ? 'RED' : 'ROJO'}</button>
          <button onClick={() => handleSelection('BLUE')} className="btn btn-option">{isEn ? 'BLUE' : 'AZUL'}</button>
          <button onClick={() => handleSelection('CIRCLE')} className="btn btn-option">{isEn ? 'CIRCLE' : 'CIRCULO'}</button>
          <button onClick={() => handleSelection('SQUARE')} className="btn btn-option">{isEn ? 'SQUARE' : 'CUADRADO'}</button>
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};

/**
 * SJT - Situational Judgment Test
 */
export const SJTGame = ({ isActive, onEndGame, isDemo, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [scenario, setScenario] = useState(0);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const scenarioBank = [
    {
      domain: isEn ? 'Leadership' : 'Liderazgo',
      promptEn: 'Your lead assigns a task with an unrealistic deadline.',
      promptEs: 'Tu lider asigna una tarea con un plazo poco realista.',
      optionsEn: ['Accept blindly', 'Discuss constraints and propose plan', 'Decline without context', 'Escalate emotionally'],
      optionsEs: ['Aceptar sin analizar', 'Discutir restricciones y proponer plan', 'Rechazar sin contexto', 'Escalar con reaccion emocional'],
      best: 1,
    },
    {
      domain: isEn ? 'Collaboration' : 'Colaboracion',
      promptEn: 'A peer repeatedly misses handoffs impacting your work.',
      promptEs: 'Un colega incumple handoffs y afecta tu trabajo.',
      optionsEn: ['Publicly blame', 'Set alignment meeting and clarify ownership', 'Ignore issue', 'Bypass peer without notice'],
      optionsEs: ['Culpar publicamente', 'Alinear en reunion y clarificar ownership', 'Ignorar el problema', 'Evitar al colega sin avisar'],
      best: 1,
    },
    {
      domain: isEn ? 'Quality' : 'Calidad',
      promptEn: 'You detect a quality risk near launch date.',
      promptEs: 'Detectas un riesgo de calidad cerca del lanzamiento.',
      optionsEn: ['Hide it to ship on time', 'Communicate risk and mitigation options', 'Stop all work immediately', 'Wait silently'],
      optionsEs: ['Ocultarlo para lanzar', 'Comunicar riesgo y opciones de mitigacion', 'Detener todo de inmediato', 'Esperar en silencio'],
      best: 1,
    },
    {
      domain: isEn ? 'Prioritization' : 'Priorizacion',
      promptEn: 'Two stakeholders request conflicting priorities.',
      promptEs: 'Dos stakeholders piden prioridades conflictivas.',
      optionsEn: ['Choose randomly', 'Align criteria and agree sequence', 'Say yes to both without plan', 'Escalate without data'],
      optionsEs: ['Elegir al azar', 'Alinear criterios y acordar secuencia', 'Decir que si a ambos sin plan', 'Escalar sin datos'],
      best: 1,
    },
  ];

  const MAX_SCENARIOS = isDemo ? 4 : 10;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('sjt_game_7', score, errors, {
      scenariosCompleted: scenario + 1,
      accuracy: Math.round(((MAX_SCENARIOS - errors) / MAX_SCENARIOS) * 100),
    });
    onEndGame(score, errors, {});
  }, [score, errors, scenario, stopTracking, onEndGame, MAX_SCENARIOS]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setScore(0);
    setErrors(0);
    setScenario(0);
    setGameState('running');
    startTracking('sjt_game_7');
  }, [startTracking]);

  const handleResponse = useCallback((selectedIndex) => {
    const current = scenarioBank[scenario % scenarioBank.length];
    if (selectedIndex === current.best) {
      setScore((prev) => prev + 20);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }

    if (scenario + 1 >= MAX_SCENARIOS) {
      endGame();
      return;
    }
    setScenario((prev) => prev + 1);
  }, [scenario, scenarioBank, MAX_SCENARIOS, endGame, recordError]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Situational Judgment Test</h2>
          <p>{isEn ? 'Read each workplace scenario and choose the BEST first response.' : 'Lee cada escenario laboral y elige la MEJOR primera respuesta.'}</p>
          <p>{isEn ? 'Prioritize collaboration, clarity and responsible execution.' : 'Prioriza colaboracion, claridad y ejecucion responsable.'}</p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  const currentScenario = scenarioBank[scenario % scenarioBank.length];
  const options = isEn ? currentScenario.optionsEn : currentScenario.optionsEs;

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Scenario' : 'Escenario'} {scenario + 1} {isEn ? 'of' : 'de'} {MAX_SCENARIOS}</h3>
        <p className="rule">{isEn ? 'Domain' : 'Dominio'}: {currentScenario.domain}</p>
        <div className="sjt-scenario">
          <p><strong>{isEn ? 'Situation:' : 'Situacion:'}</strong> {isEn ? currentScenario.promptEn : currentScenario.promptEs}</p>
        </div>
        <p className="rule" style={{ marginTop: '10px' }}>
          {isEn ? 'Question: What should you do first?' : 'Pregunta: ?Que deberias hacer primero?'}
        </p>
        <div className="buttons-group">
          {options.map((label, idx) => (
            <button key={label} onClick={() => handleResponse(idx)} className="btn btn-option">{`${idx + 1}. ${label}`}</button>
          ))}
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};







