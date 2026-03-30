# Version 2.1.0

**Date:** 2026-03-30
**Branch:** `2.1.0`

## Summary

Minor release fixing notification reliability, adding detailed stats improvements, making the widget refresh button more usable, and wiring a proper Android notification icon path.

---

## Changes

### 1. Notification Frequency Now Respected

**Root cause fixed:** A stale background fetch task registration from pre-v2.0.1 installs persisted on-device and fired an immediate `trigger: null` notification on every run, completely bypassing the user's chosen frequency setting. The background task code still contained this notification send even though registration was removed in v2.0.1.

- **File:** `src/services/backgroundTask.tsx`
  - Removed the `trigger: null` immediate notification send (lines 113-121 in old code).
  - Background task now calls `scheduleCaffeineUpdates(doses, effectiveHalfLife, notificationFrequency)` instead — re-batching the next 24h of DATE-trigger notifications each time it runs. This also fixes the "notifications stop after 24h" issue.
  - Reads `notificationFrequency` directly from AsyncStorage persisted state (same as doses/halfLife) so the correct user-chosen interval is used even if the Zustand store is not fully hydrated in background context.
  - Removed unused `expo-notifications` import.

- **File:** `src/services/notificationService.ts`
  - Added optional `frequencyOverride?: 1 | 3 | 6` parameter to `scheduleCaffeineUpdates`. When provided, uses that value directly instead of reading from store. Allows background task to pass frequency from AsyncStorage.
  - Changed fallback from `|| 1` to `?? 3` (correct default, never silently drops to 1h).

- **File:** `app/_layout.tsx`
  - Added one-time `unregisterBackgroundTask()` call on app load to clean up stale OS-level background fetch registrations from pre-v2.0.1 installs. Safe no-op if not registered.

- **File:** `app/settings.tsx`
  - Fixed hardcoded "You'll receive hourly caffeine updates" alert text — now uses the selected frequency dynamically.
  - Added "Reminding you every Xh" confirmation text below the frequency option buttons so users get clear feedback that their selection took effect.

### 2. Notifications Never Run Out

Pre-scheduled DATE-trigger notifications cover 24 hours. Previously, if the background task never ran (or OS killed it), notifications would stop after 24h. Now the background task re-schedules the next 24h batch each time it fires, extending coverage indefinitely as long as the OS occasionally runs the background task. The pre-scheduled DATE triggers remain the primary delivery mechanism — reliable even without background fetch.

### 3. Widget Refresh Button (Bigger Tap Target)

- **File:** `src/widget/GoodEnergyWidget.tsx`
  - Increased refresh button padding: `paddingHorizontal` 16 → 20, `paddingVertical` 10 → 14.
  - Increased refresh icon font size: 14 → 18.
  - Improved icon visibility: color `#FFFFFF66` → `#FFFFFFAA`.
  - Added `flex: 1` to the center number section so it fills available space between top label and bottom row at any widget size.

- **File:** `src/widget/widgetTaskHandler.tsx`
  - Fixed comment: "every 30 min" → "every 15 min" (matches `updatePeriodMillis: 900000`).

### 4. Detailed Statistics — Now Enabled + Two New Stat Cards

- **File:** `featureFlags.js`
  - `DETAILED_STATS: false` → `DETAILED_STATS: true`. The screen now appears for all users (not just Pro Debug mode).

- **File:** `app/detailed-stats.tsx`
  - Added **3-day daily average** stat card: uses `getWeeklyHistory()` from store, averages `totalMg` across days that had at least one drink.
  - Added **Peak caffeine today** stat card: iterates today's dose timestamps via `calculateStackedCaffeine` to find the highest instantaneous level, compared against current level.
  - Stats grid expands to 3 rows of 2 (6 cards total) automatically via `flexWrap`.

### 5. Android Notification Icon Path

- **File:** `app.config.ts`
  - Changed `expo-notifications` icon from `./assets/images/icon.png` → `./assets/images/notification-icon.png`.
  - **Manual step required:** Create `assets/images/notification-icon.png` — 96×96px, monochrome white on transparent background. Without this file the build will fail.

### Version Bump

- **File:** `app.config.ts` — version `"2.0.2"` → `"2.1.0"`, `versionCode` 11 → 12
- **File:** `app/settings.tsx` — display string `"Version 2.0.1"` → `"Version 2.1.0"`

---

## Active Features (featureFlags.js)

| Flag | Status |
|------|--------|
| CAFFEINE_DISPLAY | ✅ true |
| DECAY_CHART | ✅ true |
| ALERTNESS_GRAPH | ✅ true |
| CHART_TOGGLES | ✅ true |
| THRESHOLD_LINE | ✅ true |
| SLEEP_FORECAST | ✅ true |
| SLEEP_QUALITY | ✅ true |
| HISTORY_CARD | ✅ true |
| DETAILED_STATS | ✅ true *(newly enabled)* |
| ADD_DRINK | ✅ true |
| THEME_TOGGLE | ✅ true |
| NOTIFICATIONS | ❌ false *(visible via isProDebug)* |
| WEIGHT_SETTING | ✅ true |
| HALF_LIFE_SETTING | ✅ true |
| THRESHOLD_SETTING | ✅ true |
| WIDGET_PREVIEW | ❌ false *(visible via isProDebug)* |
| CLEAR_DATA | ✅ true |
| INFO_POPUPS | ✅ true |
| HOME_WIDGET | ✅ true |
| BACKGROUND_NOTIFICATIONS | ✅ true |
| BACKGROUND_WIDGET_REFRESH | ✅ true |

---

## Caveats

- **notification-icon.png** must be manually added before building. The EAS build will fail without it.
- iOS: widget and background fetch changes don't apply. Notification pre-scheduling works identically.
- A **new EAS build** is required for all changes to take effect on physical devices.
