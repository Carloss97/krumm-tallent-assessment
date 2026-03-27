# Quality Alerts

Generated at: 2026-03-27T16:16:41.482Z
Input KPI file: C:\Users\sarlo\OneDrive\Escritorio\Test\data\calibration\latest-kpis.json
Outcome source: deterministic-proxy
Synthetic outcomes: yes

## primary
- [WATCH] rocAuc: value=0.7083 target=0.72 alert=0.68 (higher)
- [ALERT] prAucLift: value=1.2646 target=1.6 alert=1.35 (higher)
- [ALERT] spearman: value=-0.0714 target=0.35 alert=0.25 (higher)
- [ALERT] brier: value=0.2211 target=0.18 alert=0.22 (lower)
- [ALERT] ece: value=0.2186 target=0.06 alert=0.09 (lower)

## decision
- [PASS] precisionAtTop20: value=1.0000 target=0.75 alert=0.65 (higher)
- [ALERT] recallAtTop30: value=0.3333 target=0.6 alert=0.5 (higher)
- [ALERT] netLiftVsBaseline: value=0.0000 target=0.12 alert=0.06 (higher)
- [PASS] falseNegativeRateHighPotential: value=0.0000 target=0.2 alert=0.28 (lower)

## fairness
- [ALERT] selectionRateRatio: value=0.0000 target=0.8 alert=0.75 (higher)
- [PASS] tprGap: value=0.0000 target=0.1 alert=0.15 (lower)
- [ALERT] calibrationGap: value=0.2329 target=0.03 alert=0.05 (lower)
- [PASS] avgScoreGapStd: value=0.2441 target=0.35 alert=0.5 (lower)

## Summary
- Global status: ALERT
- Note: Alerts are computed from calibrated KPI outputs and should be reviewed with cohort context.
- Guardrail: synthetic outcomes detected; alert breaches are non-blocking until labeled HR outcomes are provided.
