import { useEffect, useMemo, useState } from 'react';
import { PITCH_DECK_LANGUAGES, PITCH_DECK_SLIDES } from './pitchDeckContent';
import './PitchDeckPage.css';

const SVG_WIDTH = 960;
const SVG_HEIGHT = 540;

const localize = (value, language) => {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value[language] || value.en || '';
};

function LocalizedText({ value, language }) {
  return localize(value, language);
}

function BlockItems({ items = [], language }) {
  if (!items.length) return null;

  return (
    <ul className="pitch-deck-list">
      {items.map((item) => (
        <li key={`${localize(item.title, 'en')}-${localize(item.body, 'en')}`}>
          <strong>{localize(item.title, language)}:</strong>{' '}
          <span>{localize(item.body, language)}</span>
        </li>
      ))}
    </ul>
  );
}

function PitchTable({ block, language }) {
  return (
    <table className="pitch-deck-table">
      <thead>
        <tr>
          {block.columns.map((column) => (
            <th key={localize(column, 'en')}>{localize(column, language)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {block.rows.map((row) => (
          <tr key={row.map((cell) => localize(cell, 'en')).join('|')}>
            {row.map((cell) => (
              <td key={localize(cell, 'en')}>{localize(cell, language)}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function PitchBlock({ block, language }) {
  const blockLabel = localize(block.title || block.content || block.body, language);

  return (
    <foreignObject
      x={block.x}
      y={block.y}
      width={block.width}
      height={block.height}
      aria-label={blockLabel || undefined}
    >
      <div
        xmlns="http://www.w3.org/1999/xhtml"
        className={`pitch-deck-block pitch-deck-block--${block.variant}`}
        lang={language}
      >
        {block.variant === 'table' ? (
          <PitchTable block={block} language={language} />
        ) : (
          <>
            {block.eyebrow && <p className="pitch-deck-block__eyebrow"><LocalizedText value={block.eyebrow} language={language} /></p>}
            {block.title && <h2><LocalizedText value={block.title} language={language} /></h2>}
            {block.content && <p className="pitch-deck-block__content"><LocalizedText value={block.content} language={language} /></p>}
            {block.body && <p className="pitch-deck-block__body"><LocalizedText value={block.body} language={language} /></p>}
            <BlockItems items={block.items} language={language} />
          </>
        )}
      </div>
    </foreignObject>
  );
}

function PitchDeckPage() {
  const [language, setLanguage] = useState('en');
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const activeSlide = PITCH_DECK_SLIDES[activeSlideIndex];
  const activeSlideTitle = localize(activeSlide.label, language);
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
              ? 'Deck nativo React con traducciones revisadas'
              : 'Native React deck with reviewed translations'}
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

      <section className="pitch-deck-page__stage" aria-label={activeSlideTitle}>
        <svg
          className="pitch-deck-page__slide"
          data-testid="native-pitch-deck-slide"
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          role="img"
          aria-labelledby={`pitch-slide-title-${activeSlide.id}`}
          preserveAspectRatio="xMidYMid meet"
        >
          <title id={`pitch-slide-title-${activeSlide.id}`}>{activeSlideTitle}</title>
          <image
            href={activeSlide.background}
            x="0"
            y="0"
            width={SVG_WIDTH}
            height={SVG_HEIGHT}
            preserveAspectRatio="xMidYMid slice"
          />
          {activeSlide.blocks.map((block) => (
            <PitchBlock key={`${activeSlide.id}-${block.variant}-${block.x}-${block.y}`} block={block} language={language} />
          ))}
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
              aria-label={`${language === 'es' ? 'Ir a diapositiva' : 'Go to slide'} ${index + 1}: ${localize(slide.label, language)}`}
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
