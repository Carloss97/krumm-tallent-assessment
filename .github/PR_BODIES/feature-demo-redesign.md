Feature: Hero interactive demo

Summary
-------
- Adds a lightweight interactive hero demo to the landing page with three micro‑activities (quiz, priorities, reaction).
- Adds a quick-access `TestAccessModal` to sign in with demo credentials and start the short demo.
- Integrates demo into `LandingPageV3.jsx`, feature-flagged by `VITE_ENABLE_HERO_DEMO`.
- Adds E2E robustness fixes to `e2e/run-e2e.mjs` and a unit test `src/components/HeroDemo.test.jsx`.

Files added / changed
--------------------
- `src/components/HeroDemo.jsx` (new)
- `src/components/HeroDemo.css` (new)
- `src/components/TestAccessModal.jsx` (new)
- `src/components/TestAccessModal.css` (new)
- `src/components/HeroDemo.test.jsx` (new)
- `src/utils/gameFlow.js` (updated: exports `DEMO_GAME_IDS`)
- `src/components/LandingPageV3.jsx` (updated: CTA + demo integration)
- `src/components/GameShellCore.jsx` (updated: demo routing)
- `src/TelemetryContext.jsx` (updated: feature flag)
- `e2e/run-e2e.mjs` (updated: robust consent/start handling and localized heading matches)

What to validate locally
------------------------
1. Run unit tests and ensure suite passes:

```bash
npm test
```

2. Run E2E (this script starts frontend + backend locally):

```bash
npm run test:e2e
```

3. Build to ensure production bundle is fine:

```bash
npm run build
```

QA checklist (manual)
---------------------
- Open the landing page and confirm the primary CTA reads "Hacer test ya" and is visible.
- Click CTA, open `TestAccessModal`, use demo credentials and start demo.
- Complete the three micro-activities and confirm the flow ends at the Report page.
- Confirm telemetry events are emitted for `demo_start`, `demo_activity_complete`, and `demo_end` (backend logs/telemetry service).
- Verify the demo is feature-gated: set `VITE_ENABLE_HERO_DEMO=false` and confirm demo is hidden.

Notes for reviewers
-------------------
- The feature is behind `VITE_ENABLE_HERO_DEMO` for safe rollout.
- E2E script was made more robust to avoid flaky selector/timeouts for localized headings and interstitial flows.

Suggested PR metadata
---------------------
- Title: "Feature: Hero interactive demo"
- Labels: `demo`, `feature`, `needs-review`, `qa-ready`
- Suggested reviewers: @team-frontend, @sarlo

Local testing commands (quick copy-paste)
---------------------------------------
```bash
npm ci
npm test
npm run test:e2e
npm run build
```

This file is intended to be used as the PR body when creating the pull request on GitHub.
