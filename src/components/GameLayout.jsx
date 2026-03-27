import React from 'react';
import GameShellCore from './GameShellCore';

const GameLayout = ({ gameId, children }) => {
  return <GameShellCore gameId={gameId}>{children}</GameShellCore>;
};

export default GameLayout;
