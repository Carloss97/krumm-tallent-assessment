import React from 'react';
import GameShellCore from './GameShellCore';

/**
 * Transitional shell for game routes.
 * Keeps current behavior while we evolve a dedicated game container.
 */
const GameShell = (props) => {
  return <GameShellCore {...props} />;
};

export default GameShell;
