import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './DemoSection.css';

const HeroDemoLazy = lazy(() => import('./HeroDemo'));

export default function DemoSection() {
  const telemetry = useTelemetry();
  const navigate = useNavigate();

  const handleCTA = () => {
    try { telemetry && telemetry.recordTrialEvent && telemetry.recordTrialEvent({ event: 'demo_open' }); } catch (e) {}
    try { window.dataLayer?.push({ event: 'demo_open' }); } catch (e) {}
    navigate('/demo');
  };

  return (
    <section className="demo-section section--brand-dark" aria-label="Demo Section">
      <div className="demo-section__inner">
        <div className="demo-mockup" aria-hidden="false">
          <Suspense fallback={<div className="demo-placeholder">Cargando demo...</div>}>
            <HeroDemoLazy />
          </Suspense>
        </div>

        <div className="demo-cta">
          <button className="btn-cta" onClick={handleCTA} aria-label="Vive la Experiencia">Vive la Experiencia</button>
        </div>
      </div>
    </section>
  );
}
