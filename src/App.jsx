import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { TelemetryProvider } from './TelemetryContext';
import { VariantProvider } from './contexts/VariantContext';
import { LanguageProvider } from './context/LanguageContext';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalProgressBar from './components/GlobalProgressBar';
import GameShell from './components/GameShell';
import { GAME_FLOW } from './utils/gameFlow';
import RecruiterLogin from './components/RecruiterLogin';
import RecruiterDashboard from './components/RecruiterDashboard';
import { shouldEnableAppScroll } from './utils/appScrollRoutes';
import './App.css';
// Load DevControls only in dev mode so it's not bundled into production builds
const DevControls = import.meta.env.DEV ? lazy(() => import('./components/DevControls')) : null;
import Footer from './components/Footer';
import PortalButton from './components/PortalButton';
import PostulantesLogin from './components/PostulantesLogin';

// Postulation demo routes
import PostulationDemoApp from './postulation-demo/PostulationDemoApp.jsx';
import PostulationHrDashboard from './postulation-demo/hr-dashboard/PostulationHrDashboard.jsx';
import { isPostulationDemoPath, isPostulationHrDashboardPath } from './postulation-demo/postulationDemoRoute.js';

// Lazy load components for code splitting
const Report = lazy(() => import('./Report'));
const Intro = lazy(() => import('./components/Intro'));
const LandingPage = lazy(() => import('./components/LandingPageV3'));
const FutureAssessmentLab = lazy(() => import('./components/FutureAssessmentLab'));
const ComplementaryIntro = lazy(() => import('./components/ComplementaryIntro'));
const DemoShell = lazy(() => import('./components/DemoShell'));
const PitchDeckPage = lazy(() => import('./components/PitchDeckPage'));
const DevCameraLab = lazy(() => import('./components/DevCameraLab'));
const DevCameraReport = lazy(() => import('./components/DevCameraReport'));
const CameraDemo = lazy(() => import('./components/CameraDemo.jsx'));

// Main App Router and State
function AppContent() {
  const location = useLocation();
  const shouldScroll = shouldEnableAppScroll(location.pathname);

  return (
    <div className="app-layout" style={{ height: '100vh', overflow: 'hidden' }}>
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

      {DevControls && (
        <Suspense fallback={null}>
          <DevControls />
        </Suspense>
      )}

      <div style={{ 
        flex: 1, 
        position: 'relative', 
        overflowY: shouldScroll ? 'auto' : 'hidden', 
        overflowX: 'hidden',
        height: '100%'
      }}>
        <Suspense fallback={<div className="loading-spinner">Loading...</div>}>
          <Routes>
            <Route path="/" element={<><LandingPage /><Footer /></>} />
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
            <Route path="/demo" element={<DemoShell />} />
            <Route path="/pitch" element={<PitchDeckPage />} />
            <Route path="/camera" element={<DevCameraLab production basePath="/camera" />} />
            <Route path="/camera/report" element={<DevCameraReport production basePath="/camera" />} />
            <Route path="/dev" element={<Navigate to="/dev/camera" replace />} />
            <Route path="/dev/camera" element={<DevCameraLab />} />
            <Route path="/dev/report" element={<DevCameraReport />} />
            {/* Postulation demo routes */}
            <Route path="/postulaciones-demo" element={<PostulationDemoApp />} />
            <Route path="/postulaciones-demo/hr" element={<PostulationHrDashboard />} />
            {/* Camera demo route */}
            <Route path="/camera-demo" element={<CameraDemo />} />
          </Routes>
        </Suspense>
      </div>
    </div>
  );
}

function App() {
  const basename = import.meta.env.VITE_BASE_PATH || '/';

  return (
    <VariantProvider>
      <ErrorBoundary>
        <LanguageProvider>
          <Router basename={basename}>
            <PortalButton />
            <Routes>
              {/* Recruiter routes (separate from telemetry) */}
              <Route path="/recruiter/login" element={<RecruiterLogin />} />
              <Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
              <Route path="/candidate/login" element={<Navigate to="/postulantes" replace />} />
              {/* Candidate portal (minimal, no global header/footer) */}
              <Route path="/postulantes" element={<PostulantesLogin />} />

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
      </ErrorBoundary>
    </VariantProvider>
  );
}

export default App;
