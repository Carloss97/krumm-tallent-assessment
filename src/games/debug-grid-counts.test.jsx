import { it } from 'vitest';
import { GRID_LEVELS } from './GridFlowGame';

it('debug grid wall counts', () => {
  const easy = [], hard = [];
  GRID_LEVELS.forEach((l, idx) => {
    console.log(`Level ${idx} (${l.difficulty}) walls=${l.walls.length}`);
    if (l.difficulty === 'easy') easy.push(l.walls.length); else hard.push(l.walls.length);
  });
  const avg = arr => arr.reduce((s,a)=>s+a,0)/Math.max(1,arr.length);
  console.log('easyAvg', avg(easy), 'hardAvg', avg(hard));
});
