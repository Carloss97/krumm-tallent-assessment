# Calibration Artifacts

## Files

- `latest-calibration.json`: calibrated game weights and recommendation thresholds.
- `latest-kpis.json`: KPI snapshot produced by calibration run.
- `quality-alerts.md`: alert report against KPI thresholds.
- `outcomes.example.json`: schema example for real HR outcomes.

## How To Use Real Outcomes

1. Copy `outcomes.example.json` to `outcomes.json` in this same folder.
2. Fill with real labels for each `sessionId`.
3. Run:

```bash
npm run quality:check
```

When `outcomes.json` is present and complete, alerts become strict and can fail CI.
