import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const DB_PATH = path.resolve('server/app.db');
const OUT_DIR = path.resolve('data/calibration');
const OUTCOMES_PATH = path.resolve('data/calibration/outcomes.json');

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const quantile = (values, q) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const pos = (sorted.length - 1) * q;
  const base = Math.floor(pos);
  const rest = pos - base;
  if (sorted[base + 1] !== undefined) {
    return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
  }
  return sorted[base];
};

const mean = (values) => values.reduce((acc, n) => acc + n, 0) / (values.length || 1);

const variance = (values) => {
  const m = mean(values);
  return mean(values.map((v) => (v - m) ** 2));
};

const stdDev = (values) => Math.sqrt(variance(values));

const pearson = (x, y) => {
  if (!x.length || x.length !== y.length) return 0;
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < x.length; i += 1) {
    const xv = x[i] - mx;
    const yv = y[i] - my;
    num += xv * yv;
    dx += xv * xv;
    dy += yv * yv;
  }
  const denom = Math.sqrt(dx * dy);
  if (!denom) return 0;
  return num / denom;
};

const rank = (arr) => {
  const sorted = arr.map((value, index) => ({ value, index })).sort((a, b) => a.value - b.value);
  const ranks = new Array(arr.length);
  for (let i = 0; i < sorted.length; i += 1) {
    ranks[sorted[i].index] = i + 1;
  }
  return ranks;
};

const spearman = (x, y) => pearson(rank(x), rank(y));

const rocAuc = (scores, labels) => {
  const pairs = scores.map((score, i) => ({ score, label: labels[i] }));
  const positives = pairs.filter((p) => p.label === 1);
  const negatives = pairs.filter((p) => p.label === 0);
  if (!positives.length || !negatives.length) return 0.5;

  let wins = 0;
  let ties = 0;
  for (const p of positives) {
    for (const n of negatives) {
      if (p.score > n.score) wins += 1;
      else if (p.score === n.score) ties += 1;
    }
  }
  return (wins + 0.5 * ties) / (positives.length * negatives.length);
};

const prAuc = (scores, labels) => {
  const pairs = scores.map((score, i) => ({ score, label: labels[i] })).sort((a, b) => b.score - a.score);
  const totalPos = labels.filter((l) => l === 1).length;
  if (!totalPos) return 0;

  let tp = 0;
  let fp = 0;
  let prevRecall = 0;
  let area = 0;

  for (const pair of pairs) {
    if (pair.label === 1) tp += 1;
    else fp += 1;

    const precision = tp / (tp + fp);
    const recall = tp / totalPos;
    area += precision * Math.max(0, recall - prevRecall);
    prevRecall = recall;
  }

  return area;
};

const brierScore = (probabilities, labels) => mean(probabilities.map((p, i) => (p - labels[i]) ** 2));

const ece = (probabilities, labels, bins = 10) => {
  const n = probabilities.length || 1;
  let total = 0;

  for (let b = 0; b < bins; b += 1) {
    const min = b / bins;
    const max = (b + 1) / bins;
    const bucket = probabilities
      .map((p, i) => ({ p, y: labels[i] }))
      .filter((row) => row.p >= min && (b === bins - 1 ? row.p <= max : row.p < max));

    if (!bucket.length) continue;
    const conf = mean(bucket.map((row) => row.p));
    const acc = mean(bucket.map((row) => row.y));
    total += (bucket.length / n) * Math.abs(acc - conf);
  }

  return total;
};

const precisionAtK = (scores, labels, fraction) => {
  const k = Math.max(1, Math.round(scores.length * fraction));
  const sorted = scores.map((score, i) => ({ score, label: labels[i] })).sort((a, b) => b.score - a.score).slice(0, k);
  return mean(sorted.map((row) => row.label));
};

