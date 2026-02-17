import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlassmorphicCard } from './GlassmorphicCard';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

type QualityOption = 'poor' | 'average' | 'great';

interface QualityButtonProps {
    quality: QualityOption;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    isActive: boolean;
    onPress: () => void;
    colors: typeof Colors.dark;
}

const QualityButton: React.FC<QualityButtonProps> = ({ quality, label, icon, isActive, onPress, colors }) => {
    const getColor = () => {
        if (quality === 'poor') return '#FF6B6B';
        if (quality === 'average') return '#FFB84D';
        return '#4ECDC4';
    };

    return (
        <TouchableOpacity
            style={[
                styles.button,
                {
                    backgroundColor: isActive
                        ? `${getColor()}25`
                        : `${colors.border}20`,
                    borderColor: isActive ? getColor() : 'transparent',
                },
            ]}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Ionicons
                name={icon}
                size={20}
                color={isActive ? getColor() : colors.textSecondary}
            />
            <Text
                style={[
                    styles.buttonText,
                    { color: isActive ? getColor() : colors.textSecondary }
                ]}
            >
                {label}
            </Text>
        </TouchableOpacity>
    );
};

export const SleepQualitySelector: React.FC = () => {
    const sleepQuality = useCaffeineStore(state => state.sleepQuality);
    const setSleepQuality = useCaffeineStore(state => state.setSleepQuality);
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    return (
        <GlassmorphicCard style={styles.container} intensity={12}>
            <View style={styles.header}>
                <Ionicons name="moon" size={16} color={colors.textSecondary} />
                <Text style={[styles.title, { color: colors.text }]}>
                    Last Night's Sleep
                </Text>
            </View>
            <View style={styles.buttonRow}>
                <QualityButton
                    quality="poor"
                    label="Poor"
                    icon="sad-outline"
                    isActive={sleepQuality === 'poor'}
                    onPress={() => setSleepQuality('poor')}
                    colors={colors}
                />
                <QualityButton
                    quality="average"
                    label="Average"
                    icon="remove-circle-outline"
                    isActive={sleepQuality === 'average'}
                    onPress={() => setSleepQuality('average')}
                    colors={colors}
                />
                <QualityButton
                    quality="great"
                    label="Great"
                    icon="happy-outline"
                    isActive={sleepQuality === 'great'}
                    onPress={() => setSleepQuality('great')}
                    colors={colors}
                />
            </View>
            <Text style={[styles.description, { color: colors.textSecondary }]}>
                {sleepQuality === 'poor' && 'Max alertness capped at 60%'}
                {sleepQuality === 'average' && 'Max alertness capped at 80%'}
                {sleepQuality === 'great' && 'Full alertness potential (100%)'}
            </Text>
        </GlassmorphicCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8,
    },
    button: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 12,
        borderWidth: 2,
    },
    buttonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    description: {
        fontSize: 11,
        textAlign: 'center',
        fontStyle: 'italic',
    },
});
