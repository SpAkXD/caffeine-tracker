import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { FEATURES } from '../config/featureFlags';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { sectionEntering } from '../constants/motion';

interface FadeInSlotProps {
    slotIndex: number;
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
}

export function FadeInSlot({ slotIndex, children, style }: FadeInSlotProps) {
    const reduceMotion = useReduceMotion();

    if (!FEATURES.UI_MOTION) {
        return <View style={style}>{children}</View>;
    }

    return (
        <Animated.View entering={sectionEntering(slotIndex, reduceMotion)} style={style}>
            {children}
        </Animated.View>
    );
}
