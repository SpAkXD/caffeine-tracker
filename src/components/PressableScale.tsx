import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { FEATURES } from '../config/featureFlags';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const SPRING_CFG = {
    damping: 15,
    stiffness: 380,
};

type Props = PressableProps & {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    /** Scale when pressed (1 = none). StyledButton-ish default. */
    scaleTo?: number;
};

export function PressableScale({
    children,
    style,
    scaleTo = 0.97,
    onPressIn,
    onPressOut,
    disabled,
    ...rest
}: Props) {
    const scale = useSharedValue(1);
    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    if (!FEATURES.UI_MOTION || disabled) {
        return (
            <Pressable style={style} disabled={disabled} onPressIn={onPressIn} onPressOut={onPressOut} {...rest}>
                {children}
            </Pressable>
        );
    }

    return (
        <AnimatedPressable
            {...rest}
            disabled={disabled}
            style={[style, animatedStyle]}
            onPressIn={(e) => {
                scale.value = withSpring(scaleTo, SPRING_CFG);
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                scale.value = withSpring(1, SPRING_CFG);
                onPressOut?.(e);
            }}
        >
            {children}
        </AnimatedPressable>
    );
}
