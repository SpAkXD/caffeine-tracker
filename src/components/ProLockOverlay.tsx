import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

interface ProLockOverlayProps {
    onPress: () => void;
    label?: string;
}

export const ProLockOverlay: React.FC<ProLockOverlayProps> = ({
    onPress,
    label = 'Unlock with Pro',
}) => {
    const theme = useCaffeineStore((state) => state.theme);
    const colors = Colors[theme];
    return (
        <PressableScale style={styles.overlay} onPress={onPress}>
            <View style={[styles.pill, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '55' }]}>
                <Ionicons name="lock-closed" size={14} color={colors.primary} />
                <Text style={[styles.label, { color: colors.primary }]}>{label}</Text>
            </View>
        </PressableScale>
    );
};

const styles = StyleSheet.create({
    overlay: {
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderRadius: 20,
        borderWidth: 1,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
    },
});
