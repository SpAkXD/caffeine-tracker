import React, { useEffect, useState } from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { format, setHours, startOfDay } from 'date-fns';
import { PressableScale } from './PressableScale';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

/**
 * First-launch onboarding — 3 steps:
 *   1. What the app does (caffeine half-life explainer)
 *   2. Body weight (personalizes effective half-life)
 *   3. Bedtime (drives the sleep forecast)
 *
 * Self-contained: reads `hasOnboarded` from the store and only shows
 * after AsyncStorage hydration finishes, so existing users never see
 * a flash of onboarding while their persisted state loads.
 */
export const OnboardingModal: React.FC = () => {
    const hasOnboarded = useCaffeineStore(state => state.hasOnboarded);
    const completeOnboarding = useCaffeineStore(state => state.completeOnboarding);
    const updateSettings = useCaffeineStore(state => state.updateSettings);
    const setBedtime = useCaffeineStore(state => state.setBedtime);
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    // Don't decide visibility until the persisted store has hydrated
    const [hydrated, setHydrated] = useState(useCaffeineStore.persist.hasHydrated());
    useEffect(() => {
        const unsub = useCaffeineStore.persist.onFinishHydration(() => setHydrated(true));
        return unsub;
    }, []);

    const [step, setStep] = useState(0);
    const [weight, setWeight] = useState(70);
    const [bedtimeHour, setBedtimeHour] = useState(22);

    const visible = hydrated && !hasOnboarded;
    if (!visible) return null;

    const finish = () => {
        updateSettings({ weight });
        setBedtime(bedtimeHour);
        completeOnboarding();
    };

    const bedtimeLabel = format(setHours(startOfDay(new Date()), bedtimeHour), 'h:00 a');

    const steps = [
        // ── Step 1: half-life explainer ──
        <View key="welcome" style={styles.stepContent}>
            <View style={[styles.iconBubble, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="cafe" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Welcome to{'\n'}Caffeine Tracker</Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
                Caffeine doesn't vanish when the buzz fades. Roughly every{' '}
                <Text style={{ color: colors.primary, fontWeight: '700' }}>5 hours</Text>, your body
                clears only half of it — so that 4 PM espresso is still 25% active at midnight.
            </Text>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
                This app tracks the real level in your system and tells you when you can sleep.
            </Text>
        </View>,

        // ── Step 2: weight ──
        <View key="weight" style={styles.stepContent}>
            <View style={[styles.iconBubble, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="body" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Your Weight</Text>
            <Text style={[styles.bigValue, { color: colors.primary }]}>{Math.round(weight)} kg</Text>
            <Slider
                style={styles.slider}
                minimumValue={30}
                maximumValue={150}
                step={1}
                value={weight}
                onValueChange={setWeight}
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor="rgba(128,128,128,0.3)"
                thumbTintColor={colors.text}
            />
            <Text style={[styles.body, { color: colors.textSecondary }]}>
                Heavier bodies clear caffeine faster. This tunes your personal half-life — you can
                change it anytime in Settings.
            </Text>
        </View>,

        // ── Step 3: bedtime ──
        <View key="bedtime" style={styles.stepContent}>
            <View style={[styles.iconBubble, { backgroundColor: colors.primary + '22' }]}>
                <Ionicons name="moon" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>When's Bedtime?</Text>
            <View style={styles.stepperRow}>
                <PressableScale
                    style={[styles.stepperButton, { backgroundColor: colors.primary + '22' }]}
                    onPress={() => setBedtimeHour((h) => (h + 23) % 24)}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.primary} />
                </PressableScale>
                <Text style={[styles.bigValue, { color: colors.primary, minWidth: 150, textAlign: 'center' }]}>
                    {bedtimeLabel}
                </Text>
                <PressableScale
                    style={[styles.stepperButton, { backgroundColor: colors.primary + '22' }]}
                    onPress={() => setBedtimeHour((h) => (h + 1) % 24)}
                >
                    <Ionicons name="chevron-forward" size={24} color={colors.primary} />
                </PressableScale>
            </View>
            <Text style={[styles.body, { color: colors.textSecondary }]}>
                We'll forecast whether tonight's sleep is safe — and warn you when a late coffee
                would push caffeine past your sleep threshold.
            </Text>
        </View>,
    ];

    const isLast = step === steps.length - 1;

    return (
        <Modal animationType="fade" transparent visible statusBarTranslucent>
            <View style={[styles.overlay, { backgroundColor: colors.background }]}>
                {/* Skip (top-right) */}
                <PressableScale style={styles.skipButton} onPress={finish}>
                    <Text style={[styles.skipText, { color: colors.textSecondary }]}>Skip</Text>
                </PressableScale>

                <Animated.View
                    key={step}
                    entering={FadeIn.duration(250)}
                    exiting={FadeOut.duration(150)}
                    style={styles.stepWrapper}
                >
                    {steps[step]}
                </Animated.View>

                {/* Step dots */}
                <View style={styles.dots}>
                    {steps.map((_, i) => (
                        <View
                            key={i}
                            style={[
                                styles.dot,
                                {
                                    backgroundColor: i === step ? colors.primary : colors.border,
                                    width: i === step ? 22 : 8,
                                },
                            ]}
                        />
                    ))}
                </View>

                {/* Nav buttons */}
                <View style={styles.navRow}>
                    {step > 0 ? (
                        <PressableScale
                            style={[styles.backButton, { borderColor: colors.border }]}
                            onPress={() => setStep(step - 1)}
                        >
                            <Text style={[styles.backText, { color: colors.textSecondary }]}>Back</Text>
                        </PressableScale>
                    ) : (
                        <View style={styles.backButton} />
                    )}
                    <PressableScale
                        style={[styles.nextButton, { backgroundColor: colors.primary }]}
                        onPress={() => (isLast ? finish() : setStep(step + 1))}
                    >
                        <Text style={styles.nextText}>{isLast ? 'Get Started' : 'Next'}</Text>
                        <Ionicons name={isLast ? 'checkmark' : 'arrow-forward'} size={18} color="#000" />
                    </PressableScale>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 48,
    },
    skipButton: {
        position: 'absolute',
        top: 56,
        right: 24,
        padding: 8,
        zIndex: 10,
    },
    skipText: {
        fontSize: 14,
        fontWeight: '600',
    },
    stepWrapper: {
        flex: 1,
        justifyContent: 'center',
    },
    stepContent: {
        alignItems: 'center',
        gap: 18,
    },
    iconBubble: {
        width: 88,
        height: 88,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 6,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        textAlign: 'center',
        letterSpacing: -0.5,
        lineHeight: 34,
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        textAlign: 'center',
    },
    bigValue: {
        fontSize: 40,
        fontWeight: '800',
        letterSpacing: -1,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    stepperButton: {
        width: 48,
        height: 48,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dots: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    dot: {
        height: 8,
        borderRadius: 4,
    },
    navRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backButton: {
        paddingVertical: 14,
        paddingHorizontal: 22,
        borderRadius: 14,
        borderWidth: StyleSheet.hairlineWidth,
    },
    backText: {
        fontSize: 15,
        fontWeight: '600',
    },
    nextButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: 28,
        borderRadius: 14,
    },
    nextText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
});
