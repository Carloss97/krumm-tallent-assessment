import { describe, it, expect } from 'vitest';
import { GRID_LEVELS, getGridEfficiency } from './GridFlowGame';

describe('GridFlowGame levels', () => {
  it('defines a readable three-step progression', () => {
    expect(GRID_LEVELS).toHaveLength(3);
    expect(GRID_LEVELS[0].energyDrain).toBe(0);
    expect(GRID_LEVELS[1].energyDrain).toBeGreaterThan(0);
    expect(GRID_LEVELS[2].targets).toHaveLength(2);
    expect(GRID_LEVELS[1].stations).toHaveLength(1);
    expect(GRID_LEVELS[2].stations).toHaveLength(2);
    expect(GRID_LEVELS[0].timeLimit).toBeLessThan(GRID_LEVELS[1].timeLimit);
    expect(GRID_LEVELS[1].timeLimit).toBeLessThan(GRID_LEVELS[2].timeLimit);
  });

  it('computes efficiency from delivered score', () => {
    const totalPoints = GRID_LEVELS.reduce((sum, level) => (
      sum + level.targets.reduce((levelSum, target) => levelSum + target.points, 0)
    ), 0);

    expect(getGridEfficiency(0, totalPoints)).toBe(0);
    expect(getGridEfficiency(totalPoints, totalPoints)).toBe(100);
    expect(getGridEfficiency(Math.floor(totalPoints / 2), totalPoints)).toBeGreaterThan(40);
  });
});