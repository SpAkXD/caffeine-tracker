import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import React from 'react';
import { GoodEnergyWidget } from '../widget/GoodEnergyWidget';
import { calculateStackedCaffeine, calculateClearanceTime } from '../utils/math';
import { scheduleCaffeineUpdates } from './notificationService';
import { format } from 'date-fns';

import { FEATURES } from '../config/featureFlags';

const BACKGROUND_FETCH_TASK = 'CAFFEINE_LEVEL_TASK';

/**
 * Calculate stacked caffeine level from raw dose data.
 * This is a standalone version that doesn't depend on Zustand
 * (since background tasks can't access React hooks).
 */
function calculateCaffeineFromDoses(
    doses: { mg: number; timestamp: number }[],
    currentTime: number,
    halfLifeHours: number
): number {
    let total = 0;
    for (const dose of doses) {
        const elapsed = (currentTime - dose.timestamp) / (1000 * 60 * 60);
        if (elapsed < 0) continue;
        total += dose.mg * Math.pow(0.5, elapsed / halfLifeHours);
    }
    return total;
}

/**
 * Calculate effective half-life based on body weight
 */
function calculateEffectiveHalfLife(baseHalfLife: number, weightKg: number): number {
    const baselineWeight = 70;
    const adjustmentPerKg = 0.05;
    const weightDifference = weightKg - baselineWeight;
    const adjustment = weightDifference * adjustmentPerKg;
    return Math.max(3, Math.min(7, baseHalfLife - adjustment));
}

/**
 * Define the background task.
 * This runs periodically even when the app is closed.
 * It reads the caffeine store from AsyncStorage, recalculates the level,
 * updates the home screen widget, and re-schedules the next 24h batch of
 * pre-scheduled DATE-trigger notifications (so they never run out).
 *
 * NOTE: This task does NOT send immediate notifications itself — all
 * notifications come from the pre-scheduled batch in scheduleCaffeineUpdates.
 * This prevents double notifications and ensures the user's chosen frequency
 * is always respected.
 */
TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
    // Master kill switch for background tasks
    if (!FEATURES.BACKGROUND_NOTIFICATIONS && !FEATURES.BACKGROUND_WIDGET_REFRESH) {
        return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    try {
        // Read store from AsyncStorage (Zustand persists here)
        const rawStore = await AsyncStorage.getItem('caffeine-storage');
        if (!rawStore) return BackgroundFetch.BackgroundFetchResult.NoData;

        const store = JSON.parse(rawStore);
        const state = store?.state;
        if (!state) return BackgroundFetch.BackgroundFetchResult.NoData;

        const doses = state.doses || [];
        const halfLifeHours = state.halfLifeHours || 5;
        const weightKg = state.weightKg || 70;
        const sleepThreshold = state.sleepThresholdMg || 50;
        const notificationsEnabled = state.notificationsEnabled ?? false;
        // Read frequency directly from persisted state to avoid relying on store hydration
        const notificationFrequency = (state.notificationFrequency as 1 | 3 | 6) || 3;

        const effectiveHalfLife = calculateEffectiveHalfLife(halfLifeHours, weightKg);
        const now = Date.now();
        const currentLevel = calculateStackedCaffeine(doses, now, effectiveHalfLife);
        const roundedLevel = Math.round(currentLevel);

        // Calculate crash time for the widget
        const clearance = calculateClearanceTime(doses, sleepThreshold, effectiveHalfLife, now);
        let crashTimeStr = '· · · Clear · · ·';
        if (roundedLevel > sleepThreshold && clearance !== null) {
            const timePattern = state.use24HourFormat ? 'HH:mm' : 'h:mm a';
            crashTimeStr = `Crash at ${format(new Date(clearance), timePattern)}`;
        }

        // Update the home screen widget (always, regardless of notification setting).
        // Widget is a Pro feature — non-Pro users get the upgrade placeholder.
        if (FEATURES.BACKGROUND_WIDGET_REFRESH && Platform.OS === 'android') {
            try {
                const proRaw = await AsyncStorage.getItem('pro-storage');
                const proState = proRaw ? JSON.parse(proRaw)?.state : null;
                const isPro = proState?.hasPurchased === true;
                await requestWidgetUpdate({
                    widgetName: 'GoodEnergy',
                    renderWidget: () => (
                        isPro
                            ? <GoodEnergyWidget currentLevel={roundedLevel} crashTime={crashTimeStr} />
                            : <GoodEnergyWidget currentLevel={0} crashTime="Upgrade to Pro" />
                    ),
                });
            } catch {
                // Widget may not be placed on home screen — that's fine
            }
        }

        // Re-schedule the next 24h notification batch so coverage never runs out.
        // Uses frequencyOverride so the correct user-chosen interval is respected
        // even if the Zustand store is not fully hydrated in this background context.
        if (FEATURES.BACKGROUND_NOTIFICATIONS && notificationsEnabled && doses.length > 0 && roundedLevel >= 1) {
            await scheduleCaffeineUpdates(doses, effectiveHalfLife, notificationFrequency);
        }

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('Background task error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

/**
 * Register the background fetch task with a given frequency.
 * @param frequencyHours - How often to run (1, 3, or 6 hours)
 */
export async function registerBackgroundTask(frequencyHours: number = 3): Promise<void> {
    try {
        const intervalSeconds = frequencyHours * 60 * 60;

        await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
            minimumInterval: intervalSeconds,
            stopOnTerminate: false,
            startOnBoot: true,
        });

        console.log(`Background caffeine task registered (every ${frequencyHours}h)`);
    } catch (error) {
        console.error('Failed to register background task:', error);
    }
}

/**
 * Unregister the background fetch task.
 */
export async function unregisterBackgroundTask(): Promise<void> {
    try {
        const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
        if (isRegistered) {
            await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
            console.log('Background caffeine task unregistered');
        }
    } catch (error) {
        console.error('Failed to unregister background task:', error);
    }
}

/**
 * Check if the background task is currently registered.
 */
export async function isBackgroundTaskRegistered(): Promise<boolean> {
    try {
        return await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);
    } catch {
        return false;
    }
}
