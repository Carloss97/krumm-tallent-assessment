import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { GAME_FLOW } from '../utils/gameFlow';

let DevControls;
if (import.meta.env && import.meta.env.PROD) {
  DevControls = () => null;
} else {
  DevControls = function DevControlsComponent() {
    const navigate = useNavigate();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
      if (typeof window === 'undefined') {
        setVisible(false);
        return;
      }

      const host = (window.location.hostname || '').toLowerCase();
      const port = window.location.port || '';
      const viteDev = Boolean(import.meta.env && import.meta.env.DEV);

      // Allow-list of dev hosts can be configured via Vite env VITE_ALLOWED_DEV_HOSTS
      const raw = import.meta.env.VITE_ALLOWED_DEV_HOSTS || 'localhost,127.0.0.1,::1,dev.krumm.cl';
      const allowed = raw.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);

      const matchesAllowed = allowed.includes(host) || allowed.some(p => p.startsWith('*.') && host.endsWith(p.replace('*.', '')));
      const isLocalSuffix = host.endsWith('.local');

      // Only show when explicitly allowed or running Vite dev server
      setVisible(matchesAllowed || isLocalSuffix || port === '5173' || viteDev);
    }, []);

    if (!visible) return null;

    const go = (path) => {
      navigate(path);
    };

    return (
      <div className="dev-controls" aria-hidden={!visible} data-dev-controls>
        <div className="dev-controls-inner" role="navigation" aria-label="Developer controls">
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
}

export default DevControls;
