import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TelemetryProvider } from './TelemetryContext';
import { LanguageProvider } from './context/LanguageContext';
import GlobalProgressBar from './components/GlobalProgressBar';
import GameShell from './components/GameShell';
import { GAME_FLOW } from './utils/gameFlow';
import RecruiterLogin from './components/RecruiterLogin';
import RecruiterDashboard from './components/RecruiterDashboard';
import './App.css';
import DevControls from './components/DevControls';
import Footer from './components/Footer';

// Lazy load components for code splitting
const Report = lazy(() => import('./Report'));
const Intro = lazy(() => import('./components/Intro'));
const LandingPage = lazy(() => import('./components/LandingPageV3'));
const FutureAssessmentLab = lazy(() => import('./components/FutureAssessmentLab'));
const ComplementaryIntro = lazy(() => import('./components/ComplementaryIntro'));

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

      {import.meta.env.VITE_DEV_VERSION === 'true' && <DevControls />}

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
        <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/intro" element={<Intro />} />
            {GAME_FLOW.map(game => (
              <Route
                key={game.path}
                path={game.path}
                element={
                  <GameShell gameId={game.id}>
                    <game.component />
                  </GameShell>
                }
              />
            ))}
            <Route path="/complementary/intro" element={<ComplementaryIntro />} />
            <Route path="/future/lab" element={<FutureAssessmentLab />} />
            <Route path="/report" element={<Report />} />
          </Routes>
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}

function App() {
  const basename = import.meta.env.VITE_BASE_PATH || '/';

  return (
    <LanguageProvider>
      <Router basename={basename}>
        <Routes>
          {/* Recruiter routes (separate from telemetry) */}
          <Route path="/recruiter/login" element={<RecruiterLogin />} />
          <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />

          {/* Assessment routes (with telemetry tracking) */}
          <Route
            path="/*"
            element={
              <TelemetryProvider>
                <AppContent />
              </TelemetryProvider>
            }
          />
        </Routes>
      </Router>
    </LanguageProvider>
  );
}

export default App;
