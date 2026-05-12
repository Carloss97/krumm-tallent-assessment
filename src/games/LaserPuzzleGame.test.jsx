import { describe, it, expect } from 'vitest';
import { LASER_DEMO_LEVELS, buildGrid, getLaserEfficiency, getLaserMetrics, traceBeam } from './LaserPuzzleGame';

describe('LaserPuzzleGame levels', () => {
  it('defines a progressive adaptive six-level puzzle set', () => {
    expect(LASER_DEMO_LEVELS).toHaveLength(6);
    expect(LASER_DEMO_LEVELS[0].difficulty).toBe('easy');
    expect(LASER_DEMO_LEVELS[1].difficulty).toBe('hard');
    expect(LASER_DEMO_LEVELS[2].difficulty).toBe('easy');
    expect(LASER_DEMO_LEVELS[3].difficulty).toBe('hard');
    expect(LASER_DEMO_LEVELS[4].difficulty).toBe('easy');
    expect(LASER_DEMO_LEVELS[5].difficulty).toBe('hard');
    expect(LASER_DEMO_LEVELS.every((level) => level.cells.filter((cell) => cell.movable).length >= 4)).toBe(true);
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

  it('supports all 8 beam directions including diagonals', () => {
    const diagonalLevel = {
      cols: 6,
      rows: 6,
      cells: [
        { x: 0, y: 0, type: 'ship', dir: 'downRight' },
        { x: 4, y: 4, type: 'antenna' },
      ],
    };

    const result = traceBeam(buildGrid(diagonalLevel), diagonalLevel.cols, diagonalLevel.rows);

    expect(result.beamCells.has('1,1')).toBe(true);
    expect(result.beamCells.has('2,2')).toBe(true);
    expect(result.litAntennas.has('4,4')).toBe(true);
  });

  it('lights the antenna in a solved reflection layout', () => {
    const solvedLevel = {
      cols: 10,
      rows: 7,
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

  it('redesigns levels as large complex maps with progressive optical objects', () => {
    LASER_DEMO_LEVELS.forEach((level, index) => {
      expect(level.cols, `level ${index} should use a wider board`).toBeGreaterThanOrEqual(12);
      expect(level.rows, `level ${index} should use a taller board`).toBeGreaterThanOrEqual(10);
      expect(level.cells.filter((cell) => cell.type === 'wall').length, `level ${index} should include meaningful obstacles`).toBeGreaterThanOrEqual(index < 2 ? 18 : 30);
      expect(level.cells.filter((cell) => cell.movable).length, `level ${index} should require several object moves`).toBeGreaterThanOrEqual(index < 2 ? 4 : 6);
      expect(level.par, `level ${index} should require multi-step reasoning`).toBeGreaterThanOrEqual(index < 2 ? 4 : 6);
    });

    const shipDirs = new Set(
      LASER_DEMO_LEVELS
        .flatMap((level) => level.cells)
        .filter((cell) => cell.type === 'ship')
        .map((cell) => cell.dir)
    );
    expect([...shipDirs].some((dir) => ['upRight', 'downRight', 'downLeft', 'upLeft'].includes(dir))).toBe(true);
    expect(LASER_DEMO_LEVELS.some((level) => level.cells.some((cell) => cell.type === 'bifurcator'))).toBe(true);
    expect(LASER_DEMO_LEVELS.some((level) => level.cells.some((cell) => cell.type === 'portal_blue' || cell.type === 'portal_red'))).toBe(true);
  });

  it('marks portals as movable in redesigned levels', () => {
    const portals = LASER_DEMO_LEVELS.filter((level) =>
      level.cells.some((cell) => cell.type === 'portal_blue')
    );

    expect(portals.length).toBeGreaterThan(0);
    portals.forEach((level) => {
      const portalCells = level.cells.filter((cell) => cell.type === 'portal_blue');
      expect(portalCells.every((cell) => cell.movable)).toBe(true);
    });
  });

  it('preserves portal linking after moving portal pieces', () => {
    const levelWithPortals = LASER_DEMO_LEVELS.find((level) =>
      level.cells.filter((cell) => cell.type === 'portal_blue').length >= 2
    );
    expect(levelWithPortals).toBeDefined();

    const grid = buildGrid(levelWithPortals);
    const portalCells = Object.entries(grid).filter(([, cell]) => cell.type === 'portal_blue');
    expect(portalCells.length).toBeGreaterThanOrEqual(2);

    const [firstKey, firstCell] = portalCells[0];
    const newGrid = { ...grid };
    delete newGrid[firstKey];
    newGrid['7,7'] = { ...firstCell };

    const movedPortal = newGrid['7,7'];
    expect(movedPortal.portalId || movedPortal.targetPortalId).toBeDefined();
    expect(movedPortal.movable).toBe(true);

    const pairedPortal = Object.entries(newGrid).find(
      ([, cell]) =>
        (cell.portalId === movedPortal.targetPortalId || cell.targetPortalId === movedPortal.portalId) &&
        cell.type === 'portal_blue'
    );
    expect(pairedPortal).toBeDefined();
  });

  it('has at least one authored solvable arrangement for every level', () => {
    LASER_DEMO_LEVELS.forEach((level, index) => {
      expect(level.solutionPlacements, `level ${index} should document its intended solution`).toBeTruthy();
      const finalGrid = buildGrid(level);
      level.solutionPlacements.forEach(([fromKey, toKey]) => {
        const cell = finalGrid[fromKey];
        expect(cell, `level ${index} missing solution piece at ${fromKey}`).toBeDefined();
        delete finalGrid[fromKey];
        finalGrid[toKey] = { ...cell };
      });

      const antennaKeys = level.cells
        .filter((cell) => cell.type === 'antenna')
        .map((cell) => `${cell.x},${cell.y}`);
      const { litAntennas } = traceBeam(finalGrid, level.cols, level.rows);

      expect(antennaKeys.every((antennaKey) => litAntennas.has(antennaKey)), `level ${index} should solve with its authored placements`).toBe(true);
    });
  });




  it('requires more than three authored moves in each of the first four laser levels', () => {
    const minimumMoves = [4, 5, 5, 5];

    LASER_DEMO_LEVELS.slice(0, 4).forEach((level, index) => {
      const meaningfulMoves = level.solutionPlacements.filter(([fromKey, toKey]) => fromKey !== toKey).length;
      const movablePieces = level.cells.filter((cell) => cell.movable).length;

      expect(meaningfulMoves, `level ${index} should not solve in three moves`).toBeGreaterThanOrEqual(minimumMoves[index]);
      expect(level.par, `level ${index} should budget meaningful reasoning time`).toBeGreaterThanOrEqual(minimumMoves[index] + 2);
      expect(movablePieces, `level ${index} should include decoys beyond the intended chain`).toBeGreaterThanOrEqual(minimumMoves[index] + 2);
    });
  });

  it('requires substantially more than three moves in the late laser levels', () => {
    const lateLevels = LASER_DEMO_LEVELS.slice(-2);

    lateLevels.forEach((level, offset) => {
      const index = LASER_DEMO_LEVELS.length - lateLevels.length + offset;
      const meaningfulMoves = level.solutionPlacements.filter(([fromKey, toKey]) => fromKey !== toKey).length;
      const movablePieces = level.cells.filter((cell) => cell.movable).length;

      expect(meaningfulMoves, `level ${index} should require a multi-object solution`).toBeGreaterThanOrEqual(offset === 0 ? 5 : 6);
      expect(level.par, `level ${index} should budget substantial reasoning moves`).toBeGreaterThanOrEqual(offset === 0 ? 10 : 12);
      expect(movablePieces, `level ${index} should include decoys and movable alternatives`).toBeGreaterThanOrEqual(9);
    });
  });

  it('shrinks every optical board to fit a low-height desktop viewport without board scroll', () => {
    const lowResolutionPc = { width: 1366, height: 768 };

    LASER_DEMO_LEVELS.forEach((level, index) => {
      const metrics = getLaserMetrics(false, false, level, lowResolutionPc);

      expect(metrics.boardWidth, `level ${index} board width`).toBeLessThanOrEqual(1220);
      expect(metrics.boardHeight, `level ${index} board height`).toBeLessThanOrEqual(450);
      expect(metrics.cellSize, `level ${index} should remain playable`).toBeGreaterThanOrEqual(24);
    });
  });

  it('computes efficiency against the level par', () => {
    expect(getLaserEfficiency(3, 3)).toBe(100);
    expect(getLaserEfficiency(6, 3)).toBe(50);
  });

  it('increases par value with level difficulty progression', () => {
    const easyLevels = LASER_DEMO_LEVELS.filter((l) => l.difficulty === 'easy');
    const hardLevels = LASER_DEMO_LEVELS.filter((l) => l.difficulty === 'hard');

    const easyAvgPar = easyLevels.reduce((sum, l) => sum + l.par, 0) / easyLevels.length;
    const hardAvgPar = hardLevels.reduce((sum, l) => sum + l.par, 0) / hardLevels.length;

    expect(hardAvgPar).toBeGreaterThan(easyAvgPar);
  });
});
