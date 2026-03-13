# Caffeine Tracker - Version 2.0.2 Hotfix

## Overview
Version 2.0.2 resolves several critical issues regarding app lifecycle state, background task stacking, and Android widget aesthetics and reliability.

## Changelog
### 1. App Foreground Re-rendering (Stuck UI)
- Implemented `AppState` event listeners within `app/index.tsx`, `app/detailed-stats.tsx`, and `src/components/DecayChart.tsx`.
- The application now correctly detects when it returns to the 'active' foreground state and automatically updates the internal `currentTime` state, forcing an instant real-time re-render of forecasting charts.

### 2. Notification Frequency Stacking
- Identified an issue where changing the notification frequency (e.g., from 1h to 3h) failed to clear older staggered updates, resulting in stacked notifications.
- The `scheduleCaffeineUpdates` method in `notificationService.ts` now properly reads `notificationFrequency` directly from the Zustand store.
- **CRITICAL FIX**: Explicitly integrated `cancelAllScheduledNotificationsAsync()` before scheduling any new batch of notifications, wiping the old queue and assigning fresh update triggers according to the selected frequency interval.

### 3. Android Widget Enhancements
- **UI Tweaks**: Adjusted the manual refresh button within `src/widget/GoodEnergyWidget.tsx` to utilize improved flexbox alignment, expanding its padding and hit-box area to resolve previous layout squeezing. 
- **Auto-Refresh Configuration**: Modified `app.config.ts` to set `updatePeriodMillis` to 15 minutes (`900000`). This harnesses the WorkManager backend provided by `react-native-android-widget` to bypass Android's native ~30-minute restriction and ensure more frequent automatic background updates.

### Versioning
- Version bumped to `2.0.2`.
- `versionCode` set to `11` as specified.
