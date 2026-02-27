import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CurrentCaffeineDisplay } from '../src/components/CurrentCaffeineDisplay';
import { DecayChart } from '../src/components/DecayChart';
import { SleepForecast } from '../src/components/SleepForecast';
import { SleepQualitySelector } from '../src/components/SleepQualitySelector';
import { ChartToggleButtons } from '../src/components/ChartToggleButtons';
import { StyledButton } from '../src/components/StyledButton';
import { GlassmorphicCard } from '../src/components/GlassmorphicCard';
import { HistoryCard } from '../src/components/HistoryCard';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';

import { FEATURES } from '../src/config/featureFlags';

export default function Dashboard() {
    const router = useRouter();
    const theme = useCaffeineStore(state => state.theme);
    const isProDebug = useCaffeineStore(state => state.isProDebug);
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    // Chart visibility controls
    const [showCaffeine, setShowCaffeine] = useState(true);
    const [showAlertness, setShowAlertness] = useState(true);
    const [showThreshold, setShowThreshold] = useState(false);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={theme === 'dark' ? ['#050505', '#1a1a1a'] : ['#F2F2F7', '#FFFFFF']}
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.header}>
                    <View>
                        <Text style={[styles.greeting, { color: colors.text }]}>Good Energy</Text>
                        <Text style={[styles.date, { color: colors.textSecondary }]}>{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
                    </View>
                    <TouchableOpacity onPress={() => router.push('/settings')} style={[styles.settingsButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                        <Ionicons name="settings-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {FEATURES.CAFFEINE_DISPLAY && <CurrentCaffeineDisplay />}

                    {FEATURES.SLEEP_QUALITY && <SleepQualitySelector />}

                    {FEATURES.SLEEP_FORECAST && <SleepForecast />}

                    {FEATURES.DECAY_CHART && (
                        <GlassmorphicCard style={styles.chartCard} intensity={15}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>Caffeine Trajectory</Text>

                            {FEATURES.CHART_TOGGLES && (
                                <ChartToggleButtons
                                    showCaffeine={showCaffeine}
                                    showAlertness={showAlertness}
                                    showThreshold={showThreshold}
                                    onToggleCaffeine={() => setShowCaffeine(!showCaffeine)}
                                    onToggleAlertness={() => setShowAlertness(!showAlertness)}
                                    onToggleThreshold={() => setShowThreshold(!showThreshold)}
                                />
                            )}

                            <DecayChart
                                showCaffeine={showCaffeine}
                                showAlertness={showAlertness}
                                showThreshold={showThreshold}
                            />
                        </GlassmorphicCard>
                    )}

                    {(FEATURES.DETAILED_STATS || isProDebug) && (
                        <TouchableOpacity
                            style={[styles.detailsButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)', borderColor: colors.border }]}
                            onPress={() => router.push('./detailed-stats' as any)}
                        >
                            <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                            <Text style={[styles.detailsButtonText, { color: colors.text }]}>Detailed Statistics</Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}

                    {FEATURES.HISTORY_CARD && <HistoryCard />}

                    <View style={styles.spacer} />
                </ScrollView>

                {FEATURES.ADD_DRINK && (
                    <View style={[styles.fabContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
                        <StyledButton
                            title="+ Add Drink"
                            onPress={() => router.push('/add-drink')}
                            fullWidth
                            style={styles.fab}
                        />
                    </View>
                )}
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 10,
        paddingBottom: 20,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    date: {
        fontSize: 14,
    },
    settingsButton: {
        padding: 8,
        borderRadius: 12,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingBottom: 100,
    },
    chartCard: {
        marginTop: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 10,
    },
    fabContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
    },
    fab: {
        shadowColor: '#00F0FF',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 12,
    },
    spacer: {
        height: 40,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 16,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
    },
    detailsButtonText: {
        fontSize: 15,
        fontWeight: '600',
        flex: 1,
        marginLeft: 10,
    },
});
