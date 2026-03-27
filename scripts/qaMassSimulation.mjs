import fs from 'node:fs';
import path from 'node:path';

const CALIBRATION_PATH = path.resolve('data/calibration/latest-calibration.json');
const OUT_DIR = path.resolve('reports/qa');
const NOW = new Date().toISOString();
const DATE_TAG = NOW.slice(0, 10);

const PRESET = (process.env.QA_SIM_PRESET || 'standard').toLowerCase();
const PRESET_CONFIG = {
  standard: {
    seeds: [101, 202, 303, 404, 505],
    iterationsPerProfile: 2500,
  },
  fast: {
    seeds: [101, 202, 303],
    iterationsPerProfile: 500,
  },
};

const selectedPreset = PRESET_CONFIG[PRESET] || PRESET_CONFIG.standard;
const SEEDS = process.env.QA_SIM_SEEDS
  ? process.env.QA_SIM_SEEDS.split(',').map((x) => Number(x.trim())).filter(Number.isFinite)
  : selectedPreset.seeds;
const ITERATIONS_PER_PROFILE = Number(process.env.QA_SIM_ITERATIONS_PER_PROFILE || selectedPreset.iterationsPerProfile);

const ACCEPTANCE = {
  minF1: Number(process.env.QA_SIM_MIN_F1 || 0.85),
  minAccuracy: Number(process.env.QA_SIM_MIN_ACCURACY || 0.88),
  maxFpr: Number(process.env.QA_SIM_MAX_FPR || 0.08),
  maxFnr: Number(process.env.QA_SIM_MAX_FNR || 0.10),
  maxRuntimeErr: Number(process.env.QA_SIM_MAX_RUNTIME_ERR || 0.005),
  maxF1Drift: Number(process.env.QA_SIM_MAX_F1_DRIFT || 0.03),
};

const FAIL_ON_BREACH = String(process.env.QA_SIM_FAIL_ON_BREACH || 'false').toLowerCase() === 'true';

