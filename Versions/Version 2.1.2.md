# Version 2.1.2

## Changelog

### Improvements

- **Android notification icon** — New white-on-transparent status bar glyph and notification accent color `#050505` (matches app chrome) via `expo-notifications` in `app.config.ts`.
- **In-app review prompt** — After every **10th** logged dose (total count), a themed modal offers “Rate the app” (`expo-store-review`) or “Not now”. Gated by `STORE_REVIEW` in `featureFlags.js`.
- **Settings → Rate Caffeine Tracker** — Opens the Play listing (`market://` with HTTPS fallback) or App Store listing when `extra.iosAppStoreId` / `EXPO_PUBLIC_IOS_APP_STORE_ID` is set.

### Dependencies

- `expo-store-review` (SDK 54).

## Enabled Features (`featureFlags.js`)

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
- STORE_REVIEW: true
- HOME_WIDGET: true
- BACKGROUND_NOTIFICATIONS: true
- BACKGROUND_WIDGET_REFRESH: true
