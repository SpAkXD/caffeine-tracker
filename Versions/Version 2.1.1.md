# Version 2.1.1

## Changelog

### Bug Fixes

- **Fix require cycle** between `useCaffeineStore.ts` and `notificationService.ts`.
  - `notificationService.ts` no longer imports or references `useCaffeineStore`.
  - `scheduleCaffeineUpdates` now requires `frequencyHours` as an explicit argument (`1 | 3 | 6`) — callers (store, settings, background task) pass it directly.
  - This eliminates the circular module dependency that caused duplicate scheduling logs on hot reload in dev.

- **All notification scheduling uses explicit frequency** — `useCaffeineStore.addDose`, `settings.handleNotificationToggle`, and `settings.handleFrequencyChange` all now pass `notificationFrequency` explicitly to `scheduleCaffeineUpdates`.

- **No remote push tokens** — confirmed: no `getExpoPushTokenAsync` or remote push API usage anywhere in the codebase. All notifications are local (`scheduleNotificationAsync` with DATE triggers only).

## Enabled Features (featureFlags.js)

- CAFFEINE_DISPLAY: true
- DECAY_CHART: true
- ALERTNESS_GRAPH: true
- CHART_TOGGLES: true
- THRESHOLD_LINE: true
- SLEEP_FORECAST: true
- SLEEP_QUALITY: true
- HISTORY_CARD: true
- DETAILED_STATS: true
- ADD_DRINK: true
- THEME_TOGGLE: true
- NOTIFICATIONS: true
- WEIGHT_SETTING: true
- HALF_LIFE_SETTING: true
- THRESHOLD_SETTING: true
- WIDGET_PREVIEW: true
- CLEAR_DATA: true
- INFO_POPUPS: true
- HOME_WIDGET: true
- BACKGROUND_NOTIFICATIONS: true
- BACKGROUND_WIDGET_REFRESH: true
