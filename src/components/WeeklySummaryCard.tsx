import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isToday } from 'date-fns';
import { useCaffeineStore, DAILY_LIMIT_MG } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';
import { GlassmorphicCard } from './GlassmorphicCard';

/**
 * Weekly summary — last 7 days of intake with a streak counter.
 * A "streak day" is a day at or under the FDA guideline (400 mg).
 * Reads from dailyIntakeLog so it works beyond the 3-day dose retention.
 */
export const WeeklySummaryCard: React.FC = () => {
    const theme = useCaffeineStore(state => state.theme);
    const dailyIntakeLog = useCaffeineStore(state => state.dailyIntakeLog);
    const getStreakDays = useCaffeineStore(state => state.getStreakDays);
    const getWeeklyIntake = useCaffeineStore(state => state.getWeeklyIntake);
    const colors = Colors[theme];

    // dailyIntakeLog subscription re-renders this card whenever intake changes
    void dailyIntakeLog;
    const week = getWeeklyIntake();
    const streak = getStreakDays();

    const totalMg = week.reduce((sum, d) => sum + d.totalMg, 0);
    const avgMg = Math.round(totalMg / 7);
    const maxMg = Math.max(...week.map(d => d.totalMg), DAILY_LIMIT_MG);
    const hasAnyData = totalMg > 0;

    return (
        <GlassmorphicCard style={styles.container} intensity={15}>
            {/* Header: title + streak chip */}
            <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}>This Week</Text>
                {streak > 0 && (
                    <View style={[styles.streakChip, { backgroundColor: 'rgba(255, 149, 0, 0.15)' }]}>
                        <Ionicons name="flame" size={14} color="#FF9500" />
                        <Text style={styles.streakText}>
                            {streak} day{streak === 1 ? '' : 's'} under {DAILY_LIMIT_MG} mg
                        </Text>
                    </View>
                )}
            </View>

            {/* 7-day mini bars */}
            <View style={styles.barsRow}>
                {week.map((day) => {
                    const date = new Date(day.date);
                    const current = isToday(date);
                    const overLimit = day.totalMg > DAILY_LIMIT_MG;
                    const barHeight = day.totalMg > 0
                        ? Math.max(6, (day.totalMg / maxMg) * 56)
                        : 4;
                    return (
                        <View key={day.date} style={styles.barColumn}>
                            <View style={styles.barTrack}>
                                <View
                                    style={[
                                        styles.bar,
                                        {
                                            height: barHeight,
                                            backgroundColor: overLimit ? colors.accent : colors.primary,
                                            opacity: current ? 1 : 0.55,
                                        },
                                    ]}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.dayLabel,
                                    {
                                        color: current ? colors.primary : colors.textSecondary,
                                        fontWeight: current ? '700' : '500',
                                    },
                                ]}
                            >
                                {format(date, 'EEEEE')}
                            </Text>
                        </View>
                    );
                })}
            </View>

            {/* Footer: totals */}
            {hasAnyData ? (
                <View style={styles.footerRow}>
                    <Text style={[styles.footerStat, { color: colors.textSecondary }]}>
                        Total <Text style={{ color: colors.text, fontWeight: '700' }}>{Math.round(totalMg)} mg</Text>
                    </Text>
                    <Text style={[styles.footerStat, { color: colors.textSecondary }]}>
                        Avg <Text style={{ color: colors.text, fontWeight: '700' }}>{avgMg} mg/day</Text>
                    </Text>
                </View>
            ) : (
                <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
                    Log your drinks to start building a streak
                </Text>
            )}
        </GlassmorphicCard>
    );
};

const styles = StyleSheet.create({
    container: {
        marginTop: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
        gap: 8,
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
    },
    streakChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 999,
        flexShrink: 1,
    },
    streakText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FF9500',
    },
    barsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 6,
    },
    barColumn: {
        flex: 1,
        alignItems: 'center',
    },
    barTrack: {
        height: 56,
        justifyContent: 'flex-end',
        alignItems: 'center',
        width: '100%',
    },
    bar: {
        width: 14,
        borderRadius: 5,
    },
    dayLabel: {
        fontSize: 11,
        marginTop: 6,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 14,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128,128,128,0.15)',
    },
    footerStat: {
        fontSize: 13,
    },
    emptyHint: {
        fontSize: 12,
        textAlign: 'center',
        marginTop: 12,
    },
});