const PROFILES = [
  { key: 'base_normal', gt: 1, base: 0.62, spread: 0.09, runtimeErr: 0.002 },
  { key: 'alto_rendimiento', gt: 1, base: 0.78, spread: 0.07, runtimeErr: 0.0015 },
  { key: 'bajo_rendimiento', gt: 0, base: 0.42, spread: 0.10, runtimeErr: 0.003 },
  { key: 'inconsistente_ruidoso', gt: 0, base: 0.55, spread: 0.18, runtimeErr: 0.004 },
];

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6D2B79F5;
    let x = Math.imul(t ^ (t >>> 15), 1 | t);
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function gaussian(rand) {
  const u = Math.max(rand(), 1e-9);
  const v = Math.max(rand(), 1e-9);
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function mean(values) {
  return values.reduce((a, b) => a + b, 0) / (values.length || 1);
}

function std(values) {
  const m = mean(values);
  const v = mean(values.map((x) => (x - m) ** 2));
  return Math.sqrt(v);
}

function loadCalibration() {
  if (!fs.existsSync(CALIBRATION_PATH)) {
    throw new Error('Missing calibration file: data/calibration/latest-calibration.json');
  }
  return JSON.parse(fs.readFileSync(CALIBRATION_PATH, 'utf8'));
}

function scoreParticipant(features, weights, gameKeys) {
  let weighted = 0;
  let totalW = 0;
  for (const key of gameKeys) {
    const w = Number(weights[key] || 1);
    const v = Number(features[key] || 0);
    weighted += w * v;
    totalW += w;
  }
  return totalW > 0 ? weighted / totalW : 0;
}

function computeMetrics(conf) {
  const { tp, tn, fp, fn, runtimeErrors, total } = conf;
  const accuracy = (tp + tn) / Math.max(1, total);
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  const fpr = fp / Math.max(1, fp + tn);
  const fnr = fn / Math.max(1, fn + tp);
  const runtimeErrorRate = runtimeErrors / Math.max(1, total);
  return { accuracy, precision, recall, f1, fpr, fnr, runtimeErrorRate };
}

function runSeed(seed, calibration) {
  const rand = mulberry32(seed);
  const weights = calibration.weights || {};
  const gameKeys = Object.keys(weights).sort();
  const threshold = Number(calibration.thresholds?.solid || 0.5);

  const conf = { tp: 0, tn: 0, fp: 0, fn: 0, runtimeErrors: 0, total: 0 };
  const byProfile = {};

  for (const profile of PROFILES) {
    byProfile[profile.key] = { tp: 0, tn: 0, fp: 0, fn: 0, runtimeErrors: 0, total: 0 };

    for (let i = 0; i < ITERATIONS_PER_PROFILE; i += 1) {
      const features = {};
      const rhythmJitter = gaussian(rand) * 0.03;
      const controlPenalty = profile.key === 'inconsistente_ruidoso' ? Math.abs(gaussian(rand)) * 0.06 : 0;

      for (let g = 1; g <= 13; g += 1) {
        const gameKey = `game${g}`;
        const baseSignal = profile.base + (gaussian(rand) * profile.spread) + rhythmJitter;
        const gameShift = ((g % 3) - 1) * 0.015;
        features[gameKey] = clamp(baseSignal + gameShift - controlPenalty, 0, 1);
      }

      const runtimeErr = rand() < profile.runtimeErr;
      const gt = profile.gt;
      const score = scoreParticipant(features, weights, gameKeys);
      const pred = score >= threshold ? 1 : 0;

      conf.total += 1;
      byProfile[profile.key].total += 1;

      if (runtimeErr) {
        conf.runtimeErrors += 1;
        byProfile[profile.key].runtimeErrors += 1;
      }

      if (pred === 1 && gt === 1) {
        conf.tp += 1;
        byProfile[profile.key].tp += 1;
      } else if (pred === 0 && gt === 0) {
        conf.tn += 1;
        byProfile[profile.key].tn += 1;
      } else if (pred === 1 && gt === 0) {
        conf.fp += 1;
        byProfile[profile.key].fp += 1;
      } else {
        conf.fn += 1;
        byProfile[profile.key].fn += 1;
      }
    }
  }

  return {
    seed,
    threshold,
    total: conf.total,
    confusionMatrix: { tp: conf.tp, tn: conf.tn, fp: conf.fp, fn: conf.fn },
    metrics: computeMetrics(conf),
    byProfile: Object.fromEntries(Object.entries(byProfile).map(([k, c]) => [k, {
      total: c.total,
      confusionMatrix: { tp: c.tp, tn: c.tn, fp: c.fp, fn: c.fn },
      metrics: computeMetrics(c),
    }])),
  };
}

function aggregate(seedRuns) {
  const f1s = seedRuns.map((r) => r.metrics.f1);
  const accuracies = seedRuns.map((r) => r.metrics.accuracy);
  const fprs = seedRuns.map((r) => r.metrics.fpr);
  const fnrs = seedRuns.map((r) => r.metrics.fnr);
  const runtimeErrs = seedRuns.map((r) => r.metrics.runtimeErrorRate);

  const global = {
    accuracy: mean(accuracies),
    f1: mean(f1s),
    fpr: mean(fprs),
    fnr: mean(fnrs),
    runtimeErrorRate: mean(runtimeErrs),
    f1Std: std(f1s),
    f1Drift: Math.max(...f1s) - Math.min(...f1s),
  };

  const readiness = {
    minF1: global.f1 >= ACCEPTANCE.minF1,
    minAccuracy: global.accuracy >= ACCEPTANCE.minAccuracy,
    maxFpr: global.fpr <= ACCEPTANCE.maxFpr,
    maxFnr: global.fnr <= ACCEPTANCE.maxFnr,
    maxRuntimeErr: global.runtimeErrorRate <= ACCEPTANCE.maxRuntimeErr,
    maxF1Drift: global.f1Drift <= ACCEPTANCE.maxF1Drift,
  };

  const allPass = Object.values(readiness).every(Boolean);

  return {
    global,
    readiness,
    readinessStatus: allPass ? 'listo' : 'casi-listo',
  };
}

function toPct(v) {
  return `${(v * 100).toFixed(2)}%`;
}

function main() {
  if (!SEEDS.length || !Number.isFinite(ITERATIONS_PER_PROFILE) || ITERATIONS_PER_PROFILE < 1) {
    throw new Error('Invalid simulation config. Check QA_SIM_SEEDS and QA_SIM_ITERATIONS_PER_PROFILE.');
  }

  const calibration = loadCalibration();
  const seedRuns = SEEDS.map((seed) => runSeed(seed, calibration));
  const agg = aggregate(seedRuns);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jsonOut = {
    generatedAt: NOW,
    config: {
      preset: PRESET,
      seeds: SEEDS,
      iterationsPerProfile: ITERATIONS_PER_PROFILE,
      totalIterationsPerSeed: ITERATIONS_PER_PROFILE * PROFILES.length,
      profiles: PROFILES,
      groundTruth: 'Perfil sintetico: base_normal/alto_rendimiento=positivo; bajo_rendimiento/inconsistente=negativo',
      scoringThreshold: calibration.thresholds?.solid ?? null,
      calibrationSource: calibration.input || {},
      failOnBreach: FAIL_ON_BREACH,
    },
    acceptance: ACCEPTANCE,
    aggregate: agg,
    seedRuns,
  };

  const md = [];
  md.push(`# QA Simulation Multi-Seed Report - ${DATE_TAG}`);
  md.push('');
  md.push(`Generated at: ${NOW}`);
  md.push(`Preset: ${PRESET}`);
  md.push('');
  md.push('## Resumen Ejecutivo');
  md.push(`- Readiness: ${agg.readinessStatus}`);
  md.push(`- Accuracy global promedio: ${toPct(agg.global.accuracy)}`);
  md.push(`- F1 global promedio: ${agg.global.f1.toFixed(4)}`);
  md.push(`- FPR promedio: ${toPct(agg.global.fpr)}`);
  md.push(`- FNR promedio: ${toPct(agg.global.fnr)}`);
  md.push(`- Runtime error promedio: ${toPct(agg.global.runtimeErrorRate)}`);
  md.push(`- Drift F1 entre seeds: ${agg.global.f1Drift.toFixed(4)} (std=${agg.global.f1Std.toFixed(4)})`);

  const jsonPath = path.join(OUT_DIR, `SIMULATION_MULTI_SEED_${DATE_TAG}.json`);
  const mdPath = path.join(OUT_DIR, `SIMULATION_MULTI_SEED_${DATE_TAG}.md`);
  const latestJsonPath = path.join(OUT_DIR, 'SIMULATION_MULTI_SEED_latest.json');
  const latestMdPath = path.join(OUT_DIR, 'SIMULATION_MULTI_SEED_latest.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(jsonOut, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, `${md.join('\n')}\n`, 'utf8');
  fs.writeFileSync(latestJsonPath, `${JSON.stringify(jsonOut, null, 2)}\n`, 'utf8');
  fs.writeFileSync(latestMdPath, `${md.join('\n')}\n`, 'utf8');

  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${mdPath}`);
  console.log(`Saved: ${latestJsonPath}`);
  console.log(`Saved: ${latestMdPath}`);
  console.log(`Readiness: ${agg.readinessStatus}`);
  console.log(`Global -> accuracy=${toPct(agg.global.accuracy)} f1=${agg.global.f1.toFixed(4)} fpr=${toPct(agg.global.fpr)} fnr=${toPct(agg.global.fnr)} runtimeErr=${toPct(agg.global.runtimeErrorRate)} drift=${agg.global.f1Drift.toFixed(4)}`);

  if (FAIL_ON_BREACH) {
    const breaches = [];
    if (!agg.readiness.maxFpr) breaches.push(`FPR breach (${agg.global.fpr.toFixed(4)} > ${ACCEPTANCE.maxFpr})`);
    if (!agg.readiness.maxFnr) breaches.push(`FNR breach (${agg.global.fnr.toFixed(4)} > ${ACCEPTANCE.maxFnr})`);

    if (breaches.length) {
      console.error(`QA gate failed: ${breaches.join(' | ')}`);
      process.exit(1);
    }
  }
}

main();
