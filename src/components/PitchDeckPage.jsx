import { useEffect, useMemo, useState } from 'react';
import { PITCH_DECK_LANGUAGES, PITCH_DECK_SLIDES } from './pitchDeckContent';
import './PitchDeckPage.css';

const SVG_WIDTH = 960;
const SVG_HEIGHT = 540;

function PitchDeckPage() {
  const [language, setLanguage] = useState('en');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = PITCH_DECK_SLIDES[activeSlideIndex];
  const progressLabel = useMemo(
    () => `${activeSlideIndex + 1}/${PITCH_DECK_SLIDES.length}`,
    [activeSlideIndex],
  );

  useEffect(() => {
    document.title = language === 'es' ? 'KRUMM | Pitch Deck ES' : 'KRUMM | Pitch Deck EN';
  }, [language]);

  const goToPrevious = () => setActiveSlideIndex((current) => Math.max(0, current - 1));
  const goToNext = () => setActiveSlideIndex((current) => Math.min(PITCH_DECK_SLIDES.length - 1, current + 1));

  return (
    <main className="pitch-deck-page" aria-label="KRUMM Pitch Deck">
      <header className="pitch-deck-page__toolbar">
        <div>
          <p className="pitch-deck-page__brand">KRUMM</p>
          <p className="pitch-deck-page__caption">
            {language === 'es'
              ? 'Deck nativo React, recreado desde el HTML original'
              : 'Native React deck, rebuilt from the original HTML'}
          </p>
        </div>

        <div className="pitch-deck-page__actions" aria-label="Pitch deck controls">
          <div className="pitch-deck-page__language" aria-label="Language selector">
            {Object.entries(PITCH_DECK_LANGUAGES).map(([code, label]) => (
              <button
                key={code}
                type="button"
                className={language === code ? 'is-active' : ''}
                onClick={() => setLanguage(code)}
                aria-pressed={language === code}
              >
                {label}
              </button>
            ))}
          </div>
          <span className="pitch-deck-page__progress" aria-label="Slide progress">{progressLabel}</span>
        </div>
      </header>

      <section className="pitch-deck-page__stage" aria-label={activeSlide.label}>
        <svg
          className="pitch-deck-page__slide"
          data-testid="native-pitch-deck-slide"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-labelledby={`pitch-slide-title-${activeSlide.id}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={`pitch-slide-title-${activeSlide.id}`}>{activeSlide.elements[0]?.text?.[language] || activeSlide.label}</title>
          <image
            href={activeSlide.background}
            x="0"
            y="0"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
          {activeSlide.elements.map((element, index) => {
            const renderedText = element.text[language] || element.text.en;
            const fitTranslatedText = language !== 'en' && element.width;

            return (
              <text
                key={`${activeSlide.id}-${index}-${element.text.en}`}
                x={element.x}
                y={element.y}
                fill={element.color}
                fontSize={element.fontSize}
                fontWeight={element.fontWeight}
                fontFamily={`${element.fontFamily || 'Inter'}, Inter, Urbanist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`}
                dominantBaseline="alphabetic"
                textLength={fitTranslatedText ? element.width : undefined}
                lengthAdjust={fitTranslatedText ? 'spacingAndGlyphs' : undefined}
              >
                {renderedText}
              </text>
            );
          })}
        </svg>
      </section>

      <footer className="pitch-deck-page__footer">
        <button type="button" onClick={goToPrevious} disabled={activeSlideIndex === 0}>
          {language === 'es' ? 'Anterior' : 'Previous'}
        </button>
        <nav className="pitch-deck-page__dots" aria-label={language === 'es' ? 'Diapositivas' : 'Slides'}>
          {PITCH_DECK_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeSlideIndex ? 'is-active' : ''}
              onClick={() => setActiveSlideIndex(index)}
              aria-label={`${language === 'es' ? 'Ir a diapositiva' : 'Go to slide'} ${index + 1}: ${slide.elements[0]?.text?.[language] || slide.label}`}
              aria-current={index === activeSlideIndex ? 'step' : undefined}
            />
          ))}
        </nav>
        <button type="button" onClick={goToNext} disabled={activeSlideIndex === PITCH_DECK_SLIDES.length - 1}>
          {language === 'es' ? 'Siguiente' : 'Next'}
        </button>
      </footer>
    </main>
  );
}

export default PitchDeckPage;
