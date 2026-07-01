# Version 2.4.0 (versionCode 23)

**Release date:** 2026-07-02
**Type:** Feature release — onboarding + streaks

## Changelog

### 👋 First-launch onboarding (new)
- 3-step onboarding on first launch (`src/components/OnboardingModal.tsx`):
  1. **Half-life explainer** — why caffeine lingers ("your 4 PM espresso is still 25% active at midnight")
  2. **Weight** — slider, personalizes effective half-life
  3. **Bedtime** — hour stepper, drives the sleep forecast
- Skippable at any point; settings can be changed later in Settings.
- Waits for AsyncStorage hydration before showing, so existing users don't get a flash of onboarding.
- Existing users see it once (new `hasOnboarded` flag defaults to false).
- Flag: `ONBOARDING`.

### 🔥 Weekly summary + streaks (new)
- New "This Week" card on the Dashboard (`src/components/WeeklySummaryCard.tsx`):
  - 7-day mini bar chart (cyan = under 400 mg, red = over)
  - Streak chip: consecutive days at/under the FDA 400 mg guideline
  - Weekly total + daily average
- New `dailyIntakeLog` in the store: per-day mg totals maintained transactionally on add/remove/clear, pruned after 60 days. Survives the 3-day dose retention purge, so weekly stats work for free users too.
- Streak is bounded by the earliest logged day (no infinite streaks on fresh installs).
- Flag: `WEEKLY_SUMMARY`.

## Feature flags
All flags enabled, including new `ONBOARDING` and `WEEKLY_SUMMARY`.
⚠️ Both new features are untested on-device as of this commit — test in closed testing before promoting; flip the two flags to `false` if shipping without testing.

## Notes
- Streak/weekly data starts accumulating from install/update day (no backfill from old doses).
- Daily limit constant: `DAILY_LIMIT_MG = 400` (`src/store/useCaffeineStore.ts`).
