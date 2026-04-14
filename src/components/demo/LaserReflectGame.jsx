import React, { useState, useEffect } from 'react';
import { useTelemetry } from '../../TelemetryContext';

// Simplified mirror-angle puzzle: user rotates mirror; if reflected angle aims near target, success

const degToRad = (d) => (d * Math.PI) / 180;

const LaserReflectGame = ({ onComplete }) => {
  const [angle, setAngle] = useState(30);
  const { recordTrialEvent } = useTelemetry();

  useEffect(() => {
    try { recordTrialEvent && recordTrialEvent({ event: 'laser_trial_start', payload: { initialAngle: angle } }); } catch (e) {}
  }, []);

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

  const computeReflection = (angleVal) => {
    const source = { x: 20, y: 100 };
    const mirror = { x: 150, y: 100 };
    const target = { x: 330, y: 60 };

    const inc = { x: mirror.x - source.x, y: mirror.y - source.y };
    const incLen = Math.hypot(inc.x, inc.y);
    const incNorm = { x: inc.x / incLen, y: inc.y / incLen };

    const mirrorAngle = degToRad(angleVal);
    const mirrorNormal = { x: Math.sin(mirrorAngle), y: -Math.cos(mirrorAngle) };

    const dot = incNorm.x * mirrorNormal.x + incNorm.y * mirrorNormal.y;
    const rx = incNorm.x - 2 * dot * mirrorNormal.x;
    const ry = incNorm.y - 2 * dot * mirrorNormal.y;

    const toTarget = { x: target.x - mirror.x, y: target.y - mirror.y };
    const toTargetLen = Math.hypot(toTarget.x, toTarget.y);
    const toTargetNorm = { x: toTarget.x / toTargetLen, y: toTarget.y / toTargetLen };

    const cos = rx * toTargetNorm.x + ry * toTargetNorm.y;
    const angleDiff = Math.acos(Math.max(-1, Math.min(1, cos))) * (180 / Math.PI);

    return { rx, ry, angleDiff };
  };

  const { rx, ry, angleDiff } = computeReflection(angle);
  const reflectEnd = { x: 150 + rx * 240, y: 100 + ry * 240 };
  const hit = angleDiff < 12;

  return (
    <div>
      <div style={{ marginBottom: 8 }}>Girá el espejo para reflejar el rayo hacia la meta.</div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ width: 360, height: 180, background: '#fff7ed', borderRadius: 8, position: 'relative', border: '1px solid rgba(0,0,0,0.06)' }}>
          <svg width={360} height={180} style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }} aria-hidden>
            <line x1={20} y1={100} x2={150} y2={100} stroke="#fb923c" strokeWidth={2} />
            <line x1={150} y1={100} x2={reflectEnd.x} y2={reflectEnd.y} stroke={hit ? '#10b981' : '#60a5fa'} strokeWidth={2} strokeDasharray={hit ? '0' : '6 4'} />
            <line x1={150} y1={100} x2={330} y2={60} stroke="#fde68a" strokeWidth={1} strokeDasharray="4 4" />
          </svg>
          <div style={{ position: 'absolute', left: 16, top: 92 }}>🔦</div>
          <div style={{ position: 'absolute', left: 320, top: 52 }}>🎯</div>
          <div style={{ position: 'absolute', left: 140, top: 80, transformOrigin: '10px 10px', transform: `rotate(${angle}deg)` }}>
            <div style={{ width: 80, height: 6, background: '#94a3b8', borderRadius: 3 }} />
            <div style={{ width: 6, height: 6 }} />
          </div>
          <div style={{ position: 'absolute', right: 8, top: 8, fontSize: 12, color: hit ? '#065f46' : '#1e293b' }}>{hit ? 'Acierto probable' : `Desvío ${Math.round(angleDiff)}°`}</div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <input
            type="range"
            min="-80"
            max="80"
            value={angle}
            onChange={(e) => {
              const v = Number(e.target.value);
              setAngle(v);
              try { recordTrialEvent && recordTrialEvent({ event: 'laser_adjust', payload: { angle: v, tSinceStartMs: Date.now() } }); } catch (e) {}
            }}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="btn"
              onClick={() => {
                const { angleDiff: ad } = computeReflection(angle);
                try { recordTrialEvent && recordTrialEvent({ event: 'laser_try', payload: { angle, angleDiff: ad } }); } catch (e) {}
                if (ad < 12) {
                  try { recordTrialEvent && recordTrialEvent({ event: 'laser_success', payload: { angle, angleDiff: ad } }); } catch (e) {}
                  onComplete && onComplete();
                }
              }}
            >Probar</button>
            <button className="btn" onClick={() => setAngle(30)}>Restablecer</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaserReflectGame;
