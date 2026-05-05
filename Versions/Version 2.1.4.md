# Version 2.1.4

## Changelog

### Light mode & glass

- **GlassmorphicCard** — Light theme uses a solid `colors.card` surface with no `BlurView`, so rounded corners stay clean on Android/iOS. Dark theme keeps frosted blur. `style` prop accepts `StyleProp<ViewStyle>` (arrays safe).

### Detailed Statistics (`DETAILED_STATS`)

- **Layout** — Hero block (current level, today drinks/mg, first dose time, clearance line), 7-day bar strip, six **bento** metric tiles with **Ionicons** + tabular numbers (no stacked glass mini-cards).
- **Derived metrics** — 7-day total, average mg/day (active days only), average mg/drink, peak energy window, sleep-threshold clearance, half-life + weight; week caption for heaviest/lightest day and today vs 7-day average.
- **Chart** — Theme-aware night-zone shading; section retitled **Trend** with subtitle.
- **Hourly table** — Themed dividers (`colors.border`), zebra rows, segmented filter (All / Earlier / Next 12h). First 12 visible rows use **Reanimated** `FadeIn` stagger when `UI_MOTION` is on and reduce motion is off.
- **Motion** — **FadeInSlot** `variant="fast"` for denser stagger; **PressableScale** on back and segment chips.

### Motion helpers

- **`motion.ts`** — `STAGGER_FAST_MS`, `ROW_STAGGER_MS`, `sectionEnteringFast()` for dense screens.
- **`FadeInSlot`** — Optional `variant: 'default' | 'fast'`.

## Enabled Features (`featureFlags.js`)

- Unchanged from 2.1.3 (including **UI_MOTION: true**, **DETAILED_STATS: true**).
