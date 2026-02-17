import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

interface GlassmorphicCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    intensity?: number;
}

export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
    children,
    style,
    intensity = 20
}) => {
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];
    // 'default', 'light', 'dark', 'regular', 'prominent', 'extraLight'
    const tint = theme === 'dark' ? 'dark' : 'light';

    return (
        <View style={[
            styles.container,
            {
                backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                borderColor: colors.border
            },
            style
        ]}>
            <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            <View style={styles.content}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        marginVertical: 10,
    },
    content: {
        padding: 20,
        zIndex: 1,
    },
});
