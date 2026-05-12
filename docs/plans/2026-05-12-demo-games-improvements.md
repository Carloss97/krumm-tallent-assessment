# Demo Games Improvement Implementation Plan

> **For Hermes:** Implement directly in this session with focused TDD-style regression tests around the demo UX seams.

**Goal:** Improve the public demo games by removing real demo-report/telemetry-report logic, showing a blurred dummy report teaser, clarifying progressive mechanics, and making the demo fit well on desktop and mobile.

**Architecture:** Keep the demo self-contained in `src/components/DemoShell.jsx` and `src/components/PostDemoScreen.jsx`. The demo completion screen should use static/dummy report data only and should not render `Report` or the live telemetry HUD. Game-specific progressive learning remains in the existing game components, with clearer pre-game instructions surfaced by the demo shell and responsive container fixes in CSS.

**Tech Stack:** React 19, Vite, Framer Motion, Testing Library/Vitest, existing CSS modules/global CSS.

---

### Task 1: Remove demo live telemetry/report dependencies

**Objective:** Stop rendering the live telemetry HUD and stop deriving the demo completion result from real telemetry analysis.

**Files:**
- Modify: `src/components/DemoShell.jsx`
- Test: `src/components/DemoShell.test.jsx`

**Steps:**
1. Add a regression test that renders the demo screen and verifies no live telemetry HUD/report text is present.
2. Remove imports/usage of `LiveDemoTelemetryHud`, `analyzeDemoTelemetry`, `useWebcamCapture`, `PermissionModal`, and edge model preload from the public demo path.
3. On demo start, go directly to instructions without webcam/cursor permission prompts.
4. On demo completion, create a static summary object for `PostDemoScreen` with dummy values only.

### Task 2: Replace full demo report with blurred dummy report teaser

**Objective:** The post-demo experience should show a locked/blurred dummy report document and a contact CTA, not the real `Report` component.

**Files:**
- Modify: `src/components/PostDemoScreen.jsx`
- Add/modify CSS: `src/components/PostDemoScreen.css`
- Test: `src/components/PostDemoScreen.test.jsx`

**Steps:**
1. Add a failing test ensuring `PostDemoScreen` does not import/render real report copy and contains contact CTA / locked demo report copy.
2. Remove `Report` import and `showFullReport` mode.
3. Build static dummy report preview cards with blurred detailed sections and a clear overlay: contact us for the real report.
4. Keep restart/contact actions visible and accessible.

### Task 3: Improve progressive instructions for demo modules

**Objective:** Explain mechanics progressively, especially for Laser and Grid where new mechanics are introduced across levels.

**Files:**
- Modify: `src/components/DemoShell.jsx`
- Modify: `src/games/GridFlowGame.jsx`
- Modify: `src/games/LaserPuzzleGame.jsx`

**Steps:**
1. Make DemoShell instructions use structured bullets/tips instead of long paragraphs.
2. Update Grid briefings: level 1 route + drop zones; level 2 energy/recharge/satisfaction decay; level 3 obstacles/multi-package prioritization.
3. Update Laser briefings: level 1 mirrors/dragging; level 2 bifurcator/multiple antennas; level 3 portals/obstacles.
4. Include short mobile interaction hints where drag/tap matters.

### Task 4: Responsive layout fixes for desktop and mobile

**Objective:** Ensure the demo fits inside the viewport on PC and is playable on mobile.

**Files:**
- Modify: `src/components/DemoShell.css`
- Modify inline wrappers in `BalloonGame.jsx`, `GridFlowGame.jsx`, `LaserPuzzleGame.jsx` only where necessary.

**Steps:**
1. Remove obsolete HUD spacing from mobile CSS.
2. Use dynamic viewport units (`100dvh`) and `min-height: 0` in nested flex containers.
3. Make game stage scroll only when necessary on short screens.
4. Constrain instruction/report cards with `max-height` and touch-friendly buttons.
5. Reduce Balloon game fixed `minHeight: 600px` to responsive viewport-based sizing.

### Task 5: Verify

**Objective:** Prove the changes work and do not break key build/test gates.

**Commands:**
- `npm test -- src/components/PostDemoScreen.test.jsx src/components/DemoShell.test.jsx --runInBand` or equivalent Vitest command.
- `npm run lint` if feasible.
- `npm run build` after dependency state is fixed; current environment may fail due missing optional rolldown native binding.

**Acceptance Criteria:**
- `/demo` no longer shows the live telemetry HUD.
- `/demo` no longer asks webcam permission just to run the demo.
- Completing the demo shows a locked/blurred dummy report teaser with contact CTA.
- No real `Report` component is rendered by `PostDemoScreen`.
- Instructions are clearer and progressive for Grid/Laser.
- Demo layout no longer reserves bottom space for the removed HUD and is safer on small screens.
