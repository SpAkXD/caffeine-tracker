import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
    withSequence,
    Easing
} from 'react-native-reanimated';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

export const CurrentCaffeineDisplay: React.FC = () => {
    const currentLevel = useCaffeineStore(state => state.currentLevel);
    const refreshCurrentLevel = useCaffeineStore(state => state.refreshCurrentLevel);
    const doses = useCaffeineStore(state => state.doses);
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    const pulseScale = useSharedValue(1);
    const pulseOpacity = useSharedValue(0);

    // Refresh on mount and every 60s, plus whenever doses change
    useEffect(() => {
        refreshCurrentLevel();
        const interval = setInterval(refreshCurrentLevel, 60 * 1000);
        return () => clearInterval(interval);
    }, [refreshCurrentLevel, doses]);

    const isHigh = currentLevel > 100;

    useEffect(() => {
        if (isHigh) {
            pulseScale.value = withRepeat(
                withSequence(
                    withTiming(1.1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
                    withTiming(1.0, { duration: 1000, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                false
            );
            pulseOpacity.value = withRepeat(
                withSequence(
                    withTiming(0.8, { duration: 1000 }),
                    withTiming(0.3, { duration: 1000 })
                ),
                -1,
                false
            );
        } else {
            pulseScale.value = withTiming(1, { duration: 300 });
            pulseOpacity.value = withTiming(0, { duration: 300 });
        }
    }, [isHigh]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: pulseScale.value }],
        opacity: pulseOpacity.value,
    }));

    return (
        <View style={styles.container}>
            <Animated.View
                style={[
                    StyleSheet.absoluteFill,
                    styles.pulseCircle,
                    { backgroundColor: `rgba(${theme === 'dark' ? '0, 240, 255' : '0, 122, 255'}, 0.2)` },
                    animatedStyle
                ]}
            />

            <Text style={[styles.label, { color: colors.textSecondary }]}>CURRENT LEVEL</Text>
            <Text style={[styles.value, { color: colors.text, textShadowColor: colors.primary }]}>
                {Math.round(currentLevel)}
                <Text style={[styles.unit, { color: colors.textSecondary }]}>mg</Text>
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    pulseCircle: {
        borderRadius: 100,
        width: 200,
        height: 200,
        alignSelf: 'center',
        top: -20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 1,
    },
    value: {
        fontSize: 64,
        fontWeight: '800',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 20,
    },
    unit: {
        fontSize: 24,
        fontWeight: '500',
    },
});
