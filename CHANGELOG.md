# Changelog

## Unreleased

- chore(monitoring): added Prometheus alert rules for AI circuit and session validation spikes (monitoring/prometheus/ai_circuit_alerts.yml)
- feat(session): AJV schema stricter for `participant` and formalized `sessionData`; added normalization (lowercase email, trim ids), event size cap and PII redaction
- feat(metrics): counters `session_validation_errors_total` and `sessions_saved_total` exposed via `/metrics`

## 2026-04-13
- feature/backend-improvements branch created with multiple backend hardening changes
