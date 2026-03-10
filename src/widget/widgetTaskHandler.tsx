import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { GoodEnergyWidget } from './GoodEnergyWidget';
import { calculateStackedCaffeine, calculateClearanceTime } from '../utils/math';
import { format } from 'date-fns';

/**
 * Reads caffeine state from AsyncStorage (Zustand persists to 'caffeine-storage'),
 * recalculates the current level and crash time, and returns widget-ready data.
 *
 * This runs in the background — no React hooks, no store access.
 */
async function getWidgetData(): Promise<{ currentLevel: number; crashTime: string }> {
    try {
        const raw = await AsyncStorage.getItem('caffeine-storage');
        if (!raw) return { currentLevel: 0, crashTime: '· · · Clear · · ·' };

        const store = JSON.parse(raw);
        const state = store?.state;
        if (!state) return { currentLevel: 0, crashTime: '· · · Clear · · ·' };

        const doses = state.doses || [];
        const halfLifeHours = state.halfLifeHours || 5;
        const weightKg = state.weightKg || 70;
        const sleepThreshold = state.sleepThresholdMg || 50;

        // Effective half-life calculation (same formula as store & backgroundTask)
        const adjustment = (weightKg - 70) * 0.05;
        const effectiveHalfLife = Math.max(3, Math.min(7, halfLifeHours - adjustment));

        const now = Date.now();
        const currentLevel = Math.round(
            calculateStackedCaffeine(doses, now, effectiveHalfLife)
        );
        const clearance = calculateClearanceTime(
            doses,
            sleepThreshold,
            effectiveHalfLife,
            now
        );

        let crashTime = '· · · Clear · · ·';
        if (currentLevel > sleepThreshold && clearance !== null) {
            crashTime = `Crash at ${format(new Date(clearance), 'h:mm a')}`;
        }

        return { currentLevel, crashTime };
    } catch (error) {
        console.error('Widget data error:', error);
        return { currentLevel: 0, crashTime: '· · · Clear · · ·' };
    }
}

/**
 * Widget Task Handler — called by Android for every widget lifecycle event.
 *
 * WIDGET_ADDED:   User places widget on home screen
 * WIDGET_UPDATE:  Periodic refresh via updatePeriodMillis (every 30 min)
 * WIDGET_RESIZED: User resizes the widget
 * WIDGET_DELETED: User removes the widget
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
    switch (props.widgetAction) {
        case 'WIDGET_ADDED':
        case 'WIDGET_UPDATE':
        case 'WIDGET_RESIZED': {
            const { currentLevel, crashTime } = await getWidgetData();
            props.renderWidget(
                <GoodEnergyWidget currentLevel={currentLevel} crashTime={crashTime} />
            );
            break;
        }
        case 'WIDGET_CLICK': {
            // Manual refresh button tapped — re-fetch and re-render
            if (props.clickAction === 'REFRESH_WIDGET') {
                const { currentLevel, crashTime } = await getWidgetData();
                props.renderWidget(
                    <GoodEnergyWidget currentLevel={currentLevel} crashTime={crashTime} />
                );
            }
            break;
        }
        case 'WIDGET_DELETED':
            // Nothing to clean up
            break;
        default:
            break;
    }
}
