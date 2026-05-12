import { describe, it, expect } from 'vitest';
import { GRID_LEVELS, getAdaptiveGridNextRound, getGridEfficiency } from './GridFlowGame';

describe('GridFlowGame levels', () => {
  it('defines a readable adaptive six-step progression', () => {
    expect(GRID_LEVELS).toHaveLength(6);
    expect(GRID_LEVELS[0].difficulty).toBe('easy');
    expect(GRID_LEVELS[1].difficulty).toBe('hard');
    expect(GRID_LEVELS[2].difficulty).toBe('easy');
    expect(GRID_LEVELS[3].difficulty).toBe('hard');
    expect(GRID_LEVELS[4].difficulty).toBe('easy');
    expect(GRID_LEVELS[5].difficulty).toBe('hard');
    expect(GRID_LEVELS[0].energyDrain).toBeLessThan(1);
    expect(GRID_LEVELS[1].energyDrain).toBeGreaterThan(0);
    expect(GRID_LEVELS[5].targets).toHaveLength(6);
    expect(GRID_LEVELS[1].stations.length).toBeGreaterThanOrEqual(2);
    expect(GRID_LEVELS[5].stations.length).toBeGreaterThanOrEqual(4);
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

  it('increases obstacle complexity and routing challenge with difficulty', () => {
    const easyLevels = GRID_LEVELS.filter((l) => l.difficulty === 'easy');
    const hardLevels = GRID_LEVELS.filter((l) => l.difficulty === 'hard');

    const easyAvgWalls = easyLevels.reduce((sum, l) => sum + l.walls.length, 0) / easyLevels.length;
    const hardAvgWalls = hardLevels.reduce((sum, l) => sum + l.walls.length, 0) / hardLevels.length;

    // Hard levels should have more obstacles
    expect(hardAvgWalls).toBeGreaterThan(easyAvgWalls);
  });

  it('structures levels as grids with distinct path patterns', () => {
    // Levels 2+ should have meaningful wall structures (streets)
    const citiedLevels = GRID_LEVELS.slice(2);

    citiedLevels.forEach((level) => {
      // Check for patterns: either multiple walls in same column or row
      const wallSet = new Set(level.walls);
      const wallArray = Array.from(wallSet).map((key) => key.split(',').map(Number));

      // Check for patterns: either multiple walls in same column or row
      const byColumn = {};
      const byRow = {};

      wallArray.forEach(([x, y]) => {
        byColumn[x] = (byColumn[x] || 0) + 1;
        byRow[y] = (byRow[y] || 0) + 1;
      });

      const hasColumnPattern = Object.values(byColumn).some((count) => count >= 3);
      const hasRowPattern = Object.values(byRow).some((count) => count >= 3);

      expect(hasColumnPattern || hasRowPattern).toBe(true);
    });
  });

  it('increases target count and energy drain with progression', () => {
    expect(GRID_LEVELS[0].targets.length).toBeGreaterThanOrEqual(2);
    expect(GRID_LEVELS[1].targets.length).toBeGreaterThan(GRID_LEVELS[0].targets.length);
    expect(GRID_LEVELS[5].targets.length).toBeGreaterThanOrEqual(GRID_LEVELS[4].targets.length);

    expect(GRID_LEVELS[0].energyDrain).toBeLessThanOrEqual(GRID_LEVELS[1].energyDrain);
    expect(GRID_LEVELS[1].energyDrain).toBeLessThanOrEqual(GRID_LEVELS[3].energyDrain);
    expect(GRID_LEVELS[4].energyDrain).toBeLessThanOrEqual(GRID_LEVELS[5].energyDrain);
  });

  it('uses large fixed city-scale maps with passenger-like pickup/drop routing complexity', () => {
    GRID_LEVELS.forEach((level, index) => {
      expect(level.cols, `level ${index} should declare a large map width`).toBeGreaterThanOrEqual(14);
      expect(level.rows, `level ${index} should declare a large map height`).toBeGreaterThanOrEqual(14);
      expect(level.randomizeTargets, `level ${index} should preserve authored pickup/drop spawn geometry`).not.toBe(true);
      expect(level.targets.length, `level ${index} should have multiple concurrent route objectives`).toBeGreaterThanOrEqual(index < 2 ? 2 : 4);
      expect(level.walls.length, `level ${index} should have district/block obstacles`).toBeGreaterThanOrEqual(index < 2 ? 30 : 60);
    });

    const finalLevel = GRID_LEVELS[GRID_LEVELS.length - 1];
    expect(finalLevel.cols).toBeGreaterThanOrEqual(18);
    expect(finalLevel.rows).toBeGreaterThanOrEqual(16);
    expect(finalLevel.targets.length).toBeGreaterThanOrEqual(6);
    expect(finalLevel.stations.length).toBeGreaterThanOrEqual(4);
  });

  it('provides sufficient stations for energy management', () => {
    GRID_LEVELS.slice(1).forEach((level) => {
      // All levels except intro should have at least 1 station
      expect(level.stations.length).toBeGreaterThanOrEqual(1);
      // Hard levels need more stations for higher energy drain
      if (level.difficulty === 'hard') {
        expect(level.stations.length).toBeGreaterThanOrEqual(2);
      }
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

  it('lets the final level exit to the quiz instead of reloading itself', () => {
    const finalRound = GRID_LEVELS.length - 1;
    const finalRoundMax = GRID_LEVELS[finalRound].targets.reduce((sum, target) => sum + target.points, 0);

    expect(getAdaptiveGridNextRound(finalRound, finalRoundMax, finalRoundMax, GRID_LEVELS.length)).toBe(GRID_LEVELS.length);
  });

});
