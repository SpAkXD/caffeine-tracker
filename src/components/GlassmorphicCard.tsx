import React from 'react';
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

interface GlassmorphicCardProps {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
    intensity?: number;
}

/**
 * Dark: frosted blur. Light: opaque surface (no blur) — avoids squared blur corners on Android/iOS.
 */
export const GlassmorphicCard: React.FC<GlassmorphicCardProps> = ({
    children,
    style,
    intensity = 20
}) => {
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];
    const tint = theme === 'dark' ? 'dark' : 'light';

    const lightShadow =
        theme === 'light' && Platform.OS === 'ios'
            ? {
                  shadowColor: '#000000',
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.06,
                  shadowRadius: 10,
              }
            : {};
    const lightElevation = theme === 'light' && Platform.OS === 'android' ? { elevation: 3 } : {};

    const darkShadow =
        theme === 'dark' && Platform.OS === 'ios'
            ? {
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.35,
                  shadowRadius: 16,
              }
            : {};
    const darkElevation = theme === 'dark' && Platform.OS === 'android' ? { elevation: 0 } : {};

    return (
        <View
            style={[
                styles.container,
                theme === 'light'
                    ? {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                      }
                    : {
                          backgroundColor: 'rgba(30, 30, 30, 0.55)',
                          borderColor: colors.border,
                      },
                theme === 'light' ? lightShadow : {},
                theme === 'light' ? lightElevation : darkShadow,
                theme === 'light' ? {} : darkElevation,
                style,
            ]}
        >
            {theme === 'dark' && (
                <BlurView intensity={intensity} tint={tint} style={StyleSheet.absoluteFill} />
            )}
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
