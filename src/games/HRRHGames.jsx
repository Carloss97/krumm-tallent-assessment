import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import './HRRHGames.css';

/**
 * Stop-Signal Task (SST) - Inhibición
 * Mide capacidad de inhibir respuesta motora
 */
export const StopSignalGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking, recordError, recordTrialEvent } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [trial, setTrial] = useState(1);
  const [score, setScore] = useState(0);
  const [correctGo, setCorrectGo] = useState(0);
  const [correctStop, setCorrectStop] = useState(0);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const MAX_TRIALS = isDemo ? 30 : 80;
  const STOP_PROBABILITY = 0.4;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('sst_game_2', score, errors, {
      correctGo,
      correctStop,
      accuracy: Math.round(((correctGo + correctStop) / MAX_TRIALS) * 100)
    });
    onEndGame(score, errors, { correctGo, correctStop });
  }, [score, errors, correctGo, correctStop, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive && gameState === 'instruction') {
      startTracking('sst_game_2');
      setGameState('running');
    }
  }, [isActive, gameState, startTracking]);

  const handleGoClick = useCallback(() => {
    setCorrectGo(prev => prev + 1);
    setScore(prev => prev + 10);
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(trial + 1);
    }
  }, [trial, MAX_TRIALS, endGame]);

  const handleStopClick = useCallback(() => {
    setCorrectStop(prev => prev + 1);
    setScore(prev => prev + 10);
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(trial + 1);
    }
  }, [trial, MAX_TRIALS, endGame]);

  const handleError = useCallback(() => {
    setErrors(prev => prev + 1);
    recordError();
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(trial + 1);
    }
  }, [trial, MAX_TRIALS, endGame, recordError]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Stop-Signal Task</h2>
          <p>Presiona rápido cuando veas <strong>VERDE</strong></p>
          <p>NO presiones cuando veas <strong>ROJO</strong></p>
          <button onClick={() => setGameState('running')} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  const isStopTrial = Math.random() < STOP_PROBABILITY;

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>Trial {trial} de {MAX_TRIALS}</h3>
        <div className={`signal ${isStopTrial ? 'stop' : 'go'}`}>
          {isStopTrial ? 'STOP' : 'GO'}
        </div>
        <div className="buttons-group">
          {!isStopTrial && <button onClick={handleGoClick} className="btn btn-go">Presionar</button>}
          {isStopTrial && <button onClick={handleStopClick} className="btn btn-stop">Inhibir</button>}
          <button onClick={handleError} className="btn btn-error">Error</button>
        </div>
        <p className="score">Score: {score} | Correctos: {correctGo + correctStop}</p>
      </div>
    </div>
  );
};

/**
 * Task Switching - Flexibilidad Cognitiva
 */
export const TaskSwitchingGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [trial, setTrial] = useState(1);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const MAX_TRIALS = isDemo ? 40 : 100;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('tsw_game_3', score, errors, {
      accuracy: Math.round(((MAX_TRIALS - errors) / MAX_TRIALS) * 100)
    });
    onEndGame(score, errors, {});
  }, [score, errors, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive && gameState === 'instruction') {
      startTracking('tsw_game_3');
      setGameState('running');
    }
  }, [isActive, gameState, startTracking]);

  const handleResponse = useCallback(() => {
    setScore(prev => prev + 10);
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(trial + 1);
    }
  }, [trial, MAX_TRIALS, endGame]);

  const handleError = useCallback(() => {
    setErrors(prev => prev + 1);
    recordError();
    if (trial >= MAX_TRIALS) {
      endGame();
    } else {
      setTrial(trial + 1);
    }
  }, [trial, MAX_TRIALS, endGame, recordError]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Task Switching</h2>
          <p>Alterna entre clasificar por <strong>COLOR</strong> o <strong>FORMA</strong></p>
          <p>La regla cambiará periodicamente sin aviso</p>
          <button onClick={() => setGameState('running')} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>Trial {trial} de {MAX_TRIALS}</h3>
        <div className="task-display">
          <p className="rule">{trial % 2 === 0 ? 'COLOR:' : 'FORMA:'}</p>
          <div className="stimulus">◆ ROJO</div>
        </div>
        <div className="buttons-group">
          <button onClick={handleResponse} className="btn btn-correct">Respuesta</button>
          <button onClick={handleError} className="btn btn-error">Error</button>
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};

/**
 * CPT Corto - Atención Sostenida
 */
export const CPTGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [block, setBlock] = useState(1);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const MAX_BLOCKS = isDemo ? 3 : 5;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('cpt_game_4', score, errors, {
      blocksCompleted: block
    });
    onEndGame(score, errors, {});
  }, [score, errors, block, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive && gameState === 'instruction') {
      startTracking('cpt_game_4');
      setGameState('running');
    }
  }, [isActive, gameState, startTracking]);

  const handleResponse = useCallback(() => {
    setScore(prev => prev + 10);
    if (block >= MAX_BLOCKS) {
      endGame();
    } else {
      setBlock(block + 1);
    }
  }, [block, MAX_BLOCKS, endGame]);

  const handleError = useCallback(() => {
    setErrors(prev => prev + 1);
    recordError();
    if (block >= MAX_BLOCKS) {
      endGame();
    } else {
      setBlock(block + 1);
    }
  }, [block, MAX_BLOCKS, endGame, recordError]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Continuous Performance Test</h2>
          <p>Presiona cuando vea la letra X</p>
          <p>Mantén la atención durante toda la prueba</p>
          <button onClick={() => setGameState('running')} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  const letters = ['A', 'B', 'X', 'C', 'D', 'X', 'E'];

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>Bloque {block} de {MAX_BLOCKS}</h3>
        <div className="letter-stimulus">
          {letters[Math.floor(Math.random() * letters.length)]}
        </div>
        <div className="buttons-group">
          <button onClick={handleResponse} className="btn btn-correct">Veo X</button>
          <button onClick={handleError} className="btn btn-error">No es X</button>
        </div>
        <p className="score">Score: {score} | Errores: {errors}</p>
      </div>
    </div>
  );
};

