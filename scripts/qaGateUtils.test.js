import { describe, it, expect } from 'vitest';
import { buildAcceptance, evaluateReadiness, gateBreaches, toSeedMarkdownTable } from './qaGateUtils.mjs';

describe('qaGateUtils', () => {
  it('applies fast preset relaxed defaults for FPR/FNR', () => {
    const acceptance = buildAcceptance({ preset: 'fast', env: {} });
    expect(acceptance.maxFpr).toBe(0.09);
    expect(acceptance.maxFnr).toBe(0.11);
  });

  it('evaluates readiness and detects breaches', () => {
    const global = {
      accuracy: 0.91,
      f1: 0.9,
      fpr: 0.095,
      fnr: 0.07,
      runtimeErrorRate: 0.002,
      f1Drift: 0.01,
    };
    const acceptance = {
      minF1: 0.85,
      minAccuracy: 0.88,
      maxFpr: 0.08,
      maxFnr: 0.1,
      maxRuntimeErr: 0.005,
      maxF1Drift: 0.03,
    };

    const { readiness, readinessStatus } = evaluateReadiness(global, acceptance);
    expect(readinessStatus).toBe('casi-listo');
    expect(readiness.maxFpr).toBe(false);

    const breaches = gateBreaches(global, acceptance, ['maxFpr', 'maxFnr']);
    expect(breaches.length).toBe(1);
    expect(breaches[0]).toContain('FPR breach');
  });

  it('renders seed table markdown with expected columns', () => {
    const table = toSeedMarkdownTable([
      {
        seed: 101,
        metrics: {
          accuracy: 0.93,
          f1: 0.92,
          fpr: 0.07,
          fnr: 0.05,
          runtimeErrorRate: 0.002,
        },
        confusionMatrix: { tp: 4700, tn: 4600, fp: 300, fn: 400 },
      },
    ]);

    expect(table).toContain('| Seed | Accuracy | F1 | FPR | FNR | RuntimeErr | TP | TN | FP | FN |');
    expect(table).toContain('| 101 | 93.00% | 0.9200 | 7.00% | 5.00% | 0.20% | 4700 | 4600 | 300 | 400 |');
  });
});
