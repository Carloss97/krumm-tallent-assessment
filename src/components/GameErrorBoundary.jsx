import React from 'react';
import './GameErrorBoundary.css';

class GameErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    if (typeof this.props.onErrorCapture === 'function') {
      this.props.onErrorCapture(error, errorInfo);
    }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { language = 'es', onRetry, onExit } = this.props;
    const t = {
      title: language === 'en' ? 'Unexpected game error' : 'Error inesperado del juego',
      body: language === 'en'
        ? 'A problem occurred while running this game. You can retry or leave the session.'
        : 'Ocurrio un problema durante este juego. Puedes reintentar o salir de la sesion.',
      retry: language === 'en' ? 'Retry game' : 'Reintentar juego',
      leave: language === 'en' ? 'Leave session' : 'Salir de la sesion',
    };

    return (
      <div className="game-error-boundary" role="alert">
        <h3>{t.title}</h3>
        <p>{t.body}</p>
        <div className="game-error-boundary-actions">
          <button type="button" onClick={onRetry}>{t.retry}</button>
          <button type="button" className="danger" onClick={onExit}>{t.leave}</button>
        </div>
      </div>
    );
  }
}

export default GameErrorBoundary;
