import React, { useState, useEffect, useRef, useCallback } from 'react';

const DemoGoNoGo = ({ onComplete }) => {
  const TRIALS = 20;
  const GO_PROB = 0.78;
  const [trial, setTrial] = useState(0);
  const [stimulus, setStimulus] = useState(null);
  const [awaiting, setAwaiting] = useState(false);
  const [correctGo, setCorrectGo] = useState(0);
  const [commission, setCommission] = useState(0);
  const timeoutRef = useRef(null);

  const startNext = useCallback(() => {
    if (trial >= TRIALS) return;
    const isGo = Math.random() < GO_PROB;
    setStimulus(isGo ? 'GO' : 'NO-GO');
    setAwaiting(true);

    // auto-advance after response window
    timeoutRef.current = setTimeout(() => {
      // timeout: if GO trial, count omission (not penalized for this very basic demo)
      setAwaiting(false);
      setTrial((t) => t + 1);
    }, 950);
  }, [trial]);

  useEffect(() => {
    // start
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startNext();
    return () => clearTimeout(timeoutRef.current);
  }, [startNext]);

  useEffect(() => {
    if (trial >= TRIALS) {
      // end demo
      const passed = correctGo >= Math.ceil(TRIALS * 0.4); // simple pass threshold
      setTimeout(() => onComplete && onComplete(passed), 300);
    } else if (trial > 0) {
      // small inter-trial pause
      const t = setTimeout(() => startNext(), 260);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [trial, correctGo, onComplete, startNext]);

  const handleRespond = useCallback(() => {
    if (!awaiting) return;
    const isGo = stimulus === 'GO';
    if (isGo) {
      setCorrectGo((c) => c + 1);
    } else {
      setCommission((c) => c + 1);
    }
    setAwaiting(false);
    // advance immediately
    clearTimeout(timeoutRef.current);
    setTrial((t) => t + 1);
  }, [awaiting, stimulus]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        handleRespond();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [awaiting, stimulus, handleRespond]);

  return (
    <div style={{ display: 'grid', gap: 12, alignItems: 'center' }}>
      <div style={{ fontWeight: 800 }}>Go / No-Go (demo)</div>
      <div style={{ width: 360, height: 220, borderRadius: 10, background: '#eef2ff', display: 'grid', placeItems: 'center', fontSize: 42, boxShadow: '0 8px 30px rgba(2,6,23,0.06)' }}>
        <div style={{ color: stimulus === 'GO' ? '#059669' : '#ef4444', fontWeight: 900 }}>{stimulus || '...'}</div>
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
        <button className="btn" onClick={handleRespond}>
          Pulsar (o SPACE)
        </button>
      </div>
      <div style={{ fontSize: 14, color: '#475569' }}>Trial {Math.min(trial + 1, TRIALS)} / {TRIALS} — Correct Go: {correctGo} — False presses: {commission}</div>
    </div>
  );
};

export default DemoGoNoGo;
