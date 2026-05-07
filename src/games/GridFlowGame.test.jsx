import { describe, it, expect } from 'vitest';
import { GRID_LEVELS, getGridEfficiency } from './GridFlowGame';

describe('GridFlowGame levels', () => {
  it('defines a readable adaptive six-step progression', () => {
    expect(GRID_LEVELS).toHaveLength(6);
    expect(GRID_LEVELS[0].difficulty).toBe('easy');
    expect(GRID_LEVELS[1].difficulty).toBe('hard');
    expect(GRID_LEVELS[2].difficulty).toBe('easy');
    expect(GRID_LEVELS[3].difficulty).toBe('hard');
    expect(GRID_LEVELS[4].difficulty).toBe('easy');
    expect(GRID_LEVELS[5].difficulty).toBe('hard');
    expect(GRID_LEVELS[0].energyDrain).toBe(0);
    expect(GRID_LEVELS[1].energyDrain).toBeGreaterThan(0);
    expect(GRID_LEVELS[5].targets).toHaveLength(3);
    expect(GRID_LEVELS[1].stations.length).toBeGreaterThanOrEqual(1);
    expect(GRID_LEVELS[5].stations.length).toBeGreaterThanOrEqual(3);
    expect(GRID_LEVELS[0].timeLimit).toBeLessThan(GRID_LEVELS[1].timeLimit + 10);
    expect(GRID_LEVELS[1].timeLimit).toBeGreaterThan(0);
    GRID_LEVELS.forEach((level) => {
      const wallSet = new Set(level.walls);
      level.targets.forEach((target) => {
        expect(target.dropZone).toBeTruthy();
        expect(wallSet.has(`${target.dropZone.x},${target.dropZone.y}`)).toBe(false);
      });
    });
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