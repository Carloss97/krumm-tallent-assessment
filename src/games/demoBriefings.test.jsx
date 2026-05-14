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

  it('keeps Laser Puzzle instructions aligned with the extracted PDF maps', () => {
    const firstMap = getLaserDemoBriefing(0, 'es');
    const bifurcatorMap = getLaserDemoBriefing(5, 'es');
    const portalMap = getLaserDemoBriefing(8, 'es');

    expect(firstMap.title).toMatch(/mapa pdf 1/i);
    expect(firstMap.body).toMatch(/reflectores|haz|ruta/i);
    expect(bifurcatorMap.body).toMatch(/bifurcadores|piezas móviles/i);
    expect(portalMap.body).toMatch(/portales enlazados|meteoritos/i);
  });
});
