## Report Telemetry Data Pipeline

**Subject**: DemoShell → Report data flow for game telemetry

**Fact**: When a game finishes, it calls `stopTracking('gameN', score, errors, details)` which saves to `sessionData['gameN']`. In `DemoShell.handleDemoComplete()`, data flows via:
1. `analyzeDemoTelemetry(sessionData, activityRows)` returns `{perGame: [{id: 'gameN', ...}, ...], ...}`
2. Enriched activities use `activity.telemetryId` (not `activity.id`) to map analytics: `gameRowsById.get(activity.telemetryId)`
3. This enriched array is passed to `setDemoSummary({activities: enrichedActivities, ...})`
4. Report reconstructs data: `demoSummary.activities.forEach(act => reconstructed[act.telemetryId] = act.analytics)`

**Citations**: 
- src/components/DemoShell.jsx:298-307 (enrichedActivities mapping using telemetryId)
- src/Report.jsx:75-95 (effectiveSessionData reconstruction)
- src/Report.jsx:789-827 (hasMinimumAssessmentData checks GAME_ROWS by id/legacyId)

**Reason**: Critical for understanding how demo game data reaches the final report. The telemetryId ↔ id mapping is easy to break. Future changes to activities, games, or telemetry should verify this pipeline with console logs.

**Category**: Data Flow