const recallAtK = (scores, labels, fraction) => {
  const k = Math.max(1, Math.round(scores.length * fraction));
  const sorted = scores.map((score, i) => ({ score, label: labels[i] })).sort((a, b) => b.score - a.score).slice(0, k);
  const capturedPositives = sorted.filter((row) => row.label === 1).length;
  const totalPositives = labels.filter((l) => l === 1).length;
  if (!totalPositives) return 0;
  return capturedPositives / totalPositives;
};

const deterministicNoise = (seed) => {
  const value = Math.sin(seed * 12.9898) * 43758.5453;
  return value - Math.floor(value);
};

const parseSessionPayload = (payloadText) => {
  let payload;
  try {
    payload = JSON.parse(payloadText || '{}');
  } catch {
    return [];
  }

  if (Array.isArray(payload)) {
    return payload
      .map((entry, index) => {
        const idRaw = String(entry?.id || `game${index + 1}`);
        const normalized = idRaw.match(/\d+/)?.[0] || String(index + 1);
        return {
          gameKey: `game${normalized}`,
          score: Number(entry?.score) || 0,
          errors: Number(entry?.errors) || Number(entry?.metrics?.totalErrors) || 0,
        };
      });
  }

  const source = payload.sessionData || payload;
  return Object.entries(source || {})
    .filter(([key]) => /^game\d+$/i.test(key) || /_game_/.test(key))
    .map(([key, value], index) => {
      const normalized = key.match(/\d+/)?.[0] || String(index + 1);
      return {
        gameKey: `game${normalized}`,
        score: Number(value?.score) || 0,
        errors: Number(value?.errors) || 0,
      };
    });
};

const buildRows = () => {
  const db = new Database(DB_PATH, { readonly: true });
  const sessions = db.prepare('SELECT id, payload FROM sessions ORDER BY id').all();
  db.close();

  return sessions.map((session) => {
    const games = parseSessionPayload(session.payload);
    const features = {};
    const errors = {};
    for (const item of games) {
      features[item.gameKey] = item.score;
      errors[item.gameKey] = item.errors;
    }
    return {
      sessionId: session.id,
      features,
      errors,
    };
  }).filter((row) => Object.keys(row.features).length > 0);
};

const normalizeFeatures = (rows) => {
  const gameKeys = Array.from(new Set(rows.flatMap((row) => Object.keys(row.features)))).sort();
  const scoreRanges = {};
  const errorRanges = {};

  for (const key of gameKeys) {
    const scoreValues = rows.map((row) => row.features[key]).filter((v) => Number.isFinite(v));
    const errorValues = rows.map((row) => row.errors[key]).filter((v) => Number.isFinite(v));
    scoreRanges[key] = {
      min: Math.min(...scoreValues),
      max: Math.max(...scoreValues),
    };
    errorRanges[key] = {
      min: Math.min(...errorValues),
      max: Math.max(...errorValues),
    };
  }

  for (const row of rows) {
    for (const key of gameKeys) {
      const score = Number(row.features[key]);
      const errors = Number(row.errors[key]);
      if (!Number.isFinite(score)) {
        row.features[key] = 0.5;
        continue;
      }

      const scoreRange = scoreRanges[key];
      const errorRange = errorRanges[key];
      const scoreNorm = scoreRange.max > scoreRange.min
        ? (score - scoreRange.min) / (scoreRange.max - scoreRange.min)
        : 0.5;
      const errorNorm = Number.isFinite(errors) && errorRange.max > errorRange.min
        ? (errors - errorRange.min) / (errorRange.max - errorRange.min)
        : 0.5;

      row.features[key] = clamp((scoreNorm * 0.75) + ((1 - errorNorm) * 0.25), 0, 1);
    }
  }

  return gameKeys;
};

