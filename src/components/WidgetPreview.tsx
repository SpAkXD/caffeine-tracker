import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { format } from 'date-fns';

/**
 * Widget Preview - Simulates a 2x2 Android home screen widget.
 * "Nothing Phone" aesthetic: pure black, monospace font, high contrast, minimal.
 * 
 * Now reads from store's single-source-of-truth values.
 */
export const WidgetPreview: React.FC = () => {
    const currentLevel = Math.round(useCaffeineStore(state => state.currentLevel));
    const clearanceTime = useCaffeineStore(state => state.clearanceTime);
    const sleepThreshold = useCaffeineStore(state => state.sleepThresholdMg);

    let crashTime = 'Clear';
    if (currentLevel > sleepThreshold && clearanceTime !== null) {
        crashTime = format(new Date(clearanceTime), 'h:mm a');
    }

    return (
        <View style={styles.container}>
            {/* Widget label */}
            <Text style={styles.widgetLabel}>WIDGET PREVIEW</Text>
            <Text style={styles.widgetSub}>How your home screen widget will look</Text>

            {/* Widget simulation */}
            <View style={styles.widget}>
                {/* Top row: label + refresh button (mirrors real widget) */}
                <View style={styles.topRow}>
                    <Text style={styles.appName}>CAFFEINE</Text>
                    <View style={styles.refreshCircle}>
                        <Text style={styles.refreshGlyph}>↻</Text>
                    </View>
                </View>

                {/* Center: big number */}
                <View style={styles.centerBlock}>
                    <Text style={styles.bigNumber}>{currentLevel}</Text>
                    <Text style={styles.unit}>mg</Text>
                </View>

                {/* Footer: crash time */}
                <Text style={styles.crashText}>
                    {currentLevel > sleepThreshold ? `Crash at ${crashTime}` : '· · · Clear · · ·'}
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
    },
    widgetLabel: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 11,
        fontWeight: '600',
        letterSpacing: 1.5,
        marginBottom: 4,
    },
    widgetSub: {
        color: 'rgba(255,255,255,0.2)',
        fontSize: 11,
        marginBottom: 14,
    },
    widget: {
        width: 170,
        height: 170,
        backgroundColor: '#000000',
        borderRadius: 24,
        padding: 14,
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
    },
    appName: {
        color: 'rgba(255,255,255,0.35)',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 2,
        fontFamily: 'monospace',
    },
    refreshCircle: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.08)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    refreshGlyph: {
        color: 'rgba(255,255,255,0.6)',
        fontSize: 13,
    },
    centerBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    bigNumber: {
        color: '#FFFFFF',
        fontSize: 48,
        fontWeight: '200',
        fontFamily: 'monospace',
        letterSpacing: -2,
        lineHeight: 52,
    },
    unit: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: 'monospace',
        letterSpacing: 3,
        marginTop: -2,
    },
    crashText: {
        color: 'rgba(255,255,255,0.4)',
        fontSize: 10,
        fontWeight: '600',
        fontFamily: 'monospace',
        letterSpacing: 1,
        textAlign: 'center',
    },
});
