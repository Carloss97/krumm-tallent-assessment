import { useEffect, useMemo, useState } from 'react';
import deckHtml from '../assets/pitchdeck.html?raw';
import './PitchDeckPage.css';

const PAGE_IDS = Object.freeze(['pf1', 'pf2', 'pf3', 'pf4', 'pf5', 'pf6', 'pf7', 'pf8', 'pf9', 'pfa']);

const SLIDE_LABELS = Object.freeze([
  'The Behavioral Truth',
  'Hiring is Broken',
  'Delivering the Truth',
  'Edge AI Advantage',
  'The Defensive Moat',
  'The Core Founders',
  'Target Market',
  'Value Capture Strategy',
  'Why KRUMM Dominates',
  'Our Next Milestones',
]);

const buildDeckSrcDoc = (activePageId) => {
  const runtimePatch = `
<style id="krumm-pitch-runtime-fix">
  html,
  body {
    width: 100%;
    height: 100%;
    margin: 0 !important;
    overflow: hidden !important;
    background: #111318 !important;
  }

  #sidebar,
  .loading-indicator {
    display: none !important;
  }

  #page-container {
    position: fixed !important;
    inset: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    margin: 0 !important;
    padding: 0 !important;
    overflow: hidden !important;
    background: #111318 !important;
    display: grid !important;
    place-items: center !important;
  }

  .pf {
    display: none !important;
    margin: 0 !important;
    border: 0 !important;
    box-shadow: none !important;
    transform: scale(var(--krumm-deck-scale, 1)) !important;
    transform-origin: center center !important;
  }

  #${activePageId}{display:block!important;}
</style>
<script>
  (function () {
    function fitKrummDeck() {
      var width = window.innerWidth || 960;
      var height = window.innerHeight || 540;
      var scale = Math.min(width / 960, height / 540);
      document.documentElement.style.setProperty('--krumm-deck-scale', String(scale));
    }
    window.addEventListener('resize', fitKrummDeck);
    window.addEventListener('orientationchange', fitKrummDeck);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', fitKrummDeck);
    } else {
      fitKrummDeck();
    }
  }());
</script>`;

  return deckHtml.replace('</head>', `${runtimePatch}</head>`);
};

function PitchDeckPage() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activePageId = PAGE_IDS[activeSlideIndex] || PAGE_IDS[0];
  const progressLabel = `${activeSlideIndex + 1}/${PAGE_IDS.length}`;
  const activeSlideLabel = SLIDE_LABELS[activeSlideIndex] || `Slide ${activeSlideIndex + 1}`;
  const srcDoc = useMemo(() => buildDeckSrcDoc(activePageId), [activePageId]);

  useEffect(() => {
    document.title = 'KRUMM | Pitch Deck';
  }, []);

  const goToPrevious = () => setActiveSlideIndex((current) => Math.max(0, current - 1));
  const goToNext = () => setActiveSlideIndex((current) => Math.min(PAGE_IDS.length - 1, current + 1));

  return (
    <main className="pitch-deck-page" aria-label="KRUMM Pitch Deck">
      <header className="pitch-deck-page__toolbar">
        <div>
          <p className="pitch-deck-page__brand">KRUMM</p>
          <p className="pitch-deck-page__caption">Original HTML deck for visual fidelity</p>
        </div>
        <span className="pitch-deck-page__progress" aria-label="Slide progress">{progressLabel}</span>
      </header>

      <section className="pitch-deck-page__stage" aria-label={activeSlideLabel}>
        <iframe
          key={activePageId}
          className="pitch-deck-page__deck-frame"
          title="KRUMM Pitch Deck"
          srcDoc={srcDoc}
          sandbox="allow-scripts"
        />
      </section>

      <footer className="pitch-deck-page__footer">
        <button type="button" onClick={goToPrevious} disabled={activeSlideIndex === 0}>
          Previous
        </button>
        <nav className="pitch-deck-page__dots" aria-label="Slides">
          {PAGE_IDS.map((pageId, index) => (
            <button
              key={pageId}
              type="button"
              className={index === activeSlideIndex ? 'is-active' : ''}
              onClick={() => setActiveSlideIndex(index)}
              aria-label={`Go to slide ${index + 1}: ${SLIDE_LABELS[index] || pageId}`}
              aria-current={index === activeSlideIndex ? 'step' : undefined}
            />
          ))}
        </nav>
        <button type="button" onClick={goToNext} disabled={activeSlideIndex === PAGE_IDS.length - 1}>
          Next
        </button>
      </footer>
    </main>
  );
}

export default PitchDeckPage;