const attachOutcomes = (rows, gameKeys) => {
  const outcomes = readJsonIfExists(OUTCOMES_PATH);

  if (Array.isArray(outcomes) && outcomes.length) {
    const byId = new Map(outcomes.map((row) => [Number(row.sessionId), row]));
    let attached = 0;

    for (const row of rows) {
      const ext = byId.get(Number(row.sessionId));
      if (!ext) continue;
      row.success_6m = Number(ext.success_6m) ? 1 : 0;
      row.performance_rank_6m = clamp(Number(ext.performance_rank_6m) || 0, 0, 1);
      row.high_potential = Number(ext.high_potential) ? 1 : 0;
      row.group = typeof ext.group === 'string' ? ext.group : ((row.sessionId % 2 === 0) ? 'group_b' : 'group_a');
      attached += 1;
    }

    if (attached === rows.length) {
      return { outcomeSource: 'labeled-dataset', synthetic: false };
    }
  }

  // Deterministic proxy outcomes when HR labels are not yet available.
  for (const row of rows) {
    const baseline = mean(gameKeys.map((key) => row.features[key] ?? 0.5));
    const g3 = row.features.game3 ?? baseline;
    const g6 = row.features.game6 ?? baseline;
    const novelty = mean([g3, g6]);
    const noise = (deterministicNoise(row.sessionId) - 0.5) * 0.14;
    const successProb = clamp(0.12 + (baseline * 0.68) + (novelty * 0.2) + noise, 0.03, 0.98);

    row.success_6m = successProb >= 0.56 ? 1 : 0;
    row.performance_rank_6m = clamp(successProb + ((deterministicNoise(row.sessionId + 11) - 0.5) * 0.08), 0, 1);
    row.high_potential = novelty >= 0.62 ? 1 : 0;
    row.group = row.sessionId % 2 === 0 ? 'group_b' : 'group_a';
  }

  return { outcomeSource: 'deterministic-proxy', synthetic: true };
};

const calibrateWeights = (rows, gameKeys) => {
  const labels = rows.map((row) => row.success_6m);
  const rawWeights = {};

  for (const key of gameKeys) {
    const x = rows.map((row) => row.features[key] ?? 0);
    const correlation = pearson(x, labels);
    rawWeights[key] = clamp(0.85 + (correlation * 1.15), 0.6, 1.45);
  }

  const avgWeight = mean(Object.values(rawWeights));
  const normalizedWeights = {};
  for (const key of gameKeys) {
    normalizedWeights[key] = Number((rawWeights[key] / avgWeight).toFixed(3));
  }

  return normalizedWeights;
};

const scoreWithWeights = (features, weights, gameKeys) => {
  let weighted = 0;
  let total = 0;
  for (const key of gameKeys) {
    const w = Number(weights[key] || 1);
    const v = Number(features[key] || 0);
    weighted += w * v;
    total += w;
  }
  if (!total) return 0;
  return weighted / total;
};

const evaluateThreshold = (predictions, labels, threshold) => {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;

  for (let i = 0; i < predictions.length; i += 1) {
    const pred = predictions[i] >= threshold ? 1 : 0;
    const actual = labels[i];

    if (pred === 1 && actual === 1) tp += 1;
    else if (pred === 0 && actual === 0) tn += 1;
    else if (pred === 1 && actual === 0) fp += 1;
    else fn += 1;
  }

  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const f1 = (2 * precision * recall) / Math.max(1e-9, precision + recall);
  const fpr = fp / Math.max(1, fp + tn);
  const fnr = fn / Math.max(1, fn + tp);

  return { precision, recall, f1, fpr, fnr };
};

