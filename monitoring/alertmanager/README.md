Alertmanager sample configuration

Files:
- `alertmanager.yml`: sample route + receivers (Slack) for AI circuit and session validation alerts.

How to use

1. Replace `{{ .Values.SLACK_API_URL }}` with a real Slack webhook or inject the secret via your deployment tooling (Helm values, envsubst, CI secrets).
2. Configure channels `#alerts` and `#on-call` in the Slack receiver or change to your team's channels.
3. Start Alertmanager (Docker example):

```bash
# export SLACK_API_URL='https://hooks.slack.com/services/XXX/YYY/ZZZ'
# render template or substitute the variable before running
docker run --rm -p 9093:9093 -v ./alertmanager.yml:/etc/alertmanager/alertmanager.yml prom/alertmanager:v0.26.0
```

Integration with Prometheus

- Add this Alertmanager URL in your Prometheus `alerting` section:

```yaml
alerting:
  alertmanagers:
    - static_configs:
        - targets: ['alertmanager:9093']
```

Notes

- Do not commit real webhooks or secrets to the repo. Use GitHub Secrets, Vault, or Helm values to inject secrets at deploy time.
- Adjust `group_wait`, `group_interval` and `repeat_interval` to fit your on-call cadence.
