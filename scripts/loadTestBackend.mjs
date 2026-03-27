#!/usr/bin/env node

/* global process */

const BASE_URL = process.env.BACKEND_BASE_URL || 'http://127.0.0.1:4000';
const TOTAL_REQUESTS = Number(process.env.BACKEND_LOAD_TOTAL || 200);
const CONCURRENCY = Number(process.env.BACKEND_LOAD_CONCURRENCY || 20);
const TARGET_P95_MS = Number(process.env.BACKEND_SLO_P95_MS || 60);
const MAX_THROTTLE_RATE = Number(process.env.BACKEND_SLO_MAX_THROTTLE_RATE || 15);

const now = () => performance.now();

const percentile = (arr, p) => {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length));
  return sorted[idx];
};

const runSingleRequest = async () => {
  const start = now();
  try {
    const response = await fetch(`${BASE_URL}/health`);
    const latency = now() - start;
    return {
      ok: response.ok,
      status: response.status,
      latency,
    };
  } catch (error) {
    const latency = now() - start;
    return {
      ok: false,
      status: 0,
      latency,
      error: error.message,
    };
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const preflightHealthCheck = async () => {
  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const result = await runSingleRequest();
    if (result.ok || result.status === 429) {
      return result;
    }
    await sleep(350 * attempt);
  }
  return { ok: false, status: 0 };
};

const worker = async (requestsPerWorker) => {
  const results = [];
  for (let i = 0; i < requestsPerWorker; i += 1) {
    const result = await runSingleRequest();
    results.push(result);
  }
  return results;
};

const main = async () => {
  console.log(`Backend load test -> ${BASE_URL}`);
  console.log(`Total requests: ${TOTAL_REQUESTS}`);
  console.log(`Concurrency: ${CONCURRENCY}`);

  const preflight = await preflightHealthCheck();
  if (!preflight.ok && preflight.status !== 429) {
    throw new Error(`Backend health preflight failed (status: ${preflight.status || 'network-error'})`);
  }

  const startedAt = now();
  const perWorker = Math.ceil(TOTAL_REQUESTS / CONCURRENCY);

  const jobs = Array.from({ length: CONCURRENCY }, () => worker(perWorker));
  const resultBatches = await Promise.all(jobs);
  const all = resultBatches.flat().slice(0, TOTAL_REQUESTS);

  const durationMs = now() - startedAt;
  const successes = all.filter((r) => r.ok);
  const failures = all.filter((r) => !r.ok);
  const latencies = successes.map((r) => r.latency);

  const summary = {
    totalRequests: TOTAL_REQUESTS,
    successCount: successes.length,
    failureCount: failures.length,
    throttledCount: all.filter((r) => r.status === 429).length,
    successRate: Number(((successes.length / TOTAL_REQUESTS) * 100).toFixed(2)),
    throughputRps: Number((TOTAL_REQUESTS / (durationMs / 1000)).toFixed(2)),
    latency: {
      avgMs: Number((latencies.reduce((acc, n) => acc + n, 0) / (latencies.length || 1)).toFixed(2)),
      p50Ms: Number(percentile(latencies, 50).toFixed(2)),
      p95Ms: Number(percentile(latencies, 95).toFixed(2)),
      p99Ms: Number(percentile(latencies, 99).toFixed(2)),
    },
    slo: {
      targetP95Ms: TARGET_P95_MS,
      maxThrottleRate: MAX_THROTTLE_RATE,
    },
  };

  console.log('\nBackend load summary');
  console.log(JSON.stringify(summary, null, 2));

  const hardFailures = failures.filter((f) => f.status !== 429);
  if (hardFailures.length > 0) {
    const sample = hardFailures.slice(0, 5).map((f) => ({ status: f.status, error: f.error || null }));
    console.error('\nFailure sample:');
    console.error(JSON.stringify(sample, null, 2));
    process.exit(1);
  }

  if (summary.throttledCount > 0) {
    console.warn(`Detected ${summary.throttledCount} throttled requests (429). Rate limiting is active under load.`);
  }

  const throttleRate = Number(((summary.throttledCount / TOTAL_REQUESTS) * 100).toFixed(2));
  if (summary.latency.p95Ms > TARGET_P95_MS) {
    console.error(`SLO breach: p95 latency ${summary.latency.p95Ms}ms exceeds target ${TARGET_P95_MS}ms.`);
    process.exit(1);
  }

  if (throttleRate > MAX_THROTTLE_RATE) {
    console.error(`SLO breach: throttle rate ${throttleRate}% exceeds maximum ${MAX_THROTTLE_RATE}%.`);
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(`Load test failed: ${error.message}`);
  process.exit(1);
});
