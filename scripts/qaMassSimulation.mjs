import fs from 'node:fs';
import path from 'node:path';

const CALIBRATION_PATH = path.resolve('data/calibration/latest-calibration.json');
const OUT_DIR = path.resolve('reports/qa');
const NOW = new Date().toISOString();

const SEEDS = [101, 202, 303, 404, 505];
const PROFILES = [
  { key: 'base_normal', gt: 1, base: 0.62, spread: 0.09, runtimeErr: 0.002 },
  { key: 'alto_rendimiento', gt: 1, base: 0.78, spread: 0.07, runtimeErr: 0.0015 },
  { key: 'bajo_rendimiento', gt: 0, base: 0.42, spread: 0.10, runtimeErr: 0.003 },
  { key: 'inconsistente_ruidoso', gt: 0, base: 0.55, spread: 0.18, runtimeErr: 0.004 },
];

const ITERATIONS_PER_PROFILE = 2500; // preset estandar: 10,000 por seed
const ACCEPTANCE = {
  minF1: 0.85,
  minAccuracy: 0.88,
  maxFpr: 0.08,
  maxFnr: 0.10,
  maxRuntimeErr: 0.005,
  maxF1Drift: 0.03,
};

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
  const calibration = loadCalibration();
  const seedRuns = SEEDS.map((seed) => runSeed(seed, calibration));
  const agg = aggregate(seedRuns);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jsonOut = {
    generatedAt: NOW,
    config: {
      seeds: SEEDS,
      iterationsPerProfile: ITERATIONS_PER_PROFILE,
      totalIterationsPerSeed: ITERATIONS_PER_PROFILE * PROFILES.length,
      profiles: PROFILES,
      groundTruth: 'Perfil sintetico: base_normal/alto_rendimiento=positivo; bajo_rendimiento/inconsistente=negativo',
      scoringThreshold: calibration.thresholds?.solid ?? null,
      calibrationSource: calibration.input || {},
    },
    acceptance: ACCEPTANCE,
    aggregate: agg,
    seedRuns,
  };

  const md = [];
  md.push('# QA Simulation Multi-Seed Report - 2026-03-27');
  md.push('');
  md.push(`Generated at: ${NOW}`);
  md.push('');
  md.push('## Resumen Ejecutivo');
  md.push(`- Readiness: ${agg.readinessStatus}`);
  md.push(`- Accuracy global promedio: ${toPct(agg.global.accuracy)}`);
  md.push(`- F1 global promedio: ${agg.global.f1.toFixed(4)}`);
  md.push(`- FPR promedio: ${toPct(agg.global.fpr)}`);
  md.push(`- FNR promedio: ${toPct(agg.global.fnr)}`);
  md.push(`- Runtime error promedio: ${toPct(agg.global.runtimeErrorRate)}`);
  md.push(`- Drift F1 entre seeds: ${agg.global.f1Drift.toFixed(4)} (std=${agg.global.f1Std.toFixed(4)})`);
  md.push('');
  md.push('## Configuracion');
  md.push(`- Seeds: ${SEEDS.join(', ')}`);
  md.push(`- Volumen por seed: ${ITERATIONS_PER_PROFILE * PROFILES.length} (4 perfiles x ${ITERATIONS_PER_PROFILE})`);
  md.push(`- Total iteraciones: ${(ITERATIONS_PER_PROFILE * PROFILES.length * SEEDS.length).toLocaleString('en-US')}`);
  md.push(`- Ground truth: ${jsonOut.config.groundTruth}`);
  md.push(`- Umbral de clasificacion (solid): ${Number(jsonOut.config.scoringThreshold).toFixed(4)}`);
  md.push('');
  md.push('## Cumplimiento Umbrales');
  for (const [k, ok] of Object.entries(agg.readiness)) {
    md.push(`- ${ok ? '[PASS]' : '[FAIL]'} ${k}`);
  }
  md.push('');
  md.push('## Resultados Por Seed');
  for (const run of seedRuns) {
    md.push(`- Seed ${run.seed}: acc=${toPct(run.metrics.accuracy)} f1=${run.metrics.f1.toFixed(4)} fpr=${toPct(run.metrics.fpr)} fnr=${toPct(run.metrics.fnr)} runtimeErr=${toPct(run.metrics.runtimeErrorRate)} cm=[tp:${run.confusionMatrix.tp} tn:${run.confusionMatrix.tn} fp:${run.confusionMatrix.fp} fn:${run.confusionMatrix.fn}]`);
  }
  md.push('');
  md.push('## Hallazgos por Severidad');

  const severe = [];
  const moderate = [];
  const mild = [];

  if (!agg.readiness.minF1 || !agg.readiness.minAccuracy) severe.push('Validez de clasificacion debajo de umbral objetivo.');
  if (!agg.readiness.maxFpr) moderate.push('Falsos positivos por encima del maximo esperado.');
  if (!agg.readiness.maxFnr) moderate.push('Falsos negativos por encima del maximo esperado.');
  if (!agg.readiness.maxRuntimeErr) moderate.push('Error runtime supera 0.5% del volumen.');
  if (!agg.readiness.maxF1Drift) moderate.push('Variacion F1 entre seeds supera tolerancia de estabilidad.');
  if (!severe.length && !moderate.length) mild.push('Sin hallazgos criticos; mantener monitoreo continuo por cambios de distribucion.');

  md.push(`- Severo: ${severe.length ? severe.join(' ') : 'Ninguno'}`);
  md.push(`- Moderado: ${moderate.length ? moderate.join(' ') : 'Ninguno'}`);
  md.push(`- Leve: ${mild.length ? mild.join(' ') : 'Ninguno'}`);
  md.push('');
  md.push('## Riesgo Residual y Limites');
  md.push('- Los outcomes usados por calibracion base pueden ser sinteticos; no sustituyen validacion con etiquetas HR reales.');
  md.push('- Esta corrida modela perfiles sinteticos con distribucion gaussiana y ruido controlado.');
  md.push('- Se recomienda repetir con outcomes historicos etiquetados cuando esten disponibles.');
  md.push('');
  md.push('## Recomendaciones Priorizadas');
  md.push('- Alta: incorporar outcomes historicos etiquetados para reemplazar proxy deterministico en calibracion.');
  md.push('- Media: ejecutar smoke estadistico diario (2k por juego, 3 seeds) como gate no bloqueante.');
  md.push('- Baja: adicionar dashboard de drift por perfil para vigilar FN en segmento inconsistente.');

  const jsonPath = path.join(OUT_DIR, 'SIMULATION_MULTI_SEED_2026-03-27.json');
  const mdPath = path.join(OUT_DIR, 'SIMULATION_MULTI_SEED_2026-03-27.md');

  fs.writeFileSync(jsonPath, `${JSON.stringify(jsonOut, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, `${md.join('\n')}\n`, 'utf8');

  console.log(`Saved: ${jsonPath}`);
  console.log(`Saved: ${mdPath}`);
  console.log(`Readiness: ${agg.readinessStatus}`);
  console.log(`Global -> accuracy=${toPct(agg.global.accuracy)} f1=${agg.global.f1.toFixed(4)} fpr=${toPct(agg.global.fpr)} fnr=${toPct(agg.global.fnr)} runtimeErr=${toPct(agg.global.runtimeErrorRate)} drift=${agg.global.f1Drift.toFixed(4)}`);
}

main();
