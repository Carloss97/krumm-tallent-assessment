Title: feat(demo): interactive hero demo + quick access modal (feature-flagged)

Summary
-------
- Adds a compact interactive `HeroDemo` component embedded in the landing hero (3 micro-activities).
- Adds `TestAccessModal` as a quick credential modal for fast test entry from the landing.
- Limits the public demo flow to a short sequence defined by `DEMO_GAME_IDS` for demo mode.
- Adds lightweight analytics events for CTA clicks and demo activities (`cta_demo_clicked`, `cta_quick_modal_opened`, `demo_started`, `demo.activity_completed`, `demo_completed`, etc.).
- Adds a unit test for `HeroDemo` and styles for the new components.
- The demo and quick modal are controlled by a feature flag `VITE_ENABLE_HERO_DEMO` (set to "true" to enable in a deploy).

Files Changed
-------------
- `src/components/HeroDemo.jsx`, `src/components/HeroDemo.css`, `src/components/HeroDemo.test.jsx`
- `src/components/TestAccessModal.jsx`, `src/components/TestAccessModal.css`
- `src/components/LandingPageV3.jsx` (integration + CTA wiring)
- `src/components/GameShellCore.jsx` (demo navigation flow)
- `src/utils/gameFlow.js` (export `DEMO_GAME_IDS`)
- `src/TelemetryContext.jsx` (feature flag `enableHeroDemo`)

How to test locally
-------------------
1. Enable the demo UI locally by adding env var: `VITE_ENABLE_HERO_DEMO=true`.
2. Run frontend + backend:

```bash
npm run dev:full
```

3. Open the app and verify the landing hero shows the interactive demo. Click the large CTA to open quick access modal.

Notes
-----
- The branch is pushed as `feature/demo-redesign` and ready for PR creation.
- The feature flag allows progressive rollout and safe testing in staging before enabling in production.
