# Version 1.1.2 — Chart Spline Fix

**Branch:** `release/v1.1.2`  
**Date:** 2026-02-18  
**versionCode:** 5

---

## Changelog

- **Fixed chart spline overshoot** — replaced the Catmull-Rom to Bezier curve algorithm in `src/components/DecayChart.tsx` with a **monotone cubic Hermite spline** (Fritsch-Carlson method)
  - The caffeine and alertness lines no longer dip below zero before a spike
  - Added `yMax` clamping to `createSmoothPath()` as a safety net against any control point exceeding the chart bottom boundary
- Bumped version to `1.1.2`, versionCode to `5`

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
| `WEIGHT_SETTING` | Body weight slider (min 30kg) | ✅ ON |
| `HALF_LIFE_SETTING` | Base half-life slider | ✅ ON |
| `THRESHOLD_SETTING` | Sleep threshold slider | ✅ ON |
| `CLEAR_DATA` | Reset all data button | ✅ ON |
| `INFO_POPUPS` | Info icons on settings metrics | ✅ ON |
| `DETAILED_STATS` | Detailed statistics page | ❌ OFF |
| `NOTIFICATIONS` | Push notifications | ❌ OFF |
| `WIDGET_PREVIEW` | Widget preview in settings | ❌ OFF |
| `HOME_WIDGET` | Android home screen widget | ❌ OFF |
| `BACKGROUND_NOTIFICATIONS` | Background caffeine updates | ❌ OFF |
| `BACKGROUND_WIDGET_REFRESH` | Background widget sync | ❌ OFF |
