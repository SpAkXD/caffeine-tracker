import { FadeIn, FadeInDown } from 'react-native-reanimated';

export const STAGGER_MS = 64;
/** Denser screens (e.g. detailed stats) */
export const STAGGER_FAST_MS = 52;
/** Hourly table row cascade */
export const ROW_STAGGER_MS = 28;
/** Cap total delay so long screens don’t feel sluggish */
export const MAX_STAGGER_DELAY_MS = 560;

export function sectionEntering(slotIndex: number, reduceMotion: boolean) {
    if (reduceMotion) return FadeIn.duration(1);
    const delay = Math.min(slotIndex * STAGGER_MS, MAX_STAGGER_DELAY_MS);
    return FadeInDown.delay(delay).springify().damping(17).stiffness(205);
}

export function sectionEnteringFast(slotIndex: number, reduceMotion: boolean) {
    if (reduceMotion) return FadeIn.duration(1);
    const delay = Math.min(slotIndex * STAGGER_FAST_MS, MAX_STAGGER_DELAY_MS);
    return FadeInDown.delay(delay).springify().damping(18).stiffness(215);
}

export function modalCardEntering(reduceMotion: boolean) {
    if (reduceMotion) return FadeIn.duration(1);
    return FadeInDown.delay(40).springify().damping(16).stiffness(220);
}
