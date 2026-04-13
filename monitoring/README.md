Prometheus monitor rules and guidance

- File: monitoring/prometheus/ai_circuit_alerts.yml
- Purpose: alert when AI circuit opens, when it triggers repeatedly, or when session validation errors spike.

How to include in your Prometheus server config (prometheus.yml):

rule_files:
  - 'monitoring/prometheus/*.yml'

Restart Prometheus after adding the file, or point Prometheus to the directory where these rules live.

Alerting suggestions:
- Wire alerts to Alertmanager and configure notification channels (Slack / PagerDuty / Email).
- AICircuitOpen: useful to notify SRE or on-call if the AI provider remains unavailable.
- ExcessSessionValidationErrors: useful to detect broken clients or sudden malformed payloads.

Tuning:
- Adjust the `for` durations and thresholds to fit your traffic patterns.
- Consider deduplicating alerts by instance or by service label in Prometheus.
