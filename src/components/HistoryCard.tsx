import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';
import { GlassmorphicCard } from './GlassmorphicCard';
import { format, isToday, isYesterday } from 'date-fns';

export const HistoryCard: React.FC = () => {
    const getWeeklyHistory = useCaffeineStore(state => state.getWeeklyHistory);
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    const history = getWeeklyHistory();

    // Find max for scaling bars
    const maxMg = Math.max(...history.map(h => h.totalMg), 100);

    const getDayLabel = (dateStr: string) => {
        const date = new Date(dateStr);
        if (isToday(date)) return 'Today';
        if (isYesterday(date)) return 'Yesterday';
        return format(date, 'EEE');
    };

    return (
        <GlassmorphicCard style={styles.container} intensity={15}>
            <Text style={[styles.title, { color: colors.text }]}>Last 3 Days</Text>

            <View style={styles.barsContainer}>
                {history.map((day, index) => {
                    const barHeight = day.totalMg > 0 ? (day.totalMg / maxMg) * 80 : 4;
                    const isCurrentDay = isToday(new Date(day.date));

                    return (
                        <View key={day.date} style={styles.barColumn}>
                            <Text style={[styles.mgLabel, { color: colors.textSecondary }]}>
                                {day.totalMg > 0 ? `${Math.round(day.totalMg)}` : '-'}
                            </Text>
                            <View style={styles.barWrapper}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: barHeight,
                                            backgroundColor: isCurrentDay ? colors.primary : colors.accent,
                                            opacity: isCurrentDay ? 1 : 0.6,
                                        }
                                    ]}
                                />
                            </View>
                            <Text style={[
                                styles.dayLabel,
                                {
                                    color: isCurrentDay ? colors.primary : colors.textSecondary,
                                    fontWeight: isCurrentDay ? '700' : '500',
                                }
                            ]}>
                                {getDayLabel(day.date)}
                            </Text>
                            <Text style={[styles.countLabel, { color: colors.textSecondary }]}>
                                {day.doseCount > 0 ? `${day.doseCount} drink${day.doseCount > 1 ? 's' : ''}` : 'No drinks'}
                            </Text>
                        </View>
                    );
                })}
            </View>
        </GlassmorphicCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 16,
    },
    barsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'flex-end',
        height: 140,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    mgLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
    },
    barWrapper: {
        height: 80,
        justifyContent: 'flex-end',
        width: '100%',
        alignItems: 'center',
    },
    bar: {
        width: 32,
        borderRadius: 6,
        minHeight: 4,
    },
    dayLabel: {
        fontSize: 13,
        marginTop: 8,
    },
    countLabel: {
        fontSize: 10,
        marginTop: 2,
    },
});
