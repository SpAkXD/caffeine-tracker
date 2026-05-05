# Version 2.1.6

## Changelog

### Fix

- **Detailed Statistics** — Restored [`app/detailed-stats.tsx`](app/detailed-stats.tsx) (and [`src/constants/motion.ts`](src/constants/motion.ts) bento stagger export) to the **2.1.4 overhaul** baseline, dropping the extra motion layer from 2.1.5 (parallax scroll, hero count-up gymnastics, AnimatedPath dash draw, segment spring scaffolding) that caused layout/feel issues.

### Still included from 2.1.4

- Hero / 7-day strip / bento metrics / Trend chart / hourly segmented table · theme-aware zones & borders · `FadeInSlot` / `PressableScale` · hourly row cascades (`ROW_STAGGER_MS` unchanged).

## Enabled Features (`featureFlags.js`)

- Unchanged from 2.1.5.
