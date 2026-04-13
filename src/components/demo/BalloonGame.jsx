import React, { useState, useRef, useEffect } from 'react';

const TARGET_SIZE = 220;

const BalloonGame = ({ onComplete }) => {
  const [size, setSize] = useState(60);
  const inflatingRef = useRef(false);
  const rafRef = useRef(null);

  const step = () => {
    setSize((s) => Math.min(300, s + 2));
    rafRef.current = requestAnimationFrame(step);
  };

  const start = () => {
    inflatingRef.current = true;
    rafRef.current = requestAnimationFrame(step);
  };

  const stop = () => {
    inflatingRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  };

  useEffect(() => {
    if (size >= TARGET_SIZE) {
      stop();
      setTimeout(() => onComplete && onComplete(), 600);
    }
    return () => stop();
  }, [size]);

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ height: 260, display: 'grid', placeItems: 'center' }}>
        <div style={{ width: size, height: size, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, #ff9b9b, #ff5e5e)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' }}>
          <div style={{ color: 'white', fontWeight: 800 }}>🎈</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn" onMouseDown={start} onMouseUp={stop} onMouseLeave={stop} onTouchStart={start} onTouchEnd={stop}>
          Mantener para inflar
        </button>
        <button className="btn" onClick={() => setSize((s) => s + 12)}>Pulsar</button>
      </div>

      <div style={{ textAlign: 'center', color: '#334155' }}>Objetivo: inflar hasta ~{TARGET_SIZE}px. Tamaño actual: {Math.round(size)}px</div>
    </div>
  );
};

export default BalloonGame;
