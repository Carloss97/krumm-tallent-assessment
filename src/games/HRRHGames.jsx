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
    });
    onEndGame(score, errors, { correctGo, correctStop });
  }, [score, errors, correctGo, correctStop, stopTracking, onEndGame, MAX_TRIALS]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const nextTrial = useCallback(() => {
    if (trial >= MAX_TRIALS) {
      endGame();
      return;
    }
    setTrial((prev) => prev + 1);
    setIsStopTrial(Math.random() < STOP_PROBABILITY);
  }, [trial, MAX_TRIALS, endGame]);

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setTrial(1);
    setScore(0);
    setCorrectGo(0);
    setCorrectStop(0);
    setErrors(0);
    setIsStopTrial(Math.random() < STOP_PROBABILITY);
    setGameState('running');
    startTracking('sst_game_2');
  }, [startTracking]);

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
          <h2>Stop-Signal Task</h2>
          <p>{isEn ? 'Press quickly when you see ' : 'Presiona rapido cuando veas '}<strong>{isEn ? 'GREEN' : 'VERDE'}</strong></p>
          <p>{isEn ? 'Do NOT press when you see ' : 'NO presiones cuando veas '}<strong>{isEn ? 'RED' : 'ROJO'}</strong></p>
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
          {isStopTrial && <button onClick={handleStopClick} className="btn btn-stop">{isEn ? 'Inhibit' : 'Inhibir'}</button>}
          <button onClick={handleMiss} className="btn btn-error">{isEn ? 'Missed' : 'Falle'}</button>
        </div>
        <p className="score">Score: {score} | {isEn ? 'Correct' : 'Correctos'}: {correctGo + correctStop}</p>
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
      color: pickRandom(['RED', 'BLUE']),
      shape: pickRandom(['CIRCLE', 'SQUARE']),
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
          <p>{isEn ? 'Alternate between classifying by ' : 'Alterna entre clasificar por '}<strong>{isEn ? 'COLOR' : 'COLOR'}</strong>{isEn ? ' and ' : ' y '}<strong>{isEn ? 'SHAPE' : 'FORMA'}</strong></p>
          <p>{isEn ? 'Rule alternates every trial' : 'La regla alterna en cada trial'}</p>
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
        </div>
        <div className="buttons-group">
          {currentRule === 'COLOR' ? (
            <>
              <button onClick={() => handleSelection('RED')} className="btn btn-option">{isEn ? 'RED' : 'ROJO'}</button>
              <button onClick={() => handleSelection('BLUE')} className="btn btn-option">{isEn ? 'BLUE' : 'AZUL'}</button>
            </>
          ) : (
            <>
              <button onClick={() => handleSelection('CIRCLE')} className="btn btn-option">{isEn ? 'CIRCLE' : 'CIRCULO'}</button>
              <button onClick={() => handleSelection('SQUARE')} className="btn btn-option">{isEn ? 'SQUARE' : 'CUADRADO'}</button>
            </>
          )}
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
  const hasEndedRef = useRef(false);

  const MAX_BLOCKS = isDemo ? 3 : 5;
  const LETTERS = ['A', 'B', 'X', 'C', 'D', 'X', 'E'];

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('cpt_game_4', score, errors, {
      blocksCompleted: block,
    });
    onEndGame(score, errors, {});
  }, [score, errors, block, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const nextBlock = useCallback(() => {
    if (block >= MAX_BLOCKS) {
      endGame();
      return;
    }
    setBlock((prev) => prev + 1);
    setCurrentLetter(pickRandom(LETTERS));
  }, [block, MAX_BLOCKS, endGame]);

  const beginGame = useCallback(() => {
    hasEndedRef.current = false;
    setBlock(1);
    setScore(0);
    setErrors(0);
    setCurrentLetter(pickRandom(LETTERS));
    setGameState('running');
    startTracking('cpt_game_4');
  }, [startTracking]);

  const handleSeeX = useCallback(() => {
    if (currentLetter === 'X') {
      setScore((prev) => prev + 10);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }
    nextBlock();
  }, [currentLetter, recordError, nextBlock]);

  const handleNotX = useCallback(() => {
    if (currentLetter !== 'X') {
      setScore((prev) => prev + 10);
    } else {
      setErrors((prev) => prev + 1);
      recordError();
    }
    nextBlock();
  }, [currentLetter, recordError, nextBlock]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Continuous Performance Test</h2>
          <p>{isEn ? 'Press when you see the letter X' : 'Presiona cuando veas la letra X'}</p>
          <p>{isEn ? 'Maintain attention throughout the task' : 'Manten la atencion durante toda la prueba'}</p>
          <button onClick={beginGame} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>{isEn ? 'Block' : 'Bloque'} {block} {isEn ? 'of' : 'de'} {MAX_BLOCKS}</h3>
        <div className="letter-stimulus">{currentLetter}</div>
        <div className="buttons-group">
          <button onClick={handleSeeX} className="btn btn-correct">{isEn ? 'I see X' : 'Veo X'}</button>
          <button onClick={handleNotX} className="btn btn-error">{isEn ? 'Not X' : 'No es X'}</button>
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
      textEn: 'A team member is not sharing key information before a deadline.',
      textEs: 'Un miembro del equipo no comparte informacion clave antes de una entrega.',
      optionsEn: ['Escalate immediately', 'Clarify blockers first', 'Ignore and continue'],
      optionsEs: ['Escalar de inmediato', 'Aclarar bloqueos primero', 'Ignorar y continuar'],
      best: 1,
    },
    {
      textEn: 'Two urgent requests arrive simultaneously.',
      textEs: 'Llegan dos solicitudes urgentes al mismo tiempo.',
      optionsEn: ['Do both superficially', 'Prioritize by impact and deadline', 'Wait for more data'],
      optionsEs: ['Hacer ambas superficialmente', 'Priorizar por impacto y fecha', 'Esperar mas datos'],
      best: 1,
    },
    {
      textEn: 'A client asks for a risky shortcut.',
      textEs: 'Un cliente pide un atajo riesgoso.',
      optionsEn: ['Accept without checks', 'Propose safe alternative with trade-off', 'Reject without explanation'],
      optionsEs: ['Aceptar sin revisar', 'Proponer alternativa segura con trade-off', 'Rechazar sin explicar'],
      best: 1,
    },
    {
      textEn: 'Critical bug appears minutes before release.',
      textEs: 'Aparece un bug critico minutos antes del release.',
      optionsEn: ['Ship anyway', 'Contain scope and communicate plan', 'Delay indefinitely'],
      optionsEs: ['Lanzar igual', 'Acotar alcance y comunicar plan', 'Retrasar indefinidamente'],
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
          <p>{isEn ? 'Make fast decisions in work scenarios' : 'Toma decisiones rapidas sobre escenarios laborales'}</p>
          <p>{isEn ? 'Choose the best trade-off under uncertainty' : 'Elige el mejor trade-off bajo incertidumbre'}</p>
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
        <div className="scenario-box">
          <p>{isEn ? currentScenario.textEn : currentScenario.textEs}</p>
        </div>
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
          <p>{isEn ? 'Block 1: classify by COLOR' : 'Bloque 1: clasifica por COLOR'}</p>
          <p>{isEn ? 'Block 2: classify by SHAPE' : 'Bloque 2: clasifica por FORMA'}</p>
          <p>{isEn ? 'Block 3: exception, RED always maps to RED' : 'Bloque 3: excepcion, ROJO siempre va a ROJO'}</p>
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
          {block === 3 && <p>{isEn ? 'Rule: RED exception' : 'Regla: excepcion ROJO'}</p>}
        </div>
        <div className="stimulus">{stimulus.shape} - {stimulus.color}</div>
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
      promptEn: 'Your lead assigns a task with an unrealistic deadline.',
      promptEs: 'Tu lider asigna una tarea con un plazo poco realista.',
      optionsEn: ['Accept blindly', 'Discuss constraints and propose plan', 'Decline without context', 'Escalate emotionally'],
      optionsEs: ['Aceptar sin analizar', 'Discutir restricciones y proponer plan', 'Rechazar sin contexto', 'Escalar con reaccion emocional'],
      best: 1,
    },
    {
      promptEn: 'A peer repeatedly misses handoffs impacting your work.',
      promptEs: 'Un colega incumple handoffs y afecta tu trabajo.',
      optionsEn: ['Publicly blame', 'Set alignment meeting and clarify ownership', 'Ignore issue', 'Bypass peer without notice'],
      optionsEs: ['Culpar publicamente', 'Alinear en reunion y clarificar ownership', 'Ignorar el problema', 'Evitar al colega sin avisar'],
      best: 1,
    },
    {
      promptEn: 'You detect a quality risk near launch date.',
      promptEs: 'Detectas un riesgo de calidad cerca del lanzamiento.',
      optionsEn: ['Hide it to ship on time', 'Communicate risk and mitigation options', 'Stop all work immediately', 'Wait silently'],
      optionsEs: ['Ocultarlo para lanzar', 'Comunicar riesgo y opciones de mitigacion', 'Detener todo de inmediato', 'Esperar en silencio'],
      best: 1,
    },
    {
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
          <p>{isEn ? 'Assess your judgment in workplace scenarios' : 'Evalua tu juicio ante situaciones laborales'}</p>
          <p>{isEn ? 'Choose the most appropriate response' : 'Elige la respuesta mas apropiada'}</p>
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
        <div className="sjt-scenario">
          <p><strong>{isEn ? 'Situation:' : 'Situacion:'}</strong> {isEn ? currentScenario.promptEn : currentScenario.promptEs}</p>
        </div>
        <div className="buttons-group">
          {options.map((label, idx) => (
            <button key={label} onClick={() => handleResponse(idx)} className="btn btn-option">{label}</button>
          ))}
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};
