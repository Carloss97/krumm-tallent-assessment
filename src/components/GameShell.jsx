import React from 'react';
import GameLayout from './GameLayout';

/**
 * Transitional shell for game routes.
 * Keeps current behavior while we evolve a dedicated game container.
 */
const GameShell = (props) => {
  return <GameLayout {...props} />;
};

export default GameShell;
