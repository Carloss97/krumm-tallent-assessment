import React, { useState, useEffect, useRef } from 'react';

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

const CollectPeopleGame = ({ onComplete }) => {
  const areaRef = useRef(null);
  const [people, setPeople] = useState([]);
  const [player, setPlayer] = useState({ x: 100, y: 100 });
  const [collected, setCollected] = useState(0);

  useEffect(() => {
    const area = areaRef.current;
    let w = 400, h = 240;
    if (area) { w = area.clientWidth; h = area.clientHeight; }

    const spawn = setInterval(() => {
      setPeople((p) => [...p, spawnPerson(w, h)]);
    }, 900);

    const tick = setInterval(() => {
      setPeople((ps) => ps.map(p => ({ ...p, x: Math.max(10, Math.min(w - 10, p.x + p.vx)), y: Math.max(10, Math.min(h - 10, p.y + p.vy)) })));
    }, 80);

    return () => { clearInterval(spawn); clearInterval(tick); };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
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
        if (nc >= 5) setTimeout(() => onComplete && onComplete(), 500);
        return nc;
      });
    }
  }, [player, people]);

  return (
    <div>
      <div style={{ marginBottom: 8 }}>Usá las flechas para moverte. Recoge 5 personas.</div>
      <div ref={areaRef} style={{ width: 400, height: 240, background: '#eef2ff', position: 'relative', borderRadius: 8, overflow: 'hidden' }}>
        <Player x={player.x} y={player.y} />
        {people.map(p => <Person key={p.id} p={p} />)}
      </div>
      <div style={{ marginTop: 8 }}>Recogidas: {collected} / 5</div>
    </div>
  );
};

export default CollectPeopleGame;
