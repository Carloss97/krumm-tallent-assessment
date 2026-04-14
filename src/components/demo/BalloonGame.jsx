import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTelemetry } from '../../TelemetryContext';
import './BalloonGame.css';

const MIN_SIZE = 56;
const TARGET_SIZE = 220;
const MAX_SIZE = 340;

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const BalloonGame = ({ onComplete }) => {
  const [size, setSize] = useState(72);
  const [isInflating, setIsInflating] = useState(false);
  const [pumped, setPumped] = useState(false);
  const [done, setDone] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  const rafRef = useRef(null);
  const lastTs = useRef(null);
  const isInflatingRef = useRef(false);

  const { recordTrialEvent } = useTelemetry();

  // Rates (px per second) - tuned for demo pacing
  const INFLATE_RATE = 18; // when holding (slower for a more engaging demo)
  const LEAK_RATE = 6; // when releasing (gentle leak)
  const PUMP_BOOST = 12; // per tap

  const playTone = useCallback((freq = 440, duration = 0.06) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      setTimeout(() => { o.stop(); ctx.close(); }, (duration + 0.05) * 1000);
    } catch (e) {
      // audio may be blocked — ignore
    }
  }, []);

  const step = useCallback((ts) => {
    if (!lastTs.current) lastTs.current = ts;
    const dt = Math.min(80, ts - lastTs.current);
    lastTs.current = ts;
    const sec = dt / 1000;

    if (isInflatingRef.current) {
      setSize((s) => clamp(s + INFLATE_RATE * sec, MIN_SIZE, MAX_SIZE));
    } else {
      setSize((s) => clamp(s - LEAK_RATE * sec, MIN_SIZE, MAX_SIZE));
    }

    rafRef.current = requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    rafRef.current = requestAnimationFrame(step);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [step]);

  useEffect(() => {
    if (size >= TARGET_SIZE && !done) {
      setDone(true);
      setShowConfetti(true);
      playTone(880, 0.12);
      try {
        recordTrialEvent && recordTrialEvent({ event: 'balloon_complete', payload: { finalSize: size } });
      } catch (e) {}
      // small pop animation then callback
      setTimeout(() => {
        setShowConfetti(false);
        try { onComplete && onComplete(); } catch (e) {}
      }, 1200);
    }
  }, [size, done, onComplete, playTone]);

  const startInflate = () => {
    setIsInflating(true);
    isInflatingRef.current = true;
    try { recordTrialEvent && recordTrialEvent({ event: 'balloon_start', payload: { size } }); } catch (e) {}
  };
  const stopInflate = () => {
    setIsInflating(false);
    isInflatingRef.current = false;
  };

  const pump = () => {
    setPumped(true);
    setSize((s) => clamp(s + PUMP_BOOST, MIN_SIZE, MAX_SIZE));
    playTone(620, 0.06);
    try { recordTrialEvent && recordTrialEvent({ event: 'balloon_pump', payload: { newSize: Math.round(Math.min(MAX_SIZE, size + PUMP_BOOST)) } }); } catch (e) {}
    setTimeout(() => setPumped(false), 160);
  };

  useEffect(() => {
    const onKey = (e) => {
      if (done) return;
      if (e.code === 'Space') {
        if (e.type === 'keydown') startInflate();
        if (e.type === 'keyup') stopInflate();
      }
      if (e.key === 'Enter') pump();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('keyup', onKey);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('keyup', onKey); };
  }, [done]);

  const perc = Math.round(((size - MIN_SIZE) / (TARGET_SIZE - MIN_SIZE)) * 100);

  return (
    <div className="balloon-game" role="application" aria-label="Balloon inflation demo">
      <div className="bg-card">
        <div className="balloon-stage">
          <div className="inflation-ring" style={{ width: TARGET_SIZE + 40, height: TARGET_SIZE + 40 }} aria-hidden />

          <div className={`balloon ${pumped ? 'pulse' : ''} ${done ? 'done' : ''}`} style={{ width: `${Math.round(size)}px`, height: `${Math.round(size)}px` }}>
            <div className="balloon-emoji" aria-hidden>🎈</div>
          </div>

          {showConfetti && (
            <div className="confetti" aria-hidden>
              {Array.from({ length: 22 }).map((_, i) => {
                const left = Math.random() * 100;
                const delay = Math.random() * 0.6;
                const dur = 1.2 + Math.random() * 1.4;
                const colors = ['#ff7a7a', '#ffd166', '#60a5fa', '#34d399', '#c084fc'];
                const bg = colors[i % colors.length];
                return (
                  <span
                    key={i}
                    className="particle"
                    style={{ left: `${left}%`, background: bg, animationDelay: `${delay}s`, animationDuration: `${dur}s` }}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="progress" aria-hidden>
          <i style={{ width: `${clamp(perc, 0, 100)}%` }} />
        </div>

        <div className="controls">
          <button
            type="button"
            className={`btn inflator ${isInflating ? 'active' : ''}`}
            onPointerDown={(e) => { e.preventDefault(); startInflate(); }}
            onPointerUp={(e) => { e.preventDefault(); stopInflate(); }}
            onPointerLeave={(e) => { e.preventDefault(); stopInflate(); }}
            onTouchStart={(e) => { e.preventDefault(); startInflate(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopInflate(); }}
            aria-pressed={isInflating}
          >
            {isInflating ? 'Inflando…' : 'Mantener para inflar'}
          </button>

          <button type="button" className="btn pump" onClick={pump}>Pulsar</button>
        </div>

        <div className="meta" aria-live="polite">
          <div className="target">Objetivo: {Math.round(TARGET_SIZE)} px</div>
          <div className="size">Tamaño actual: {Math.round(size)} px — {clamp(perc, 0, 100)}%</div>
        </div>
      </div>
    </div>
  );
};

export default BalloonGame;
