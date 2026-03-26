import { describe, it, expect } from 'vitest';
import { assignVariant, getExperimentConfig } from './abTesting';

describe('abTesting', () => {
  it('assigns deterministic variant for same user seed', () => {
    const first = assignVariant('report-experiment', 'participant-123', ['control', 'insight-panel']);
    const second = assignVariant('report-experiment', 'participant-123', ['control', 'insight-panel']);
    expect(first).toBe(second);
  });

  it('returns experiment config flags', () => {
    const config = getExperimentConfig('report-experiment', 'participant-456');
    expect(config).toHaveProperty('variant');
    expect(config).toHaveProperty('showTelemetryInsightPanel');
  });
});
