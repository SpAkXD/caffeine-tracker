# Version 1.1.0 — Base Version (Core Features)

**Branch:** `release/v1.1.0-base`  
**Date:** 2026-02-17  
**versionCode:** 3

---

## Changelog

- Implemented **feature flags system** (`featureFlags.js` in root) shared between build config and runtime
- Converted `app.json` → `app.config.ts` to support conditional plugin inclusion based on flags
- Wrapped all Dashboard components in feature flag conditionals (`app/index.tsx`)
- Wrapped all Settings sections in feature flag conditionals (`app/settings.tsx`)
- Guarded background task execution with `BACKGROUND_NOTIFICATIONS` and `BACKGROUND_WIDGET_REFRESH` flags (`src/services/backgroundTask.tsx`)
- Created `src/config/featureFlags.ts` bridge for typed imports throughout the app
- Enabled **14 core features** for the base release
- Bumped version to `1.1.0`, versionCode to `3`

---

## Active Features

| Flag | Feature | Status |
|------|---------|--------|
| `CAFFEINE_DISPLAY` | Big mg number + crash time on dashboard | ✅ ON |
| `DECAY_CHART` | Caffeine decay curve chart | ✅ ON |
| `ALERTNESS_GRAPH` | Alertness overlay on the chart | ✅ ON |
| `CHART_TOGGLES` | Toggle buttons for graph lines | ✅ ON |
| `THRESHOLD_LINE` | Sleep threshold line on chart | ✅ ON |
| `SLEEP_FORECAST` | "You can sleep at..." card | ✅ ON |
| `SLEEP_QUALITY` | Sleep quality selector | ✅ ON |
| `HISTORY_CARD` | 3-day history card | ✅ ON |
| `ADD_DRINK` | Add drink modal with presets | ✅ ON |
| `THEME_TOGGLE` | Dark/Light theme toggle | ✅ ON |
| `WEIGHT_SETTING` | Body weight slider | ✅ ON |
| `HALF_LIFE_SETTING` | Base half-life slider | ✅ ON |
| `THRESHOLD_SETTING` | Sleep threshold slider | ✅ ON |
| `CLEAR_DATA` | Reset all data button | ✅ ON |
| `DETAILED_STATS` | Detailed statistics page | ❌ OFF |
| `NOTIFICATIONS` | Push notifications | ❌ OFF |
| `WIDGET_PREVIEW` | Widget preview in settings | ❌ OFF |
| `HOME_WIDGET` | Android home screen widget | ❌ OFF |
| `BACKGROUND_NOTIFICATIONS` | Background caffeine updates | ❌ OFF |
| `BACKGROUND_WIDGET_REFRESH` | Background widget sync | ❌ OFF |
