# Version 2.1.3

## Changelog

### UX / Motion (`UI_MOTION` flag)

- **Shared primitives** — `PressableScale` (spring shrink on press), `FadeInSlot` (staggered `FadeInDown` entrances), `src/constants/motion.ts` timing helpers.
- **Reduce motion** — Respects system “Reduce motion” via `AccessibilityInfo` / `useReduceMotion` (minimal-duration fades when enabled).
- **Dashboard** (`app/index.tsx`) — Staggered sections; **settings** FAB uses **PressableScale** + light haptic (`StyledButton impactLightOnPress`); richer dark **LinearGradient**.
- **Add drink** (`app/add-drink.tsx`) — Screen sections staggered; **PressableScale** on close, presets (via **`DrinkPresetCard`**), dropdown, modal chips/buttons; confirmation card uses **`modalCardEntering`** + **Reanimated `Animated`** (RN **`Animated`** aliased **`RNAnimated`** for wheel picker). Haptic when opening dose confirmation when motion is on.
- **GlassmorphicCard** — Subtle shadow / elevation on **light** theme only.
- **HistoryCard** — Bar height updates use **`Layout.springify()`** when `UI_MOTION` is on.
- **ChartToggleButtons** — Pressable-scale toggles.
- **Modals** — **`RateAppPromptModal`** and **`InfoPopupModal`** animate card entrance; rate actions use **`PressableScale`**.
- **Settings** — Frequency chips, rate row, dev toggle, and info icons use **`PressableScale`**.
- **Navigation** — **`add-drink`** modal presentation: **`slide_from_bottom`** (iOS) / **`fade_from_bottom`** (Android).
- **`StyledButton`** — Honors **`UI_MOTION`** for spring scale; optional **`impactLightOnPress`** for primary actions.

Fonts from the brainstorm list were intentionally skipped (plan optional phase).

## Enabled Features (`featureFlags.js`)

- CAFFEINE_DISPLAY through BACKGROUND_WIDGET_REFRESH: unchanged from 2.1.2 (`true`).
- STORE_REVIEW: true
- **UI_MOTION: true**

## Future ideas

See backlog in [Version 2.1.2.md](Version%202.1.2.md) (still current product notes).
