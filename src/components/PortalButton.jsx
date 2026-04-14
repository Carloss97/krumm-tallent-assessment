import React from 'react';
import { useLocation } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './PortalButton.css';

export default function PortalButton() {
  const location = useLocation();
  const telemetry = useTelemetry();
  const portalUrl = import.meta.env.VITE_PORTAL_URL || '/postulantes';

  // Hide on the postulantes page itself
  if ((location?.pathname || '').startsWith('/postulantes')) return null;

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
