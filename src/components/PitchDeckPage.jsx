import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

// Slide animation variants — slide in from direction of navigation
const slideVariants = {
  enter: (direction) => ({
    x: direction > 0 ? '60%' : '-60%',
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction) => ({
    x: direction > 0 ? '-60%' : '60%',
    opacity: 0,
    scale: 0.96,
  }),
};

function PitchDeckPage() {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [direction, setDirection] = useState(0); // 1 = forward, -1 = backward
  const activeSlide = SLIDES[activeSlideIndex];
  const progressLabel = `${activeSlideIndex + 1}/${SLIDES.length}`;

  useEffect(() => {
    document.title = 'KRUMM | Pitch Deck';
  }, []);

  const goTo = useCallback((index) => {
    setDirection(index > activeSlideIndex ? 1 : -1);
    setActiveSlideIndex(index);
  }, [activeSlideIndex]);

  const goToPrevious = useCallback(() => {
    if (activeSlideIndex > 0) goTo(activeSlideIndex - 1);
  }, [activeSlideIndex, goTo]);

  const goToNext = useCallback(() => {
    if (activeSlideIndex < SLIDES.length - 1) goTo(activeSlideIndex + 1);
  }, [activeSlideIndex, goTo]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') goToPrevious();
      if (event.key === 'ArrowRight') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Touch swipe support
  const [touchStart, setTouchStart] = useState(null);

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    const threshold = 50;
    if (Math.abs(diff) > threshold) {
      if (diff > 0) goToNext();
      else goToPrevious();
    }
    setTouchStart(null);
  };

  return (
    <main
      className="pitch-deck-page"
      aria-label="KRUMM Pitch Deck"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header toolbar */}
      <header className="pitch-deck-page__toolbar">
        <div>
          <p className="pitch-deck-page__brand">KRUMM</p>
        </div>
        <span className="pitch-deck-page__progress" aria-label="Slide progress">{progressLabel}</span>
      </header>

      {/* Animated slide stage */}
      <section className="pitch-deck-page__stage" aria-label={activeSlide.label}>
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.img
            key={activeSlideIndex}
            className="pitch-deck-page__deck-image"
            src={activeSlide.image}
            width="3840"
            height="2160"
            alt={`KRUMM pitch deck slide ${activeSlideIndex + 1}: ${activeSlide.label}`}
            decoding="async"
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
          />
        </AnimatePresence>
      </section>

      {/* Slide label overlay */}
      <motion.div
        className="pitch-deck-page__label"
        key={`label-${activeSlideIndex}`}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        {activeSlide.label}
      </motion.div>

      {/* Footer controls */}
      <footer className="pitch-deck-page__footer">
        <button type="button" onClick={goToPrevious} disabled={activeSlideIndex === 0}>
          ← Prev
        </button>
        <nav className="pitch-deck-page__dots" aria-label="Slides">
          {SLIDES.map((slide, index) => (
            <button
              key={slide.label}
              type="button"
              className={index === activeSlideIndex ? 'is-active' : ''}
              onClick={() => goTo(index)}
              aria-label={`Go to slide ${index + 1}: ${slide.label}`}
              aria-current={index === activeSlideIndex ? 'step' : undefined}
            />
          ))}
        </nav>
        <button type="button" onClick={goToNext} disabled={activeSlideIndex === SLIDES.length - 1}>
          Next →
        </button>
      </footer>
    </main>
  );
}

export default PitchDeckPage;