import { describe, it, expect } from 'vitest';
import { generateDummyReportData } from './dummyDataGenerator';

const REQUIRED_GAME_IDS = [
  'ospan_game_1',
  'sst_game_2',
  'tsw_game_3',
  'cpt_game_4',
  'dec_game_5',
  'rsh_game_6',
  'sjt_game_7',
  'game8',
  'game9',
  'game10',
  'game11',
  'game12',
  'game13',
];

describe('dummyDataGenerator', () => {
  it('covers all report games with dummy snapshots', () => {
    const dummy = generateDummyReportData();

    REQUIRED_GAME_IDS.forEach((id) => {
      expect(dummy[id]).toBeDefined();
    });
  });

  it('keeps a consistent telemetry structure for all games', () => {
    const dummy = generateDummyReportData();

    REQUIRED_GAME_IDS.forEach((id) => {
      const snapshot = dummy[id];
      expect(typeof snapshot.score).toBe('number');
      expect(typeof snapshot.errors).toBe('number');
      expect(typeof snapshot.duration).toBe('number');
      expect(snapshot.details).toBeTypeOf('object');
      expect(Array.isArray(snapshot.mouseMovements)).toBe(true);
      expect(Array.isArray(snapshot.clicks)).toBe(true);
      expect(Array.isArray(snapshot.trialEvents)).toBe(true);
      expect(Array.isArray(snapshot.webcamFrames)).toBe(true);
      expect(snapshot.cursorMetrics).toBeTypeOf('object');
    });
  });
});
