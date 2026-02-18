import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Switch, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { StyledButton } from '../src/components/StyledButton';
import { GlassmorphicCard } from '../src/components/GlassmorphicCard';
import { Colors } from '../src/constants/Colors';
import {
    requestNotificationPermissions,
    cancelAllNotifications,
} from '../src/services/notificationService';
import {
    registerBackgroundTask,
    unregisterBackgroundTask,
} from '../src/services/backgroundTask';
import { WidgetPreview } from '../src/components/WidgetPreview';

import { FEATURES } from '../src/config/featureFlags';
import { InfoPopupModal } from '../src/components/InfoPopupModal';

export default function SettingsScreen() {
    const halfLifeHours = useCaffeineStore(state => state.halfLifeHours);
    const sleepThresholdMg = useCaffeineStore(state => state.sleepThresholdMg);
    const weightKg = useCaffeineStore(state => state.weightKg);
    const getEffectiveHalfLife = useCaffeineStore(state => state.getEffectiveHalfLife);
    const updateSettings = useCaffeineStore(state => state.updateSettings);
    const clearDoses = useCaffeineStore(state => state.clearDoses);
    const theme = useCaffeineStore(state => state.theme);
    const toggleTheme = useCaffeineStore(state => state.toggleTheme);
    const notificationsEnabled = useCaffeineStore(state => state.notificationsEnabled);
    const toggleNotifications = useCaffeineStore(state => state.toggleNotifications);
    const notificationFrequency = useCaffeineStore(state => state.notificationFrequency);
    const setNotificationFrequency = useCaffeineStore(state => state.setNotificationFrequency);
    const getCurrentLevel = useCaffeineStore(state => state.getCurrentLevel);

    const colors = Colors[theme];

    // Local state for smooth slider dragging before committing to store
    const [localHalfLife, setLocalHalfLife] = useState(halfLifeHours);
    const [localThreshold, setLocalThreshold] = useState(sleepThresholdMg);
    const [localWeight, setLocalWeight] = useState(weightKg);

    // Info popup state
    const [infoPopup, setInfoPopup] = useState<{ title: string; description: string } | null>(null);

    const INFO_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
        weight: {
            title: 'Weight',
            description: 'Heavier people generally metabolize caffeine faster. Lowering your weight increases your effective half-life, meaning caffeine stays in your system longer.',
        },
        halfLife: {
            title: 'Base Half-Life',
            description: 'This is your genetic baseline. The average adult is 5 hours. If you know you are highly sensitive to caffeine and it keeps you up, increase this number.',
        },
        threshold: {
            title: 'Sleep Threshold',
            description: 'The maximum amount of active caffeine your body can handle before it disrupts your sleep. Lowering this number means you will need to stop drinking coffee earlier in the day to reach your target by bedtime.',
        },
    };

    const effectiveHalfLife = getEffectiveHalfLife();

    const handleHalfLifeChange = (val: number) => {
        setLocalHalfLife(val);
        updateSettings({ halfLife: val });
    };

    const handleThresholdChange = (val: number) => {
        setLocalThreshold(val);
        updateSettings({ threshold: val });
    };

    const handleWeightChange = (val: number) => {
        setLocalWeight(val);
        updateSettings({ weight: val });
    };

    const handleNotificationToggle = async () => {
        if (!notificationsEnabled) {
            // Turning ON notifications
            const granted = await requestNotificationPermissions();
            if (granted) {
                toggleNotifications();
                await registerBackgroundTask(notificationFrequency);
                Alert.alert('Notifications Enabled', `You'll receive caffeine updates every ${notificationFrequency}h`);
            } else {
                Alert.alert(
                    'Permission Required',
                    'Notifications are disabled. Please enable them in system settings to use this feature.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Linking.openSettings() }
                    ]
                );
            }
        } else {
            // Turning OFF notifications
            await cancelAllNotifications();
            await unregisterBackgroundTask();
            toggleNotifications();
        }
    };

    const handleFrequencyChange = async (freq: 1 | 3 | 6) => {
        setNotificationFrequency(freq);
        if (notificationsEnabled) {
            await registerBackgroundTask(freq);
        }
    };

    const handleClearData = () => {
        Alert.alert(
            'Clear Data',
            'Are you sure you want to delete all logged drinks?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        clearDoses();
                        Alert.alert('Data Cleared');
                    }
                },
            ]
        );
    };

    return (
        <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
            <ScrollView style={styles.container} contentContainerStyle={styles.content}>

                {FEATURES.THEME_TOGGLE && (
                    <GlassmorphicCard style={styles.card}>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.primary }]}>Appearance</Text>
                            <View style={styles.switchRow}>
                                <Text style={[styles.switchLabel, { color: colors.text }]}>{theme === 'dark' ? 'Dark' : 'Light'}</Text>
                                <Switch
                                    value={theme === 'dark'}
                                    onValueChange={toggleTheme}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor="#f4f3f4"
                                />
                            </View>
                        </View>
                    </GlassmorphicCard>
                )}

                {FEATURES.NOTIFICATIONS && (
                    <GlassmorphicCard style={styles.card}>
                        <View style={styles.row}>
                            <Text style={[styles.label, { color: colors.primary }]}>Notifications</Text>
                            <View style={styles.switchRow}>
                                <Text style={[styles.switchLabel, { color: colors.text }]}>{notificationsEnabled ? 'On' : 'Off'}</Text>
                                <Switch
                                    value={notificationsEnabled}
                                    onValueChange={handleNotificationToggle}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor="#f4f3f4"
                                />
                            </View>
                        </View>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            Get periodic updates showing your current caffeine level
                        </Text>

                        {notificationsEnabled && (
                            <View style={styles.frequencyContainer}>
                                <Text style={[styles.frequencyLabel, { color: colors.textSecondary }]}>
                                    Update Frequency
                                </Text>
                                <View style={styles.frequencyRow}>
                                    {([1, 3, 6] as const).map((freq) => (
                                        <TouchableOpacity
                                            key={freq}
                                            style={[
                                                styles.frequencyOption,
                                                {
                                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                                    borderColor: colors.border,
                                                },
                                                notificationFrequency === freq && {
                                                    backgroundColor: theme === 'dark' ? 'rgba(0, 240, 255, 0.2)' : 'rgba(0, 122, 255, 0.2)',
                                                    borderColor: colors.primary,
                                                },
                                            ]}
                                            onPress={() => handleFrequencyChange(freq)}
                                        >
                                            <Text
                                                style={[
                                                    styles.frequencyText,
                                                    { color: colors.textSecondary },
                                                    notificationFrequency === freq && { color: colors.primary, fontWeight: '700' },
                                                ]}
                                            >
                                                {freq}h
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}
                    </GlassmorphicCard>
                )}

                {/* NEW: Body Weight Section */}
                {FEATURES.WEIGHT_SETTING && (
                    <GlassmorphicCard style={styles.card}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: colors.primary }]}>Your Weight</Text>
                            {FEATURES.INFO_POPUPS && (
                                <TouchableOpacity onPress={() => setInfoPopup(INFO_DESCRIPTIONS.weight)}>
                                    <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={[styles.value, { color: colors.text }]}>{Math.round(localWeight)} kg</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            Heavier people metabolize caffeine faster. This adjusts your personal half-life.
                        </Text>

                        <Slider
                            style={styles.slider}
                            minimumValue={30}
                            maximumValue={150}
                            step={1}
                            value={localWeight}
                            onValueChange={handleWeightChange}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor="rgba(128,128,128,0.3)"
                            thumbTintColor={colors.text}
                        />

                        <View style={styles.effectiveRow}>
                            <Text style={[styles.effectiveLabel, { color: colors.textSecondary }]}>
                                Your Effective Half-Life:
                            </Text>
                            <Text style={[styles.effectiveValue, { color: colors.accent }]}>
                                {effectiveHalfLife.toFixed(1)} hrs
                            </Text>
                        </View>
                    </GlassmorphicCard>
                )}

                {FEATURES.HALF_LIFE_SETTING && (
                    <GlassmorphicCard style={styles.card}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: colors.primary }]}>Base Half-Life (Hours)</Text>
                            {FEATURES.INFO_POPUPS && (
                                <TouchableOpacity onPress={() => setInfoPopup(INFO_DESCRIPTIONS.halfLife)}>
                                    <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={[styles.value, { color: colors.text }]}>{localHalfLife.toFixed(1)} hrs</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            The baseline time for half of caffeine to be eliminated.
                            Average is 5 hours. Adjust if you're a fast/slow metabolizer.
                        </Text>

                        <Slider
                            style={styles.slider}
                            minimumValue={3}
                            maximumValue={8}
                            step={0.1}
                            value={localHalfLife}
                            onValueChange={handleHalfLifeChange}
                            minimumTrackTintColor={colors.primary}
                            maximumTrackTintColor="rgba(128,128,128,0.3)"
                            thumbTintColor={colors.text}
                        />
                    </GlassmorphicCard>
                )}

                {FEATURES.THRESHOLD_SETTING && (
                    <GlassmorphicCard style={styles.card}>
                        <View style={styles.labelRow}>
                            <Text style={[styles.label, { color: colors.primary }]}>Sleep Threshold (mg)</Text>
                            {FEATURES.INFO_POPUPS && (
                                <TouchableOpacity onPress={() => setInfoPopup(INFO_DESCRIPTIONS.threshold)}>
                                    <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                </TouchableOpacity>
                            )}
                        </View>
                        <Text style={[styles.value, { color: colors.text }]}>{Math.round(localThreshold)} mg</Text>
                        <Text style={[styles.description, { color: colors.textSecondary }]}>
                            The caffeine level below which you can sleep comfortably.
                            Default is 50mg. Lower = stricter.
                        </Text>

                        <Slider
                            style={styles.slider}
                            minimumValue={10}
                            maximumValue={100}
                            step={5}
                            value={localThreshold}
                            onValueChange={handleThresholdChange}
                            minimumTrackTintColor={colors.accent}
                            maximumTrackTintColor="rgba(128,128,128,0.3)"
                            thumbTintColor={colors.text}
                        />
                    </GlassmorphicCard>
                )}

                {FEATURES.CLEAR_DATA && (
                    <StyledButton
                        title="Reset All Data"
                        variant="danger"
                        onPress={handleClearData}
                        style={styles.resetButton}
                    />
                )}

                <Text style={[styles.version, { color: colors.textSecondary }]}>Version 1.1.1</Text>

                {/* Widget Preview */}
                {FEATURES.WIDGET_PREVIEW && (
                    <GlassmorphicCard style={{ ...styles.card, marginTop: 20 }}>
                        <WidgetPreview />
                    </GlassmorphicCard>
                )}

            </ScrollView>

            {/* Info Popup Modal */}
            <InfoPopupModal
                visible={infoPopup !== null}
                title={infoPopup?.title ?? ''}
                description={infoPopup?.description ?? ''}
                onClose={() => setInfoPopup(null)}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        flex: 1,
    },
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    card: {
        marginBottom: 20,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    switchLabel: {
        marginRight: 10,
        fontWeight: '600',
    },
    label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 5,
    },
    value: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 10,
    },
    description: {
        fontSize: 14,
        marginBottom: 20,
        lineHeight: 20,
    },
    slider: {
        width: '100%',
        height: 40,
    },
    effectiveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.1)',
    },
    effectiveLabel: {
        fontSize: 14,
    },
    effectiveValue: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 8,
    },
    resetButton: {
        marginTop: 20,
    },
    version: {
        textAlign: 'center',
        marginTop: 40,
    },
    frequencyContainer: {
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    frequencyLabel: {
        fontSize: 13,
        fontWeight: '500',
        marginBottom: 8,
    },
    frequencyRow: {
        flexDirection: 'row',
        gap: 8,
    },
    frequencyOption: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    frequencyText: {
        fontWeight: '600',
        fontSize: 15,
    },
});
