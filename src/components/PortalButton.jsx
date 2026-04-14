import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './PortalButton.css';

export default function PortalButton() {
  const location = useLocation();
  const telemetry = useTelemetry();
  const portalUrl = import.meta.env.VITE_PORTAL_URL || '/postulantes';
  const [topPx, setTopPx] = useState(null);

  // Hide on the postulantes page itself
  if ((location?.pathname || '').startsWith('/postulantes')) return null;

  useEffect(() => {
    // Compute offset if the landing page language corner is present,
    // otherwise use default CSS top.
    const update = () => {
      try {
        const el = document.querySelector('.lv3-lang-corner');
        if (el) {
          const rect = el.getBoundingClientRect();
          // add small margin
          const newTop = Math.ceil(rect.bottom + 8);
          setTopPx(newTop);
          return;
        }
      } catch (e) {
        // ignore
      }
      setTopPx(null);
    };

    update();
    window.addEventListener('resize', update);
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', update);
      mo.disconnect();
    };
  }, [location.pathname]);

  const handleClick = () => {
    try { telemetry && telemetry.recordTrialEvent && telemetry.recordTrialEvent({ event: 'portal_click' }); } catch (e) {}
    try { window.dataLayer?.push({ event: 'portal_click' }); } catch (e) {}
  };

  return (
    <a
      href={portalUrl}
      className="btn-portal"
      aria-label="Portal de Postulantes"
      onClick={handleClick}
      style={topPx ? { top: `${topPx}px` } : undefined}
    >
      Dar mi Test
    </a>
  );
}
