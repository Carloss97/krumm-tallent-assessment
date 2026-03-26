# Predictive KPI Targets (Step 3)

**Date**: March 26, 2026  
**Scope**: Hiring prediction quality for assessment + report pipeline  
**Status**: Draft v1.0 (ready to operationalize in Step 4)

---

## 1) KPI Framework

We track 4 layers in sequence:

1. **Model Quality**: Does score predict outcomes?
2. **Decision Quality**: Are shortlist decisions better than baseline?
3. **Operational Quality**: Is the pipeline stable and complete?
4. **Fairness Quality**: Is quality consistent across protected groups?

---

## 2) KPI Targets

## A. Model Quality (Primary Predictive KPIs)

| KPI | Formula | Target | Alert | Notes |
|---|---|---:|---:|---|
| ROC-AUC | AUC(score, success_6m) | >= 0.72 | < 0.68 | Main discrimination signal for binary success label |
| PR-AUC Lift | PR-AUC(model) / PR-AUC(random) | >= 1.60x | < 1.35x | Robust under class imbalance |
| Spearman rho | corr(score_rank, performance_rank_6m) | >= 0.35 | < 0.25 | Rank consistency with supervisor outcomes |
| Brier Score | mean((p - y)^2) | <= 0.18 | > 0.22 | Probabilistic accuracy |
| ECE (10 bins) | weighted calibration gap | <= 0.06 | > 0.09 | Calibration reliability |

## B. Decision Quality (Recruiting Impact KPIs)

| KPI | Formula | Target | Alert | Notes |
|---|---|---:|---:|---|
| Precision@Top20 | hires_successful_in_top20 / top20_hires | >= 0.75 | < 0.65 | Quality of highest-priority candidates |
| Recall@Top30 | successful_hires_captured_top30 / all_successful_hires | >= 0.60 | < 0.50 | Coverage of strong candidates |
| Net Lift vs Rule Baseline | (success_rate_model - success_rate_baseline) | >= +12 pp | < +6 pp | Baseline = prior heuristic-only rule |
| False Negative Rate (High Potential) | missed_high_potential / total_high_potential | <= 0.20 | > 0.28 | Reduces missed talent |

## C. Operational Quality (Data + Pipeline)

| KPI | Formula | Target | Alert | Notes |
|---|---|---:|---:|---|
| Session Completeness | complete_sessions / started_sessions | >= 0.92 | < 0.88 | End-to-end completion |
| Telemetry Completeness | sessions_with_required_signals / complete_sessions | >= 0.95 | < 0.90 | Missing data control |
| Score Drift (PSI) | PSI(score_distribution_t, t-1) | <= 0.15 | > 0.25 | Stability by release/cohort |
| Report Latency p95 | p95(report_generation_ms) | <= 2000 ms | > 3500 ms | UX and recruiter throughput |

## D. Fairness Quality (Guardrail KPIs)

| KPI | Formula | Target | Alert | Notes |
|---|---|---:|---:|---|
| Selection Rate Ratio | min(group_rate)/max(group_rate) | >= 0.80 | < 0.75 | 80% rule guardrail |
| TPR Gap | max(TPR_group) - min(TPR_group) | <= 0.10 | > 0.15 | Equal opportunity proxy |
| Calibration Gap | max(ECE_group) - min(ECE_group) | <= 0.03 | > 0.05 | Reliable probabilities across groups |
| Avg Score Gap (std units) | |mean(z_group_a) - mean(z_group_b)| | <= 0.35 | > 0.50 | Monitor unintended score shifts |

---

## 3) Outcome Label Contract

To make the KPIs measurable, we standardize target labels:

- **success_6m (binary)**: 1 if candidate reaches role success at 6 months, else 0.
- **performance_rank_6m (ordinal)**: normalized supervisor score and objective KPI bundle.
- **high_potential (binary)**: future promotion/expanded-scope signal within 6-9 months.

Minimum data quality before KPI publication:
- Outcome coverage >= 85% of hired candidates in cohort.
- Label lag <= 45 days from evaluation checkpoint.

---

## 4) Governance and Cadence

- **Weekly**: Operational KPIs (completeness, latency, drift).
- **Bi-weekly**: Model quality KPIs (AUC, calibration).
- **Monthly**: Decision + fairness review with recruiter stakeholders.
- **Quarterly**: Threshold and weight revision proposal.

Owners:
- Product Analytics: KPI computation and dashboard integrity.
- Data/ML: model quality, calibration, drift mitigation.
- Talent Ops: interpretation and decision-policy adjustments.

---

## 5) Gate Criteria for Promotion

A model/scoring update can be promoted only if all conditions hold in latest evaluation window:

1. ROC-AUC >= 0.72 and PR-AUC Lift >= 1.60x.
2. Brier <= 0.18 and ECE <= 0.06.
3. Net Lift vs baseline >= +12 pp.
4. Selection Rate Ratio >= 0.80 and TPR Gap <= 0.10.
5. No operational alert in completeness/latency/drift for 2 consecutive weeks.

---

## 6) Immediate Handoff to Step 4 (Calibration)

Inputs required for calibration phase:
- Cohort dataset with score + outcomes + segment metadata.
- Baseline policy snapshot for net-lift comparison.
- Current threshold set (8.0, 6.5, 4.5) and role-specific overrides.

Expected output of Step 4:
- Revised weights/thresholds proposal with before-vs-after KPI deltas.
- Risk memo if any fairness guardrail regresses.
