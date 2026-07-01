import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStackedCaffeine, calculateAlertness, calculateClearanceTime, Dose } from '../utils/math';
import { addHours, subHours, subDays, startOfDay, format, isSameDay } from 'date-fns';
import { refreshWidget } from '../widget/refreshWidget';
import { scheduleCaffeineUpdates } from '../services/notificationService';

export interface CustomPreset {
    id: string;
    name: string;
    mg: number;
}

interface DailyStats {
    date: string; // 'YYYY-MM-DD'
    totalMg: number;
    doseCount: number;
}

interface CaffeineState {
    doses: Dose[];
    halfLifeHours: number;
    sleepThresholdMg: number;
    theme: 'light' | 'dark';
    weightKg: number;
    notificationsEnabled: boolean;
    notificationFrequency: 1 | 3 | 6; // hours between notifications
    sleepQuality: 'great' | 'average' | 'poor';
    bedtimeHour: number; // 0-23, default 22 (10 PM)
    use24HourFormat: boolean; // 12h vs 24h time display
    customPresets: CustomPreset[];
    hasOnboarded: boolean; // First-launch onboarding completed
    /**
     * Per-day intake totals ('yyyy-MM-dd' → total mg).
     * Kept separately from doses[] so weekly stats & streaks survive
     * the 3-day dose retention purge. Pruned after 60 days.
     */
    dailyIntakeLog: Record<string, number>;

    // === SINGLE SOURCE OF TRUTH ===
    // These are computed once and shared across all components.
    currentLevel: number;
    clearanceTime: number | null; // Timestamp when level drops below threshold, null if already clear
    lastRefreshed: number; // Timestamp of last refresh

    // Actions
    addDose: (mg: number, timestamp?: number) => void;
    removeDose: (id: string) => void;
    updateSettings: (settings: { halfLife?: number; threshold?: number; weight?: number }) => void;
    toggleTheme: () => void;
    toggleTimeFormat: () => void;
    toggleNotifications: () => void;
    setNotificationFrequency: (frequency: 1 | 3 | 6) => void;
    setSleepQuality: (quality: 'great' | 'average' | 'poor') => void;
    setBedtime: (hour: number) => void;
    clearDoses: () => void;
    cleanupOldDoses: () => void;
    addCustomPreset: (name: string, mg: number) => void;
    removeCustomPreset: (id: string) => void;
    updateCustomPreset: (id: string, partial: Partial<Pick<CustomPreset, 'name' | 'mg'>>) => void;
    refreshCurrentLevel: () => void; // Recalculate currentLevel + clearanceTime from Date.now()
    completeOnboarding: () => void;

    // Selectors (still available for backward compat)
    getCurrentLevel: () => number;
    getEffectiveHalfLife: () => number;
    getChartData: (hoursLookback?: number, hoursLookahead?: number) => { value: number; label?: string; date: number }[];
    getAlertnessData: (hoursLookback?: number, hoursLookahead?: number) => { value: number; date: number }[];
    getWeeklyHistory: () => DailyStats[];
    getTodaysDoses: () => Dose[];
    /** Consecutive days (ending today) with intake ≤ DAILY_LIMIT_MG. 0 if nothing ever logged. */
    getStreakDays: () => number;
    /** Last 7 days of intake totals from dailyIntakeLog (oldest → today). */
    getWeeklyIntake: () => { date: string; totalMg: number }[];
}

/** FDA-recommended daily caffeine ceiling for healthy adults. */
export const DAILY_LIMIT_MG = 400;

/**
 * Calculate effective half-life based on body weight.
 */
const calculateEffectiveHalfLife = (baseHalfLife: number, weightKg: number): number => {
    const baselineWeight = 70;
    const adjustmentPerKg = 0.05;
    const weightDifference = weightKg - baselineWeight;
    const adjustment = weightDifference * adjustmentPerKg;
    const effectiveHalfLife = baseHalfLife - adjustment;
    return Math.max(3, Math.min(7, effectiveHalfLife));
};

const FREE_RETENTION_MS = 3 * 24 * 60 * 60 * 1000;
const PRO_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;

