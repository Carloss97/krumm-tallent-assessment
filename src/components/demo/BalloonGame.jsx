import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTelemetry } from '../../TelemetryContext';
import './BalloonGame.css';

const MIN_SIZE = 56;
const PUMP_SIZE_BOOST = 14; // px per pump
const MAX_SIZE = 340;

const MIN_PUMPS_THRESHOLD = 6; // user-requested minimum to create false sense of security
const MAX_PUMPS_THRESHOLD = 18;
const DEFAULT_TRIALS = 3;
const REWARD_PER_PUMP = 1;
const MAX_PUMPS = 30;
const TRIAL_TIMEOUT_MS = 45_000;

const playToneInternal = (freq = 440, duration = 0.06) => {
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
    // ignore audio errors
  }
};

const randInt = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

const BalloonGame = ({ onComplete, trials = DEFAULT_TRIALS }) => {
  const [trialIndex, setTrialIndex] = useState(0);
  const [threshold, setThreshold] = useState(randInt(MIN_PUMPS_THRESHOLD, MAX_PUMPS_THRESHOLD));
  const [pumps, setPumps] = useState(0);
  const [totalBanked, setTotalBanked] = useState(0);
  const [exploded, setExploded] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [justPumped, setJustPumped] = useState(false);

  const [results, setResults] = useState([]);

  const { recordTrialEvent } = useTelemetry();

  const trialStartRef = useRef(null);
  const timeoutRef = useRef(null);

  const size = Math.min(MAX_SIZE, MIN_SIZE + pumps * PUMP_SIZE_BOOST);

  const cleanupTimeout = () => {
    if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
  };

  const startTrial = useCallback((index) => {
    cleanupTimeout();
    const newThreshold = randInt(MIN_PUMPS_THRESHOLD, MAX_PUMPS_THRESHOLD);
    setThreshold(newThreshold);
    setPumps(0);
    setExploded(false);
    setShowConfetti(false);
    setDisabled(false);
    setJustPumped(false);
    trialStartRef.current = Date.now();
    try { recordTrialEvent && recordTrialEvent({ event: 'balloon_trial_start', payload: { trialIndex: index, threshold: newThreshold, trials } }); } catch (e) {}

    // auto-end trial after timeout (bank current pumps if any, otherwise advance)
    timeoutRef.current = setTimeout(() => {
      // forced bank or advance
      handleBank(true);
    }, TRIAL_TIMEOUT_MS);
  }, [recordTrialEvent, trials]);

  useEffect(() => {
    // start first trial on mount
    startTrial(0);
    return () => { cleanupTimeout(); };
  }, [startTrial]);

  // push final summary when we have results equal to trials
  useEffect(() => {
    if (results.length !== trials) return;
    const explosionCount = results.filter(r => r.exploded).length;
    const bankedTrials = results.filter(r => !r.exploded && r.bankedPoints > 0);
    const meanPumpsAtBank = bankedTrials.length ? Math.round(bankedTrials.reduce((s, r) => s + r.pumps, 0) / bankedTrials.length) : 0;
    try {
      recordTrialEvent && recordTrialEvent({
        event: 'balloon_session_summary',
        payload: { totalBanked, trials, results, explosionCount, meanPumpsAtBank }
      });
    } catch (e) {}

    // small delay for UX then signal completion
    setTimeout(() => { try { onComplete && onComplete(); } catch (e) {} }, 300);
  }, [results, trials, totalBanked, recordTrialEvent, onComplete]);

  const goToNextTrial = useCallback(() => {
    cleanupTimeout();
    const next = trialIndex + 1;
    if (next >= trials) {
      // finished: results effect will handle finalization
      setTrialIndex(next);
      return;
    }
    setTrialIndex(next);
    // small gap between trials for animation
    setTimeout(() => startTrial(next), 400);
  }, [trialIndex, trials, startTrial]);

  const handleExplosion = (pumpCount) => {
    setExploded(true);
    setDisabled(true);
    cleanupTimeout();
    playToneInternal(120, 0.22);
    try { recordTrialEvent && recordTrialEvent({ event: 'balloon_explode', payload: { trialIndex, pumpNumber: pumpCount, lostPoints: pumpCount * REWARD_PER_PUMP, tSinceStartMs: Date.now() - trialStartRef.current } }); } catch (e) {}

    // record trial result
    setResults((r) => [...r, { trialIndex, pumps: pumpCount, exploded: true, bankedPoints: 0, durationMs: Date.now() - trialStartRef.current }]);

    // brief explosion animation then next trial
    setTimeout(() => goToNextTrial(), 900);
  };

  const handleBank = (forced = false) => {
    if (disabled) return;
    cleanupTimeout();
    setDisabled(true);
    const bankedPoints = pumps * REWARD_PER_PUMP;
    setTotalBanked((t) => t + bankedPoints);
    setShowConfetti(true);
    playToneInternal(880, 0.12);
    try { recordTrialEvent && recordTrialEvent({ event: 'balloon_bank', payload: { trialIndex, pumpNumber: pumps, bankedPoints, forced, tSinceStartMs: Date.now() - trialStartRef.current } }); } catch (e) {}

    setResults((r) => [...r, { trialIndex, pumps, exploded: false, bankedPoints, durationMs: Date.now() - trialStartRef.current }]);

    setTimeout(() => {
      setShowConfetti(false);
      goToNextTrial();
    }, 900);
  };

  const pump = () => {
    if (disabled || exploded) return;
    const next = Math.min(MAX_PUMPS, pumps + 1);
    setPumps(next);
    setJustPumped(true);
    setTimeout(() => setJustPumped(false), 160);
    try { recordTrialEvent && recordTrialEvent({ event: 'balloon_pump', payload: { trialIndex, pumpNumber: next, tSinceStartMs: Date.now() - (trialStartRef.current || Date.now()) } }); } catch (e) {}
    playToneInternal(620, 0.06);
    if (next >= threshold) {
      handleExplosion(next);
    }
  };

  // keyboard support: Space = pump, Enter = bank
  useEffect(() => {
    const onKey = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (e.type === 'keydown') pump();
      }
      if (e.key === 'Enter' && e.type === 'keydown') {
        e.preventDefault();
        handleBank(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pump, handleBank]);

  const perc = Math.round((pumps / MAX_PUMPS) * 100);

  return (
    <div className="balloon-game" role="application" aria-label="Balloon inflation demo">
      <div className="bg-card">
        <div className="balloon-stage">
          <div className="inflation-ring" style={{ width: 220 + 40, height: 220 + 40 }} aria-hidden />

          <div className={`balloon ${justPumped ? 'pulse' : ''} ${exploded ? 'done' : ''}`} style={{ width: `${Math.round(size)}px`, height: `${Math.round(size)}px` }}>
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
          <i style={{ width: `${Math.min(100, Math.max(0, perc))}%` }} />
        </div>

        <div className="controls">
          <button
            type="button"
            className={`btn pump ${disabled || exploded ? 'disabled' : ''}`}
            onClick={pump}
            disabled={disabled || exploded}
          >
            Inflar (Space)
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => handleBank(false)}
            disabled={disabled || pumps === 0}
          >
            Cobrar
          </button>
        </div>

        <div className="meta" aria-live="polite">
          <div className="target">Trial {Math.min(trials, trialIndex + 1)} / {trials} • Umbral mínimo: {MIN_PUMPS_THRESHOLD} pumps</div>
          <div className="size">Pumps: {pumps} • Banked: {totalBanked} pts • Umbral oculto</div>
        </div>
      </div>
    </div>
  );
};

export default BalloonGame;
