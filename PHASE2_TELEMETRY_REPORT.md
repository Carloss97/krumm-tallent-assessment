# Phase 2 Telemetry Report

Date: 2026-05-01

## Scope
This phase keeps the privacy-first rule intact: no raw video or other sensitive biometric streams leave the device. Only local analysis results and session metadata are used for reporting.

## What Is Captured Today
- Cursor position samples with timestamps.
- Click events with coordinates and timestamps.
- Trial/game events emitted during activity.
- Webcam-derived frames when consent is granted.
- Webcam quality scores, plus derived head pose and blink markers when provided by the capture layer.
- Quality flags for missing consent or weak signal conditions.
- Error and score summaries per game.

## What Phase 2 Added
- A local demo telemetry analyzer in `src/utils/advancedTelemetryAnalytics.js`.
- Per-game metrics for:
  - capture coverage
  - local inference confidence
  - local reliability
  - duration
  - webcam quality
  - hesitation and quality-flag impact
- Aggregated session metrics:
  - completion rate
  - average confidence
  - average reliability
  - attention stability
  - local quality signals

## Demo Report Changes
- The demo report now shows a dedicated per-game summary in execution order.
- Each game row includes completion state and local telemetry metrics.
- The report also shows a compact session-level summary and quality signals.

## Current Interpretation Rules
- Low capture coverage reduces confidence.
- High hesitation and repeated quality flags reduce reliability.
- Low webcam quality is treated as a caution signal for biometric interpretation.

## Next Step
- Expose the local insight helper to the report generation path so future phase 3 work can reuse the same score surface.

## Phase 3 Kickoff - 2026-05-01
- Added a discreet live telemetry HUD during demo play so the participant can see local-only metrics while the activity is running.
- Introduced a lightweight edge-local live insight helper to compute readiness, fatigue, stability, and coverage from current telemetry.
- The demo now exposes a clearer path to phase 3: live local inference on-device, without sending raw biometric streams to the server.

## Phase 3 Follow-up - 2026-05-01
- The live HUD is designed to stay discreet and non-blocking while giving the participant a transparent view of local processing.
- The demo report now surfaces fatigue and stability per game, which makes the timeline cognitively meaningful instead of only descriptive.
- The local live insight helper is now reused in the demo report analytics path so HUD and report share the same readiness, fatigue, and stability score surface.
