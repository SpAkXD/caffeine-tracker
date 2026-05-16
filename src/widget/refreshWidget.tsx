import React from 'react';
import { Platform } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoodEnergyWidget } from './GoodEnergyWidget';
import { calculateStackedCaffeine, calculateClearanceTime } from '../utils/math';
import { format } from 'date-fns';
import { useProStore } from '../store/useProStore';

/**
 * Trigger an immediate widget refresh.
 *
 * Reads current state from AsyncStorage (same as the background task handler),
 * recalculates everything, and pushes updated UI to the widget.
 *
 * Safe to call from anywhere — silently no-ops on iOS or if the widget
 * isn't placed on the home screen.
 */
export async function refreshWidget(): Promise<void> {
    if (Platform.OS !== 'android') return;

    // Widget is a Pro feature — show upgrade prompt if not Pro
    const isPro = useProStore.getState().isPro();
    if (!isPro) {
        await requestWidgetUpdate({
            widgetName: 'GoodEnergy',
            renderWidget: () => (
                <GoodEnergyWidget currentLevel={0} crashTime="Upgrade to Pro" />
            ),
        }).catch(() => {});
        return;
    }

    try {
        const raw = await AsyncStorage.getItem('caffeine-storage');
        if (!raw) {
            await requestWidgetUpdate({
                widgetName: 'GoodEnergy',
                renderWidget: () => (
                    <GoodEnergyWidget currentLevel={0} crashTime="· · · Clear · · ·" />
                ),
            });
            return;
        }

        const store = JSON.parse(raw);
        const state = store?.state;
        if (!state) return;

        const doses = state.doses || [];
        const halfLifeHours = state.halfLifeHours || 5;
        const weightKg = state.weightKg || 70;
        const sleepThreshold = state.sleepThresholdMg || 50;

        const adjustment = (weightKg - 70) * 0.05;
        const effectiveHalfLife = Math.max(3, Math.min(7, halfLifeHours - adjustment));

        const now = Date.now();
        const currentLevel = Math.round(
            calculateStackedCaffeine(doses, now, effectiveHalfLife)
        );
        const clearance = calculateClearanceTime(doses, sleepThreshold, effectiveHalfLife, now);

        let crashTime = '· · · Clear · · ·';
        if (currentLevel > sleepThreshold && clearance !== null) {
            crashTime = `Crash at ${format(new Date(clearance), 'h:mm a')}`;
        }

        await requestWidgetUpdate({
            widgetName: 'GoodEnergy',
            renderWidget: () => (
                <GoodEnergyWidget currentLevel={currentLevel} crashTime={crashTime} />
            ),
        });
    } catch {
        // Widget not placed or other error — silently ignore
    }
}
