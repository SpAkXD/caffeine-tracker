import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView, Switch, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import Constants from 'expo-constants';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { useProStore } from '../src/store/useProStore';
import { StyledButton } from '../src/components/StyledButton';
import { GlassmorphicCard } from '../src/components/GlassmorphicCard';
import { Colors } from '../src/constants/Colors';
import {
    requestNotificationPermissions,
    cancelAllNotifications,
    scheduleCaffeineUpdates,
    scheduleTestNotification,
} from '../src/services/notificationService';
import { openStoreListing } from '../src/services/storeReview';
import { WidgetPreview } from '../src/components/WidgetPreview';
import { PressableScale } from '../src/components/PressableScale';
import { PaywallModal } from '../src/components/PaywallModal';
import { CustomPresetEditor } from '../src/components/CustomPresetEditor';

import { FEATURES } from '../src/config/featureFlags';
import { InfoPopupModal } from '../src/components/InfoPopupModal';
import { exportDosesAsCsv } from '../src/utils/csvExport';
import { restorePurchases } from '../src/services/iapService';

export default function SettingsScreen() {
    const halfLifeHours = useCaffeineStore(state => state.halfLifeHours);
    const sleepThresholdMg = useCaffeineStore(state => state.sleepThresholdMg);
    const weightKg = useCaffeineStore(state => state.weightKg);
    const getEffectiveHalfLife = useCaffeineStore(state => state.getEffectiveHalfLife);
    const updateSettings = useCaffeineStore(state => state.updateSettings);
    const clearDoses = useCaffeineStore(state => state.clearDoses);
    const theme = useCaffeineStore(state => state.theme);
    const toggleTheme = useCaffeineStore(state => state.toggleTheme);
    const use24HourFormat = useCaffeineStore(state => state.use24HourFormat);
    const toggleTimeFormat = useCaffeineStore(state => state.toggleTimeFormat);
    const notificationsEnabled = useCaffeineStore(state => state.notificationsEnabled);
    const toggleNotifications = useCaffeineStore(state => state.toggleNotifications);
    const notificationFrequency = useCaffeineStore(state => state.notificationFrequency);
    const setNotificationFrequency = useCaffeineStore(state => state.setNotificationFrequency);
    const getCurrentLevel = useCaffeineStore(state => state.getCurrentLevel);
    const isProDebug = useCaffeineStore(state => state.isProDebug);
    const toggleProDebug = useCaffeineStore(state => state.toggleProDebug);
    const doses = useCaffeineStore(state => state.doses);

    const isPro = useProStore(state => state.isPro)();

    const colors = Colors[theme];

    // Local state for smooth slider dragging before committing to store
    const [localHalfLife, setLocalHalfLife] = useState(halfLifeHours);
    const [localThreshold, setLocalThreshold] = useState(sleepThresholdMg);
    const [localWeight, setLocalWeight] = useState(weightKg);

    // Info popup state
    const [infoPopup, setInfoPopup] = useState<{ title: string; description: string } | null>(null);

    // Pro modal state
    const [paywallVisible, setPaywallVisible] = useState(false);
    const [presetEditorVisible, setPresetEditorVisible] = useState(false);
    const [csvExporting, setCsvExporting] = useState(false);
    const [restoring, setRestoring] = useState(false);

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
                // Pre-schedule 24h of notification updates
                const doses = useCaffeineStore.getState().doses;
                const hl = useCaffeineStore.getState().getEffectiveHalfLife();
                await scheduleCaffeineUpdates(doses, hl, notificationFrequency);
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
            toggleNotifications();
        }
    };

    const handleFrequencyChange = async (freq: 1 | 3 | 6) => {
        setNotificationFrequency(freq);
        if (notificationsEnabled) {
            const doses = useCaffeineStore.getState().doses;
            const hl = useCaffeineStore.getState().getEffectiveHalfLife();
            await scheduleCaffeineUpdates(doses, hl, freq);
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
                        <View style={[styles.row, { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)' }]}>
                            <Text style={[styles.label, { color: colors.primary, marginBottom: 0 }]}>Time Format</Text>
                            <View style={styles.switchRow}>
                                <Text style={[styles.switchLabel, { color: colors.text }]}>{use24HourFormat ? '24-Hour' : '12-Hour'}</Text>
                                <Switch
                                    value={use24HourFormat}
                                    onValueChange={toggleTimeFormat}
                                    trackColor={{ false: '#767577', true: colors.primary }}
                                    thumbColor="#f4f3f4"
                                />
                            </View>
                        </View>
                    </GlassmorphicCard>
                )}

                {(FEATURES.NOTIFICATIONS || isProDebug) && (
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
                                        <PressableScale
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
                                        </PressableScale>
                                    ))}
                                </View>
                                <Text style={[styles.frequencyHint, { color: colors.primary }]}>
                                    Reminding you every {notificationFrequency}h
                                </Text>
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
                                <PressableScale onPress={() => setInfoPopup(INFO_DESCRIPTIONS.weight)}>
                                    <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                </PressableScale>
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
                                <PressableScale onPress={() => setInfoPopup(INFO_DESCRIPTIONS.halfLife)}>
                                    <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                </PressableScale>
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
                                <PressableScale onPress={() => setInfoPopup(INFO_DESCRIPTIONS.threshold)}>
                                    <Ionicons name="information-circle-outline" size={22} color={colors.primary} />
                                </PressableScale>
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

                {FEATURES.STORE_REVIEW && (
                    <GlassmorphicCard style={styles.card}>
                        <PressableScale
                            style={styles.rateRow}
                            onPress={async () => {
                                try {
                                    await openStoreListing();
                                } catch {
                                    Alert.alert('Store', 'Could not open the store. Try again later.');
                                }
                            }}
                        >
                            <View style={styles.rateRowLeft}>
                                <Ionicons name="star-outline" size={24} color={colors.primary} />
                                <Text style={[styles.rateTitle, { color: colors.text }]}>Rate Caffeine Tracker</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
                        </PressableScale>
                        <Text style={[styles.rateHint, { color: colors.textSecondary }]}>
                            Opens the Play Store or App Store listing
                        </Text>
                    </GlassmorphicCard>
                )}

                {/* Pro Section */}
                {FEATURES.PAYWALL && (
                    <GlassmorphicCard style={styles.card}>
                        {isPro ? (
                            <>
                                <View style={styles.proUnlockedRow}>
                                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                                    <Text style={[styles.proUnlockedText, { color: colors.primary }]}>
                                        Pro Unlocked
                                    </Text>
                                </View>

                                {/* Manage Custom Presets */}
                                {FEATURES.CUSTOM_PRESETS && (
                                    <PressableScale style={styles.proRow} onPress={() => setPresetEditorVisible(true)}>
                                        <Ionicons name="cafe-outline" size={20} color={colors.text} />
                                        <Text style={[styles.proRowText, { color: colors.text }]}>
                                            Manage Custom Drinks
                                        </Text>
                                        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    </PressableScale>
                                )}

                                {/* CSV Export */}
                                {FEATURES.CSV_EXPORT && (
                                    <PressableScale
                                        style={styles.proRow}
                                        onPress={async () => {
                                            if (csvExporting) return;
                                            setCsvExporting(true);
                                            try {
                                                const getEffectiveHalfLife = useCaffeineStore.getState().getEffectiveHalfLife;
                                                await exportDosesAsCsv(doses, getEffectiveHalfLife());
                                            } catch (e: any) {
                                                Alert.alert('Export failed', e?.message ?? 'Unknown error');
                                            } finally {
                                                setCsvExporting(false);
                                            }
                                        }}
                                    >
                                        <Ionicons name="download-outline" size={20} color={colors.text} />
                                        <Text style={[styles.proRowText, { color: colors.text }]}>
                                            Export Data (CSV)
                                        </Text>
                                        {csvExporting
                                            ? <ActivityIndicator size="small" color={colors.textSecondary} />
                                            : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                        }
                                    </PressableScale>
                                )}

                                {/* Restore Purchases (required by Google policy) */}
                                <PressableScale
                                    style={styles.proRow}
                                    onPress={async () => {
                                        setRestoring(true);
                                        try {
                                            await restorePurchases();
                                            Alert.alert('Restored', 'Purchase status refreshed.');
                                        } catch {
                                            Alert.alert('Error', 'Could not connect to the Play Store.');
                                        } finally {
                                            setRestoring(false);
                                        }
                                    }}
                                >
                                    <Ionicons name="refresh-outline" size={20} color={colors.text} />
                                    <Text style={[styles.proRowText, { color: colors.text }]}>Restore Purchase</Text>
                                    {restoring
                                        ? <ActivityIndicator size="small" color={colors.textSecondary} />
                                        : <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                                    }
                                </PressableScale>
                            </>
                        ) : (
                            <>
                                <PressableScale style={styles.upgradeButton} onPress={() => setPaywallVisible(true)}>
                                    <Ionicons name="flash" size={18} color="#000" />
                                    <Text style={styles.upgradeText}>Upgrade to Pro — $1.99</Text>
                                </PressableScale>
                                <Text style={[styles.upgradeHint, { color: colors.textSecondary }]}>
                                    One-time · Detailed Stats · Widget · Dose Advisor · CSV Export · Custom Drinks
                                </Text>

                                {/* Restore Purchases (required even for non-Pro users) */}
                                <PressableScale
                                    style={[styles.proRow, { marginTop: 8 }]}
                                    onPress={async () => {
                                        setRestoring(true);
                                        try {
                                            const restored = await restorePurchases();
                                            if (!restored) Alert.alert('Nothing found', 'No previous Pro purchase on this account.');
                                        } catch {
                                            Alert.alert('Error', 'Could not connect to the Play Store.');
                                        } finally {
                                            setRestoring(false);
                                        }
                                    }}
                                >
                                    <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
                                        Restore Purchase
                                    </Text>
                                    {restoring && <ActivityIndicator size="small" color={colors.textSecondary} />}
                                </PressableScale>
                            </>
                        )}
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

                <Text style={[styles.version, { color: colors.textSecondary }]}>
                    Version {Constants.expoConfig?.version ?? '—'}
                </Text>

                {/* Widget Preview */}
                {FEATURES.WIDGET_PREVIEW && isPro && (
                    <GlassmorphicCard style={{ ...styles.card, marginTop: 20 }}>
                        <WidgetPreview />
                    </GlassmorphicCard>
                )}

                {/* DEV: Toggle Pro Mode */}
                <PressableScale
                    onPress={toggleProDebug}
                    style={[
                        styles.devToggle,
                        {
                            backgroundColor: isProDebug
                                ? 'rgba(255, 149, 0, 0.15)'
                                : theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                            borderColor: isProDebug ? '#FF9500' : colors.border,
                        },
                    ]}
                >
                    <Ionicons
                        name={isProDebug ? 'flash' : 'flash-outline'}
                        size={18}
                        color={isProDebug ? '#FF9500' : colors.textSecondary}
                    />
                    <Text
                        style={[
                            styles.devToggleText,
                            { color: isProDebug ? '#FF9500' : colors.textSecondary },
                        ]}
                    >
                        DEV: Toggle Pro Mode {isProDebug ? '(ON)' : '(OFF)'}
                    </Text>
                </PressableScale>

                {/* DEV: Send Test Notification (5s) */}
                {isProDebug && (
                    <StyledButton
                        title="DEV: Send Test Notification (5s)"
                        variant="secondary"
                        onPress={() => {
                            const level = getCurrentLevel();
                            scheduleTestNotification(level);
                            Alert.alert('Sent', 'Close the app now. Notification arriving in 5 seconds.');
                        }}
                        style={{ marginTop: 12, marginBottom: 20 }}
                    />
                )}

            </ScrollView>

            {/* Info Popup Modal */}
            <InfoPopupModal
                visible={infoPopup !== null}
                title={infoPopup?.title ?? ''}
                description={infoPopup?.description ?? ''}
                onClose={() => setInfoPopup(null)}
            />

            {FEATURES.PAYWALL && (
                <PaywallModal visible={paywallVisible} onClose={() => setPaywallVisible(false)} />
            )}

            {FEATURES.CUSTOM_PRESETS && (
                <CustomPresetEditor visible={presetEditorVisible} onClose={() => setPresetEditorVisible(false)} />
            )}
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
    rateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    rateRowLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flexShrink: 1,
    },
    rateTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    rateHint: {
        marginTop: 12,
        fontSize: 13,
        lineHeight: 18,
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
    frequencyHint: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
        marginTop: 8,
    },
    devToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 20,
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        borderWidth: 1,
        gap: 8,
    },
    devToggleText: {
        fontSize: 14,
        fontWeight: '700',
    },
    // Pro section styles
    proUnlockedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    proUnlockedText: {
        fontSize: 16,
        fontWeight: '700',
    },
    proRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.08)',
    },
    proRowText: {
        flex: 1,
        fontSize: 15,
        fontWeight: '600',
    },
    upgradeButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        backgroundColor: '#00F0FF',
        borderRadius: 14,
        paddingVertical: 14,
        marginBottom: 10,
    },
    upgradeText: {
        fontSize: 15,
        fontWeight: '800',
        color: '#000',
    },
    upgradeHint: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 18,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
