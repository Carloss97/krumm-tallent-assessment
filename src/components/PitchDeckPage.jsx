import { useEffect, useState } from 'react';
import page01 from '../assets/pitchdeck/highres/page-01.webp';
import page02 from '../assets/pitchdeck/highres/page-02.webp';
import page03 from '../assets/pitchdeck/highres/page-03.webp';
import page04 from '../assets/pitchdeck/highres/page-04.webp';
import page05 from '../assets/pitchdeck/highres/page-05.webp';
import page06 from '../assets/pitchdeck/highres/page-06.webp';
import page07 from '../assets/pitchdeck/highres/page-07.webp';
import page08 from '../assets/pitchdeck/highres/page-08.webp';
import page09 from '../assets/pitchdeck/highres/page-09.webp';
import page10 from '../assets/pitchdeck/highres/page-10.webp';
import './PitchDeckPage.css';

const SLIDES = Object.freeze([
  { image: page01, label: 'The Behavioral Truth' },
  { image: page02, label: 'Hiring is Broken' },
  { image: page03, label: 'Delivering the Truth' },
  { image: page04, label: 'Edge AI Advantage' },
  { image: page05, label: 'The Defensive Moat' },
  { image: page06, label: 'The Core Founders' },
  { image: page07, label: 'Target Market' },
  { image: page08, label: 'Value Capture Strategy' },
  { image: page09, label: 'Why KRUMM Dominates' },
  { image: page10, label: 'Our Next Milestones' },
]);

function PitchDeckPage() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = SLIDES[activeSlideIndex];
  const progressLabel = `${activeSlideIndex + 1}/${SLIDES.length}`;

  useEffect(() => {
    document.title = 'KRUMM | Pitch Deck';
  }, []);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        setActiveSlideIndex((current) => Math.max(0, current - 1));
      }
      if (event.key === 'ArrowRight') {
        setActiveSlideIndex((current) => Math.min(SLIDES.length - 1, current + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const goToPrevious = () => setActiveSlideIndex((current) => Math.max(0, current - 1));
  const goToNext = () => setActiveSlideIndex((current) => Math.min(SLIDES.length - 1, current + 1));

  return (
    <main className="pitch-deck-page" aria-label="KRUMM Pitch Deck">
      <header className="pitch-deck-page__toolbar">
        <div>
          <p className="pitch-deck-page__brand">KRUMM</p>
          <p className="pitch-deck-page__caption">High-resolution PDF render</p>
        </div>
        <span className="pitch-deck-page__progress" aria-label="Slide progress">{progressLabel}</span>
      </header>

      <section className="pitch-deck-page__stage" aria-label={activeSlide.label}>
        <img
          key={activeSlide.image}
          className="pitch-deck-page__deck-image"
          src={activeSlide.image}
          width="3840"
          height="2160"
          alt={`KRUMM pitch deck slide ${activeSlideIndex + 1}: ${activeSlide.label}`}
          decoding="async"
          loading={activeSlideIndex === 0 ? 'eager' : 'lazy'}
        />
      </section>

      <footer className="pitch-deck-page__footer">
        <button type="button" onClick={goToPrevious} disabled={activeSlideIndex === 0}>
          Previous
        </button>
        <nav className="pitch-deck-page__dots" aria-label="Slides">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.label}
              type="button"
              className={index === activeSlideIndex ? 'is-active' : ''}
              onClick={() => setActiveSlideIndex(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.label}`}
              aria-current={index === activeSlideIndex ? 'step' : undefined}
            />
          ))}
        </nav>
        <button type="button" onClick={goToNext} disabled={activeSlideIndex === SLIDES.length - 1}>
          Next
        </button>
      </footer>
    </main>
  );
}

export default PitchDeckPage;
