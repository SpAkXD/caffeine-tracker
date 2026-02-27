import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateStackedCaffeine, calculateAlertness, calculateClearanceTime, Dose } from '../utils/math';
import { addHours, subHours, subDays, startOfDay, format, isSameDay } from 'date-fns';
import { refreshWidget } from '../widget/refreshWidget';

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
    isProDebug: boolean; // Dev toggle to simulate Pro mode

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
    refreshCurrentLevel: () => void; // Recalculate currentLevel + clearanceTime from Date.now()
    toggleProDebug: () => void;

    // Selectors (still available for backward compat)
    getCurrentLevel: () => number;
    getEffectiveHalfLife: () => number;
    getChartData: (hoursLookback?: number, hoursLookahead?: number) => { value: number; label?: string; date: number }[];
    getAlertnessData: (hoursLookback?: number, hoursLookahead?: number) => { value: number; date: number }[];
    getWeeklyHistory: () => DailyStats[];
    getTodaysDoses: () => Dose[];
}

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

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

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
            isProDebug: false,

            // === Single Source of Truth state ===
            currentLevel: 0,
            clearanceTime: null,
            lastRefreshed: 0,

            addDose: (mg, timestamp = Date.now()) => {
                set((state) => ({
                    doses: [
                        ...state.doses,
                        { id: Math.random().toString(36).substr(2, 9), mg, timestamp },
                    ],
                }));
                // Auto-cleanup and refresh after adding
                get().cleanupOldDoses();
                get().refreshCurrentLevel();
                // Update home screen widget immediately
                refreshWidget().catch(() => { });
            },

            removeDose: (id) => {
                set((state) => ({
                    doses: state.doses.filter((d) => d.id !== id),
                }));
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
                set({ doses: [], currentLevel: 0, clearanceTime: null });
                refreshWidget().catch(() => { });
            },

            cleanupOldDoses: () => {
                const cutoff = Date.now() - THREE_DAYS_MS;
                set((state) => ({
                    doses: state.doses.filter((d) => d.timestamp >= cutoff),
                }));
            },

            toggleProDebug: () => {
                set((state) => ({
                    isProDebug: !state.isProDebug,
                }));
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
        }),
        {
            name: 'caffeine-storage',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
