import React, { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Text, AppState } from 'react-native';
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
import { FadeInSlot } from '../src/components/FadeInSlot';
import { PressableScale } from '../src/components/PressableScale';
import { PaywallModal } from '../src/components/PaywallModal';
import { ProBadge } from '../src/components/ProBadge';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { useProStore } from '../src/store/useProStore';
import { Colors } from '../src/constants/Colors';

import { FEATURES } from '../src/config/featureFlags';

type ScrollSlotKey = 'caffeine' | 'sleepQuality' | 'sleepForecast' | 'chart' | 'details' | 'advisor' | 'history' | 'fab';

export default function Dashboard() {
    const router = useRouter();
    const theme = useCaffeineStore(state => state.theme);
    const isProDebug = useCaffeineStore(state => state.isProDebug);
    const isPro = useProStore(state => state.isPro)();
    const colors = Colors[theme];
    const insets = useSafeAreaInsets();

    const [showCaffeine, setShowCaffeine] = useState(true);
    const [showAlertness, setShowAlertness] = useState(true);
    const [showThreshold, setShowThreshold] = useState(false);
    const [currentTime, setCurrentTime] = useState(Date.now());
    const [paywallVisible, setPaywallVisible] = useState(false);

    const scrollSlots = useMemo(() => {
        let i = 0;
        const slots: Partial<Record<ScrollSlotKey, number>> = {};
        if (FEATURES.CAFFEINE_DISPLAY) slots.caffeine = i++;
        if (FEATURES.SLEEP_QUALITY) slots.sleepQuality = i++;
        if (FEATURES.SLEEP_FORECAST) slots.sleepForecast = i++;
        if (FEATURES.DECAY_CHART) slots.chart = i++;
        if (FEATURES.DETAILED_STATS) slots.details = i++;
        if (FEATURES.DOSE_ADVISOR) slots.advisor = i++;
        if (FEATURES.HISTORY_CARD) slots.history = i++;
        if (FEATURES.ADD_DRINK) slots.fab = i++;
        return slots;
    }, []);

    useEffect(() => {
        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active') {
                setCurrentTime(Date.now());
            }
        });
        return () => subscription.remove();
    }, []);

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <LinearGradient
                colors={
                    theme === 'dark'
                        ? ['#050505', '#0c1018', '#1a1a1a']
                        : ['#F2F2F7', '#FFFFFF']
                }
                style={StyleSheet.absoluteFill}
            />
            <SafeAreaView style={styles.safeArea}>
                <FadeInSlot slotIndex={0}>
                    <View style={styles.header}>
                        <View>
                            <Text style={[styles.greeting, { color: colors.text }]}>Good Energy</Text>
                            <Text style={[styles.date, { color: colors.textSecondary }]}>
                                {new Date(currentTime).toLocaleDateString(undefined, {
                                    weekday: 'long',
                                    month: 'short',
                                    day: 'numeric',
                                })}
                            </Text>
                        </View>
                        <PressableScale
                            onPress={() => router.push('/settings')}
                            style={[
                                styles.settingsButton,
                                {
                                    backgroundColor:
                                        theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                },
                            ]}
                        >
                            <Ionicons name="settings-outline" size={24} color={colors.text} />
                        </PressableScale>
                    </View>
                </FadeInSlot>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    {FEATURES.CAFFEINE_DISPLAY && scrollSlots.caffeine !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.caffeine}>
                            <CurrentCaffeineDisplay />
                        </FadeInSlot>
                    )}

                    {FEATURES.SLEEP_QUALITY && scrollSlots.sleepQuality !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.sleepQuality}>
                            <SleepQualitySelector />
                        </FadeInSlot>
                    )}

                    {FEATURES.SLEEP_FORECAST && scrollSlots.sleepForecast !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.sleepForecast}>
                            <SleepForecast />
                        </FadeInSlot>
                    )}

                    {FEATURES.DECAY_CHART && scrollSlots.chart !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.chart} style={styles.chartSlot}>
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
                        </FadeInSlot>
                    )}

                    {FEATURES.DETAILED_STATS && scrollSlots.details !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.details}>
                            <PressableScale
                                style={[
                                    styles.detailsButton,
                                    {
                                        backgroundColor:
                                            theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => {
                                    if (isPro) {
                                        router.push('./detailed-stats' as any);
                                    } else {
                                        setPaywallVisible(true);
                                    }
                                }}
                            >
                                <Ionicons name="analytics-outline" size={18} color={colors.primary} />
                                <Text style={[styles.detailsButtonText, { color: colors.text }]}>Detailed Statistics</Text>
                                {isPro
                                    ? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    : <ProBadge />
                                }
                            </PressableScale>
                        </FadeInSlot>
                    )}

                    {FEATURES.DOSE_ADVISOR && scrollSlots.advisor !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.advisor}>
                            <PressableScale
                                style={[
                                    styles.detailsButton,
                                    {
                                        backgroundColor:
                                            theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                                        borderColor: colors.border,
                                    },
                                ]}
                                onPress={() => {
                                    if (isPro) {
                                        router.push('./dose-advisor' as any);
                                    } else {
                                        setPaywallVisible(true);
                                    }
                                }}
                            >
                                <Ionicons name="bulb-outline" size={18} color={colors.primary} />
                                <Text style={[styles.detailsButtonText, { color: colors.text }]}>Dose Advisor</Text>
                                {isPro
                                    ? <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    : <ProBadge />
                                }
                            </PressableScale>
                        </FadeInSlot>
                    )}

                    {FEATURES.HISTORY_CARD && scrollSlots.history !== undefined && (
                        <FadeInSlot slotIndex={scrollSlots.history}>
                            <HistoryCard />
                        </FadeInSlot>
                    )}

                    <View style={styles.spacer} />
                </ScrollView>

                {FEATURES.ADD_DRINK && scrollSlots.fab !== undefined && (
                    <FadeInSlot
                        slotIndex={scrollSlots.fab}
                        style={[styles.fabContainer, { paddingBottom: Math.max(insets.bottom, 20) }]}
                    >
                        <StyledButton
                            title="+ Add Drink"
                            impactLightOnPress={FEATURES.UI_MOTION}
                            onPress={() => router.push('/add-drink')}
                            fullWidth
                            style={styles.fab}
                        />
                    </FadeInSlot>
                )}
            </SafeAreaView>

            {FEATURES.PAYWALL && (
                <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
            )}
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
    chartSlot: {
        overflow: 'visible',
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
