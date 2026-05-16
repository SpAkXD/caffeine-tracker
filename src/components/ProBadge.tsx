import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

export const ProBadge: React.FC = () => {
    const theme = useCaffeineStore((state) => state.theme);
    const colors = Colors[theme];
    return (
        <View style={[styles.badge, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
            <Text style={[styles.text, { color: colors.primary }]}>PRO</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        borderRadius: 6,
        borderWidth: 1,
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    text: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
