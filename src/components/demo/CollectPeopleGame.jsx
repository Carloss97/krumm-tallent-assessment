import React, { useState, useEffect, useRef } from 'react';
import { useTelemetry } from '../../TelemetryContext';

const spawnPerson = (width, height) => ({
  id: Math.random().toString(36).slice(2, 9),
  x: Math.random() * (width - 40) + 20,
  y: Math.random() * (height - 40) + 20,
  vx: (Math.random() * 1.4) - 0.7,
  vy: (Math.random() * 1.4) - 0.7
});

const Player = ({ x, y }) => (
  <div style={{ position: 'absolute', left: x - 12, top: y - 12, width: 24, height: 24, borderRadius: 6, background: '#2563eb' }} />
);

const Person = ({ p }) => (
  <div style={{ position: 'absolute', left: p.x - 10, top: p.y - 10, width: 20, height: 20, borderRadius: 10, background: '#f59e0b' }} />
);

const CollectPeopleGame = ({ onComplete, targetCount = 5 }) => {
  const areaRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [player, setPlayer] = useState({ x: 100, y: 100 });
  const [collected, setCollected] = useState(0);
  const [target, setTarget] = useState(null);
  const pointerDownRef = useRef(false);
  const targetRef = useRef(null);
  const startTimeRef = useRef(null);
  const { recordTrialEvent } = useTelemetry();

  useEffect(() => {
    const area = areaRef.current;
    let w = 400, h = 240;
    if (area) { w = area.clientWidth; h = area.clientHeight; }

    startTimeRef.current = Date.now();
    try { recordTrialEvent && recordTrialEvent({ event: 'collect_trial_start', payload: { targetCount } }); } catch (e) {}

    const spawn = setInterval(() => {
      setPeople((p) => {
        const np = spawnPerson(w, h);
        try { recordTrialEvent && recordTrialEvent({ event: 'person_spawn', payload: { id: np.id, x: np.x, y: np.y } }); } catch (e) {}
        return [...p, np];
      });
    }, 900);

    const tick = setInterval(() => {
      setPeople((ps) => ps.map(p => ({ ...p, x: Math.max(10, Math.min(w - 10, p.x + p.vx)), y: Math.max(10, Math.min(h - 10, p.y + p.vy)) })));

      // smooth player movement towards pointer target (if any)
      setPlayer((p) => {
        const t = targetRef.current;
        if (!t) return p;
        const dx = t.x - p.x;
        const dy = t.y - p.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 4) return p;
        const step = Math.min(12, dist);
        const nx = p.x + (dx / dist) * step;
        const ny = p.y + (dy / dist) * step;
        return { x: Math.max(10, Math.min(w - 10, nx)), y: Math.max(10, Math.min(h - 10, ny)) };
      });
    }, 80);

    return () => { clearInterval(spawn); clearInterval(tick); };
  }, [recordTrialEvent, targetCount]);

  useEffect(() => { targetRef.current = target; }, [target]);

  useEffect(() => {
    const onKey = (e) => {
      // keyboard movement cancels pointer target
      setTarget(null);
      setPlayer((p) => {
        let nx = p.x, ny = p.y;
        if (e.key === 'ArrowUp') ny -= 12;
        if (e.key === 'ArrowDown') ny += 12;
        if (e.key === 'ArrowLeft') nx -= 12;
        if (e.key === 'ArrowRight') nx += 12;
        return { x: Math.max(10, Math.min(380, nx)), y: Math.max(10, Math.min(220, ny)) };
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const hit = people.find(p => Math.hypot(p.x - player.x, p.y - player.y) < 22);
    if (hit) {
      setPeople((ps) => ps.filter(p => p.id !== hit.id));
      setCollected((c) => {
        const nc = c + 1;
        try { recordTrialEvent && recordTrialEvent({ event: 'person_collect', payload: { id: hit.id, x: hit.x, y: hit.y, newCount: nc } }); } catch (e) {}
        if (nc >= targetCount) {
          try { recordTrialEvent && recordTrialEvent({ event: 'collect_trial_end', payload: { totalCollected: nc, durationMs: Date.now() - (startTimeRef.current || Date.now()) } }); } catch (e) {}
          setTimeout(() => onComplete && onComplete(), 500);
        }
        return nc;
      });
    }
  }, [player, people, recordTrialEvent, targetCount, onComplete]);

  const handlePointer = (e) => {
    if (!areaRef.current) return;
    const rect = areaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTarget({ x, y });
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>Usá las flechas o toca/arrastra para moverte. Recoge {targetCount} personas.</div>
      <div
        ref={areaRef}
        onPointerDown={(e) => { pointerDownRef.current = true; handlePointer(e); }}
        onPointerMove={(e) => { if (pointerDownRef.current) handlePointer(e); }}
        onPointerUp={() => { pointerDownRef.current = false; setTarget(null); }}
        style={{ width: 400, height: 240, background: '#eef2ff', position: 'relative', borderRadius: 8, overflow: 'hidden', touchAction: 'none' }}
      >
        <Player x={player.x} y={player.y} />
        {people.map(p => <Person key={p.id} p={p} />)}
      </div>
      <div style={{ marginTop: 8 }}>Recogidas: {collected} / {targetCount}</div>
    </div>
  );
};

export default CollectPeopleGame;
