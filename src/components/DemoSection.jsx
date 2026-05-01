import React, { lazy, Suspense, useState, useEffect } from 'react';
import { useTelemetry } from '../TelemetryContext';
import { useLanguage } from '../context/LanguageContext';
import './DemoSection.css';

const HeroDemoLazy = lazy(() => import('./HeroDemo'));
// Show the full demo shell inside the hero mockup for a richer preview
const DemoShellLazy = lazy(() => import('./DemoShell'));

export default function DemoSection() {
  const telemetry = useTelemetry();
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();

  const demoCopy = {
    es: {
      loading: 'Cargando demo...',
      cta: 'Vive la experiencia',
      ariaLabel: 'Sección de demostración',
      close: 'Cerrar demo'
    },
    en: {
      loading: 'Loading demo...',
      cta: 'Experience demo',
      ariaLabel: 'Demo section',
      close: 'Close demo'
    }
  };

  const handleCTA = () => {
    if (telemetry?.recordTrialEvent) telemetry.recordTrialEvent({ event: 'demo_open' });
    window.dataLayer?.push({ event: 'demo_open' });
    setIsOpen(true);
  };

  useEffect(() => {
    const onOpen = () => setIsOpen(true);
    document.addEventListener('krumm:open-demo', onOpen);
    return () => document.removeEventListener('krumm:open-demo', onOpen);
  }, []);

  return (
    <section className="demo-section section--brand-dark" aria-label={demoCopy[language]?.ariaLabel || demoCopy.es.ariaLabel}>
      <div id="demo-live-announcer" aria-live="polite" style={{position:'absolute',left:-9999,width:1,height:1,overflow:'hidden'}} />
      <div className="demo-section__inner">
        <div className="demo-mockup" aria-hidden="false">
          <div className="mockup-frame">
            <Suspense fallback={<div className="demo-placeholder">{demoCopy[language]?.loading || demoCopy.es.loading}</div>}>
              <DemoShellLazy />
            </Suspense>
          </div>
        </div>

        <div className="demo-cta">
          <button className="btn-cta" onClick={handleCTA} aria-label={demoCopy[language]?.cta || demoCopy.es.cta}>{demoCopy[language]?.cta || demoCopy.es.cta}</button>
        </div>
      </div>

      {isOpen && (
        <div className="demo-overlay" role="dialog" aria-modal="true">
          <div className="demo-overlay__backdrop" onClick={() => setIsOpen(false)} />
          <div className="demo-overlay__panel">
            <button className="demo-overlay__close" onClick={() => setIsOpen(false)} aria-label={demoCopy[language]?.close || demoCopy.es.close}>✕</button>
            <Suspense fallback={<div className="demo-placeholder">{demoCopy[language]?.loading || demoCopy.es.loading}</div>}>
              <div className="demo-overlay__content">
                <DemoShellLazy />
              </div>
            </Suspense>
          </div>
        </div>
      )}
    </section>
  );
}
