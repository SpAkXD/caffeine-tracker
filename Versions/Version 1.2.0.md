# Version 1.2.0 — "Pro Prep"

> **Codename**: Pro Prep  
> **versionCode**: 7  
> **Branch**: `feat/v1.2.0-pro-prep`

---

## Changelog

### 🔔 Refactored Notification System
- Replaced periodic background notifications with a **single scheduled notification** at the exact timestamp when caffeine drops below the sleep threshold.
- System is now immune to OS killing background tasks — works via `scheduleNotificationAsync` with a `TIME_INTERVAL` trigger.
- `toggleNotifications()` now cancels pending notifications on toggle-off and reschedules on toggle-on.
- Notification frequency buttons now have a **solid primary background** when selected for clarity.

### 📊 AppState: Fix Frozen Chart & Widget
- Added `AppState` listener to `index.tsx`.
- On **foreground**: calls `refreshCurrentLevel()` to snap the chart to present.
- On **background**: pushes latest data to the Android home screen widget via `refreshWidget()`.

### 🏆 Upgraded "Detailed Statistics" Screen
Three new Pro-worthy sections added:
- **7-Day Average**: daily caffeine intake average with total and active days.
- **Top Drinks**: frequency-ranked drink sizes (grouped by `mg` value) with horizontal bar chart.
- **Sleep-Safe Streak**: consecutive days ending bedtime below the sleep threshold.

### 🧪 Developer "Mock Pro" Toggle
- New `isProDebug` state + `toggleProDebug()` action in Zustand store.
- "DEV: Toggle Pro Mode" button at the bottom of Settings (orange when active).
- When ON, unlocks **Detailed Statistics** and **Widget Preview** without changing `featureFlags.js`.

### ⚡ Fix "Add Drink" Time Lag
- `DecayChart` now uses `key={lastRefreshed}` to force a full re-render whenever state changes.
- Any call to `refreshCurrentLevel()` (including `addDose`) triggers an instant chart update.

---

## Active Feature Flags (unchanged)

| Flag | Status |
|------|--------|
| CAFFEINE_DISPLAY | ✅ |
| DECAY_CHART | ✅ |
| ALERTNESS_GRAPH | ✅ |
| CHART_TOGGLES | ✅ |
| THRESHOLD_LINE | ✅ |
| SLEEP_FORECAST | ✅ |
| SLEEP_QUALITY | ✅ |
| HISTORY_CARD | ✅ |
| ADD_DRINK | ✅ |
| THEME_TOGGLE | ✅ |
| WEIGHT_SETTING | ✅ |
| HALF_LIFE_SETTING | ✅ |
| THRESHOLD_SETTING | ✅ |
| CLEAR_DATA | ✅ |
| INFO_POPUPS | ✅ |
| DETAILED_STATS | ❌ (unlockable via Dev Toggle) |
| NOTIFICATIONS | ❌ |
| WIDGET_PREVIEW | ❌ (unlockable via Dev Toggle) |
| HOME_WIDGET | ❌ |
| BACKGROUND_NOTIFICATIONS | ❌ |
| BACKGROUND_WIDGET_REFRESH | ❌ |

---

## Version Details

- **Version**: 1.2.0
- **versionCode**: 7
- **Previous**: 1.1.3 (versionCode 6)
