import { useEffect, useState } from 'react';
import pitchDeckUrl from '../assets/pitchdeck.html?url';

const loadingDeckHtml = `<!doctype html>
<html lang="en">
  <head><title>KRUMM Pitch Deck</title></head>
  <body style="font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; color: #0f172a; background: #f8fafc;">
    <p>Loading pitch deck…</p>
  </body>
</html>`;

const failedDeckHtml = `<!doctype html>
<html lang="en">
  <head><title>KRUMM Pitch Deck unavailable</title></head>
  <body style="font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; color: #991b1b; background: #fff7ed;">
    <p>Pitch deck could not be loaded.</p>
  </body>
</html>`;

function PitchDeckPage() {
  const [deckHtml, setDeckHtml] = useState(loadingDeckHtml);

  useEffect(() => {
    let cancelled = false;
    document.title = 'KRUMM | Pitch Deck';

    fetch(pitchDeckUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Pitch deck request failed: ${response.status}`);
        }
        return response.text();
      })
      .then((html) => {
        if (!cancelled) {
          setDeckHtml(html);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeckHtml(failedDeckHtml);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        srcDoc={deckHtml}
        title="KRUMM Pitch Deck"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default PitchDeckPage;
