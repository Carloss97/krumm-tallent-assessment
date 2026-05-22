import { describe, it, expect } from 'vitest';
import { GRID_LEVELS, getAdaptiveGridNextRound, getGridEfficiency, getGridFeedbackToastProps, getGridMetrics } from './GridFlowGame';

describe('GridFlowGame levels', () => {
  it('defines a 7-level progressive Delivery Puzzle progression', () => {
    expect(GRID_LEVELS).toHaveLength(7);

    // Level 1: intro, single package, no energy
    expect(GRID_LEVELS[0].difficulty).toBe('easy');
    expect(GRID_LEVELS[0].targets).toHaveLength(1);
    expect(GRID_LEVELS[0].energyDrain).toBe(0);
    expect(GRID_LEVELS[0].stations.length).toBe(0);

    // Level 3: energy introduced
    expect(GRID_LEVELS[2].energyDrain).toBeGreaterThan(0);
    expect(GRID_LEVELS[2].stations.length).toBeGreaterThanOrEqual(1);

    // Level 5: first obstacles
    expect(GRID_LEVELS[4].walls.length).toBeGreaterThan(0);
    expect(GRID_LEVELS[4].difficulty).toBe('medium');

    // Level 7: final boss
    const last = GRID_LEVELS[6];
    expect(last.difficulty).toBe('hard');
    expect(last.targets.length).toBeGreaterThanOrEqual(5);
    expect(last.cols).toBeGreaterThanOrEqual(17);
    expect(last.stations.length).toBeGreaterThanOrEqual(4);

    // Validate drop zones don't overlap with walls
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

    // Easy levels have no/low walls, hard levels have significant obstacles
    const easyAvgWalls = easyLevels.reduce((sum, l) => sum + l.walls.length, 0) / easyLevels.length;
    const hardAvgWalls = hardLevels.reduce((sum, l) => sum + l.walls.length, 0) / hardLevels.length;

    expect(hardAvgWalls).toBeGreaterThan(easyAvgWalls);
  });

  it('structures levels as grids with progressive introduction of walls', () => {
    // Levels 1-4: no or minimal walls (introductory)
    for (let i = 0; i <= 3; i++) {
      expect(GRID_LEVELS[i].walls.length).toBeLessThanOrEqual(0);
    }

    // Levels 5+: walls introduced (city-like obstacles)
    const citiedLevels = GRID_LEVELS.slice(4);
    citiedLevels.forEach((level, i) => {
      expect(level.walls.length, `level ${i + 5} should have obstacles`).toBeGreaterThan(0);

      const wallSet = new Set(level.walls);
      const wallArray = Array.from(wallSet).map((key) => key.split(',').map(Number));

      const byColumn = {};
      const byRow = {};

      wallArray.forEach(([x, y]) => {
        byColumn[x] = (byColumn[x] || 0) + 1;
        byRow[y] = (byRow[y] || 0) + 1;
      });

      const hasColumnPattern = Object.values(byColumn).some((count) => count >= 3);
      const hasRowPattern = Object.values(byRow).some((count) => count >= 3);

      expect(hasColumnPattern || hasRowPattern, `level ${i + 5} should have structured wall patterns`).toBe(true);
    });
  });

  it('increases target count and energy drain with progression', () => {
    // Progressive difficulty: targets and drain increase over levels
    expect(GRID_LEVELS[0].targets.length).toBe(1); // Intro: single package
    expect(GRID_LEVELS[1].targets.length).toBeGreaterThan(GRID_LEVELS[0].targets.length);

    // Energy introduced at level 3
    expect(GRID_LEVELS[2].energyDrain).toBeGreaterThan(0);
    expect(GRID_LEVELS[3].energyDrain).toBeGreaterThanOrEqual(GRID_LEVELS[2].energyDrain);
    expect(GRID_LEVELS[6].energyDrain).toBeGreaterThanOrEqual(GRID_LEVELS[5].energyDrain);

    // More targets at higher levels
    expect(GRID_LEVELS[6].targets.length).toBeGreaterThanOrEqual(5);
  });

  it('uses progressive grid sizes from small intro to complex city maps', () => {
    // Level 1: small intro grid (12x12)
    expect(GRID_LEVELS[0].cols).toBe(12);
    expect(GRID_LEVELS[0].rows).toBe(12);

    // Mid-levels: expand to 14-16
    expect(GRID_LEVELS[2].cols).toBeGreaterThanOrEqual(14);
    expect(GRID_LEVELS[4].cols).toBeGreaterThanOrEqual(15);

    // Final levels: large city maps
    const last = GRID_LEVELS[6];
    expect(last.cols).toBeGreaterThanOrEqual(18);
    expect(last.rows).toBeGreaterThanOrEqual(16);
    expect(last.targets.length).toBeGreaterThanOrEqual(5);
    expect(last.stations.length).toBeGreaterThanOrEqual(4);

    // Verify no randomizeTargets flag (preserves authored geometry)
    GRID_LEVELS.forEach((level, i) => {
      expect(level.randomizeTargets, `level ${i} should preserve authored pickup/drop geometry`).not.toBe(true);
    });
  });

  it('provides stations for energy management as energy is introduced', () => {
    // Levels 1-2: no energy system, no stations needed
    expect(GRID_LEVELS[0].stations.length).toBe(0);
    expect(GRID_LEVELS[1].stations.length).toBe(0);

    // Levels 3+: energy present, must have stations
    GRID_LEVELS.slice(2).forEach((level) => {
      expect(level.stations.length, `level with energy drain ${level.energyDrain} must have stations`).toBeGreaterThanOrEqual(1);
      if (level.difficulty === 'hard') {
        expect(level.stations.length, `hard level needs 2+ stations`).toBeGreaterThanOrEqual(2);
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

  it('keeps transient pickup, delivery, and recharge feedback inside the board viewport', () => {
    ['pickup', 'deliver', 'charge'].forEach((variant) => {
      const { initial, animate, style } = getGridFeedbackToastProps(variant, false);

      expect(style.position).toBe('absolute');
      expect(style.zIndex).toBeGreaterThanOrEqual(30);
      expect(style.maxWidth).toBe('calc(100% - 24px)');
      expect(style.boxSizing).toBe('border-box');
      expect(style.pointerEvents).toBe('none');
      expect(String(style.top), `${variant} should declare a safe top anchor`).not.toBe('');
      expect(Number(animate.y || 0), `${variant} should not animate upward out of the clipped board`).toBeGreaterThanOrEqual(0);
      expect(Number(initial.y || 0), `${variant} should not start far above the clipped board`).toBeGreaterThanOrEqual(-8);
    });
  });

  it('shrinks every city map to fit a low-height desktop viewport without board scroll', () => {
    const lowResolutionPc = { width: 1366, height: 768 };

    GRID_LEVELS.forEach((level, index) => {
      const metrics = getGridMetrics(false, false, level, lowResolutionPc);

      expect(metrics.boardWidth, `level ${index} board width`).toBeLessThanOrEqual(1220);
      expect(metrics.boardHeight, `level ${index} board height`).toBeLessThanOrEqual(470);
      expect(metrics.cellSize, `level ${index} should remain playable`).toBeGreaterThanOrEqual(20);
    });
  });

  it('lets the final level exit to the quiz instead of reloading itself', () => {
    const finalRound = GRID_LEVELS.length - 1;
    const finalRoundMax = GRID_LEVELS[finalRound].targets.reduce((sum, target) => sum + target.points, 0);

    expect(getAdaptiveGridNextRound(finalRound, finalRoundMax, finalRoundMax, GRID_LEVELS.length)).toBe(GRID_LEVELS.length);
  });

});