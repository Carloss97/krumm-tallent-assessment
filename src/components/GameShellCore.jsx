import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { GAME_FLOW } from '../utils/gameFlow';
import { assignVariant } from '../utils/abTesting';
import { getLocalizedGameInstruction } from '../utils/gameFlowI18n';
import InstructionInterstitial from './InstructionInterstitial';
import ConsentModal from './ConsentModal';
import GameSessionHeader from './GameSessionHeader';
import GameErrorBoundary from './GameErrorBoundary';
import GameExitModal from './GameExitModal';
import EngagementPulse from './EngagementPulse';
import './GameShellCore.css';
import { useWebcamCapture } from '../hooks/useWebcamCapture';
import {
  recordGameShellRuntimeError,
  recordGameShellRecovery,
  recordGameShellExit,
} from '../utils/gameShellHealth';

const GameShellCore = ({ gameId, children }) => {
  const {
    isDemo,
    consentState,
    featureFlags,
    recordWebcamFrame,
    setConsent,
    recordTrialEvent,
    participantProfile,
    setExperimentAssignment = () => {},
  } = useTelemetry();
  const { language } = useLanguage();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [webcamFallbackNotice, setWebcamFallbackNotice] = useState('');
  const [showExitModal, setShowExitModal] = useState(false);
  const [runtimeError, setRuntimeError] = useState('');
  const [boundaryKey, setBoundaryKey] = useState(0);
  const errorGateRef = React.useRef({
    lastSignature: '',
    lastTimestamp: 0,
    uiTimer: null,
  });

  const isGameplayVisible = isActive && !showInstructions;

  const gameConfig = GAME_FLOW.find(g => g.id === gameId);
  const totalGames = GAME_FLOW.length;
  const localizedInstruction = useMemo(() => getLocalizedGameInstruction(gameConfig, language), [gameConfig, language]);
  const needsConsent = !isDemo && !consentState.consentTimestamp;

  const engagementVariant = useMemo(() => (
    assignVariant('engagement-pulse-v1', participantProfile?.participantId || 'anonymous', ['control', 'gamified'])
  ), [participantProfile?.participantId]);

  const shouldCaptureWebcam = useMemo(() => {
    return isActive && consentState.webcam && featureFlags.enableWebcamTracking;
  }, [isActive, consentState.webcam, featureFlags.enableWebcamTracking]);

  const videoRef = useWebcamCapture({
    isActive,
    shouldCapture: shouldCaptureWebcam,
    onFrameCapture: recordWebcamFrame,
  });

  const handleStart = useCallback(() => {
    setShowInstructions(false);
    setIsActive(true);
  }, []);

  const handleConsentsReady = useCallback((consents) => {
    if (consents.requestedWebcam && !consents.webcam) {
      setWebcamFallbackNotice(language === 'en'
        ? 'Webcam not available or denied. Continuing with cursor telemetry only.'
        : 'Webcam no disponible o denegada. Continuando solo con cursor.');
    }
    setConsent(consents.cursor, consents.webcam);
  }, [setConsent, language]);

  useEffect(() => {
    if (isDemo && !consentState.consentTimestamp) {
      setConsent(true, false);
    }
  }, [isDemo, consentState.consentTimestamp, setConsent]);

  useEffect(() => {
    setExperimentAssignment('engagement-pulse-v1', engagementVariant);
  }, [engagementVariant, setExperimentAssignment]);

  const handleEndGame = useCallback(() => {
    if (!isActive || !gameConfig) return;
    setIsActive(false);

    // Keep current full-page navigation behavior to avoid regressions.
    window.location.href = gameConfig.nextPath;
  }, [isActive, gameConfig]);

  const navigateHome = useCallback((source = 'unknown') => {
    recordGameShellExit({ gameId, source });
    setIsActive(false);
    setShowExitModal(false);
    window.location.href = '/';
  }, [gameId]);

  const handleExitGame = useCallback(() => {
    if (featureFlags.enableSessionExitModal !== false) {
      setShowExitModal(true);
      return;
    }

    const exitConfirm = language === 'en'
      ? 'Are you sure you want to exit? Your progress will not be saved.'
      : '¿Estas seguro de que deseas salir? Tu progreso no sera guardado.';
    if (window.confirm(exitConfirm)) {
      navigateHome('native-confirm');
    }
  }, [featureFlags.enableSessionExitModal, language, navigateHome]);

  const handleCancelExit = useCallback(() => {
    setShowExitModal(false);
  }, []);

  const handleGameError = useCallback((error) => {
    const fallback = language === 'en'
      ? 'A runtime error occurred in this game.'
      : 'Ocurrio un error de ejecucion en este juego.';
    const message = error?.message ? `${fallback} ${error.message}` : fallback;
    const signature = `${gameId}:${message}`;
    const now = Date.now();
    const isDuplicateBurst = (
      errorGateRef.current.lastSignature === signature
      && (now - errorGateRef.current.lastTimestamp) < 2500
    );

    recordGameShellRuntimeError({
      gameId,
      message,
      deduped: isDuplicateBurst,
    });

    if (isDuplicateBurst) {
      return;
    }

    errorGateRef.current.lastSignature = signature;
    errorGateRef.current.lastTimestamp = now;

    if (errorGateRef.current.uiTimer) {
      clearTimeout(errorGateRef.current.uiTimer);
    }

    errorGateRef.current.uiTimer = setTimeout(() => {
      setRuntimeError(message);
      errorGateRef.current.uiTimer = null;
    }, 120);

    console.error('[GameShellCore] runtime_error', {
      gameId,
      message,
      original: error?.message || null,
      timestamp: new Date().toISOString(),
    });
  }, [language, gameId]);

  const handleRetryAfterError = useCallback(() => {
    recordGameShellRecovery({ gameId });
    setRuntimeError('');
    setBoundaryKey((prev) => prev + 1);
  }, [gameId]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRuntimeError('');
    setBoundaryKey(0);
    setShowExitModal(false);
  }, [gameId]);

  useEffect(() => {
    return () => {
      if (errorGateRef.current.uiTimer) {
        clearTimeout(errorGateRef.current.uiTimer);
        errorGateRef.current.uiTimer = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!isGameplayVisible) return undefined;

    const onWindowError = (event) => {
      handleGameError(event?.error || new Error(event?.message || 'Unhandled window error'));
    };

    const onUnhandledRejection = (event) => {
      const reason = event?.reason;
      if (reason instanceof Error) {
        handleGameError(reason);
        return;
      }
      const normalized = typeof reason === 'string' ? reason : 'Unhandled promise rejection';
      handleGameError(new Error(normalized));
    };

    window.addEventListener('error', onWindowError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onWindowError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, [isGameplayVisible, handleGameError]);

  if (!gameConfig) {
    return <div>{language === 'en' ? `Error: Game configuration not found for ID ${gameId}` : `Error: configuracion de juego no encontrada para ID ${gameId}`}</div>;
  }

  const timeLimit = typeof gameConfig.timeLimit === 'object'
    ? (isDemo ? gameConfig.timeLimit.demo : gameConfig.timeLimit.full)
    : gameConfig.timeLimit;

  if (needsConsent) {
    return (
      <ConsentModal
        isOpen={true}
        onConsentsReady={handleConsentsReady}
        isDemo={isDemo}
        language={language}
      />
    );
  }

  if (showInstructions) {
    return (
      <>
        {webcamFallbackNotice && (
          <div
            style={{
              position: 'absolute',
              top: 12,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1200,
              background: '#fef2f2',
              color: '#991b1b',
              border: '1px solid #fecaca',
              borderRadius: 8,
              padding: '8px 12px',
              fontSize: 13,
            }}
          >
            {webcamFallbackNotice}
          </div>
        )}
        <InstructionInterstitial
          type={localizedInstruction.type}
          title={localizedInstruction.title}
          description={localizedInstruction.description}
          timeLimit={timeLimit === 'None' || timeLimit === 'Timed' ? timeLimit : `${timeLimit}s`}
          language={language}
          onStart={handleStart}
        />
        <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
      </>
    );
  }

  const enableSessionHeader = featureFlags.enableSessionHeader !== false;
  const enableEngagementPulse = featureFlags.enableEngagementPulse !== false && engagementVariant === 'gamified';
  const enableGameErrorBoundary = featureFlags.enableGameErrorBoundary !== false;

  const gameChild = React.cloneElement(children, {
    isActive,
    onEndGame: handleEndGame,
    isDemo,
    timeLimit,
    language,
  });

  return (
    <>
      {enableSessionHeader && (
        <GameSessionHeader
          gameConfig={gameConfig}
          gameId={gameId}
          isActive={isActive}
          timeLimit={timeLimit}
          language={language}
          errorMessage={runtimeError}
          onExit={handleExitGame}
        />
      )}
      {enableGameErrorBoundary ? (
        <GameErrorBoundary
          key={boundaryKey}
          language={language}
          onErrorCapture={handleGameError}
          onRetry={handleRetryAfterError}
          onExit={() => navigateHome('error-fallback')}
        >
          <div className="game-shell-body">{gameChild}</div>
        </GameErrorBoundary>
      ) : <div className="game-shell-body">{gameChild}</div>}
      {enableEngagementPulse && isActive && (
        <EngagementPulse
          key={`game-${gameId}-pulse`}
          gameId={gameId}
          totalGames={totalGames}
          isActive={isActive}
          timeLimit={typeof timeLimit === 'number' ? timeLimit : null}
          language={language}
          onMilestoneUnlocked={(event) => recordTrialEvent({ ...event, experiment: 'engagement-pulse-v1', variant: engagementVariant })}
        />
      )}
      <GameExitModal
        isOpen={showExitModal}
        language={language}
        onConfirm={() => navigateHome('modal-confirm')}
        onCancel={handleCancelExit}
      />
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
    </>
  );
};

export default GameShellCore;


