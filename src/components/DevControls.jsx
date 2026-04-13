import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_FLOW } from '../utils/gameFlow';

const DevControls = () => {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      setVisible(false);
      return;
    }

    const host = window.location.hostname || '';
    const port = window.location.port || '';
    const isLocalhost = host === 'localhost' || host === '127.0.0.1' || host === '::1';
    const isDevSubdomain = host.startsWith('dev.');
    const isLocalSuffix = host.endsWith('.local');
    const viteDev = Boolean(import.meta.env && import.meta.env.DEV);

    setVisible(isLocalhost || isDevSubdomain || isLocalSuffix || port === '5173' || viteDev);
  }, []);

  if (!visible) return null;

  const go = (path) => {
    navigate(path);
  };

  return (
    <div className="dev-controls" aria-hidden={false}>
      <div className="dev-controls-inner">
        <button className="btn" onClick={() => go('/report')}>Ir a Report</button>
        <button className="btn" onClick={() => go('/recruiter/login')}>Login Dashboard</button>
        <button className="btn" onClick={() => go('/recruiter/dashboard')}>Abrir Dashboard</button>
        {GAME_FLOW.slice(0, 4).map((g) => (
          <button key={g.id} className="btn" onClick={() => go(g.path)}>{g.title || g.id}</button>
        ))}
      </div>
    </div>
  );
};

export default DevControls;
