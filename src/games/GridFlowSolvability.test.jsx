import { describe, it, expect } from 'vitest';
import { GRID_LEVELS } from './GridFlowGame';

const GRID_SIZE = 10;

const existsPath = (wallsSet, from, to) => {
  const key = (p) => `${p.x},${p.y}`;
  const visited = new Set();
  const q = [from];
  while (q.length) {
    const cur = q.shift();
    if (cur.x === to.x && cur.y === to.y) return true;
    const k = key(cur);
    if (visited.has(k)) continue;
    visited.add(k);
    const neighbors = [
      { x: cur.x + 1, y: cur.y },
      { x: cur.x - 1, y: cur.y },
      { x: cur.x, y: cur.y + 1 },
      { x: cur.x, y: cur.y - 1 },
    ];
    neighbors.forEach(n => {
      if (n.x < 0 || n.y < 0 || n.x >= GRID_SIZE || n.y >= GRID_SIZE) return;
      if (wallsSet.has(`${n.x},${n.y}`)) return;
      if (!visited.has(`${n.x},${n.y}`)) q.push(n);
    });
  }
  return false;
};

describe('GridFlow solvability', () => {
  it('each target pickup and dropZone is reachable (ignoring energy/time)', () => {
    GRID_LEVELS.forEach((level, idx) => {
      const wallsSet = new Set(level.walls);
      const start = level.startPos || { x: 0, y: 0 };
      level.targets.forEach((t) => {
        const pickup = { x: t.x, y: t.y };
        const drop = { x: t.dropZone.x, y: t.dropZone.y };

        const canReachPickup = existsPath(wallsSet, start, pickup);
        expect(canReachPickup, `Level ${idx} start -> pickup ${pickup.x},${pickup.y}`).toBe(true);

        const canDeliver = existsPath(wallsSet, pickup, drop);
        expect(canDeliver, `Level ${idx} pickup -> drop ${drop.x},${drop.y}`).toBe(true);
      });
    });
  });
});
