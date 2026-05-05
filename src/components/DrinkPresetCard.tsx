import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableScale } from './PressableScale';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

interface DrinkPresetCardProps {
    name: string;
    mg: number;
    onPress: () => void;
}

export const DrinkPresetCard: React.FC<DrinkPresetCardProps> = ({ name, mg, onPress }) => {
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    return (
        <PressableScale onPress={onPress} style={styles.pressable}>
            <View
                style={[
                    styles.card,
                    {
                        backgroundColor: theme === 'dark' ? 'rgba(30, 30, 30, 0.6)' : 'rgba(255, 255, 255, 0.6)',
                        borderColor: colors.border,
                    },
                ]}
            >
                <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
                <Text style={[styles.mg, { color: colors.primary }]}>{mg} mg</Text>
            </View>
        </PressableScale>
    );
};

const styles = StyleSheet.create({
    pressable: {
        width: '48%',
        marginBottom: 12,
    },
    card: {
        borderRadius: 16,
        borderWidth: 1,
        paddingVertical: 20,
        paddingHorizontal: 14,
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: 80,
    },
    name: {
        fontSize: 15,
        fontWeight: '700',
        marginBottom: 4,
        textAlign: 'center',
    },
    mg: {
        fontSize: 14,
        fontWeight: 'bold',
    },
});
