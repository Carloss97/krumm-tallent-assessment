import { useEffect, useMemo, useState } from 'react';
import { PITCH_DECK_LANGUAGES, PITCH_DECK_SLIDES } from './pitchDeckContent';
import './PitchDeckPage.css';

function PitchDeckPage() {
  const [language, setLanguage] = useState('es');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = PITCH_DECK_SLIDES[activeSlideIndex];
  const copy = activeSlide[language];
  const progressLabel = useMemo(
    () => `${activeSlideIndex + 1}/${PITCH_DECK_SLIDES.length}`,
    [activeSlideIndex],
  );

  useEffect(() => {
    document.title = language === 'es' ? 'KRUMM | Pitch Deck ES' : 'KRUMM | Pitch Deck EN';
  }, [language]);

  const goToPrevious = () => {
    setActiveSlideIndex((current) => Math.max(0, current - 1));
  };

  const goToNext = () => {
    setActiveSlideIndex((current) => Math.min(PITCH_DECK_SLIDES.length - 1, current + 1));
  };

  return (
    <main className="native-pitch-deck" aria-label="KRUMM Pitch Deck">
      <header className="native-pitch-deck__topbar">
        <div>
          <p className="native-pitch-deck__kicker">KRUMM</p>
          <p className="native-pitch-deck__mode">
            {language === 'es' ? 'Deck nativo editable' : 'Editable native deck'}
          </p>
        </div>

        <div className="native-pitch-deck__controls" aria-label={language === 'es' ? 'Controles del deck' : 'Deck controls'}>
          <div className="native-pitch-deck__language" aria-label="Language selector">
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
          <span className="native-pitch-deck__progress">{progressLabel}</span>
        </div>
      </header>

      <section className={`native-pitch-deck__slide native-pitch-deck__slide--${activeSlide.accent}`}>
        <div className="native-pitch-deck__copy">
          <p className="native-pitch-deck__eyebrow">{copy.eyebrow}</p>
          <h1>{copy.title}</h1>
          <p className="native-pitch-deck__subtitle">{copy.subtitle}</p>
          <ul className="native-pitch-deck__bullets">
            {copy.bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>

        <aside className="native-pitch-deck__visual" aria-label={language === 'es' ? 'Métricas clave' : 'Key metrics'}>
          <div className="native-pitch-deck__orb" />
          <div className="native-pitch-deck__metric-grid">
            {copy.metrics.map((metric) => (
              <div className="native-pitch-deck__metric" key={`${metric.label}-${metric.value}`}>
                <span>{metric.label}</span>
                <strong>{metric.value}</strong>
              </div>
            ))}
          </div>
        </aside>
      </section>

      <footer className="native-pitch-deck__footer">
        <button type="button" onClick={goToPrevious} disabled={activeSlideIndex === 0}>
          {language === 'es' ? 'Anterior' : 'Previous'}
        </button>
        <nav className="native-pitch-deck__dots" aria-label={language === 'es' ? 'Diapositivas' : 'Slides'}>
          {PITCH_DECK_SLIDES.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              className={index === activeSlideIndex ? 'is-active' : ''}
              onClick={() => setActiveSlideIndex(index)}
              aria-label={`${language === 'es' ? 'Ir a diapositiva' : 'Go to slide'} ${index + 1}: ${slide[language].title}`}
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
