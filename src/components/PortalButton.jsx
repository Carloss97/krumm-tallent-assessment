import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './PortalButton.css';

export default function PortalButton() {
  const location = useLocation();
  const telemetry = useTelemetry();
  const portalUrl = import.meta.env.VITE_PORTAL_URL || '/candidate/login';

  // Hide on the postulantes / candidate pages themselves
  if ((location?.pathname || '').startsWith('/postulantes') || (location?.pathname || '').startsWith('/candidate')) return null;

  // Add small UX nicety: if the landing language corner exists, add a helper class
  // on the root element to avoid overlap with the fixed portal button.
  React.useEffect(() => {
    const update = () => {
      try {
        const el = document.querySelector('.lv3-lang-corner');
        if (el) document.documentElement.classList.add('has-lang-corner');
        else document.documentElement.classList.remove('has-lang-corner');
      } catch (e) {
        document.documentElement.classList.remove('has-lang-corner');
      }
    };

    update();
    window.addEventListener('resize', update);
    const mo = new MutationObserver(update);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      window.removeEventListener('resize', update);
      mo.disconnect();
      document.documentElement.classList.remove('has-lang-corner');
    };
  }, []);

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
    >
      Dar mi Test
    </a>
  );
}
