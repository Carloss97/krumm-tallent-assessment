import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log to console and allow telemetry hooks to pick it up if available
    // Avoid importing telemetry here to keep this boundary generic and safe.
    console.error('ErrorBoundary caught an error:', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div style={{padding: 24, textAlign: 'center'}}>
          <h2>Ha ocurrido un error</h2>
          <p>La aplicación encontró un problema. Intenta recargar la página.</p>
          <div style={{marginTop: 16}}>
            <button onClick={() => window.location.reload()} style={{padding: '8px 16px'}}>Recargar</button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
