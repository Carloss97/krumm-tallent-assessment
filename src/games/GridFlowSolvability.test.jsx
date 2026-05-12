import { describe, it, expect } from 'vitest';
import { GRID_LEVELS } from './GridFlowGame';

const existsPath = (wallsSet, from, to, cols, rows) => {
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
      if (n.x < 0 || n.y < 0 || n.x >= cols || n.y >= rows) return;
      if (wallsSet.has(`${n.x},${n.y}`)) return;
      if (!visited.has(`${n.x},${n.y}`)) q.push(n);
    });
  }
  return false;
};

describe('GridFlow solvability', () => {
  it('each target pickup and dropZone is reachable (ignoring energy/time)', () => {
    GRID_LEVELS.forEach((level, idx) => {
      const cols = level.cols;
      const rows = level.rows;
      const wallsSet = new Set(level.walls);
      const start = level.startPos || { x: 0, y: 0 };

      expect(start.x).toBeGreaterThanOrEqual(0);
      expect(start.y).toBeGreaterThanOrEqual(0);
      expect(start.x).toBeLessThan(cols);
      expect(start.y).toBeLessThan(rows);
      expect(wallsSet.has(`${start.x},${start.y}`)).toBe(false);

      level.targets.forEach((t) => {
        const pickup = { x: t.x, y: t.y };
        const drop = { x: t.dropZone.x, y: t.dropZone.y };

        const canReachPickup = existsPath(wallsSet, start, pickup, cols, rows);
        expect(canReachPickup, `Level ${idx} start -> pickup ${pickup.x},${pickup.y}`).toBe(true);

        const canDeliver = existsPath(wallsSet, pickup, drop, cols, rows);
        expect(canDeliver, `Level ${idx} pickup -> drop ${drop.x},${drop.y}`).toBe(true);
      });
    });
  });
});
