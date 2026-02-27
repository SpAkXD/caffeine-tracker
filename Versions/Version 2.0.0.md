# Version 2.0.0

**Date:** 2026-02-27
**Branch:** `release/v2.0.0`

## Summary

Enables all premium "Pro" feature flags and adds a Developer Pro Mode debug toggle to the Settings screen, allowing the full V2.0.0 experience to be tested (notifications, widgets, detailed stats).

---

## Changes

### Pro Feature Flags Enabled
- **File:** `featureFlags.js`
- Set `DETAILED_STATS` → `true`
- Set `NOTIFICATIONS` → `true`
- Set `WIDGET_PREVIEW` → `true`
- Set `HOME_WIDGET` → `true`
- Set `BACKGROUND_NOTIFICATIONS` → `true`
- Set `BACKGROUND_WIDGET_REFRESH` → `true`

### Developer Pro Mode Toggle
- **File:** `src/store/useCaffeineStore.ts`
  - Added `isProDebug: boolean` state (default `false`) and `toggleProDebug()` action
- **File:** `app/settings.tsx`
  - Imported `isProDebug` and `toggleProDebug` from the store
  - Added "DEV: Toggle Pro Mode" button at the bottom of Settings (orange flash icon, ON/OFF label)
  - Guarded Notifications and Widget Preview sections with `(FEATURES.X || isProDebug)`
  - Updated version display to `"Version 2.0.0"`
- **File:** `app/index.tsx`
  - Imported `isProDebug` from the store
  - Guarded Detailed Statistics button with `(FEATURES.DETAILED_STATS || isProDebug)`

### Version Bump
- **File:** `app.config.ts` — version `"1.1.7"` → `"2.0.0"`
