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
    expect(LASER_DEMO_LEVELS[4].quiz.length).toBeGreaterThan(0);
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