# Version 1.1.6 — Pure JS Scroll Wheel + Time Format Toggle

**Branch:** `release/v1.1.6`  
**Date:** 2026-02-23  
**versionCode:** 9

---

## Changelog

### Pure JS Scroll Wheel Time Picker
- **Replaced chevron up/down time adjuster** with an iOS-style scroll wheel picker built entirely from React Native `FlatList`
- Uses `snapToInterval` for smooth snapping, `onMomentumScrollEnd` for index calculation
- **Hours wheel:** Displays 00–23 in 24h mode or 1–12 in 12h mode
- **Minutes wheel:** Displays 00–59 (zero-padded)
- **AM/PM wheel:** Only rendered in 12h mode
- Selected item is styled with larger, bolder text; unselected items are smaller with reduced opacity
- Selection indicator lines highlight the active row
- **Zero native dependencies** — works in Expo Go without custom dev builds

### Global Time Format Preference
- Added `use24HourFormat` boolean to the Zustand store (persisted, defaults to `false`)
- Added `toggleTimeFormat()` action
- **Settings UI:** New "Time Format" toggle in the Appearance card with 12-Hour / 24-Hour label
- The wheel picker and chip display both respect the format preference

### Other
- Bumped version to `1.1.6`, versionCode to `9`
- Updated settings version string to `1.1.6`

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
