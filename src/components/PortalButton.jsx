import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './PortalButton.css';

export default function PortalButton() {
  const location = useLocation();
  const telemetry = useTelemetry();
  const portalUrl = import.meta.env.VITE_PORTAL_URL || '/postulantes';
  const navigate = useNavigate();
  // Only show the portal button on the landing page root. Hide in demo, game, report, candidate, etc.
  const path = (location?.pathname || '');
  const isVisible = path === '/';
  if (!isVisible) return null;

  const isExternalUrl = (url) => {
    if (!url) return false;
    return /^https?:\/\//i.test(url);
  };

  const handleClick = (e) => {
    try { telemetry?.recordTrialEvent && telemetry.recordTrialEvent({ event: 'portal_click' }); } catch (err) {}
    try { window.dataLayer?.push({ event: 'portal_click' }); } catch (err) {}

    const external = isExternalUrl(portalUrl);
    if (external) {
      // external: navigate via full page load to ensure proper host change
      e && e.preventDefault();
      window.location.assign(portalUrl);
      return;
    }

    // internal route: if we're on the landing page, open the landing's start form
    // via a custom event so the landing can present the credentials modal in-place.
    e && e.preventDefault();
    try {
      if ((location?.pathname || '') === '/' || (location?.pathname || '') === '') {
        document.dispatchEvent(new CustomEvent('krumm:open-start-form'));
        return;
      }
    } catch (err) {
      // fallback to SPA navigation if event dispatch fails
    }

    try { navigate(portalUrl); } catch (err) { window.location.assign(portalUrl); }
  };

  return (
    <a
      href={portalUrl}
      className="btn-portal soft-glow"
      onClick={handleClick}
      aria-label="Portal de Postulantes"
      {...(isExternalUrl(portalUrl) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      Dar mi Test
    </a>
  );
}
