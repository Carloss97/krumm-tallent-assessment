import { it } from 'vitest';
import { GRID_LEVELS } from './GridFlowGame';

it('debug wall/dropZone conflicts', () => {
  GRID_LEVELS.forEach((level, idx) => {
    const walls = new Set(level.walls);
    level.targets.forEach(t => {
      const dz = `${t.dropZone.x},${t.dropZone.y}`;
      if (walls.has(dz)) {
        console.log(`Level ${idx} conflict: dropZone ${dz} is a wall`);
      }
    });
  });
});

it('debug level 3 path', () => {
  const level = GRID_LEVELS[3];
  const walls = new Set(level.walls);
  const start = level.startPos || { x:0,y:0 };
  const pickup = { x: 4, y:5 };

  console.log('Level 3 walls:', Array.from(walls).sort().join(' | '));

  const key = (p) => `${p.x},${p.y}`;
  const visited = new Set();
  const q = [start];
  let found = false;
  while (q.length) {
    const cur = q.shift();
    if (cur.x === pickup.x && cur.y === pickup.y) { found = true; break; }
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
      if (n.x < 0 || n.y < 0 || n.x >= 10 || n.y >= 10) return;
      if (walls.has(`${n.x},${n.y}`)) return;
      if (!visited.has(`${n.x},${n.y}`)) q.push(n);
    });
  }

  console.log('Found path to pickup 4,5?', found);
  console.log('Visited count:', visited.size);
});

it('debug level 4 delivery path', () => {
  const level = GRID_LEVELS[4];
  const walls = new Set(level.walls);
  const pickup = { x: 1, y:1 };
  const drop = { x: 9, y:8 };

  console.log('Level 4 walls sample:', Array.from(walls).slice(0,40).join(' | '));

  const key = (p) => `${p.x},${p.y}`;
  const visited = new Set();
  const q = [pickup];
  let found = false;
  while (q.length) {
    const cur = q.shift();
    if (cur.x === drop.x && cur.y === drop.y) { found = true; break; }
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
      if (n.x < 0 || n.y < 0 || n.x >= 10 || n.y >= 10) return;
      if (walls.has(`${n.x},${n.y}`)) return;
      if (!visited.has(`${n.x},${n.y}`)) q.push(n);
    });
  }

  console.log('Found delivery path 1,1 -> 9,8?', found);
  console.log('Visited count:', visited.size);
});

it('debug level 4 start->pickup', () => {
  const level = GRID_LEVELS[4];
  const walls = new Set(level.walls);
  const start = level.startPos || { x:5,y:9 };
  const pickup = { x:5, y:0 };

  const key = (p) => `${p.x},${p.y}`;
  const visited = new Set();
  const q = [start];
  let found = false;
  while (q.length) {
    const cur = q.shift();
    if (cur.x === pickup.x && cur.y === pickup.y) { found = true; break; }
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
      if (n.x < 0 || n.y < 0 || n.x >= 10 || n.y >= 10) return;
      if (walls.has(`${n.x},${n.y}`)) return;
      if (!visited.has(`${n.x},${n.y}`)) q.push(n);
    });
  }

  console.log('Found start->pickup 5,9 -> 5,0?', found);
  console.log('Visited count:', visited.size);
});

it('debug level 5 start->pickup', () => {
  const level = GRID_LEVELS[5];
  const walls = new Set(level.walls);
  const start = level.startPos || { x:5,y:9 };
  const pickup = { x:0, y:0 };

  console.log('Level 5 walls sample:', Array.from(walls).slice(0,80).join(' | '));

  const key = (p) => `${p.x},${p.y}`;
  const visited = new Set();
  const q = [start];
  let found = false;
  while (q.length) {
    const cur = q.shift();
    if (cur.x === pickup.x && cur.y === pickup.y) { found = true; break; }
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
      if (n.x < 0 || n.y < 0 || n.x >= 10 || n.y >= 10) return;
      if (walls.has(`${n.x},${n.y}`)) return;
      if (!visited.has(`${n.x},${n.y}`)) q.push(n);
    });
  }

  console.log('Found start->pickup 5,9 -> 0,0?', found);
  console.log('Visited count:', visited.size);
});
