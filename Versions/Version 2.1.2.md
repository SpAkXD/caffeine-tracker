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

## Future ideas (backlog)

Ideas from planning — not part of 2.1.2; sketch for later iterations.

1. **Daily caffeine budget** — User sets a max mg per day; dashboard shows “remaining budget” and a suggested last-coffee time (reuse existing decay math).
2. **Cutoff alarm** — One smart local notification, e.g. if you stop caffeine now you’ll be under the sleep threshold by bedtime (uses threshold + bedtime already in the store).
3. **Export / backup** — JSON or CSV export of doses (privacy-first, no server); optional import when switching phones.
4. **Presets library + search** — User-saved drinks (name + mg) and quick re-log from history beyond the fixed presets.
5. **Insights card** — Rolling 7-day average, “heaviest day”, ties to self-reported sleep quality using helpers like `getWeeklyHistory()`.
