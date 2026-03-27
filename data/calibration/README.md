# Calibration Artifacts

## Files

- `latest-calibration.json`: calibrated game weights and recommendation thresholds.
- `latest-kpis.json`: KPI snapshot produced by calibration run.
- `quality-alerts.md`: alert report against KPI thresholds.
- `outcomes.example.json`: schema example for real HR outcomes.
- `edge-calibration-registry.json`: versioned edge calibration map (cohorts, active/stable, rollback policy).
- `reports/qa/EDGE_LOCAL_QUALITY_latest.json`: edge-local quality gate results (latency p95, memory peak, fail rate, F1, ECE).

## How To Use Real Outcomes

1. Copy `outcomes.example.json` to `outcomes.json` in this same folder.
2. Fill with real labels for each `sessionId`.
3. Run:

```bash
npm run quality:check
```

When `outcomes.json` is present and complete, alerts become strict and can fail CI.

## Edge Local Controls

- `VITE_EDGE_CALIBRATION_VERSION`: force a specific calibration version for edge-local scoring.
- `VITE_EDGE_COHORT`: select cohort profile (`general`, `operations`, `tech`).
- `VITE_EDGE_ROLLBACK_TO_STABLE=true`: force rollback to stable calibration version.
- `VITE_EDGE_AB_MODE=false`: disable A/B and use calibrated variant only.
- `VITE_EDGE_AB_FORCE_VARIANT=control|calibrated`: force one variant in QA/dev.

## Edge Quality Gate

Run:

```bash
npm run quality:edge
```

This gate evaluates edge-local inference against:

- latency p95
- memory peak
- inference error rate
- F1
- ECE