/**
 * Decision Under Time Pressure
 */
export const DecisionGameHTMX = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [scenario, setScenario] = useState(1);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const MAX_SCENARIOS = isDemo ? 4 : 8;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('dec_game_5', score, errors, {
      scenariosCompleted: scenario
    });
    onEndGame(score, errors, {});
  }, [score, errors, scenario, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive && gameState === 'instruction') {
      startTracking('dec_game_5');
      setGameState('running');
    }
  }, [isActive, gameState, startTracking]);

  const handleDecision = useCallback(() => {
    setScore(prev => prev + 20);
    if (scenario >= MAX_SCENARIOS) {
      endGame();
    } else {
      setScenario(scenario + 1);
    }
  }, [scenario, MAX_SCENARIOS, endGame]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Decision Making Under Pressure</h2>
          <p>Toma decisiones rápidas sobre escenarios laborales</p>
          <p>El tiempo se reduce en cada ronda</p>
          <button onClick={() => setGameState('running')} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>Escenario {scenario} de {MAX_SCENARIOS}</h3>
        <div className="scenario-box">
          <p>Un miembro del equipo no comparte información importante...</p>
        </div>
        <div className="buttons-group">
          <button onClick={handleDecision} className="btn btn-option">Opción A</button>
          <button onClick={handleDecision} className="btn btn-option">Opción B</button>
          <button onClick={handleDecision} className="btn btn-option">Opción C</button>
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};

/**
 * Rule Shift + Exceptions
 */
export const RuleShiftGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking, recordError } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [block, setBlock] = useState(1); // 1: Learning, 2: Shift, 3: Exceptions
  const [score, setScore] = useState(0);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('rsh_game_6', score, errors, {
      blocksCompleted: block
    });
    onEndGame(score, errors, {});
  }, [score, errors, block, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive && gameState === 'instruction') {
      startTracking('rsh_game_6');
      setGameState('running');
    }
  }, [isActive, gameState, startTracking]);

  const handleResponse = useCallback(() => {
    setScore(prev => prev + 10);
    if (block >= 3) {
      endGame();
    } else {
      setBlock(block + 1);
    }
  }, [block, endGame]);

  const handleError = useCallback(() => {
    setErrors(prev => prev + 1);
    recordError();
  }, [recordError]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Rule Shift + Exceptions</h2>
          <p>Aprende a clasificar con una regla</p>
          <p>La regla cambiará, deberás adaptarte</p>
          <p>Luego habrá excepciones a la regla</p>
          <button onClick={() => setGameState('running')} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>Bloque {block} de 3</h3>
        <div className="rule-display">
          {block === 1 && <p>Clasifica por COLOR</p>}
          {block === 2 && <p>Cambia: Clasifica por FORMA</p>}
          {block === 3 && <p>Excepciones: Rojo siempre es rojo</p>}
        </div>
        <div className="stimulus">◆ ROJO</div>
        <div className="buttons-group">
          <button onClick={handleResponse} className="btn btn-correct">Respuesta</button>
          <button onClick={handleError} className="btn btn-error">Error</button>
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};

/**
 * SJT - Situational Judgment Test
 */
export const SJTGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking } = useTelemetry();
  const [gameState, setGameState] = useState('instruction');
  const [score, setScore] = useState(0);
  const [scenario, setScenario] = useState(1);
  const [errors, setErrors] = useState(0);
  const hasEndedRef = useRef(false);

  const MAX_SCENARIOS = isDemo ? 4 : 10;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    stopTracking('sjt_game_7', score, errors, {
      scenariosCompleted: scenario,
      accuracy: Math.round(((MAX_SCENARIOS - errors) / MAX_SCENARIOS) * 100)
    });
    onEndGame(score, errors, {});
  }, [score, errors, scenario, stopTracking, onEndGame]);

  useGameTimer({ isActive, timeLimit, onEnd: endGame });

  useEffect(() => {
    if (isActive && gameState === 'instruction') {
      startTracking('sjt_game_7');
      setGameState('running');
    }
  }, [isActive, gameState, startTracking]);

  const handleResponse = useCallback(() => {
    setScore(prev => prev + 20);
    if (scenario >= MAX_SCENARIOS) {
      endGame();
    } else {
      setScenario(scenario + 1);
    }
  }, [scenario, MAX_SCENARIOS, endGame]);

  if (gameState === 'instruction') {
    return (
      <div className="hrrh-game-container">
        <div className="game-instruction-box">
          <h2>Situational Judgment Test</h2>
          <p>Evalúa tu juicio ante situaciones laborales</p>
          <p>Elige la respuesta más apropiada</p>
          <button onClick={() => setGameState('running')} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="hrrh-game-container">
      <div className="game-state-box">
        <h3>Escenario {scenario} de {MAX_SCENARIOS}</h3>
        <div className="sjt-scenario">
          <p><strong>Situación:</strong> Tu líder asigna una tarea con un plazo muy corto...</p>
        </div>
        <div className="buttons-group">
          <button onClick={handleResponse} className="btn btn-option">Aceptar sin cuestionar</button>
          <button onClick={handleResponse} className="btn btn-option">Discutir el plazo</button>
          <button onClick={handleResponse} className="btn btn-option">Proponer alternativas</button>
          <button onClick={handleResponse} className="btn btn-option">Declinar la tarea</button>
        </div>
        <p className="score">Score: {score}</p>
      </div>
    </div>
  );
};
