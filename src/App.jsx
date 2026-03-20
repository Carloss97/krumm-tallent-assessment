import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TelemetryProvider, useTelemetry } from './TelemetryContext';
import Game1 from './games/ColorWordGame';
import Game2 from './games/FrustrationGame';
import Game3 from './games/MemoryGame';
import Game4 from './games/BalloonGame';
import Game5 from './games/VigilanceGame';
import Game6 from './games/GridOptimizerGame';
import Game7 from './games/LaserPuzzleGame';
import NBackGame from './games/NBackGame';
import TowerOfLondonGame from './games/TowerOfLondonGame';
import WisconsinCardSortingGame from './games/WisconsinCardSortingGame';
import GoNoGoGame from './games/GoNoGoGame';
import TrailMakingGame from './games/TrailMakingGame';
import CorsiBlockTappingGame from './games/CorsiBlockTappingGame';
import MentalRotationGame from './games/MentalRotationGame';
import Report from './Report';
import GlobalProgressBar from './components/GlobalProgressBar';
import LiveTelemetryChart from './components/LiveTelemetryChart';
import './App.css'; 

// Primary entry/intro component
const Intro = () => {
  const navigate = useNavigate();
  const { setIsDemo } = useTelemetry();
  const [showDevTools, setShowDevTools] = useState(false);

  const handleStart = (demo = false) => {
    setIsDemo(demo);
    navigate('/game/1');
  };

  const handleViewDummyReport = () => {
    navigate('/report?dummy=true');
  };

  const handleDirectGameAccess = (gameNumber) => {
    setIsDemo(false); // Set to full mode for direct access
    navigate(`/game/${gameNumber}`);
  };

  const games = [
    { number: 1, name: 'Color Word Game', type: 'Cognitive Flexibility' },
    { number: 2, name: 'Frustration Game', type: 'Stress Resilience' },
    { number: 3, name: 'Memory Game', type: 'Working Memory' },
    { number: 4, name: 'Balloon Game', type: 'Risk Assessment' },
    { number: 5, name: 'Vigilance Game', type: 'Sustained Attention' },
    { number: 6, name: 'Grid Optimizer', type: 'Planning & Logic' },
    { number: 7, name: 'Laser Puzzle', type: 'Spatial Reasoning' },
    { number: 8, name: 'N-Back Task', type: 'Working Memory' },
    { number: 9, name: 'Tower of London', type: 'Planning & Problem Solving' },
    { number: 10, name: 'Wisconsin Card Sorting', type: 'Cognitive Flexibility' },
    { number: 11, name: 'Go/No-Go Task', type: 'Response Inhibition' },
    { number: 12, name: 'Trail Making Test', type: 'Processing Speed' },
    { number: 13, name: 'Corsi Block Tapping', type: 'Spatial Memory' },
    { number: 14, name: 'Mental Rotation', type: 'Spatial Reasoning' }
  ];

  return (
    <div className="flex-center" style={{ width: '100%', height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel"
        style={{ padding: '60px', textAlign: 'center', maxWidth: '800px' }}
      >
        <h1 className="text-gradient" style={{ fontSize: '3rem', marginBottom: '16px' }}>Cognitive Assessment</h1>
        <p style={{ marginBottom: '40px', color: '#374151', lineHeight: '1.8', fontSize: '1.1rem' }}>
          Welcome to the comprehensive cognitive assessment platform. You will complete 14 scientifically-validated games
          designed to evaluate working memory, planning, cognitive flexibility, response inhibition, processing speed, spatial memory, and spatial reasoning.
        </p>

        <div style={{ display: 'flex', gap: '24px', justifyContent: 'center', flexWrap: 'wrap', alignItems: 'center', marginBottom: '30px' }}>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px' }} onClick={() => handleStart(false)}>
            Begin Assessment
          </button>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px', background: 'rgba(124, 58, 237, 0.1)', color: '#7c3aed', border: '1px solid #7c3aed' }} onClick={() => handleStart(true)}>
            Quick Demo
          </button>
          <button className="btn" style={{ fontSize: '1.2rem', padding: '16px 36px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid #10b981' }} onClick={handleViewDummyReport}>
            View Demo Report
          </button>
        </div>

        {/* Development Tools Toggle */}
        <div style={{ marginBottom: '20px' }}>
          <button
            className="btn"
            style={{
              fontSize: '0.9rem',
              padding: '8px 16px',
              background: 'rgba(107, 114, 128, 0.1)',
              color: '#6b7280',
              border: '1px solid #6b7280'
            }}
            onClick={() => setShowDevTools(!showDevTools)}
          >
            {showDevTools ? 'Hide' : 'Show'} Development Tools
          </button>
        </div>

        {/* Development Tools */}
        {showDevTools && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ marginTop: '20px', padding: '20px', backgroundColor: 'rgba(0,0,0,0.05)', borderRadius: '12px' }}
          >
            <h3 style={{ color: '#374151', marginBottom: '16px', fontSize: '1.2rem' }}>Direct Game Access (Development)</h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto'
            }}>
              {games.map((game) => (
                <button
                  key={game.number}
                  className="btn"
                  style={{
                    fontSize: '0.8rem',
                    padding: '8px 12px',
                    background: 'rgba(59, 130, 246, 0.1)',
                    color: '#3b82f6',
                    border: '1px solid #3b82f6',
                    textAlign: 'left'
                  }}
                  onClick={() => handleDirectGameAccess(game.number)}
                >
                  <div style={{ fontWeight: 'bold' }}>Game {game.number}</div>
                  <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>{game.name}</div>
                  <div style={{ fontSize: '0.6rem', opacity: 0.6 }}>{game.type}</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

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
      <LiveTelemetryChart />

      <div style={{ flex: 1, position: 'relative', overflowY: 'auto', overflowX: 'hidden' }}>
        <Routes>
          <Route path="/" element={<Intro />} />
          <Route path="/game/1" element={<Game1 />} />
          <Route path="/game/2" element={<Game2 />} />
          <Route path="/game/3" element={<Game3 />} />
          <Route path="/game/4" element={<Game4 />} />
          <Route path="/game/5" element={<Game5 />} />
          <Route path="/game/6" element={<Game6 />} />
          <Route path="/game/7" element={<Game7 />} />
          <Route path="/game/8" element={<NBackGame />} />
          <Route path="/game/9" element={<TowerOfLondonGame />} />
          <Route path="/game/10" element={<WisconsinCardSortingGame />} />
          <Route path="/game/11" element={<GoNoGoGame />} />
          <Route path="/game/12" element={<TrailMakingGame />} />
          <Route path="/game/13" element={<CorsiBlockTappingGame />} />
          <Route path="/game/14" element={<MentalRotationGame />} />
          <Route path="/report" element={<Report />} />
        </Routes>
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
