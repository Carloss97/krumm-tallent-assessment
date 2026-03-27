import fs from 'node:fs';
import path from 'node:path';

const KPI_PATH = path.resolve('data/calibration/latest-kpis.json');
const ALERT_PATH = path.resolve('data/calibration/quality-alerts.md');

const TARGETS = {
  primary: {
    rocAuc: { target: 0.72, alert: 0.68, direction: 'higher' },
    prAucLift: { target: 1.6, alert: 1.35, direction: 'higher' },
    spearman: { target: 0.35, alert: 0.25, direction: 'higher' },
    brier: { target: 0.18, alert: 0.22, direction: 'lower' },
    ece: { target: 0.06, alert: 0.09, direction: 'lower' },
  },
  decision: {
    precisionAtTop20: { target: 0.75, alert: 0.65, direction: 'higher' },
    recallAtTop30: { target: 0.6, alert: 0.5, direction: 'higher' },
    netLiftVsBaseline: { target: 0.12, alert: 0.06, direction: 'higher' },
    falseNegativeRateHighPotential: { target: 0.2, alert: 0.28, direction: 'lower' },
  },
  fairness: {
    selectionRateRatio: { target: 0.8, alert: 0.75, direction: 'higher' },
    tprGap: { target: 0.1, alert: 0.15, direction: 'lower' },
    calibrationGap: { target: 0.03, alert: 0.05, direction: 'lower' },
    avgScoreGapStd: { target: 0.35, alert: 0.5, direction: 'lower' },
  },
};

const evaluate = (value, spec) => {
  if (spec.direction === 'higher') {
    if (value >= spec.target) return 'pass';
    if (value < spec.alert) return 'alert';
    return 'watch';
  }

  if (value <= spec.target) return 'pass';
  if (value > spec.alert) return 'alert';
  return 'watch';
};

const statusIcon = (status) => {
  if (status === 'pass') return '[PASS]';
  if (status === 'watch') return '[WATCH]';
  return '[ALERT]';
};

const shouldBlockSynthetic = process.env.QUALITY_ALERTS_BLOCK_SYNTHETIC === 'true';

const main = () => {
  if (!fs.existsSync(KPI_PATH)) {
    throw new Error('Missing data/calibration/latest-kpis.json. Run npm run calibrate:scoring first.');
  }

  const raw = JSON.parse(fs.readFileSync(KPI_PATH, 'utf8'));
  const values = raw.kpis || {};

  const lines = [];
  lines.push('# Quality Alerts');
  lines.push('');
  lines.push(`Generated at: ${new Date().toISOString()}`);
  lines.push(`Input KPI file: ${KPI_PATH}`);
  lines.push(`Outcome source: ${raw.outcomeSource || 'unknown'}`);
  lines.push(`Synthetic outcomes: ${raw.syntheticOutcomes ? 'yes' : 'no'}`);
  lines.push('');

  let hasAlert = false;

  for (const category of Object.keys(TARGETS)) {
    lines.push(`## ${category}`);
    const categoryValues = values[category] || {};

    for (const metric of Object.keys(TARGETS[category])) {
      const spec = TARGETS[category][metric];
      const value = Number(categoryValues[metric]);
      const status = evaluate(value, spec);
      if (status === 'alert') hasAlert = true;

      lines.push(
        `- ${statusIcon(status)} ${metric}: value=${Number.isFinite(value) ? value.toFixed(4) : 'NaN'} target=${spec.target} alert=${spec.alert} (${spec.direction})`
      );
    }

    lines.push('');
  }

  lines.push('## Summary');
  lines.push(`- Global status: ${hasAlert ? 'ALERT' : 'OK'}`);
  lines.push('- Note: Alerts are computed from calibrated KPI outputs and should be reviewed with cohort context.');
  if (raw.syntheticOutcomes && !shouldBlockSynthetic) {
    if (hasAlert) {
      console.warn('Alert thresholds breached, but run is non-blocking because outcomes are synthetic proxies.');
    }
    console.log('Quality alert check completed in non-blocking mode (synthetic outcomes).');
    process.exit(0);
  }

  if (hasAlert) {
    console.error('Quality alert thresholds breached. See report for details.');
    process.exit(1);
  }

  console.log('Quality alert check passed.');
};

main();

