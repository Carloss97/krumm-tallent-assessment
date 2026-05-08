import { describe, it, expect } from 'vitest';
import { LASER_DEMO_LEVELS, buildGrid, getLaserEfficiency, traceBeam } from './LaserPuzzleGame';

describe('LaserPuzzleGame levels', () => {
  const buildPlacedGrid = (level, placements) => {
    const grid = buildGrid(level);

    placements.forEach(([fromKey, toKey]) => {
      const cell = grid[fromKey];
      expect(cell).toBeDefined();
      delete grid[fromKey];
      grid[toKey] = { ...cell };
    });

    return grid;
  };

  const expectSolvedArrangement = (level, placements) => {
    const antennaKeys = level.cells
      .filter((cell) => cell.type === 'antenna')
      .map((cell) => `${cell.x},${cell.y}`);

    const finalGrid = buildPlacedGrid(level, placements);
    const { litAntennas } = traceBeam(finalGrid, level.cols, level.rows);

    expect(antennaKeys.every((antennaKey) => litAntennas.has(antennaKey))).toBe(true);
  };

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

  it('most levels require 2+ moves (allowing simple intro levels)', () => {
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

    let requiresMultipleMoves = 0;

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

      if (!oneMoveSolved) {
        requiresMultipleMoves += 1;
      }
    });

    // At least 4 out of 6 levels should require 2+ moves
    expect(requiresMultipleMoves).toBeGreaterThanOrEqual(4);
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

    // Extract the portal IDs
    const portalIds = portalCells.map(([, cell]) => ({
      id: cell.portalId || cell.targetPortalId,
      type: cell.portalId ? 'source' : 'target',
      cell,
    }));

    // Move first portal to a new location
    const [firstKey, firstCell] = portalCells[0];
    const newGrid = { ...grid };
    delete newGrid[firstKey];
    newGrid['7,7'] = { ...firstCell };

    // Verify that the portal identity and linking are preserved
    const movedPortal = newGrid['7,7'];
    expect(movedPortal.portalId || movedPortal.targetPortalId).toBeDefined();
    expect(movedPortal.movable).toBe(true);

    // Verify the paired portal can still find it by ID
    const pairedPortal = Object.entries(newGrid).find(
      ([, cell]) =>
        (cell.portalId === movedPortal.targetPortalId || cell.targetPortalId === movedPortal.portalId) &&
        cell.type === 'portal_blue'
    );
    expect(pairedPortal).toBeDefined();
  });

  it('requires minimum 2+ movable pieces per level for complexity', () => {
    LASER_DEMO_LEVELS.forEach((level, idx) => {
      const movableCount = level.cells.filter((cell) => cell.movable).length;
      expect(movableCount).toBeGreaterThanOrEqual(2);
    });
  });

  it('has at least one solvable arrangement for every level', () => {
    const cases = [
      {
        name: 'Sector Alpha',
        levelIndex: 0,
        placements: [
          ['1,4', '3,3'],
          ['8,1', '3,0'],
        ],
      },
      {
        name: 'Sector Alpha+',
        levelIndex: 1,
        placements: [
          ['2,2', '2,3'],
          ['10,1', '2,0'],
          ['10,6', '2,7'],
        ],
      },
      {
        name: 'Sector Beta',
        levelIndex: 2,
        placements: [
          ['4,1', '2,0'],
        ],
      },
      {
        name: 'Sector Beta+',
        levelIndex: 3,
        placements: [
          ['1,0', '2,3'],
          ['6,0', '2,1'],
          ['6,4', '2,5'],
        ],
      },
      {
        name: 'Sector Gamma',
        levelIndex: 4,
        placements: [
          ['1,4', '1,2'],
          ['7,4', '6,2'],
        ],
      },
      {
        name: 'Sector Gamma+',
        levelIndex: 5,
        placements: [
          ['1,0', '2,3'],
          ['8,0', '2,1'],
          ['8,6', '2,5'],
          ['1,1', '4,1'],
          ['6,1', '7,1'],
          ['1,5', '4,5'],
          ['6,5', '7,5'],
        ],
      },
    ];

    cases.forEach(({ name, levelIndex, placements }) => {
      const level = LASER_DEMO_LEVELS[levelIndex];
      const antennaKeys = level.cells
        .filter((cell) => cell.type === 'antenna')
        .map((cell) => `${cell.x},${cell.y}`);

      const finalGrid = buildPlacedGrid(level, placements);
      const { litAntennas } = traceBeam(finalGrid, level.cols, level.rows);
      const solved = antennaKeys.every((antennaKey) => litAntennas.has(antennaKey));

      expect(solved, `${name} should have a real solved arrangement`).toBe(true);
    });
  });

  it('increases par value with level difficulty progression', () => {
    const easyLevels = LASER_DEMO_LEVELS.filter((l) => l.difficulty === 'easy');
    const hardLevels = LASER_DEMO_LEVELS.filter((l) => l.difficulty === 'hard');
    
    const easyAvgPar = easyLevels.reduce((sum, l) => sum + l.par, 0) / easyLevels.length;
    const hardAvgPar = hardLevels.reduce((sum, l) => sum + l.par, 0) / hardLevels.length;
    
    expect(hardAvgPar).toBeGreaterThan(easyAvgPar);
  });
});