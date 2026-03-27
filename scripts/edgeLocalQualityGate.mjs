import fs from 'node:fs';
import path from 'node:path';
import { generateEdgeLocalReport } from '../src/services/edgeLocalInferenceService.js';

const OUT_DIR = path.resolve('reports/qa');
const NOW = new Date().toISOString();
const DATE_TAG = NOW.slice(0, 10);

const ACCEPTANCE = {
  maxLatencyP95Ms: Number(process.env.EDGE_QA_MAX_P95_MS || 300),
  maxMemoryPeakMb: Number(process.env.EDGE_QA_MAX_MEMORY_MB || 250),
  maxInferenceErrorRate: Number(process.env.EDGE_QA_MAX_ERROR_RATE || 0.015),
  minF1: Number(process.env.EDGE_QA_MIN_F1 || 0.72),
  maxEce: Number(process.env.EDGE_QA_MAX_ECE || 0.1),
};

const FAIL_ON_BREACH = String(process.env.EDGE_QA_FAIL_ON_BREACH || 'false').toLowerCase() === 'true';
const RUNS_PER_PROFILE = Number(process.env.EDGE_QA_RUNS_PER_PROFILE || 220);
const COHORTS = String(process.env.EDGE_QA_COHORTS || 'general,operations,tech')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);

const PROFILES = [
  { key: 'high_performer', gt: 1, scoreBase: 84, scoreSpread: 8, errorBase: 2, durationBase: 54000, webcamQuality: 82, hesitation: 5 },
  { key: 'solid_performer', gt: 1, scoreBase: 72, scoreSpread: 9, errorBase: 4, durationBase: 59000, webcamQuality: 74, hesitation: 8 },
  { key: 'at_risk', gt: 0, scoreBase: 51, scoreSpread: 11, errorBase: 9, durationBase: 76000, webcamQuality: 59, hesitation: 15 },
  { key: 'unstable_signal', gt: 0, scoreBase: 57, scoreSpread: 15, errorBase: 11, durationBase: 81000, webcamQuality: 48, hesitation: 20 },
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

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
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function percentile(values, p) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[clamp(idx, 0, sorted.length - 1)];
}

function mean(values) {
  return values.reduce((acc, value) => acc + value, 0) / Math.max(values.length, 1);
}

function computeEce(probabilities, labels, bins = 10) {
  const n = probabilities.length || 1;
  let total = 0;

  for (let b = 0; b < bins; b += 1) {
    const min = b / bins;
    const max = (b + 1) / bins;
    const bucket = probabilities
      .map((prob, i) => ({ prob, label: labels[i] }))
      .filter((row) => row.prob >= min && (b === bins - 1 ? row.prob <= max : row.prob < max));

    if (!bucket.length) continue;

    const confidence = mean(bucket.map((row) => row.prob));
    const accuracy = mean(bucket.map((row) => row.label));
    total += (bucket.length / n) * Math.abs(accuracy - confidence);
  }

  return total;
}

function computeClassificationMetrics(predictions, labels) {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (let i = 0; i < predictions.length; i += 1) {
    const pred = predictions[i];
    const gt = labels[i];

    if (pred === 1 && gt === 1) tp += 1;
    else if (pred === 0 && gt === 0) tn += 1;
    else if (pred === 1 && gt === 0) fp += 1;
    else fn += 1;
  }

  const accuracy = (tp + tn) / Math.max(1, labels.length);
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);

  return { accuracy, precision, recall, f1, tp, tn, fp, fn };
}

function randomSeries(rand, count, base, spread) {
  const arr = [];
  for (let i = 0; i < count; i += 1) {
    arr.push(base + (gaussian(rand) * spread));
  }
  return arr;
}

