import React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';
import { FEATURES } from '../config/featureFlags';

interface StyledButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'secondary' | 'danger';
    style?: ViewStyle;
    textStyle?: TextStyle;
    fullWidth?: boolean;
    /** Light haptic once on press — primary actions only. */
    impactLightOnPress?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const StyledButton: React.FC<StyledButtonProps> = ({
    onPress,
    title,
    variant = 'primary',
    style,
    textStyle,
    fullWidth = false,
    impactLightOnPress,
}) => {
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }],
        };
    });

    const springIn = () => {
        scale.value = withSpring(0.95);
    };
    const springOut = () => {
        scale.value = withSpring(1);
    };

    const handlePressIn = () => {
        if (FEATURES.UI_MOTION) springIn();
    };

    const handlePressOut = () => {
        if (FEATURES.UI_MOTION) springOut();
    };

    const handlePress = () => {
        if (impactLightOnPress) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
        }
        onPress();
    };

    const getBackgroundColor = () => {
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return theme === 'dark' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)';
            case 'danger': return colors.accent;
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary': return theme === 'dark' ? '#000' : '#FFF'; // Contrast check
            case 'secondary': return colors.text;
            case 'danger': return '#FFF';
            default: return '#000';
        }
    };

    const buttonEl = (
        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
            {title}
        </Text>
    );

    if (!FEATURES.UI_MOTION) {
        return (
            <Pressable
                onPress={handlePress}
                style={[
                    styles.button,
                    { backgroundColor: getBackgroundColor(), width: fullWidth ? '100%' : 'auto' },
                    style,
                ]}
            >
                {buttonEl}
            </Pressable>
        );
    }

    return (
        <AnimatedPressable
            onPress={handlePress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
                styles.button,
                { backgroundColor: getBackgroundColor(), width: fullWidth ? '100%' : 'auto' },
                style,
                animatedStyle
            ]}
        >
            {buttonEl}
        </AnimatedPressable>
    );
};

const styles = StyleSheet.create({
    button: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        // Removed fixed shadow color for now, relies on platform defaults or could be themed
        shadowOpacity: 0.1,
        elevation: 2,
    },
    text: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
