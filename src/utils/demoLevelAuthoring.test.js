import { describe, expect, it } from 'vitest';
import {
  createGridFlowLevel,
  createLaserPuzzleLevel,
  createDemoLevels,
  createDemoLevelPacks,
} from './demoLevelAuthoring';

describe('demo level authoring importer', () => {
  it('normalizes externally-authored GridFlow specs and keeps authored route cells clear', () => {
    const level = createGridFlowLevel({
      name: 'Ruta piloto',
      difficulty: 'easy',
      cols: 6,
      rows: 5,
      start: [0, 4],
      stations: [[2, 2]],
      targets: [
        { id: 'red', pickup: [0, 0], drop: [5, 4], color: '#ef4444', points: 100 },
        { id: 'blue', pickup: [5, 0], drop: [1, 4], color: '#3b82f6', points: 120 },
      ],
      walls: {
        rects: [[0, 0, 5, 0], [1, 2, 3, 3]],
        cells: [[4, 4]],
      },
      timeLimit: 45,
      energyDrain: 0.5,
    });

    expect(level.startPos).toEqual({ x: 0, y: 4 });
    expect(level.stations).toEqual([{ x: 2, y: 2 }]);
    expect(level.targets).toEqual([
      { id: 'red', x: 0, y: 0, color: '#ef4444', points: 100, dropZone: { x: 5, y: 4 } },
      { id: 'blue', x: 5, y: 0, color: '#3b82f6', points: 120, dropZone: { x: 1, y: 4 } },
    ]);
    expect(level.walls).toContain('1,0');
    expect(level.walls).toContain('3,3');
    expect(level.walls).toContain('4,4');
    expect(level.walls).not.toContain('0,0');
    expect(level.walls).not.toContain('5,0');
    expect(level.walls).not.toContain('0,4');
    expect(level.walls).not.toContain('5,4');
    expect(level.walls).not.toContain('1,4');
    expect(level.walls).not.toContain('2,2');
  });

  it('normalizes externally-authored LaserPuzzle specs and reserves solution landing cells', () => {
    const level = createLaserPuzzleLevel({
      name: 'Haz piloto',
      difficulty: 'hard',
      cols: 8,
      rows: 6,
      par: 5,
      timeLimit: 90,
      hint: { es: 'Divide y redirige', en: 'Split and redirect' },
      objects: [
        { type: 'ship', at: [0, 2], dir: 'right' },
        { type: 'antenna', at: [7, 1] },
        { type: 'antenna', at: [7, 4] },
        { type: 'bifurcator', at: [1, 5], movable: true },
        { type: 'reflector_ne', at: [6, 0], movable: true },
      ],
      walls: {
        rects: [[1, 0, 7, 0], [3, 1, 3, 4]],
        cells: [[6, 5]],
      },
      solution: [
        { from: [1, 5], to: [3, 2] },
        [[6, 0], [6, 1]],
      ],
    });

    expect(level.cells).toContainEqual({ x: 0, y: 2, type: 'ship', dir: 'right' });
    expect(level.cells).toContainEqual({ x: 1, y: 5, type: 'bifurcator', movable: true });
    expect(level.cells).toContainEqual({ x: 6, y: 5, type: 'wall' });
    expect(level.cells).toContainEqual({ x: 2, y: 0, type: 'wall' });
    expect(level.cells).not.toContainEqual({ x: 6, y: 0, type: 'wall' });
    expect(level.cells).not.toContainEqual({ x: 3, y: 2, type: 'wall' });
    expect(level.cells).not.toContainEqual({ x: 6, y: 1, type: 'wall' });
    expect(level.solutionPlacements).toEqual([
      ['1,5', '3,2'],
      ['6,0', '6,1'],
    ]);
  });

  it('builds full demo level packs by kind', () => {
    const gridLevels = createDemoLevels('grid-flow', [
      {
        cols: 3,
        rows: 3,
        start: [0, 0],
        targets: [{ pickup: [1, 0], drop: [2, 2], color: '#ef4444' }],
      },
    ]);

    const laserLevels = createDemoLevels('laser-puzzle', [
      {
        cols: 3,
        rows: 3,
        objects: [
          { type: 'ship', at: [0, 1], dir: 'right' },
          { type: 'antenna', at: [2, 1] },
        ],
      },
    ]);

    expect(gridLevels).toHaveLength(1);
    expect(gridLevels[0].targets[0].points).toBe(100);
    expect(laserLevels).toHaveLength(1);
    expect(laserLevels[0].par).toBe(1);
  });

  it('imports a full external catalog for demo game 2 and 3 level packs', () => {
    const packs = createDemoLevelPacks({
      schemaVersion: 1,
      gridFlow: [
        {
          cols: 4,
          rows: 4,
          start: '0,3',
          targets: [{ pickup: '1,0', drop: '3,3' }],
          walls: { rects: [[0, 0, 3, 0]] },
        },
      ],
      laserPuzzle: [
        {
          width: 5,
          height: 4,
          objects: [
            { type: 'ship', at: '0,1', dir: 'right' },
            { type: 'antenna', at: '4,1' },
            { type: 'reflector_ne', at: '2,3', movable: true },
          ],
          solution: [{ from: '2,3', to: '2,1' }],
          walls: [[2, 1]],
        },
      ],
    });

    expect(packs.schemaVersion).toBe(1);
    expect(packs.gridFlow[0].startPos).toEqual({ x: 0, y: 3 });
    expect(packs.gridFlow[0].walls).not.toContain('1,0');
    expect(packs.gridFlow[0].walls).not.toContain('3,3');
    expect(packs.laserPuzzle[0].cols).toBe(5);
    expect(packs.laserPuzzle[0].solutionPlacements).toEqual([['2,3', '2,1']]);
    expect(packs.laserPuzzle[0].cells).not.toContainEqual({ x: 2, y: 1, type: 'wall' });
  });

  it('throws clear validation errors for invalid authored coordinates', () => {
    expect(() => createGridFlowLevel({ cols: 2, rows: 2, start: [2, 0], targets: [] }))
      .toThrow(/start.*outside/i);

    expect(() => createLaserPuzzleLevel({ cols: 2, rows: 2, objects: [{ type: 'ship', at: [0, -1] }] }))
      .toThrow(/object.*outside/i);
  });
});