function buildSession(rand, profile) {
  const sessionData = {};

  for (let game = 1; game <= 13; game += 1) {
    const gameKey = `game${game}`;

    const score = clamp(profile.scoreBase + (gaussian(rand) * profile.scoreSpread), 20, 99);
    const errors = Math.round(clamp(profile.errorBase + Math.abs(gaussian(rand) * 3), 0, 28));
    const duration = Math.round(clamp(profile.durationBase + (gaussian(rand) * 9000), 18000, 170000));

    const trialEventsCount = Math.round(clamp(35 + Math.abs(gaussian(rand) * 18), 12, 90));
    const cursorCount = Math.round(clamp(trialEventsCount * (1.9 + Math.abs(gaussian(rand) * 0.45)), 30, 320));
    const clickCount = Math.round(clamp(trialEventsCount * (0.42 + Math.abs(gaussian(rand) * 0.08)), 8, 80));
    const webcamCount = Math.round(clamp(trialEventsCount * (0.7 + Math.abs(gaussian(rand) * 0.22)), 6, 90));

    const webcamQuality = clamp(profile.webcamQuality + (gaussian(rand) * 7), 20, 95);
    const hesitation = clamp(profile.hesitation + Math.abs(gaussian(rand) * 5), 1, 35);

    const webcamFrames = Array.from({ length: webcamCount }, (_, idx) => ({
      timestamp: idx,
      faceDetected: rand() > (profile.key === 'unstable_signal' ? 0.35 : 0.12),
      blinkDetected: rand() < (profile.key === 'high_performer' ? 0.015 : 0.028),
      headPose: {
        yaw: Math.round(gaussian(rand) * (profile.key === 'unstable_signal' ? 14 : 8)),
        pitch: Math.round(gaussian(rand) * (profile.key === 'unstable_signal' ? 11 : 6)),
      },
    }));

    sessionData[gameKey] = {
      score,
      errors,
      duration,
      trialEvents: randomSeries(rand, trialEventsCount, 1, 0.2).map((x, idx) => ({ t: idx, s: x })),
      mouseMovements: randomSeries(rand, cursorCount, 1, 0.3).map((x, idx) => ({ x: x * 100, y: x * 100, timestamp: idx * 16 })),
      clicks: randomSeries(rand, clickCount, 1, 0.5).map((x, idx) => ({ x: x * 100, y: x * 100, timestamp: idx * 100 })),
      webcamFrames,
      webcamQualityScore: webcamQuality,
      cursorMetrics: {
        avgVelocity: clamp(780 + (gaussian(rand) * 290), 80, 2100),
        hesitationCount: hesitation,
      },
      qualityFlags: webcamQuality < 55 ? ['insufficient_webcam_signal'] : [],
      consentSnapshot: {
        cursor: true,
        webcam: true,
      },
    };
  }

  return sessionData;
}

function resolvePrediction(report) {
  const rec = String(report?.recommendation || '').toUpperCase();
  if (rec.includes('STRONG ALIGNMENT') || rec.includes('SOLID ALIGNMENT')) return 1;
  return 0;
}

function resolvePositiveProbability(report) {
  const confidence = clamp(Number(report?.confidenceScore || 0) / 100, 0, 1);
  const recommendation = String(report?.recommendation || '').toUpperCase();

  let tierBase = 0.5;
  if (recommendation.includes('STRONG ALIGNMENT')) tierBase = 0.96;
  else if (recommendation.includes('SOLID ALIGNMENT')) tierBase = 0.9;
  else if (recommendation.includes('CONDITIONAL ALIGNMENT')) tierBase = 0.1;
  else tierBase = 0.04;

  const confidenceAdjustment = (confidence - 0.5) * 0.1;
  return clamp(tierBase + confidenceAdjustment, 0.01, 0.99);
}

