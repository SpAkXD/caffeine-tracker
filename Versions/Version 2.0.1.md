# Version 2.0.1

**Date:** 2026-03-10
**Branch:** `release/v2.0.1`

## Summary

Patch update fixing four real-world performance bugs found during beta testing: unreliable background notifications, stale widget data, time picker mis-snapping, and chart clipping for past drinks.

---

## Changes

### 1. Bulletproof Notifications (Pre-Scheduling)
- **File:** `src/services/notificationService.ts`
  - Removed `schedulePeriodicNotifications()` (single repeating `TIME_INTERVAL` trigger)
  - Added `scheduleCaffeineUpdates(doses, halfLife)` — pre-schedules up to 24 individual local notifications using exact `Date` triggers (+1h, +2h, ..., +24h), each containing the projected caffeine mg level at that future time
  - Cancels all existing scheduled notifications before regenerating a fresh batch
- **File:** `src/store/useCaffeineStore.ts`
  - `addDose()` now calls `scheduleCaffeineUpdates()` after adding a drink (guarded by `notificationsEnabled`)
- **File:** `app/settings.tsx`
  - Notification toggle now calls `scheduleCaffeineUpdates()` instead of `registerBackgroundTask()`
  - Removed `registerBackgroundTask` / `unregisterBackgroundTask` imports (background task still runs for widget refresh only)

### 2. Widget Manual Reload Button
- **File:** `src/widget/GoodEnergyWidget.tsx`
  - Added a ⟳ refresh button in the bottom-right corner using `FlexWidget` with `clickAction="REFRESH_WIDGET"`
- **File:** `src/widget/widgetTaskHandler.tsx`
  - Added `WIDGET_CLICK` case to handle the refresh action — re-fetches data from `AsyncStorage` and re-renders the widget

### 3. Time Picker Snapping Math Fix
- **File:** `app/add-drink.tsx`
  - Fixed `getItemLayout` offset: added `+ ITEM_HEIGHT` to account for `contentContainerStyle` top padding, preventing scroll-to-offset mismatches that caused off-by-one snapping

### 4. Dynamic Chart X-Axis for Past Drinks
- **File:** `app/detailed-stats.tsx`
  - Replaced hardcoded `startTime = now - 2h` with dynamic calculation: finds oldest dose from today and uses `Math.min(now - 2h, oldestDoseTimestamp - 1h)`
  - `totalPoints` and `step` now scale dynamically to maintain ~10min resolution
- **File:** `src/components/DecayChart.tsx`
  - Replaced hardcoded `lookbackHours = 2` (single-day) with dynamic `useMemo` that checks the oldest dose from today and adds a 1h buffer

### Version Bump
- **File:** `app.config.ts` — version `"2.0.0"` → `"2.0.1"`
- **File:** `app/settings.tsx` — display string `"Version 2.0.0"` → `"Version 2.0.1"`
