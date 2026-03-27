import fs from 'node:fs';

export const DEFAULT_ACCEPTANCE = {
  minF1: 0.85,
  minAccuracy: 0.88,
  maxFpr: 0.08,
  maxFnr: 0.10,
  maxRuntimeErr: 0.005,
  maxF1Drift: 0.03,
};

const FAST_PRESET_DEFAULTS = {
  maxFpr: 0.09,
  maxFnr: 0.11,
};

export function buildAcceptance({ preset = 'standard', env = process.env } = {}) {
  const isFast = String(preset).toLowerCase() === 'fast';
  const base = {
    ...DEFAULT_ACCEPTANCE,
    ...(isFast ? FAST_PRESET_DEFAULTS : {}),
  };

  return {
    minF1: Number(env.QA_SIM_MIN_F1 || base.minF1),
    minAccuracy: Number(env.QA_SIM_MIN_ACCURACY || base.minAccuracy),
    maxFpr: Number(env.QA_SIM_MAX_FPR || base.maxFpr),
    maxFnr: Number(env.QA_SIM_MAX_FNR || base.maxFnr),
    maxRuntimeErr: Number(env.QA_SIM_MAX_RUNTIME_ERR || base.maxRuntimeErr),
    maxF1Drift: Number(env.QA_SIM_MAX_F1_DRIFT || base.maxF1Drift),
  };
}

export function evaluateReadiness(global, acceptance) {
  const readiness = {
    minF1: global.f1 >= acceptance.minF1,
    minAccuracy: global.accuracy >= acceptance.minAccuracy,
    maxFpr: global.fpr <= acceptance.maxFpr,
    maxFnr: global.fnr <= acceptance.maxFnr,
    maxRuntimeErr: global.runtimeErrorRate <= acceptance.maxRuntimeErr,
    maxF1Drift: global.f1Drift <= acceptance.maxF1Drift,
  };

  return {
    readiness,
    readinessStatus: Object.values(readiness).every(Boolean) ? 'listo' : 'casi-listo',
  };
}

export function gateBreaches(global, acceptance, keys = ['maxFpr', 'maxFnr']) {
  const labels = {
    maxFpr: ['FPR', global.fpr, acceptance.maxFpr, '<='],
    maxFnr: ['FNR', global.fnr, acceptance.maxFnr, '<='],
    minF1: ['F1', global.f1, acceptance.minF1, '>='],
    minAccuracy: ['Accuracy', global.accuracy, acceptance.minAccuracy, '>='],
    maxRuntimeErr: ['RuntimeErr', global.runtimeErrorRate, acceptance.maxRuntimeErr, '<='],
    maxF1Drift: ['F1Drift', global.f1Drift, acceptance.maxF1Drift, '<='],
  };

  const { readiness } = evaluateReadiness(global, acceptance);
  return keys
    .filter((k) => readiness[k] === false)
    .map((k) => {
      const [name, actual, target, op] = labels[k];
      return `${name} breach (${actual.toFixed(4)} ${op === '<=' ? '>' : '<'} ${target})`;
    });
}

export function toSeedMarkdownTable(seedRuns) {
  const header = '| Seed | Accuracy | F1 | FPR | FNR | RuntimeErr | TP | TN | FP | FN |';
  const sep = '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|';
  const rows = seedRuns.map((run) => {
    const m = run.metrics;
    const cm = run.confusionMatrix;
    return `| ${run.seed} | ${(m.accuracy * 100).toFixed(2)}% | ${m.f1.toFixed(4)} | ${(m.fpr * 100).toFixed(2)}% | ${(m.fnr * 100).toFixed(2)}% | ${(m.runtimeErrorRate * 100).toFixed(2)}% | ${cm.tp} | ${cm.tn} | ${cm.fp} | ${cm.fn} |`;
  });
  return [header, sep, ...rows].join('\n');
}

export function readJsonSafe(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
