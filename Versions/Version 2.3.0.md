# Version 2.3.0 (versionCode 22)

**Release date:** 2026-07-01
**Type:** Production release — Pro tier goes live

## Changelog

### 🔒 Production hardening (removed all dev tools)
- **Removed "DEV: Toggle Pro Mode" button** from Settings — it was visible to all users and would have let anyone unlock Pro for free.
- Removed `isProDebug` flag entirely (store, `useProStore.isPro()`, widget Pro checks, Dashboard).
- Removed "DEV: Send Test Notification" button and both test-notification functions from `notificationService`.
- Removing the `useCaffeineStore` import from `useProStore` also eliminates the last circular dependency.

### 📱 Widget redesign (smoother)
- Refresh button moved to a round chip in the top-right corner; crash time now gets the full bottom row (centered, truncates with … instead of colliding with the button).
- Corner radius 16 → 24 to better match modern launchers.
- Replaced invalid layout props (`flexWrap`, `flex` on text, `minWidth`) that Android silently ignored — fixes the janky bottom row and all 3 outstanding TypeScript errors.
- In-app Widget Preview (Settings) updated to mirror the real widget.
- Widget + background task now respect the 12h/24h time-format setting for "Crash at" times.
- Background-fetch widget update now also enforces the Pro gate (upgrade placeholder for free users).

### 📤 Export fixed + upgraded to Excel
- Fixed crash ("Cannot read property 'UTF8' of undefined") — SDK 54 moved `EncodingType` to `expo-file-system/legacy`.
- Export now produces a real `.xlsx` workbook (SheetJS) instead of CSV; Settings row renamed "Export Data (Excel)".

### 🧰 Build fixes (2.2.1–2.2.2, rolled into this release)
- Downgraded `expo-file-system` 55 → ~19.0.23 and `expo-sharing` 55 → ~14.0.8 to match Expo SDK 54 (fixed release build failure at `compileReleaseJavaWithJavac`).
- IAP: `fetchProducts` pre-warm before `requestPurchase`; billing errors surfaced via Alert (fixed silent "buy does nothing").

## Feature flags (all enabled)
CAFFEINE_DISPLAY, DECAY_CHART, ALERTNESS_GRAPH, CHART_TOGGLES, THRESHOLD_LINE, SLEEP_FORECAST, SLEEP_QUALITY, HISTORY_CARD, DETAILED_STATS, ADD_DRINK, THEME_TOGGLE, NOTIFICATIONS, WEIGHT_SETTING, HALF_LIFE_SETTING, THRESHOLD_SETTING, WIDGET_PREVIEW, CLEAR_DATA, INFO_POPUPS, STORE_REVIEW, PAYWALL, DOSE_ADVISOR, CUSTOM_PRESETS, CSV_EXPORT, EXTENDED_HISTORY, HOME_WIDGET, BACKGROUND_NOTIFICATIONS, BACKGROUND_WIDGET_REFRESH, UI_MOTION

## Pro tier (live)
- SKU: `pro_unlock_lifetime` · one-time $1.99 · Google Play Billing via react-native-iap v15
- Gated features: Detailed Statistics, Dose Advisor, Home Screen Widget, Excel Export, Custom Drink Presets, 30-day history
- Entitlement re-verified against Play Store on every launch; Restore Purchase available to all users (Google policy)