const tuneSolidThreshold = (predictions, labels, baseline) => {
  let best = {
    threshold: baseline,
    metrics: evaluateThreshold(predictions, labels, baseline),
    constrained: false,
  };

  const candidates = [];
  for (let i = 30; i <= 70; i += 1) {
    const q = i / 100;
    candidates.push(Number(quantile(predictions, q).toFixed(4)));
  }

  for (const threshold of candidates) {
    const metrics = evaluateThreshold(predictions, labels, threshold);
    const constrained = metrics.fnr <= 0.1 && metrics.fpr <= 0.08;

    if (constrained) {
      if (!best.constrained || metrics.f1 > best.metrics.f1) {
        best = { threshold, metrics, constrained: true };
      }
      continue;
    }

    if (!best.constrained && metrics.fnr < best.metrics.fnr) {
      best = { threshold, metrics, constrained: false };
    }
  }

  return best;
};
const computeGroupMetric = (rows, valueFn) => {
  const groups = new Map();
  for (const row of rows) {
    if (!groups.has(row.group)) groups.set(row.group, []);
    groups.get(row.group).push(row);
  }
  const values = {};
  for (const [group, entries] of groups.entries()) {
    values[group] = valueFn(entries);
  }
  return values;
};

const computeKpis = (rows, predictions, thresholds, baselinePredictions) => {
  const labels = rows.map((row) => row.success_6m);
  const perf = rows.map((row) => row.performance_rank_6m);
  const pr = prAuc(predictions, labels);
  const posRate = mean(labels);
  const randomPr = Math.max(0.001, posRate);

  const primary = {
    rocAuc: Number(rocAuc(predictions, labels).toFixed(4)),
    prAucLift: Number((pr / randomPr).toFixed(4)),
    spearman: Number(spearman(predictions, perf).toFixed(4)),
    brier: Number(brierScore(predictions, labels).toFixed(4)),
    ece: Number(ece(predictions, labels, 10).toFixed(4)),
  };

  const decision = {
    precisionAtTop20: Number(precisionAtK(predictions, labels, 0.2).toFixed(4)),
    recallAtTop30: Number(recallAtK(predictions, labels, 0.3).toFixed(4)),
    netLiftVsBaseline: Number((precisionAtK(predictions, labels, 0.3) - precisionAtK(baselinePredictions, labels, 0.3)).toFixed(4)),
    falseNegativeRateHighPotential: Number((() => {
      const high = rows.filter((row) => row.high_potential === 1);
      if (!high.length) return 0;
      const missed = high.filter((row, index) => predictions[rows.indexOf(row)] < thresholds.solid).length;
      return missed.length / high.length;
    })().toFixed(4)),
  };

  const selectionByGroup = computeGroupMetric(rows, (entries) => {
    const selected = entries.filter((row) => predictions[rows.indexOf(row)] >= thresholds.solid).length;
    return selected / (entries.length || 1);
  });
  const selectionRates = Object.values(selectionByGroup);
  const selectionRateRatio = selectionRates.length >= 2
    ? Math.min(...selectionRates) / Math.max(...selectionRates)
    : 1;

  const tprByGroup = computeGroupMetric(rows, (entries) => {
    const positives = entries.filter((row) => row.success_6m === 1);
    if (!positives.length) return 0;
    const detected = positives.filter((row) => predictions[rows.indexOf(row)] >= thresholds.solid).length;
    return detected / positives.length;
  });
  const tprs = Object.values(tprByGroup);
  const tprGap = tprs.length >= 2 ? Math.max(...tprs) - Math.min(...tprs) : 0;

  const eceByGroup = computeGroupMetric(rows, (entries) => {
    const groupPred = entries.map((row) => predictions[rows.indexOf(row)]);
    const groupLabels = entries.map((row) => row.success_6m);
    return ece(groupPred, groupLabels, 10);
  });
  const eceValues = Object.values(eceByGroup);
  const calibrationGap = eceValues.length >= 2 ? Math.max(...eceValues) - Math.min(...eceValues) : 0;

  const zStd = stdDev(predictions) || 1;
  const zMeanByGroup = computeGroupMetric(rows, (entries) => {
    const scores = entries.map((row) => predictions[rows.indexOf(row)]);
    return (mean(scores) - mean(predictions)) / zStd;
  });
  const zMeans = Object.values(zMeanByGroup);
  const avgScoreGapStd = zMeans.length >= 2 ? Math.abs(Math.max(...zMeans) - Math.min(...zMeans)) : 0;

  const fairness = {
    selectionRateRatio: Number(selectionRateRatio.toFixed(4)),
    tprGap: Number(tprGap.toFixed(4)),
    calibrationGap: Number(calibrationGap.toFixed(4)),
    avgScoreGapStd: Number(avgScoreGapStd.toFixed(4)),
    byGroup: {
      selectionRate: selectionByGroup,
      tpr: tprByGroup,
      ece: Object.fromEntries(Object.entries(eceByGroup).map(([k, v]) => [k, Number(v.toFixed(4))])),
      scoreZMean: Object.fromEntries(Object.entries(zMeanByGroup).map(([k, v]) => [k, Number(v.toFixed(4))])),
    },
  };

  return { primary, decision, fairness };
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const main = () => {
  ensureDir(OUT_DIR);

  const rows = buildRows();
  if (rows.length < 5) {
    throw new Error(`Not enough sessions for calibration. Found ${rows.length}, need at least 5.`);
  }

  const gameKeys = normalizeFeatures(rows);
  const outcomeMeta = attachOutcomes(rows, gameKeys);
  const weights = calibrateWeights(rows, gameKeys);

  const predictions = rows.map((row) => scoreWithWeights(row.features, weights, gameKeys));
  const baselineWeights = Object.fromEntries(gameKeys.map((key) => [key, 1]));
  const baselinePredictions = rows.map((row) => scoreWithWeights(row.features, baselineWeights, gameKeys));

  const labels = rows.map((row) => row.success_6m);
  const baselineSolid = Number(quantile(predictions, 0.5).toFixed(4));
  const tunedSolid = tuneSolidThreshold(predictions, labels, baselineSolid);

  const solidThreshold = Number((tunedSolid.constrained
    ? tunedSolid.threshold
    : Math.max(0.3, tunedSolid.threshold - 0.03)).toFixed(4));

  const thresholds = {
    strong: Number(quantile(predictions, 0.75).toFixed(4)),
    solid: solidThreshold,
    conditional: Number(quantile(predictions, 0.25).toFixed(4)),
  };

  const kpis = computeKpis(rows, predictions, thresholds, baselinePredictions);

  const calibrationResult = {
    generatedAt: new Date().toISOString(),
    input: {
      sessionCount: rows.length,
      gameCount: gameKeys.length,
      outcomeSource: outcomeMeta.outcomeSource,
      syntheticOutcomes: outcomeMeta.synthetic,
      note: outcomeMeta.synthetic
        ? 'Outcomes are deterministic proxy labels. Replace with data/calibration/outcomes.json for true HR outcome calibration.'
        : 'Outcomes loaded from data/calibration/outcomes.json',
    },
    weights,
    thresholds,
    thresholdsScale0to10: {
      strong: Number((thresholds.strong * 10).toFixed(2)),
      solid: Number((thresholds.solid * 10).toFixed(2)),
      conditional: Number((thresholds.conditional * 10).toFixed(2)),
    },
  };

  const kpiResult = {
    generatedAt: new Date().toISOString(),
    sessionCount: rows.length,
    outcomeSource: outcomeMeta.outcomeSource,
    syntheticOutcomes: outcomeMeta.synthetic,
    kpis,
  };

  fs.writeFileSync(path.join(OUT_DIR, 'latest-calibration.json'), `${JSON.stringify(calibrationResult, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(OUT_DIR, 'latest-kpis.json'), `${JSON.stringify(kpiResult, null, 2)}\n`, 'utf8');

  console.log('Calibration completed.');
  console.log(`Sessions: ${rows.length}`);
  console.log(`Outcome source: ${outcomeMeta.outcomeSource}`);
  console.log('Saved: data/calibration/latest-calibration.json');
  console.log('Saved: data/calibration/latest-kpis.json');
};

main();


