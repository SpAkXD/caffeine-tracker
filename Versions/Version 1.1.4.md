# Version 1.1.4 — Custom Time Picker

**Branch:** `release/v1.1.4`  
**Date:** 2026-02-23  
**versionCode:** 7

---

## Changelog

- **Added custom time selection to the Add Drink modal** — users can now pick an exact past time for their caffeine intake instead of being limited to "Just Now", "30m ago", or "1h ago"
- Replaced the three hardcoded time chips with two chips: **"Just Now"** and **"Custom Time"** (opens native `DateTimePicker`)
- The "Custom Time" chip displays the selected time (e.g. "2:15 PM") once chosen; the picker prevents selecting future times via `maximumDate`
- Added `@react-native-community/datetimepicker` dependency and Expo plugin
- Bumped version to `1.1.4`, versionCode to `7`

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
