import { describe, it, expect } from 'vitest';
import { getGridDemoBriefing } from './GridFlowGame';
import { getLaserDemoBriefing } from './LaserPuzzleGame';

describe('progressive demo briefings', () => {
  it('keeps Grid Flow instructions progressive for all adaptive level indexes', () => {
    const intro = getGridDemoBriefing(0, 'es');
    const hardIntro = getGridDemoBriefing(1, 'es');
    const energy = getGridDemoBriefing(2, 'es');
    const optimized = getGridDemoBriefing(5, 'es');

    expect(intro.title).toMatch(/paso 1/i);
    expect(intro.body).toMatch(/mover|recoger|entregar/i);
    expect(hardIntro.body).toMatch(/mismo flujo/i);
    expect(energy.body).toMatch(/energ/i);
    expect(optimized.body).toMatch(/planifica|prioriza/i);
  });

  it('keeps Laser Puzzle instructions progressive for all adaptive level indexes', () => {
    const mirrors = getLaserDemoBriefing(0, 'es');
    const split = getLaserDemoBriefing(1, 'es');
    const portals = getLaserDemoBriefing(5, 'es');

    expect(mirrors.title).toMatch(/paso 1/i);
    expect(mirrors.body).toMatch(/espejo|haz/i);
    expect(split.body).toMatch(/bifurcador|divide/i);
    expect(portals.body).toMatch(/portal|obstáculos/i);
  });
});
