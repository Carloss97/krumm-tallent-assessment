import React, { useEffect, useState, useRef, useCallback } from 'react';

const DemoNBack = ({ onComplete }) => {
  const N = 1; // 1-back for simplest demo
  const LENGTH = 10;
  const STIMULUS_MS = 700;
  const RESPONSE_MS = 900;

  const [sequence, setSequence] = useState([]);
  const [index, setIndex] = useState(0);
  const [showing, setShowing] = useState(false);
  const [correct, setCorrect] = useState(0);
  const timeoutRef = useRef(null);

  useEffect(() => {
    // generate sequence with some repeats
    const letters = 'ABCDEFGH'.split('');
    const seq = [];
    for (let i = 0; i < LENGTH; i++) {
      if (i >= N && Math.random() < 0.28) {
        seq.push(seq[i - N]);
      } else {
        let s;
        do { s = letters[Math.floor(Math.random() * letters.length)]; } while (i >= N && s === seq[i - N]);
        seq.push(s);
      }
    }
    setSequence(seq);
    setIndex(0);
  }, []);

  useEffect(() => {
    if (!sequence.length) return undefined;
    if (index >= sequence.length) {
      setTimeout(() => onComplete && onComplete(correct >= 2), 250);
      return undefined;
    }

    // show stimulus then allow brief response window
    setShowing(true);
    timeoutRef.current = setTimeout(() => {
      setShowing(false);
      timeoutRef.current = setTimeout(() => setIndex((i) => i + 1), RESPONSE_MS / 2);
    }, STIMULUS_MS);

    return () => clearTimeout(timeoutRef.current);
  }, [index, sequence, onComplete, correct]);

  const handleMatch = useCallback(() => {
    if (!sequence.length) return;
    const i = index;
    const isMatch = i >= N && sequence[i] === sequence[i - N];
    if (isMatch) setCorrect((c) => c + 1);
    // move to next immediately
    clearTimeout(timeoutRef.current);
    setIndex((i) => Math.min(sequence.length, i + 1));
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
  }, [sequence, index, handleMatch]);

  const current = sequence[index] || '-';

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div style={{ fontWeight: 800 }}>1-Back (memoria de trabajo) — pulsa 'Match' si coincide con la anterior</div>
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
