# Version 1.1.5 — Custom Time Adjuster UI

**Branch:** `release/v1.1.5`  
**Date:** 2026-02-23  
**versionCode:** 8

---

## Changelog

- **Removed `react-native-date-picker`** — the native module caused crashes in Expo Go since it requires a custom dev build
- **Built a 100% pure React Native time adjuster UI** directly into the Add Drink modal:
  - Two-chip selector: "Just Now" (default) and "Custom Time"
  - When "Custom Time" is selected, a themed hour/minute adjuster appears with chevron up/down buttons
  - Hours adjust by ±1, minutes by ±5, with AM/PM label
  - All times are capped at `new Date()` to prevent logging future drinks
  - Fully styled for both dark and light themes using the existing `colors` system
- **Also removed `@react-native-community/datetimepicker`** (replaced in v1.1.4) — no native picker dependencies remain
- Graph and alertness curves continue to update correctly for any selected past time
- Bumped version to `1.1.5`, versionCode to `8`

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
| `INFO_POPUPS` | Info icons on settings + sleep panel | ✅ ON |
| `DETAILED_STATS` | Detailed statistics page | ❌ OFF |
| `NOTIFICATIONS` | Push notifications | ❌ OFF |
| `WIDGET_PREVIEW` | Widget preview in settings | ❌ OFF |
| `HOME_WIDGET` | Android home screen widget | ❌ OFF |
| `BACKGROUND_NOTIFICATIONS` | Background caffeine updates | ❌ OFF |
| `BACKGROUND_WIDGET_REFRESH` | Background widget sync | ❌ OFF |
