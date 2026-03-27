import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import { GAME_FLOW } from '../utils/gameFlow';
import { getLocalizedGameInstruction } from '../utils/gameFlowI18n';
import InstructionInterstitial from './InstructionInterstitial';
import ConsentModal from './ConsentModal';
import GameSessionHeader from './GameSessionHeader';
import { useWebcamCapture } from '../hooks/useWebcamCapture';

const GameShellCore = ({ gameId, children }) => {
  const {
    isDemo,
    consentState,
    featureFlags,
    recordWebcamFrame,
    setConsent,
  } = useTelemetry();
  const { language } = useLanguage();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);
  const [webcamFallbackNotice, setWebcamFallbackNotice] = useState('');

  const gameConfig = GAME_FLOW.find(g => g.id === gameId);
  const localizedInstruction = useMemo(() => getLocalizedGameInstruction(gameConfig, language), [gameConfig, language]);
  const needsConsent = !isDemo && !consentState.consentTimestamp;

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

  const handleEndGame = useCallback(() => {
    if (!isActive || !gameConfig) return;
    setIsActive(false);

    // Keep current full-page navigation behavior to avoid regressions.
    window.location.href = gameConfig.nextPath;
  }, [isActive, gameConfig]);

  const handleExitGame = useCallback(() => {
    const exitConfirm = language === 'en'
      ? 'Are you sure you want to exit? Your progress will not be saved.'
      : '¿Estás seguro de que deseas salir? Tu progreso no será guardado.';
    if (window.confirm(exitConfirm)) {
      window.location.href = '/';
    }
  }, [language]);

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

  return (
    <>
      {enableSessionHeader && (
        <GameSessionHeader
          gameConfig={gameConfig}
          gameId={gameId}
          isActive={isActive}
          timeLimit={timeLimit}
          language={language}
          telemetryStatus={{
            webcam: consentState.webcam,
            cursor: consentState.cursor,
          }}
          onExit={handleExitGame}
        />
      )}
      {React.cloneElement(children, {
        isActive,
        onEndGame: handleEndGame,
        isDemo,
        timeLimit,
        language,
      })}
      <video ref={videoRef} style={{ display: 'none' }} playsInline muted />
    </>
  );
};

export default GameShellCore;