function evaluateEdgeQuality() {
  const rand = mulberry32(27032026);

  const latencies = [];
  const memories = [];
  const labels = [];
  const predictions = [];
  const probabilities = [];
  let failures = 0;
  const total = RUNS_PER_PROFILE * PROFILES.length * COHORTS.length;

  for (const cohort of COHORTS) {
    for (const profile of PROFILES) {
      for (let run = 0; run < RUNS_PER_PROFILE; run += 1) {
        const participantId = `${cohort}-${profile.key}-${run}`;
        const sessionData = buildSession(rand, profile);

        try {
          const report = generateEdgeLocalReport(sessionData, 'en', { participantId, cohort });
          if (!report) {
            failures += 1;
            continue;
          }

          latencies.push(Number(report.runtime?.latencyMs || 0));
          memories.push(Number(report.runtime?.estimatedMemoryMb || 0));

          labels.push(profile.gt);
          predictions.push(resolvePrediction(report));
          probabilities.push(resolvePositiveProbability(report));
        } catch {
          failures += 1;
        }
      }
    }
  }

  const metrics = computeClassificationMetrics(predictions, labels);
  const ece = computeEce(probabilities, labels);
  const p95Latency = percentile(latencies, 95);
  const memoryPeak = Math.max(...memories, 0);
  const inferenceErrorRate = failures / Math.max(1, total);

  const readiness = {
    latencyP95: p95Latency <= ACCEPTANCE.maxLatencyP95Ms,
    memoryPeak: memoryPeak <= ACCEPTANCE.maxMemoryPeakMb,
    inferenceErrorRate: inferenceErrorRate <= ACCEPTANCE.maxInferenceErrorRate,
    f1: metrics.f1 >= ACCEPTANCE.minF1,
    ece: ece <= ACCEPTANCE.maxEce,
  };

  return {
    generatedAt: NOW,
    config: {
      runsPerProfile: RUNS_PER_PROFILE,
      cohorts: COHORTS,
      profiles: PROFILES,
      failOnBreach: FAIL_ON_BREACH,
    },
    acceptance: ACCEPTANCE,
    results: {
      totalRuns: total,
      successfulRuns: predictions.length,
      failures,
      p95LatencyMs: p95Latency,
      memoryPeakMb: memoryPeak,
      inferenceErrorRate,
      accuracy: metrics.accuracy,
      precision: metrics.precision,
      recall: metrics.recall,
      f1: metrics.f1,
      ece,
      confusionMatrix: {
        tp: metrics.tp,
        tn: metrics.tn,
        fp: metrics.fp,
        fn: metrics.fn,
      },
    },
    readiness,
    readinessStatus: Object.values(readiness).every(Boolean) ? 'ready' : 'needs-attention',
  };
}

function writeReports(report) {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const jsonPath = path.join(OUT_DIR, `EDGE_LOCAL_QUALITY_${DATE_TAG}.json`);
  const mdPath = path.join(OUT_DIR, `EDGE_LOCAL_QUALITY_${DATE_TAG}.md`);
  const latestJsonPath = path.join(OUT_DIR, 'EDGE_LOCAL_QUALITY_latest.json');
  const latestMdPath = path.join(OUT_DIR, 'EDGE_LOCAL_QUALITY_latest.md');

  const md = [
    `# Edge Local Quality Report - ${DATE_TAG}`,
    '',
    `Generated at: ${report.generatedAt}`,
    `Readiness: ${report.readinessStatus}`,
    '',
    '## Metrics',
    `- p95 latency: ${report.results.p95LatencyMs.toFixed(2)} ms`,
    `- memory peak: ${report.results.memoryPeakMb.toFixed(2)} MB`,
    `- inference error rate: ${(report.results.inferenceErrorRate * 100).toFixed(2)}%`,
    `- F1: ${report.results.f1.toFixed(4)}`,
    `- ECE: ${report.results.ece.toFixed(4)}`,
    '',
    '## Confusion Matrix',
    `- TP: ${report.results.confusionMatrix.tp}`,
    `- TN: ${report.results.confusionMatrix.tn}`,
    `- FP: ${report.results.confusionMatrix.fp}`,
    `- FN: ${report.results.confusionMatrix.fn}`,
  ];

  fs.writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(mdPath, `${md.join('\n')}\n`, 'utf8');
  fs.writeFileSync(latestJsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  fs.writeFileSync(latestMdPath, `${md.join('\n')}\n`, 'utf8');

  return { jsonPath, mdPath, latestJsonPath, latestMdPath };
}

function main() {
  const report = evaluateEdgeQuality();
  const files = writeReports(report);

  console.log(`Saved: ${files.jsonPath}`);
  console.log(`Saved: ${files.mdPath}`);
  console.log(`Saved: ${files.latestJsonPath}`);
  console.log(`Saved: ${files.latestMdPath}`);
  console.log(`Readiness: ${report.readinessStatus}`);

  if (FAIL_ON_BREACH && report.readinessStatus !== 'ready') {
    const breaches = Object.entries(report.readiness)
      .filter(([, ok]) => !ok)
      .map(([key]) => key)
      .join(', ');
    console.error(`EDGE QA gate failed: ${breaches}`);
    process.exit(1);
  }
}

main();
