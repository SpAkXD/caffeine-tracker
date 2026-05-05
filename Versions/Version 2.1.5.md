# Version 2.1.5

## Changelog

### Detailed Statistics — extra motion (`UI_MOTION`, no haptics)

- **Hero** — On focus, current mg **counts up** from ~65% of target to full over ~400 ms (no “0 mg” flash). While the screen stays focused, **level updates snap** to the new value.
- **Bento** — Tiles use staggered **FadeIn**; icons use delayed **ZoomIn** spring. Shared constant **`BENTO_STAGGER_MS`** in [`src/constants/motion.ts`](src/constants/motion.ts).
- **Trend chart** — Inner block **FadeInDown** spring on enter. **Caffeine line** uses **stroke dash draw** (`AnimatedPath` + `linePathLength` ≈ chord sum × 1.14) with ~1s ease-out; **web** uses a static line (no dash animation). **Reduce motion** / **UI_MOTION off** disables these.
- **Hourly filters** — **Spring scale** on the active segment chip (no `expo-haptics`).
- **Parallax** — Background **LinearGradient** sits in an **Animated** wrapper with tiny **translateY** from scroll (native only when `UI_MOTION` and not reduce motion). **Web** uses normal `ScrollView` (no Reanimated scroll binding).

## Enabled Features (`featureFlags.js`)

- Unchanged from 2.1.4 (including **UI_MOTION: true**, **DETAILED_STATS: true**).
