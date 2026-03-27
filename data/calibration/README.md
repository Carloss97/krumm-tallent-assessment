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

## Edge -> Gemini Escalation Controls

- `VITE_EDGE_ESCALATION_ENABLED=true|false`: enable threshold-based escalation from edge-local to Gemini.
- `VITE_EDGE_ESCALATE_MIN_CONFIDENCE`: escalate if edge confidence is below this value (default `66`).
- `VITE_EDGE_ESCALATE_MIN_TELEMETRY_COVERAGE`: escalate if telemetry coverage is below this value (default `55`).
- `VITE_EDGE_ESCALATE_MIN_BIOMETRIC_QUALITY`: escalate if biometric quality is below this value (default `50`).
- `VITE_EDGE_ESCALATE_CONFIDENCE_BAND_MIN`: lower bound for borderline confidence band (default `64`).
- `VITE_EDGE_ESCALATE_CONFIDENCE_BAND_MAX`: upper bound for borderline confidence band (default `72`).
- `VITE_EDGE_ESCALATE_ON_RECOMMENDATIONS`: pipe-separated recommendations that trigger escalation when confidence is in the borderline band. Default: `CONDITIONAL ALIGNMENT|EXPLORATORY FIT - NEEDS MORE DATA`.

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
