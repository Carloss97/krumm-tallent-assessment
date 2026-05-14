import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTelemetry } from '../TelemetryContext';
import { useGameTimer } from '../hooks/useGameTimer';
import { buildAssessmentTrialEvent } from '../utils/assessmentTelemetry';
import './OSPANGame.css';

/**
 * OSPAN - Operation Span Task (Memoria de Trabajo Dual-Task)
 */
const OSPANGame = ({ isActive, onEndGame, isDemo, timeLimit, language = 'es' }) => {
  const isEn = language === 'en';
  const { startTracking, stopTracking, recordError, recordTrialEvent } = useTelemetry();

  const [gameState, setGameState] = useState('instruction');
  const [setSize, setSetSize] = useState(3);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [phaseVariant, setPhaseVariant] = useState('steady');

  const [operation, setOperation] = useState('');
  const [operationIsCorrect, setOperationIsCorrect] = useState(null);
  const [currentLetter, setCurrentLetter] = useState('');

  const [lettersToRecall, setLettersToRecall] = useState([]);
  const [recallSequence, setRecallSequence] = useState([]);

  const [score, setScore] = useState(0);
  const [correctOperations, setCorrectOperations] = useState(0);
  const [totalOperations, setTotalOperations] = useState(0);
  const [correctRecalls, setCorrectRecalls] = useState(0);
  const [totalRecalls, setTotalRecalls] = useState(0);

  const operationStartTimeRef = useRef(null);
  const letterStartTimeRef = useRef(null);
  const hasEndedRef = useRef(false);
  const gameIdRef = useRef('ospan_game_1');

  const MAX_SET_SIZE = isDemo ? 4 : 6;

  const endGame = useCallback(() => {
    if (hasEndedRef.current) return;
    hasEndedRef.current = true;

    const operationAccuracy = totalOperations > 0 ? Math.round((correctOperations / totalOperations) * 100) : 0;
    const recallAccuracy = totalRecalls > 0 ? Math.round((correctRecalls / totalRecalls) * 100) : 0;
    const workingMemorySpan = lettersToRecall.length > 0 ? Math.max(...lettersToRecall.map((arr) => arr.length)) : 0;

    stopTracking(gameIdRef.current, score, totalOperations - correctOperations, {
      operationAccuracy,
      recallAccuracy,
      workingMemorySpan,
      totalTrials: totalOperations,
      correctOperations,
      correctRecalls,
      phaseVariant,
    });

    onEndGame(score, totalOperations - correctOperations, {
      operationAccuracy,
      recallAccuracy,
      workingMemorySpan,
    });
  }, [score, totalOperations, correctOperations, correctRecalls, totalRecalls, lettersToRecall, stopTracking, onEndGame, phaseVariant]);

  const gameTimer = useGameTimer({ isActive, timeLimit, onEnd: endGame });

  const generateOperation = useCallback(() => {
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    const opRoll = Math.random();
    const op = opRoll > 0.66 ? '*' : opRoll > 0.33 ? '+' : '-';

    const left = op === '-' ? Math.max(a, b) : a;
    const right = op === '-' ? Math.min(a, b) : b;
    const expression = `${left}${op}${right}`;
    const result = op === '+' ? left + right : op === '-' ? left - right : left * right;

    const isCorrect = Math.random() > 0.3;
    const displayResult = isCorrect ? result : result + Math.floor(Math.random() * 5) + 1;

    const variant = setSize >= 5 ? 'surge' : setSize >= 4 ? 'switch' : 'steady';
    setPhaseVariant(variant);
    setOperation(`${expression} = ${displayResult}?`);
    setOperationIsCorrect(isCorrect);
    operationStartTimeRef.current = Date.now();

    recordTrialEvent({
      phase: 'operation',
      expression,
      actualResult: result,
      displayResult,
      isCorrectAnswer: isCorrect,
      variant,
    });
  }, [recordTrialEvent, setSize]);

  const generateLetter = useCallback(() => {
    const letterPools = {
      steady: 'BCDFGHJKLMNPRSTVWXYZ',
      switch: 'BCDFGHJKLMNPRSTVWXYZQ',
      surge: 'BCDFGHJKLMNPRSTVWXYZQZ',
    };

    const letters = letterPools[phaseVariant] || letterPools.steady;
    const letter = letters[Math.floor(Math.random() * letters.length)];
    setCurrentLetter(letter);
    letterStartTimeRef.current = Date.now();

    recordTrialEvent({ phase: 'letter', letter, variant: phaseVariant });
  }, [recordTrialEvent, phaseVariant]);

  const nextPhase = useCallback(() => {
    if (gameState === 'operationPhase') {
      setGameState('letterPhase');
      generateLetter();
    } else if (gameState === 'letterPhase') {
      if (currentTrial < setSize - 1) {
        setCurrentTrial((prev) => prev + 1);
        setGameState('operationPhase');
        generateOperation();
      } else {
        setGameState('recallPhase');
      }
    }
  }, [gameState, currentTrial, setSize, generateLetter, generateOperation]);

  const handleOperationResponse = useCallback((answer) => {
    const rt = Date.now() - operationStartTimeRef.current;

    const expectedTrue = operationIsCorrect === true;
    const answeredTrue = answer === 'true';
    const isCorrect = answeredTrue === expectedTrue;

    if (isCorrect) {
      setCorrectOperations((prev) => prev + 1);
      setScore((prev) => prev + 10);
    } else {
      recordError();
    }

    setTotalOperations((prev) => prev + 1);

    recordTrialEvent(buildAssessmentTrialEvent(gameIdRef.current, {
      phase: 'operation_response',
      trialIndex: totalOperations + 1,
      stimulus: {
        operation,
        setSize,
        currentTrial: currentTrial + 1,
        displayedTruth: operationIsCorrect,
        variant: phaseVariant,
      },
      response: { answer },
      expected: { answer: expectedTrue ? 'true' : 'false' },
      isCorrect,
      reactionTimeMs: rt,
      behaviouralMarkers: isCorrect ? ['processing_hit'] : ['processing_error'],
      metrics: { setSize, operationAccuracySoFar: totalOperations > 0 ? Math.round((correctOperations / totalOperations) * 100) : undefined },
    }));

    setTimeout(() => {
      nextPhase();
    }, 500);
  }, [nextPhase, recordError, recordTrialEvent, operationIsCorrect, phaseVariant, operation, setSize, currentTrial, totalOperations, correctOperations]);

  const handleLetterConfirm = useCallback(() => {
    const rt = Date.now() - letterStartTimeRef.current;

    setLettersToRecall((prev) => [...prev, [...prev[prev.length - 1] || [], currentLetter]]);
    setTotalRecalls((prev) => prev + setSize);

    recordTrialEvent({
      type: 'letter_recorded',
      letter: currentLetter,
      reactionTime: rt,
      variant: phaseVariant,
    });

    setTimeout(() => {
      nextPhase();
    }, 500);
  }, [currentLetter, setSize, nextPhase, recordTrialEvent, phaseVariant]);

  const handleRecallResponse = useCallback((letters) => {
    const expected = lettersToRecall[lettersToRecall.length - 1] || [];
    const correct = letters.length > 0 && letters.every((l, i) => expected[i] === l);

    if (correct) {
      setCorrectRecalls((prev) => prev + 1);
      setScore((prev) => prev + 50);
    } else {
      recordError();
    }

    setRecallSequence([...recallSequence, { expected, actual: letters, isCorrect: correct }]);

    if (setSize >= MAX_SET_SIZE) {
      endGame();
    } else {
      setSetSize((prev) => prev + 1);
      setCurrentTrial(0);
      setGameState('operationPhase');
      setLettersToRecall([]);
      generateOperation();
    }
  }, [lettersToRecall, recallSequence, setSize, endGame, recordError, generateOperation]);

  const startFirstTrial = useCallback(() => {
    startTracking(gameIdRef.current);
    setGameState('operationPhase');
    setCurrentTrial(0);
    setLettersToRecall([]);
    generateOperation();
  }, [generateOperation, startTracking]);

  const modeLabel = phaseVariant === 'steady'
    ? (isEn ? 'Steady' : 'Estable')
    : phaseVariant === 'switch'
      ? (isEn ? 'Switch' : 'Cambio')
      : (isEn ? 'Surge' : 'Impulso');

  if (gameState === 'instruction') {
    return (
      <div className="ospan-container">
        <div className="game-instruction">
          <h2>{isEn ? 'Working Memory - OSPAN' : 'Memoria de Trabajo - OSPAN'}</h2>
          <p>{isEn ? 'You will:' : 'Deberás:'}</p>
          <ol>
            <li>{isEn ? 'Answer ' : 'Responder '}<strong>{isEn ? 'True/False' : 'Verdadero/Falso'}</strong>{isEn ? ' to math operations' : ' a operaciones matemáticas'}</li>
            <li>{isEn ? 'Then ' : 'Después, '}<strong>{isEn ? 'memorize a letter' : 'memorizar una letra'}</strong></li>
            <li>{isEn ? 'The cycle gains variety as sets increase' : 'El ciclo gana variedad conforme suben los sets'}</li>
            <li>{isEn ? 'Recall letters in order at each set end' : 'Recuerda letras en orden al final de cada set'}</li>
          </ol>
          <p><strong>{isEn ? 'Goal:' : 'Objetivo:'}</strong> {isEn ? 'Stable precision with adaptive rhythm.' : 'Precisión estable con ritmo adaptativo.'}</p>
          <button onClick={startFirstTrial} className="btn-start">{isEn ? 'Start' : 'Comenzar'}</button>
        </div>
      </div>
    );
  }

  if (gameState === 'operationPhase') {
    return (
      <div className="ospan-container">
        <div className="ospan-content">
          <div className="timer-bar">
            <div className={`timer-progress ${gameTimer < 5 ? 'warning' : ''}`} style={{ width: `${(gameTimer / timeLimit) * 100}%` }} />
          </div>

          <div className="operation-phase">
            <p className="operation-display">{operation}</p>
            <div className="operation-buttons">
              <button onClick={() => handleOperationResponse('true')} className="btn btn-true">{isEn ? 'True' : 'Verdadero'}</button>
              <button onClick={() => handleOperationResponse('false')} className="btn btn-false">{isEn ? 'Falso' : 'Falso'}</button>
            </div>
          </div>

          <div className="progress-info">
            <span>Set {setSize} / Trial {currentTrial + 1} {isEn ? 'of' : 'de'} {setSize}</span>
            <span style={{ marginLeft: 10, fontWeight: 700 }}>{isEn ? 'Mode' : 'Modo'}: {modeLabel}</span>
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
            <div className={`timer-progress ${gameTimer < 5 ? 'warning' : ''}`} style={{ width: `${(gameTimer / timeLimit) * 100}%` }} />
          </div>

          <div className="letter-phase">
            <motion.div className="letter-display" initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.3 }}>
              {currentLetter}
            </motion.div>
            <p className="instruction">{isEn ? 'Memorize this letter' : 'Memoriza esta letra'}</p>
            <button onClick={handleLetterConfirm} className="btn btn-confirm">{isEn ? 'Continue' : 'Continuar'}</button>
          </div>

          <div className="progress-info">
            <span>{isEn ? 'Memorized' : 'Memorizadas'}: {lettersToRecall.length > 0 ? lettersToRecall[lettersToRecall.length - 1].length : 0}</span>
            <span style={{ marginLeft: 10, fontWeight: 700 }}>{isEn ? 'Mode' : 'Modo'}: {modeLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'recallPhase') {
    return (
      <div className="ospan-container">
        <div className="recall-phase">
          <h3>{isEn ? 'Recall - Enter letters in order' : 'Recall - Escribe las letras en orden'}</h3>
          <div className="letter-grid">
            {['B', 'C', 'D', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'W', 'X', 'Y', 'Z'].map((letter) => (
              <button key={letter} className="btn-recall" onClick={() => setRecallSequence([...recallSequence, letter])}>
                {letter}
              </button>
            ))}
          </div>
          <p className="recalled-sequence">{isEn ? 'Recalled' : 'Recordadas'}: {recallSequence.join(' ')}</p>
          <button onClick={() => handleRecallResponse(recallSequence)} className="btn btn-submit">{isEn ? 'Confirm' : 'Confirmar'}</button>
          <button onClick={() => setRecallSequence(recallSequence.slice(0, -1))} className="btn btn-delete">{isEn ? 'Delete last' : 'Borrar última'}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ospan-container">
      <p>{isEn ? 'Game ended.' : 'Juego finalizado.'}</p>
    </div>
  );
};

export default OSPANGame;
