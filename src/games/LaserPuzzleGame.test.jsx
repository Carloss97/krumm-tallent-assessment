import { describe, it, expect } from 'vitest';
import { LASER_DEMO_LEVELS, buildGrid, getLaserEfficiency, traceBeam } from './LaserPuzzleGame';

describe('LaserPuzzleGame levels', () => {
  it('defines a progressive adaptive six-level puzzle set', () => {
    expect(LASER_DEMO_LEVELS).toHaveLength(6);
    expect(LASER_DEMO_LEVELS[0].difficulty).toBe('easy');
    expect(LASER_DEMO_LEVELS[1].difficulty).toBe('hard');
    expect(LASER_DEMO_LEVELS[2].difficulty).toBe('easy');
    expect(LASER_DEMO_LEVELS[3].difficulty).toBe('hard');
    expect(LASER_DEMO_LEVELS[4].difficulty).toBe('easy');
    expect(LASER_DEMO_LEVELS[5].difficulty).toBe('hard');
    expect(LASER_DEMO_LEVELS.every((level) => level.cells.filter((cell) => cell.movable).length >= 2)).toBe(true);
    expect(LASER_DEMO_LEVELS.some((level) => level.cells.some((cell) => cell.type === 'bifurcator'))).toBe(true);
    expect(LASER_DEMO_LEVELS.some((level) => level.cells.some((cell) => cell.type === 'portal_blue'))).toBe(true);
    expect(LASER_DEMO_LEVELS.some((level) => level.quiz.length > 0)).toBe(true);
  });

  it('does not start with any level already solved', () => {
    LASER_DEMO_LEVELS.forEach((level) => {
      const { litAntennas } = traceBeam(buildGrid(level), level.cols, level.rows);
      const antennaKeys = level.cells
        .filter((cell) => cell.type === 'antenna')
        .map((cell) => `${cell.x},${cell.y}`);

      expect(antennaKeys.length).toBeGreaterThan(0);
      expect(antennaKeys.every((key) => litAntennas.has(key))).toBe(false);
    });
  });

  it('cannot be solved in a single move', () => {
    const getEmptyCells = (level, grid) => {
      const occupied = new Set(Object.keys(grid));
      const empties = [];
      for (let y = 0; y < level.rows; y += 1) {
        for (let x = 0; x < level.cols; x += 1) {
          const key = `${x},${y}`;
          if (!occupied.has(key)) {
            empties.push({ x, y, key });
          }
        }
      }
      return empties;
    };

    LASER_DEMO_LEVELS.forEach((level) => {
      const baseGrid = buildGrid(level);
      const movableCells = Object.entries(baseGrid).filter(([, cell]) => cell.movable);
      const antennaKeys = level.cells
        .filter((cell) => cell.type === 'antenna')
        .map((cell) => `${cell.x},${cell.y}`);

      let oneMoveSolved = false;

      movableCells.forEach(([fromKey, fromCell]) => {
        if (oneMoveSolved) return;
        const empties = getEmptyCells(level, baseGrid);
        empties.forEach(({ key }) => {
          if (oneMoveSolved) return;
          const candidateGrid = { ...baseGrid };
          delete candidateGrid[fromKey];
          candidateGrid[key] = { ...fromCell };

          const { litAntennas } = traceBeam(candidateGrid, level.cols, level.rows);
          if (antennaKeys.every((antenna) => litAntennas.has(antenna))) {
            oneMoveSolved = true;
          }
        });
      });

      expect(oneMoveSolved).toBe(false);
    });
  });

  it('lights the antenna in a solved reflection layout', () => {
    const solvedLevel = {
      ...LASER_DEMO_LEVELS[0],
      cells: [
        { x: 0, y: 3, type: 'ship', dir: 'right' },
        { x: 7, y: 0, type: 'antenna' },
        { x: 2, y: 3, type: 'reflector_ne' },
        { x: 2, y: 0, type: 'reflector_ne' },
      ],
    };

    const result = traceBeam(buildGrid(solvedLevel), solvedLevel.cols, solvedLevel.rows);
    expect(result.litAntennas.has('7,0')).toBe(true);
  });

  it('supports portal and bifurcation as an end-to-end solved route', () => {
    const portalLevel = {
      cols: 10,
      rows: 8,
      cells: [
        { x: 0, y: 3, type: 'ship', dir: 'right' },
        { x: 2, y: 3, type: 'portal_blue', targetPortalId: 'p1' },
        { x: 6, y: 3, type: 'portal_blue', portalId: 'p1' },
        { x: 7, y: 3, type: 'bifurcator' },
        { x: 7, y: 0, type: 'reflector_ne' },
        { x: 7, y: 6, type: 'reflector_nw' },
        { x: 9, y: 0, type: 'antenna' },
        { x: 9, y: 6, type: 'antenna' },
        { x: 4, y: 1, type: 'wall' },
        { x: 4, y: 2, type: 'wall' },
        { x: 4, y: 3, type: 'wall' },
        { x: 4, y: 4, type: 'wall' },
        { x: 4, y: 5, type: 'wall' },
      ],
    };

    const result = traceBeam(buildGrid(portalLevel), portalLevel.cols, portalLevel.rows);
    expect(result.litAntennas.has('9,0')).toBe(true);
    expect(result.litAntennas.has('9,6')).toBe(true);
  });

  it('computes efficiency against the level par', () => {
    expect(getLaserEfficiency(3, 3)).toBe(100);
    expect(getLaserEfficiency(6, 3)).toBe(50);
  });
});