import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TelemetryProvider } from './TelemetryContext';
import GlobalProgressBar from './components/GlobalProgressBar';
import GameLayout from './components/GameLayout';
import { GAME_FLOW } from './utils/gameFlow';
import './App.css';

// Lazy load components for code splitting
const Report = lazy(() => import('./Report'));
const Intro = lazy(() => import('./components/Intro'));

// Main App Router and State
function AppContent() {
  return (
    <div className="app-layout">
      {/* Background effects */}
      <div style={{
        position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 60%)', zIndex: -1
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 60%)', zIndex: -1
      }} />

      <GlobalProgressBar />

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
        <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
          <Routes>
            <Route path="/" element={<Intro />} />
            {GAME_FLOW.map(game => (
              <Route
                key={game.path}
                path={game.path}
                element={
                  <GameLayout gameId={game.id}>
                    <game.component />
                  </GameLayout>
                }
              />
            ))}
            <Route path="/report" element={<Report />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  return (
    <TelemetryProvider>
      <Router>
        <AppContent />
      </Router>
    </TelemetryProvider>
  );
}

export default App;
