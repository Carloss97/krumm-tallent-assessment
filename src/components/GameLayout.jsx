import React, { useState, useCallback } from 'react';
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

  const handleEndGame = useCallback((score, errors, details) => {
    if (!isActive) return;
    setIsActive(false);
    stopTracking(gameConfig.telemetryId, score, errors, details);

    setTimeout(() => {
      navigate(gameConfig.nextPath, { replace: true });
      window.scrollTo(0, 0);
    }, 1500);
  }, [isActive, gameConfig.telemetryId, gameConfig.nextPath, navigate, stopTracking]);

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
