import fs from 'node:fs';
import path from 'node:path';
import { gateBreaches, readJsonSafe, toSeedMarkdownTable } from './qaGateUtils.mjs';

const INPUT = path.resolve('reports/qa/SIMULATION_MULTI_SEED_latest.json');

function main() {
  const payload = readJsonSafe(INPUT);
  if (!payload) {
    console.error(`Missing simulation payload: ${INPUT}`);
    process.exit(1);
  }

  const aggregate = payload.aggregate || {};
  const global = aggregate.global || {};
  const acceptance = payload.acceptance || {};
  const seedRuns = payload.seedRuns || [];
  const preset = payload.config?.preset || 'unknown';

  const breaches = gateBreaches(global, acceptance, ['maxFpr', 'maxFnr']);

  const lines = [];
  lines.push('## QA Classification Gate');
  lines.push(`- Preset: ${preset}`);
  lines.push(`- Readiness: ${aggregate.readinessStatus || 'unknown'}`);
  lines.push(`- Accuracy: ${(Number(global.accuracy || 0) * 100).toFixed(2)}%`);
  lines.push(`- F1: ${Number(global.f1 || 0).toFixed(4)}`);
  lines.push(`- FPR: ${(Number(global.fpr || 0) * 100).toFixed(2)}% (target <= ${(Number(acceptance.maxFpr || 0) * 100).toFixed(2)}%)`);
  lines.push(`- FNR: ${(Number(global.fnr || 0) * 100).toFixed(2)}% (target <= ${(Number(acceptance.maxFnr || 0) * 100).toFixed(2)}%)`);
  lines.push('');
  lines.push('### Seed Matrix');
  lines.push(toSeedMarkdownTable(seedRuns));
  lines.push('');
  lines.push(`- Gate status: ${breaches.length ? 'FAIL' : 'PASS'}`);
  if (breaches.length) {
    lines.push(`- Breaches: ${breaches.join(' | ')}`);
  }

  const summary = lines.join('\n');
  console.log(summary);

  if (process.env.GITHUB_STEP_SUMMARY) {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`, 'utf8');
  }

  const failOnBreach = String(process.env.QA_GATE_FAIL_ON_BREACH || 'false').toLowerCase() === 'true';
  if (failOnBreach && breaches.length) {
    process.exit(1);
  }
}

main();
