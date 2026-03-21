import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import { GAME_FLOW } from '../utils/gameFlow';
import InstructionInterstitial from './InstructionInterstitial';

const GameLayout = ({ gameId, children }) => {
  const navigate = useNavigate();
  const { isDemo, startTracking, stopTracking } = useTelemetry();
  const [showInstructions, setShowInstructions] = useState(true);
  const [isActive, setIsActive] = useState(false);

  const gameConfig = GAME_FLOW.find(g => g.id === gameId);

  const handleStart = useCallback(() => {
    setShowInstructions(false);
    startTracking(gameConfig.telemetryId);
    setIsActive(true);
  }, [gameConfig.telemetryId, startTracking]);

  // Automatically start subsequent games after showing instructions briefly
  useEffect(() => {
    if (gameId > 1 && showInstructions) {
      const timer = setTimeout(() => {
        handleStart();
      }, 2000); // Show instructions for 2 seconds, then auto-start
      return () => clearTimeout(timer);
    }
  }, [gameId, showInstructions, handleStart]);

  const handleEndGame = useCallback((score, errors, details) => {
    if (!isActive) return;
    setIsActive(false);
    stopTracking(gameConfig.telemetryId, score, errors, details);

    // Navigate to the next game
    window.location.href = gameConfig.nextPath;
  }, [isActive, gameConfig.telemetryId, gameConfig.nextPath, stopTracking]);

  if (!gameConfig) {
    return <div>Error: Game configuration not found for ID {gameId}</div>;
  }

  const timeLimit = typeof gameConfig.timeLimit === 'object'
    ? (isDemo ? gameConfig.timeLimit.demo : gameConfig.timeLimit.full)
    : gameConfig.timeLimit;

  if (showInstructions) {
    return (
      <InstructionInterstitial
        type={gameConfig.instruction.type}
        title={gameConfig.instruction.title}
        description={gameConfig.instruction.description}
        timeLimit={timeLimit === 'None' || timeLimit === 'Timed' ? timeLimit : `${timeLimit}s`}
        onStart={handleStart}
        autoStart={gameId > 1}
      />
    );
  }

  return React.cloneElement(children, {
    isActive,
    onEndGame: handleEndGame,
    isDemo,
    timeLimit, // Pass the calculated time limit
  });
};

export default GameLayout;
