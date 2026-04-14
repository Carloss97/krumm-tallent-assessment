import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTelemetry } from '../TelemetryContext';
import './DemoSection.css';

const HeroDemoLazy = lazy(() => import('./HeroDemo'));
// Show the full demo shell inside the hero mockup for a richer preview
const DemoShellLazy = lazy(() => import('./DemoShell'));

export default function DemoSection() {
  const telemetry = useTelemetry();
  const navigate = useNavigate();

  const handleCTA = () => {
    if (telemetry?.recordTrialEvent) telemetry.recordTrialEvent({ event: 'demo_open' });
    window.dataLayer?.push({ event: 'demo_open' });
    navigate('/demo');
  };

  return (
    <section className="demo-section section--brand-dark" aria-label="Demo Section">
      <div className="demo-section__inner">
        <div className="demo-mockup" aria-hidden="false">
          <div className="mockup-frame">
            <Suspense fallback={<div className="demo-placeholder">Cargando demo...</div>}>
              <DemoShellLazy />
            </Suspense>
          </div>
        </div>

        <div className="demo-cta">
          <button className="btn-cta" onClick={handleCTA} aria-label="Vive la Experiencia">Vive la Experiencia</button>
        </div>
      </div>
    </section>
  );
}
