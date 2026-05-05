import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { FEATURES } from '../config/featureFlags';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { sectionEntering, sectionEnteringFast } from '../constants/motion';

interface FadeInSlotProps {
    slotIndex: number;
    /** `fast` = tighter stagger for dense screens like detailed statistics */
    variant?: 'default' | 'fast';
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export function FadeInSlot({ slotIndex, variant = 'default', children, style }: FadeInSlotProps) {
    const reduceMotion = useReduceMotion();

    if (!FEATURES.UI_MOTION) {
        return <View style={style}>{children}</View>;
    }

    const entering =
        variant === 'fast'
            ? sectionEnteringFast(slotIndex, reduceMotion)
            : sectionEntering(slotIndex, reduceMotion);

    return (
        <Animated.View entering={entering} style={style}>
            {children}
        </Animated.View>
    );
}
