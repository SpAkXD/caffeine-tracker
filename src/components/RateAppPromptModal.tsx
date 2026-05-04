import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';

type ThemeColors = typeof Colors.dark;

interface RateAppPromptModalProps {
    visible: boolean;
    colors: ThemeColors;
    totalDosesLogged: number;
    onRate: () => Promise<void>;
    onNotNow: () => void;
}

export const RateAppPromptModal: React.FC<RateAppPromptModalProps> = ({
    visible,
    colors,
    totalDosesLogged,
    onRate,
    onNotNow,
}) => {
    const [loading, setLoading] = React.useState(false);

    const handleRate = async () => {
        setLoading(true);
        try {
            await onRate();
        } finally {
            setLoading(false);
        }
        onNotNow();
    };

    const cardBg = colors.card;
    const borderCol = colors.border;

    return (
        <Modal
            animationType="fade"
            transparent
            visible={visible}
            onRequestClose={onNotNow}
        >
            <Pressable style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.65)' }]} onPress={onNotNow}>
                <Pressable
                    style={[styles.card, { backgroundColor: cardBg, borderColor: borderCol }]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <Text style={[styles.title, { color: colors.primary }]}>Enjoying Half-lifr?</Text>
                    <Text style={[styles.body, { color: colors.textSecondary }]}>
                        You've logged {totalDosesLogged} drinks. A quick rating on the store helps others find the app.
                    </Text>
                    <TouchableOpacity
                        style={[styles.primaryBtn, { backgroundColor: colors.primary + '22', borderColor: colors.primary }]}
                        onPress={handleRate}
                        disabled={loading}
                        activeOpacity={0.85}
                    >
                        {loading ? (
                            <ActivityIndicator color={colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="star" size={20} color={colors.primary} />
                                <Text style={[styles.primaryText, { color: colors.primary }]}>Rate the app</Text>
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.secondaryWrap} onPress={onNotNow} disabled={loading}>
                        <Text style={[styles.secondaryText, { color: colors.textSecondary }]}>Not now</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        maxWidth: 400,
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
        elevation: 12,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: 12,
        textAlign: 'center',
    },
    body: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 22,
        textAlign: 'center',
    },
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 14,
        borderRadius: 14,
        borderWidth: 1,
    },
    primaryText: {
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryWrap: {
        alignItems: 'center',
        marginTop: 14,
        paddingVertical: 8,
    },
    secondaryText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
