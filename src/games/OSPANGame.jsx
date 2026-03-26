import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import './OSPANGame.css';

/**
 * OSPAN - Operation Span Task (Memoria de Trabajo Dual-Task)
 * v2.0 para Talent Assessment RRHH
 * 
 * Mide: Capacidad de mantener + actualizar información bajo multitarea
 * Constructo: Memoria de Trabajo
 * Duración: 6-7 min
 * 
 * Diseño:
 * - Trials alternados: Operación matemática → Letra a recordar
 * - Niveles: Set sizes 3, 4, 5, 6 (3 trials cada uno)
 * - Scoring: Recall accuracy + Operation accuracy + WM span final
 */
const OSPANGame = ({ isActive, onEndGame, isDemo, timeLimit }) => {
  const { startTracking, stopTracking, recordError, recordTrialEvent, getConsent } = useTelemetry();

  const [gameState, setGameState] = useState('initializing'); // initializing, instruction, operationPhase, letterPhase, recallPhase, ended
  const [setSize, setSetSize] = useState(3);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [round, setRound] = useState(1);

  // Operación actual
  const [operation, setOperation] = useState('');
  const [operationCorrect, setOperationCorrect] = useState(null);
  const [operationResponse, setOperationResponse] = useState('');
  const [operationRT, setOperationRT] = useState(0);

  // Letra actual
  const [currentLetter, setCurrentLetter] = useState('');
  const [letterRT, setLetterRT] = useState(0);

  // Almacenamiento para recall
  const [lettersToRecall, setLettersToRecall] = useState([]);
  const [recallSequence, setRecallSequence] = useState([]);

  // Scoring
  const [score, setScore] = useState(0);
  const [correctOperations, setCorrectOperations] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);
  const [correctRecalls, setCorrectRecalls] = useState(0);
  const [totalRecalls, setTotalRecalls] = useState(0);

  const operationStartTimeRef = useRef(null);
  const letterStartTimeRef = useRef(null);
  const hasEndedRef = useRef(false);
  const gameIdRef = useRef('ospan_game_1');

  const MAX_SET_SIZE = 6;
  const TRIALS_PER_SIZE = isDemo ? 2 : 3;
  const OPERATION_TIME_LIMIT = 3000; // 3 seg
  const LETTER_TIME_LIMIT = 1500; // 1.5 seg

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    const operationAccuracy = totalOperations > 0 ? Math.round((correctOperations / totalOperations) * 100) : 0;
    const recallAccuracy = totalRecalls > 0 ? Math.round((correctRecalls / totalRecalls) * 100) : 0;
    const workingMemorySpan = Math.max(...(lettersToRecall.map(arr => arr.length) || [0]));

    stopTracking(gameIdRef.current, score, totalOperations - correctOperations, {
      operationAccuracy,
      recallAccuracy,
      workingMemorySpan,
      totalTrials: totalOperations,
      correctOperations,
      correctRecalls
    });

    onEndGame(score, totalOperations - correctOperations, {
      operationAccuracy,
      recallAccuracy,
      workingMemorySpan
    });
  }, [score, totalOperations, correctOperations, correctRecalls, lettersToRecall, stopTracking, onEndGame]);

  const gameTimer = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  // Generar operación aleatorio
  const generateOperation = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const op = Math.random() > 0.5 ? '+' : '*';
    const expression = `${a}${op}${b}`;
    const result = op === '+' ? a + b : a * b;
    const isCorrect = Math.random() > 0.3; // 70% de operaciones correctas
    const displayResult = isCorrect ? result : result + Math.floor(Math.random() * 5) + 1;

    setOperation(`${expression} = ${displayResult}?`);
    operationStartTimeRef.current = Date.now();

    recordTrialEvent({
      phase: 'operation',
      expression,
      actualResult: result,
      displayResult,
      isCorrectAnswer: isCorrect
    });
  }, [recordTrialEvent]);

  // Generar letra aleatoria
  const generateLetter = useCallback(() => {
    const letters = 'BCDFGHJKLMNPRSTVWXYZ'; // Sin vocales
    const letter = letters[Math.floor(Math.random() * letters.length)];
    setCurrentLetter(letter);
    letterStartTimeRef.current = Date.now();

    recordTrialEvent({
      phase: 'letter',
      letter
    });
  }, [recordTrialEvent]);

  // Transición: Operation → Letter
  const nextPhase = useCallback(() => {
    if (gameState === 'operationPhase') {
      setGameState('letterPhase');
      generateLetter();
    } else if (gameState === 'letterPhase') {
      // Siguiente trial o recall
      if (currentTrial < setSize - 1) {
        setCurrentTrial(currentTrial + 1);
        setGameState('operationPhase');
        generateOperation();
      } else {
        // Ir a recall
        setGameState('recallPhase');
      }
    }
  }, [gameState, currentTrial, setSize, generateLetter, generateOperation]);

  // Manejar respuesta de operación
  const handleOperationResponse = useCallback((answer) => {
    const rt = Date.now() - operationStartTimeRef.current;
    setOperationRT(rt);

    // Verificar si es correcto (lógica simplificada)
    const isCorrect = Math.random() > 0.3; // Para demo
    setOperationCorrect(isCorrect);
    setOperationResponse(answer);

    if (isCorrect) {
      setCorrectOperations(prev => prev + 1);
      setScore(prev => prev + 10);
    } else {
      recordError();
    }

    setTotalOperations(prev => prev + 1);

    recordTrialEvent({
      type: 'operation_response',
      response: answer,
      isCorrect,
      reactionTime: rt
    });

    // Pasar a siguiente fase
    setTimeout(() => {
      setOperationCorrect(null);
      nextPhase();
    }, 500);
  }, [nextPhase, recordError, recordTrialEvent]);

  // Manejar respuesta de letra
  const handleLetterConfirm = useCallback(() => {
    const rt = Date.now() - letterStartTimeRef.current;
    setLetterRT(rt);

    setLettersToRecall(prev => [...prev, [...prev[prev.length - 1] || [], currentLetter]]);
    setTotalRecalls(prev => prev + setSize);

    recordTrialEvent({
      type: 'letter_recorded',
      letter: currentLetter,
      reactionTime: rt
    });

    // Siguiente trial
    setTimeout(() => {
      nextPhase();
    }, 500);
  }, [currentLetter, setSize, nextPhase, recordTrialEvent]);

  // Manejar recall (usuario escribe las letras recordadas)
  const handleRecallResponse = useCallback((letters) => {
    const correct = letters.length > 0 && letters.every((l, i) => lettersToRecall[lettersToRecall.length - 1]?.[i] === l);

    if (correct) {
      setCorrectRecalls(prev => prev + 1);
      setScore(prev => prev + 50);
    } else {
      recordError();
    }

    setRecallSequence([...recallSequence, { expected: lettersToRecall[lettersToRecall.length - 1], actual: letters, isCorrect: correct }]);

    // Siguiente set size
    if (setSize >= MAX_SET_SIZE) {
      endGame();
    } else {
      setSetSize(prev => prev + 1);
      setCurrentTrial(0);
      setGameState('operationPhase');
      setLettersToRecall([]);
      generateOperation();
    }
  }, [lettersToRecall, recallSequence, setSize, endGame, recordError]);

  // Inicializar juego
  useEffect(() => {
    if (!isActive) return;
    if (gameState !== 'initializing') return;

    startTracking(gameIdRef.current);
    setGameState('instruction');
  }, [isActive, gameState, startTracking]);

  // Empezar primer trial
  const startFirstTrial = useCallback(() => {
    setGameState('operationPhase');
    setCurrentTrial(0);
    setLettersToRecall([]);
    generateOperation();
  }, [generateOperation]);

  if (gameState === 'instruction') {
    return (
      <div className="ospan-container">
        <div className="game-instruction">
          <h2>Memoria de Trabajo - OSPAN</h2>
          <p>Deberás:</p>
          <ol>
            <li>Responder <strong>Verdadero/Falso</strong> a operaciones matemáticas</li>
            <li>Después, <strong>memorizar una letra</strong></li>
            <li>Este ciclo se repite, aumentando en complejidad</li>
            <li>Cuando terminen los ciclos, <strong>recuerda todas las letras</strong> en orden</li>
          </ol>
          <p><strong>Objetivo:</strong> Equilibra velocidad y precisión. Solo tienes pocos segundos para cada fase.</p>
          <button onClick={startFirstTrial} className="btn-start">Comenzar</button>
        </div>
      </div>
    );
  }

  if (gameState === 'operationPhase') {
    return (
      <div className="ospan-container">
        <div className="ospan-content">
          <div className="timer-bar">
            <div className={`timer-progress ${gameTimer < 5 ? 'warning' : ''}`} style={{ width: `${(gameTimer / timeLimit) * 100}%` }}></div>
          </div>

          <div className="operation-phase">
            <p className="operation-display">{operation}</p>
            <div className="operation-buttons">
              <button onClick={() => handleOperationResponse('true')} className="btn btn-true">Verdadero</button>
              <button onClick={() => handleOperationResponse('false')} className="btn btn-false">Falso</button>
            </div>
          </div>

          <div className="progress-info">
            <span>Set {setSize} / Trial {currentTrial + 1} de {setSize}</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'letterPhase') {
    return (
      <div className="ospan-container">
        <div className="ospan-content">
          <div className="timer-bar">
            <div className={`timer-progress ${gameTimer < 5 ? 'warning' : ''}`} style={{ width: `${(gameTimer / timeLimit) * 100}%` }}></div>
          </div>

          <div className="letter-phase">
            <motion.div
              className="letter-display"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {currentLetter}
            </motion.div>
            <p className="instruction">Memoriza esta letra</p>
            <button onClick={handleLetterConfirm} className="btn btn-confirm">Continuar</button>
          </div>

          <div className="progress-info">
            <span>Memorizadas: {lettersToRecall.length > 0 ? lettersToRecall[lettersToRecall.length - 1].length : 0}</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'recallPhase') {
    return (
      <div className="ospan-container">
        <div className="recall-phase">
          <h3>Recall - Escribe las letras en orden</h3>
          <div className="letter-grid">
            {['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'].map(letter => (
              <button key={letter} className="btn-recall" onClick={() => setRecallSequence([...recallSequence, letter])}>
                {letter}
              </button>
            ))}
          </div>
          <p className="recalled-sequence">Recordadas: {recallSequence.join(' ')}</p>
          <button onClick={() => handleRecallResponse(recallSequence)} className="btn btn-submit">Confirmar</button>
          <button onClick={() => setRecallSequence(recallSequence.slice(0, -1))} className="btn btn-delete">Borrar última</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ospan-container">
      <p>Game ended.</p>
    </div>
  );
};

export default OSPANGame;
