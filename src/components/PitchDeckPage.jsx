import { useEffect } from 'react';

function PitchDeckPage() {
  useEffect(() => {
    document.title = 'KRUMM | Pitch Deck';
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <iframe
        src="/pitchdeck.html"
        title="KRUMM Pitch Deck"
        style={{ border: 0, width: '100%', height: '100%' }}
      />
    </div>
  );
}

export default PitchDeckPage;