export const useCaffeineStore = create<CaffeineState>()(
    persist(
        (set, get) => ({
            doses: [],
            halfLifeHours: 5,
            sleepThresholdMg: 50,
            theme: 'dark',
            weightKg: 70,
            notificationsEnabled: false,
            notificationFrequency: 3,
            sleepQuality: 'great',
            bedtimeHour: 22,
            use24HourFormat: false,
            customPresets: [],
            hasOnboarded: false,
            dailyIntakeLog: {},

            // === Single Source of Truth state ===
            currentLevel: 0,
            clearanceTime: null,
            lastRefreshed: 0,

            addDose: (mg, timestamp = Date.now()) => {
                const dayKey = format(new Date(timestamp), 'yyyy-MM-dd');
                set((state) => ({
                    doses: [
                        ...state.doses,
                        { id: Math.random().toString(36).substr(2, 9), mg, timestamp },
                    ],
                    dailyIntakeLog: {
                        ...state.dailyIntakeLog,
                        [dayKey]: (state.dailyIntakeLog[dayKey] ?? 0) + mg,
                    },
                }));
                // Auto-cleanup and refresh after adding
                get().cleanupOldDoses();
                get().refreshCurrentLevel();
                // Update home screen widget immediately
                refreshWidget().catch(() => { });
                // Re-schedule notification batch with updated projections
                if (get().notificationsEnabled) {
                    const { doses, notificationFrequency } = get();
                    const hl = get().getEffectiveHalfLife();
                    scheduleCaffeineUpdates(doses, hl, notificationFrequency).catch(() => { });
                }
            },

            removeDose: (id) => {
                set((state) => {
                    const dose = state.doses.find((d) => d.id === id);
                    const next: Partial<CaffeineState> = {
                        doses: state.doses.filter((d) => d.id !== id),
                    };
                    if (dose) {
                        const dayKey = format(new Date(dose.timestamp), 'yyyy-MM-dd');
                        next.dailyIntakeLog = {
                            ...state.dailyIntakeLog,
                            [dayKey]: Math.max(0, (state.dailyIntakeLog[dayKey] ?? 0) - dose.mg),
                        };
                    }
                    return next;
                });
                get().refreshCurrentLevel();
                refreshWidget().catch(() => { });
            },

            updateSettings: ({ halfLife, threshold, weight }) => {
                set((state) => ({
                    halfLifeHours: halfLife ?? state.halfLifeHours,
                    sleepThresholdMg: threshold ?? state.sleepThresholdMg,
                    weightKg: weight ?? state.weightKg,
                }));
                get().refreshCurrentLevel();
            },

            toggleTheme: () => {
                set((state) => ({
                    theme: state.theme === 'dark' ? 'light' : 'dark',
                }));
            },

            toggleTimeFormat: () => {
                set((state) => ({
                    use24HourFormat: !state.use24HourFormat,
                }));
            },

            toggleNotifications: () => {
                set((state) => ({
                    notificationsEnabled: !state.notificationsEnabled,
                }));
            },

            setSleepQuality: (quality) => {
                set({ sleepQuality: quality });
            },

            setNotificationFrequency: (frequency) => {
                set({ notificationFrequency: frequency });
            },

            setBedtime: (hour) => {
                set({ bedtimeHour: Math.max(0, Math.min(23, hour)) });
            },

            clearDoses: () => {
                set({ doses: [], currentLevel: 0, clearanceTime: null, dailyIntakeLog: {} });
                refreshWidget().catch(() => { });
            },

            cleanupOldDoses: () => {
                // Import lazily to avoid circular deps at module init time
                const { useProStore } = require('./useProStore');
                const isPro = useProStore.getState().isPro();
                const cutoff = Date.now() - (isPro ? PRO_RETENTION_MS : FREE_RETENTION_MS);
                const logCutoffKey = format(subDays(new Date(), 60), 'yyyy-MM-dd');
                set((state) => {
                    // Prune daily intake log entries older than 60 days
                    const prunedLog: Record<string, number> = {};
                    for (const [day, mg] of Object.entries(state.dailyIntakeLog)) {
                        if (day >= logCutoffKey) prunedLog[day] = mg;
                    }
                    return {
                        doses: state.doses.filter((d) => d.timestamp >= cutoff),
                        dailyIntakeLog: prunedLog,
                    };
                });
            },

            addCustomPreset: (name, mg) => {
                set((state) => ({
                    customPresets: [
                        ...state.customPresets,
                        { id: Math.random().toString(36).substr(2, 9), name, mg },
                    ],
                }));
            },

            removeCustomPreset: (id) => {
                set((state) => ({
                    customPresets: state.customPresets.filter((p) => p.id !== id),
                }));
            },

            updateCustomPreset: (id, partial) => {
                set((state) => ({
                    customPresets: state.customPresets.map((p) =>
                        p.id === id ? { ...p, ...partial } : p
                    ),
                }));
            },

            completeOnboarding: () => {
                set({ hasOnboarded: true });
            },

            // === REFRESH: Single calculation point ===
            refreshCurrentLevel: () => {
                const { doses, sleepThresholdMg } = get();
                const effectiveHalfLife = get().getEffectiveHalfLife();
                const now = Date.now();
                const level = calculateStackedCaffeine(doses, now, effectiveHalfLife);
                const clearance = calculateClearanceTime(doses, sleepThresholdMg, effectiveHalfLife, now);
                set({
                    currentLevel: level,
                    clearanceTime: clearance,
                    lastRefreshed: now,
                });
            },

            getEffectiveHalfLife: () => {
                const { halfLifeHours, weightKg } = get();
                return calculateEffectiveHalfLife(halfLifeHours, weightKg);
            },

            // Backward-compat: still available but prefer store's currentLevel
            getCurrentLevel: () => {
                const { doses } = get();
                const effectiveHalfLife = get().getEffectiveHalfLife();
                return calculateStackedCaffeine(doses, Date.now(), effectiveHalfLife);
            },

            getChartData: (hoursLookback = 4, hoursLookahead = 8) => {
                const { doses } = get();
                const effectiveHalfLife = get().getEffectiveHalfLife();
                const now = Date.now();
                const startTime = subHours(now, hoursLookback).getTime();
                const endTime = addHours(now, hoursLookahead).getTime();

                const dataPoints = [];
                for (let time = startTime; time <= endTime; time += 30 * 60 * 1000) {
                    const level = calculateStackedCaffeine(doses, time, effectiveHalfLife);
                    dataPoints.push({
                        value: parseFloat(level.toFixed(1)),
                        date: time,
                    });
                }
                return dataPoints;
            },

            getAlertnessData: (hoursLookback = 4, hoursLookahead = 8) => {
                const { doses, sleepQuality } = get();
                const effectiveHalfLife = get().getEffectiveHalfLife();
                const now = Date.now();
                const startTime = subHours(now, hoursLookback).getTime();
                const endTime = addHours(now, hoursLookahead).getTime();

                const qualityMultiplier = sleepQuality === 'great' ? 1.0 : sleepQuality === 'average' ? 0.8 : 0.6;

                const dataPoints: { value: number; date: number }[] = [];
                for (let time = startTime; time <= endTime; time += 30 * 60 * 1000) {
                    const alertness = calculateAlertness(doses, time, effectiveHalfLife, undefined, qualityMultiplier);
                    dataPoints.push({
                        value: parseFloat(alertness.toFixed(1)),
                        date: time,
                    });
                }
                return dataPoints;
            },

            getWeeklyHistory: () => {
                const { doses } = get();
                const stats: DailyStats[] = [];

                for (let i = 2; i >= 0; i--) {
                    const day = subDays(new Date(), i);
                    const dayStart = startOfDay(day).getTime();
                    const dayEnd = dayStart + 24 * 60 * 60 * 1000;

                    const dayDoses = doses.filter(d => d.timestamp >= dayStart && d.timestamp < dayEnd);
                    const totalMg = dayDoses.reduce((sum, d) => sum + d.mg, 0);

                    stats.push({
                        date: format(day, 'yyyy-MM-dd'),
                        totalMg,
                        doseCount: dayDoses.length,
                    });
                }

                return stats;
            },

            getTodaysDoses: () => {
                const { doses } = get();
                const todayStart = startOfDay(new Date()).getTime();
                return doses.filter(d => d.timestamp >= todayStart).sort((a, b) => b.timestamp - a.timestamp);
            },

            getStreakDays: () => {
                const { dailyIntakeLog } = get();
                const loggedDays = Object.keys(dailyIntakeLog);
                if (loggedDays.length === 0) return 0;

                // Walk backwards from today; a day counts if intake ≤ limit
                // (days with no entry count as 0 mg). Stop at the earliest
                // logged day so a fresh install doesn't get an infinite streak.
                const earliest = loggedDays.sort()[0];
                let streak = 0;
                for (let i = 0; i < 60; i++) {
                    const dayKey = format(subDays(new Date(), i), 'yyyy-MM-dd');
                    if (dayKey < earliest) break;
                    if ((dailyIntakeLog[dayKey] ?? 0) <= DAILY_LIMIT_MG) {
                        streak++;
                    } else {
                        break;
                    }
                }
                return streak;
            },

            getWeeklyIntake: () => {
                const { dailyIntakeLog } = get();
                const days: { date: string; totalMg: number }[] = [];
                for (let i = 6; i >= 0; i--) {
                    const dayKey = format(subDays(new Date(), i), 'yyyy-MM-dd');
                    days.push({ date: dayKey, totalMg: dailyIntakeLog[dayKey] ?? 0 });
                }
                return days;
            },
        }),
        {
            name: 'caffeine-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
