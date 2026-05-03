import React, { useEffect, useState, useRef, useCallback } from 'react';

const N_BACK = 1; // 1-back for simplest demo
const LENGTH = 10;
const STIMULUS_MS = 700;
const RESPONSE_MS = 900;

const generateSequence = () => {
  const letters = 'ABCDEFGH'.split('');
  const seq = [];
  for (let i = 0; i < LENGTH; i++) {
    if (i >= N_BACK && Math.random() < 0.28) {
      seq.push(seq[i - N_BACK]);
    } else {
      let s;
      do { s = letters[Math.floor(Math.random() * letters.length)]; } while (i >= N_BACK && s === seq[i - N_BACK]);
      seq.push(s);
    }
  }
  return seq;
};

const DemoNBack = ({ onComplete }) => {
  // Lazy initializer runs once — no impure calls during re-renders
  const [sequence] = useState(generateSequence);

  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  const [correct, setCorrect] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (!sequence.length) return undefined;
    if (index >= sequence.length) {
      setTimeout(() => onComplete && onComplete(correct >= 2), 250);
      return undefined;
    }

    // Schedule state changes via setTimeout to avoid synchronous setState in effect body
    timeoutRef.current = setTimeout(() => {
      setShowing(true);
      timeoutRef.current = setTimeout(() => {
        setShowing(false);
        timeoutRef.current = setTimeout(() => setIndex((i) => i + 1), RESPONSE_MS / 2);
      }, STIMULUS_MS);
    }, 0);

    return () => clearTimeout(timeoutRef.current);
  }, [index, sequence, onComplete, correct]);

  const handleMatch = useCallback(() => {
    if (!sequence.length) return;
    const i = index;
    const isMatch = i >= N_BACK && sequence[i] === sequence[i - N_BACK];
    if (isMatch) setCorrect((c) => c + 1);
    // move to next immediately
    clearTimeout(timeoutRef.current);
    setIndex((idx) => Math.min(sequence.length, idx + 1));
  }, [index, sequence]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'm' || e.code === 'Space') {
        e.preventDefault();
        handleMatch();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [handleMatch]);

  const current = sequence[index] || '-';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800 }}>1-Back (memoria de trabajo) — pulsa &apos;Match&apos; si coincide con la anterior</div>
      <div style={{ width: 320, height: 160, borderRadius: 10, background: '#fff7ed', display: 'grid', placeItems: 'center', fontSize: 56, boxShadow: '0 8px 20px rgba(2,6,23,0.06)' }}>
        <div style={{ color: showing ? '#111827' : '#9ca3af', fontWeight: 900 }}>{showing ? current : ' '}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
        <button className="btn" onClick={handleMatch}>Match (o SPACE)</button>
      </div>
      <div style={{ fontSize: 13, color: '#475569' }}>Progreso: {Math.min(index, sequence.length)} / {sequence.length} — Aciertos: {correct}</div>
    </div>
  );
};

export default DemoNBack;
