# Version 2.2.0

## Summary

Introduces **Half-lifr Pro** — a one-time $1.99 in-app purchase via Google Play Billing that unlocks five features. No subscription, no expiry.

---

## Changelog

### New — Pro Tier
- **Google Play Billing integration** (`react-native-iap` v15) — non-consumable managed product `pro_unlock_lifetime`.
- Purchase state persisted in new `useProStore` (separate Zustand store, AsyncStorage). Re-verified against Play Store on every app launch; automatically revokes access on refund.
- `isPro()` selector = `hasPurchased || isProDebug` — existing dev toggle still works for testing.
- **PaywallModal** — full-screen upgrade sheet listing all 5 Pro features, $1.99 CTA, Restore Purchase button.
- **ProBadge** chip shown next to locked features on Dashboard.
- **ProLockOverlay** for in-place lock UI (used in Add Drink → My Drinks).

### New — Pro Features
- **Smart Dose Advisor** (`app/dose-advisor.tsx`) — Pick a target time (1–4h) and energy level (Moderate / Focused / Peak). Algorithm scores 3,000+ dose+timing combos using existing `calculateAlertness` + `calculateClearanceTime` math and returns top 3 recommendations with sleep impact. Accessible from Dashboard.
- **CSV Export** — "Export Data (CSV)" in Settings → Pro section. Writes `caffeine-export-YYYY-MM-DD.csv` via `expo-file-system` v55 class API and opens the share sheet.
- **Custom Drink Presets** — Save your own drinks (name + mg) via Settings → Manage Custom Drinks. Custom presets appear in Add Drink → My Drinks section. Full CRUD via `CustomPresetEditor` modal.
- **Extended History** — Pro users retain 30 days of doses (up from 3). History retention is Pro-aware in `cleanupOldDoses`.

### Pro-Gated Existing Features
- **Detailed Statistics** — Dashboard button now shows `ProBadge` and opens PaywallModal for non-Pro users.
- **Home Screen Widget** — `refreshWidget` returns an "Upgrade to Pro" placeholder for non-Pro users.

### Settings — Pro Section
- Shows "Upgrade to Pro — $1.99" CTA (non-Pro) or "Pro Unlocked ✓" indicator (Pro).
- **Restore Purchase** button (required by Google Play policy) always visible.
- Pro users also see: Manage Custom Drinks, Export Data (CSV).

### Dependencies Added
- `react-native-iap@^15.3.0`
- `expo-file-system@^55.0.20` (already in Expo SDK; new class-based API used)
- `expo-sharing` (for CSV share sheet)

---

## Feature Flags (`featureFlags.js`)

| Flag | Value |
|---|---|
| PAYWALL | ✅ true |
| DOSE_ADVISOR | ✅ true |
| CUSTOM_PRESETS | ✅ true |
| CSV_EXPORT | ✅ true |
| EXTENDED_HISTORY | ✅ true |
| All previous flags | Unchanged |

---

## Play Console Setup (one-time, after build)

1. **Monetize → In-app products → Create**
   - Product ID: `pro_unlock_lifetime`
   - Name: "Half-lifr Pro"
   - Price: $1.99
   - Status: Active
2. Upload AAB to Internal Testing track
3. Add tester Gmail → **Setup → License testing → add email**
4. Install from internal track link and test purchase

---

## Version

- `version`: 2.2.0
- `versionCode`: 19
