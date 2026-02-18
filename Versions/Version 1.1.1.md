# Version 1.1.1 — User Feedback Fixes

**Branch:** `release/v1.1.1`  
**Date:** 2026-02-18  
**versionCode:** 4

---

## Changelog

- **Fixed "Add Drink" button overlap** on devices with Android gesture/navigation bars by applying safe area inset padding (`useSafeAreaInsets`) to the FAB container in `app/index.tsx`
- **Lowered weight slider minimum** from 40kg to 30kg in `app/settings.tsx` to accommodate a wider range of users
- **Added info popup modals** next to the Weight, Base Half-Life, and Sleep Threshold settings titles (`app/settings.tsx`) — each displays a clear explanation of how that metric affects the caffeine math
- Created reusable `src/components/InfoPopupModal.tsx` component (dark-themed, cyan accents)
- Added `INFO_POPUPS` feature flag to `featureFlags.js` and `src/config/featureFlags.ts`
- Bumped version to `1.1.1`, versionCode to `4`

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
