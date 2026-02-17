import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Colors } from '../constants/Colors';
import { useCaffeineStore } from '../store/useCaffeineStore';

interface ChartToggleButtonsProps {
    showCaffeine: boolean;
    showAlertness: boolean;
    showThreshold: boolean;
    onToggleCaffeine: () => void;
    onToggleAlertness: () => void;
    onToggleThreshold: () => void;
}

export const ChartToggleButtons: React.FC<ChartToggleButtonsProps> = ({
    showCaffeine,
    showAlertness,
    showThreshold,
    onToggleCaffeine,
    onToggleAlertness,
    onToggleThreshold,
}) => {
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    showCaffeine
                        ? { backgroundColor: `${colors.primary}35`, borderColor: colors.primary }
                        : { backgroundColor: 'transparent', borderColor: `${colors.border}40` },
                ]}
                onPress={onToggleCaffeine}
                activeOpacity={0.7}
            >
                <View style={[styles.colorDot, { backgroundColor: colors.primary, opacity: showCaffeine ? 1 : 0.4 }]} />
                <Text style={[styles.buttonText, { color: showCaffeine ? colors.primary : colors.textSecondary }]}>
                    Caffeine
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    showAlertness
                        ? { backgroundColor: '#FF950035', borderColor: '#FF9500' }
                        : { backgroundColor: 'transparent', borderColor: `${colors.border}40` },
                ]}
                onPress={onToggleAlertness}
                activeOpacity={0.7}
            >
                <View style={[styles.colorDot, { backgroundColor: '#FF9500', opacity: showAlertness ? 1 : 0.4 }]} />
                <Text style={[styles.buttonText, { color: showAlertness ? '#FF9500' : colors.textSecondary }]}>
                    Alertness
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.toggleButton,
                    showThreshold
                        ? { backgroundColor: `${colors.accent}35`, borderColor: colors.accent }
                        : { backgroundColor: 'transparent', borderColor: `${colors.border}40` },
                ]}
                onPress={onToggleThreshold}
                activeOpacity={0.7}
            >
                <View style={[styles.colorDot, { backgroundColor: colors.accent, opacity: showThreshold ? 1 : 0.4 }]} />
                <Text style={[styles.buttonText, { color: showThreshold ? colors.accent : colors.textSecondary }]}>
                    Threshold
                </Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 8,
        paddingHorizontal: 20,
    },
    toggleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 20,
        borderWidth: 1.5,
        gap: 6,
    },
    colorDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: '600',
    },
});
