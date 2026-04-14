import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './PortalButton.css';

export default function PortalButton() {
  const location = useLocation();
  const telemetry = useTelemetry();
  const portalUrl = import.meta.env.VITE_PORTAL_URL || '/postulantes';
  const navigate = useNavigate();

  // Add small UX nicety: if the landing language corner exists, add a helper class
  // on the root element to avoid overlap with the fixed portal button.
  React.useEffect(() => {
    const update = () => {
      const el = document.querySelector('.lv3-lang-corner');
      if (el) document.documentElement.classList.add('has-lang-corner');
      else document.documentElement.classList.remove('has-lang-corner');
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

  // Hide on the postulantes / candidate pages themselves
  const isHidden = (location?.pathname || '').startsWith('/postulantes') || (location?.pathname || '').startsWith('/candidate');
  if (isHidden) return null;

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

    // internal route: use SPA navigation
    e && e.preventDefault();
    try { navigate(portalUrl); } catch (err) { window.location.assign(portalUrl); }
  };

  return (
    <a
      href={portalUrl}
      className="btn-portal"
      onClick={handleClick}
      aria-label="Portal de Postulantes"
      {...(isExternalUrl(portalUrl) ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      Dar mi Test
    </a>
  );
}
