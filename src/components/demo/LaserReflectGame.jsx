import React, { useState } from 'react';

// Simplified mirror-angle puzzle: user rotates mirror; if reflected angle aims near target, success

const degToRad = (d) => (d * Math.PI) / 180;

const LaserReflectGame = ({ onComplete }) => {
  const [angle, setAngle] = useState(30);

  const checkHit = () => {
    // Mirror located at (150, 100), laser source at (20, 100), target at (330, 60)
    const source = { x: 20, y: 100 };
    const mirror = { x: 150, y: 100 };
    const target = { x: 330, y: 60 };

    const inc = { x: mirror.x - source.x, y: mirror.y - source.y };
    const incLen = Math.hypot(inc.x, inc.y);
    const incNorm = { x: inc.x / incLen, y: inc.y / incLen };

    // mirror normal vector based on angle (mirror angle measured from horizontal)
    const mirrorAngle = degToRad(angle);
    const mirrorNormal = { x: Math.sin(mirrorAngle), y: -Math.cos(mirrorAngle) };

    // reflection r = d - 2*(d·n)*n
    const dot = incNorm.x * mirrorNormal.x + incNorm.y * mirrorNormal.y;
    const rx = incNorm.x - 2 * dot * mirrorNormal.x;
    const ry = incNorm.y - 2 * dot * mirrorNormal.y;

    // direction to target from mirror
    const toTarget = { x: target.x - mirror.x, y: target.y - mirror.y };
    const toTargetLen = Math.hypot(toTarget.x, toTarget.y);
    const toTargetNorm = { x: toTarget.x / toTargetLen, y: toTarget.y / toTargetLen };

    const cos = rx * toTargetNorm.x + ry * toTargetNorm.y;
    const angleDiff = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);

    return angleDiff < 12; // tolerance 12 degrees
  };

  return (
    <div>
      <div style={{ marginBottom: 8 }}>Girá el espejo para reflejar el rayo hacia la meta.</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 360, height: 180, background: '#fff7ed', borderRadius: 8, position: 'relative', border: '1px solid rgba(0,0,0,0.06)' }}>
          <div style={{ position: 'absolute', left: 16, top: 92 }}>🔦</div>
          <div style={{ position: 'absolute', left: 320, top: 52 }}>🎯</div>
          <div style={{ position: 'absolute', left: 140, top: 80, transformOrigin: '10px 10px', transform: `rotate(${angle}deg)` }}>
            <div style={{ width: 80, height: 6, background: '#94a3b8', borderRadius: 3 }} />
            <div style={{ width: 6, height: 6 }} />
          </div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <input type="range" min="-80" max="80" value={angle} onChange={(e) => setAngle(Number(e.target.value))} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn" onClick={() => { if (checkHit()) onComplete && onComplete(); }}>Probar</button>
            <button className="btn" onClick={() => setAngle(30)}>Restablecer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaserReflectGame;
