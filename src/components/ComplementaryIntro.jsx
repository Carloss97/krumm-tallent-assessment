import React from 'react';
import { useNavigate } from 'react-router-dom';

const list = [
  'Metacognitive Calibration',
  'Operational Prioritization',
  'Learning Agility',
  'Social Coordination',
  'Cognitive Resilience',
  'Risk Under Uncertainty',
];

function ComplementaryIntro() {
  const navigate = useNavigate();

  return (
    <div className="flex-center" style={{ width: '100%', minHeight: '100vh', padding: '24px' }}>
      <div className="glass-panel" style={{ maxWidth: '900px', width: '100%', padding: '28px' }}>
        <h1 className="text-gradient" style={{ marginBottom: '12px' }}>Complementary Battery (6 High-Priority Games)</h1>
        <p style={{ color: '#334155', marginBottom: '16px' }}>
          This complementary sequence extends predictive coverage beyond the 7-core battery.
          It focuses on calibration, prioritization, adaptability, social coordination, resilience, and uncertainty management.
        </p>

        <ol style={{ color: '#1e293b', lineHeight: '1.8', marginBottom: '18px' }}>
          {list.map((item) => <li key={item}>{item}</li>)}
        </ol>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn" onClick={() => navigate('/game/8')}>Start Complementary Battery</button>
          <button className="btn" onClick={() => navigate('/intro')}>Back to Main Intro</button>
        </div>
      </div>
    </div>
  );
}

export default ComplementaryIntro;
