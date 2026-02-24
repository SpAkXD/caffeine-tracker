# Version 1.1.7

**Date:** 2026-02-24
**Branch:** `release/v1.1.6`

## Summary

Enhanced the `DecayChart` with hourly X-axis labels for better readability, with collision-aware rendering to avoid overlapping the "Now" indicator.

---

## Changes

### X-Axis Hourly Labels on DecayChart
- **File:** `src/components/DecayChart.tsx`
- Changed X-axis labels from **3-hourly** to **every hour** for improved granularity
- **Root cause fix:** Chart data points are generated at 30-min intervals from arbitrary timestamps (e.g., 9:17, 9:47), so they never land on `:00`. The old `date.getMinutes() === 0` check never matched. New approach computes hourly positions directly from the chart's time range via ratio interpolation: `(hourTimestamp - chartFirstTime) / chartTimeRange`
- Added `use24HourFormat` support from the store:
  - **24h mode:** Shows bare hour numbers (e.g., `0`, `6`, `14`, `22`)
  - **12h mode:** Shows abbreviated format (e.g., `6a`, `2p`, `12a`)
- **Collision avoidance (3 layers):**
  1. **25px minimum** distance from the "Now" indicator — labels within this range are skipped
  2. **20px minimum** distance between adjacent hour labels — prevents overcrowding
  3. **15px edge margin** — labels too close to chart edges are not rendered
- **Styling:** `colors.textSecondary`, opacity `0.5`, font size `10`, `textAnchor="middle"`
- Replaced `date-fns format()` calls with manual hour formatting (lighter, no locale dependency)
- Added `use24HourFormat` to the `useMemo` dependency array

### Other
- No version bump in `app.config.ts`
- No feature flags were modified
