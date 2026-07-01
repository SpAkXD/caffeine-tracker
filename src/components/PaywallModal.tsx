import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ActivityIndicator, Alert } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { FEATURES } from '../config/featureFlags';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { modalCardEntering } from '../constants/motion';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';
import { purchasePro, restorePurchases } from '../services/iapService';

interface PaywallModalProps {
    visible: boolean;
    onClose: () => void;
}

const PRO_FEATURES = [
    { icon: 'bar-chart', label: 'Detailed Statistics', desc: '7-day analytics & trend chart' },
    { icon: 'phone-portrait', label: 'Home Screen Widget', desc: 'Live caffeine level on your home screen' },
    { icon: 'bulb', label: 'Smart Dose Advisor', desc: 'Get optimal timing recommendations' },
    { icon: 'document-text', label: 'CSV Data Export', desc: 'Export your full 30-day history' },
    { icon: 'cafe', label: 'Custom Drink Presets', desc: 'Save your own drinks with custom mg' },
];

export const PaywallModal: React.FC<PaywallModalProps> = ({ visible, onClose }) => {
    const reduceMotion = useReduceMotion();
    const theme = useCaffeineStore((state) => state.theme);
    const colors = Colors[theme];
    const entering = FEATURES.UI_MOTION ? modalCardEntering(reduceMotion) : FadeIn.duration(1);

    const [loading, setLoading] = useState(false);
    const [restoring, setRestoring] = useState(false);

    const handlePurchase = async () => {
        setLoading(true);
        try {
            await purchasePro();
            // purchase listener in _layout.tsx handles state update + closing
        } catch (e: any) {
            const code = e?.code ?? '';
            // Ignore user-cancelled (they dismissed the sheet)
            if (code === 'user-cancelled' || code === 'E_USER_CANCELLED') return;
            console.warn('[PaywallModal] purchase failed:', JSON.stringify(e));
            Alert.alert(
                'Purchase failed',
                e?.message ? `${e.message} (${code})` : 'Please try again.',
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        setRestoring(true);
        try {
            const restored = await restorePurchases();
            if (restored) {
                Alert.alert('Restored!', 'Your Pro access has been restored.', [
                    { text: 'OK', onPress: onClose },
                ]);
            } else {
                Alert.alert('Nothing to restore', 'No previous Pro purchase found for this account.');
            }
        } catch {
            Alert.alert('Error', 'Could not connect to the Play Store. Please try again.');
        } finally {
            setRestoring(false);
        }
    };

    return (
        <Modal animationType="fade" transparent visible={visible} onRequestClose={onClose}>
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.cardWrapper} onPress={() => {}}>
                    <Animated.View
                        entering={entering}
                        style={[
                            styles.card,
                            {
                                backgroundColor: theme === 'dark' ? '#111' : '#fff',
                                borderColor: colors.primary + '33',
                            },
                        ]}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <Text style={[styles.title, { color: colors.primary }]}>Caffeine Tracker Pro</Text>
                            <Text style={[styles.price, { color: colors.text }]}>One-time · $1.99</Text>
                        </View>

                        {/* Feature list */}
                        <View style={styles.featureList}>
                            {PRO_FEATURES.map((f) => (
                                <View key={f.icon} style={styles.featureRow}>
                                    <View style={[styles.iconBubble, { backgroundColor: colors.primary + '22' }]}>
                                        <Ionicons name={f.icon as any} size={16} color={colors.primary} />
                                    </View>
                                    <View style={styles.featureText}>
                                        <Text style={[styles.featureName, { color: colors.text }]}>{f.label}</Text>
                                        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{f.desc}</Text>
                                    </View>
                                </View>
                            ))}
                        </View>

                        {/* CTA */}
                        <PressableScale
                            style={[styles.buyButton, { backgroundColor: colors.primary }]}
                            onPress={handlePurchase}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#000" />
                            ) : (
                                <Text style={styles.buyText}>Unlock Pro — $1.99</Text>
                            )}
                        </PressableScale>

                        {/* Restore */}
                        <PressableScale style={styles.restoreButton} onPress={handleRestore} disabled={restoring}>
                            {restoring ? (
                                <ActivityIndicator color={colors.textSecondary} size="small" />
                            ) : (
                                <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
                                    Restore Purchase
                                </Text>
                            )}
                        </PressableScale>

                        <Text style={[styles.legal, { color: colors.textSecondary }]}>
                            One-time payment · No subscription · Yours forever
                        </Text>
                    </Animated.View>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    cardWrapper: {
        width: '100%',
        maxWidth: 420,
    },
    card: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    price: {
        fontSize: 14,
        fontWeight: '500',
        marginTop: 4,
        opacity: 0.7,
    },
    featureList: {
        gap: 12,
        marginBottom: 24,
    },
    featureRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    iconBubble: {
        width: 34,
        height: 34,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    featureText: {
        flex: 1,
    },
    featureName: {
        fontSize: 14,
        fontWeight: '600',
    },
    featureDesc: {
        fontSize: 12,
        marginTop: 1,
    },
    buyButton: {
        borderRadius: 16,
        paddingVertical: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    buyText: {
        fontSize: 16,
        fontWeight: '800',
        color: '#000',
    },
    restoreButton: {
        alignItems: 'center',
        paddingVertical: 10,
        marginBottom: 10,
    },
    restoreText: {
        fontSize: 14,
        fontWeight: '500',
    },
    legal: {
        textAlign: 'center',
        fontSize: 11,
    },
});
