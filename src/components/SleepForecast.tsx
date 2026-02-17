import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { format } from 'date-fns';
import { Colors } from '../constants/Colors';

export const SleepForecast: React.FC = () => {
    const clearanceTime = useCaffeineStore(state => state.clearanceTime);
    const currentLevel = useCaffeineStore(state => state.currentLevel);
    const sleepThreshold = useCaffeineStore(state => state.sleepThresholdMg);
    const refreshCurrentLevel = useCaffeineStore(state => state.refreshCurrentLevel);
    const doses = useCaffeineStore(state => state.doses);
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    // Refresh when doses or settings change
    useEffect(() => {
        refreshCurrentLevel();
    }, [doses, sleepThreshold, refreshCurrentLevel]);

    // Already clear (no clearance time needed)
    if (clearanceTime === null || currentLevel <= sleepThreshold) {
        return (
            <View style={styles.container}>
                <Text style={[styles.safeText, { color: theme === 'dark' ? '#00FF99' : '#009955' }]}>You are safe to sleep now 😴</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>SLEEP FORECAST</Text>
            <Text style={[styles.time, { color: colors.text }]}>{format(clearanceTime, 'h:mm a')}</Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>until levels drop below {sleepThreshold}mg</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        marginVertical: 10,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 4,
    },
    time: {
        fontSize: 24,
        fontWeight: '700',
    },
    safeText: {
        fontSize: 16,
        fontWeight: '600',
    },
    subtext: {
        fontSize: 10,
        marginTop: 2,
    },
});
