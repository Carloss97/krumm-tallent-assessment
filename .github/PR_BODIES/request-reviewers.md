Requesting review & QA sign-off — feature/demo-redesign

Hi @team-frontend @sarlo,

Please review the changes in this PR and execute the QA checklist below. You can paste this text as a PR comment to request review and sign-off.

---

Files to focus on:
- `src/components/HeroDemo.jsx` (new)
- `src/components/TestAccessModal.jsx` (new)
- `src/components/LandingPageV3.jsx` (updated: CTA + demo integration)
- `src/components/GameShellCore.jsx` (updated: demo routing)
- `src/TelemetryContext.jsx` (feature flag)
- `e2e/run-e2e.mjs` (E2E robustness fixes)
- `src/components/HeroDemo.test.jsx` (unit test)

QA checklist (please mark when done):

- [ ] Run unit tests: `npm ci && npm test`
- [ ] Run E2E locally: `npm run test:e2e`
- [ ] Build: `npm run build`
- [ ] Verify landing CTA reads "Hacer test ya" and is visible
- [ ] Open `TestAccessModal` and start demo using demo credentials
- [ ] Complete the three micro-activities and confirm flow ends at Report page
- [ ] Confirm telemetry events: `demo_start`, `demo_activity_complete`, `demo_end` in backend logs
- [ ] Toggle `VITE_ENABLE_HERO_DEMO=false` and confirm demo is hidden
- [ ] Code review: confirm no regressions and code style ok

Sign-off:
- QA: add comment `QA: approved` when checklist is complete
- Reviewer: add approval when satisfied

Notes:
- The demo is feature‑gated by `VITE_ENABLE_HERO_DEMO` for progressive rollout.
- E2E script updated to handle localized headings and consent interstitial behavior to reduce flakes.

PR URL: https://github.com/Carloss97/Test/compare/main...feature/demo-redesign?expand=1

Thank you!
