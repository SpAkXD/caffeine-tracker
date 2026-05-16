import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    StyleSheet,
    Pressable,
    Alert,
    ScrollView,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { FEATURES } from '../config/featureFlags';
import { useReduceMotion } from '../hooks/useReduceMotion';
import { modalCardEntering } from '../constants/motion';
import { useCaffeineStore } from '../store/useCaffeineStore';
import { Colors } from '../constants/Colors';

interface CustomPresetEditorProps {
    visible: boolean;
    onClose: () => void;
}

export const CustomPresetEditor: React.FC<CustomPresetEditorProps> = ({ visible, onClose }) => {
    const reduceMotion = useReduceMotion();
    const theme = useCaffeineStore((s) => s.theme);
    const customPresets = useCaffeineStore((s) => s.customPresets);
    const addCustomPreset = useCaffeineStore((s) => s.addCustomPreset);
    const removeCustomPreset = useCaffeineStore((s) => s.removeCustomPreset);
    const colors = Colors[theme];

    const entering = FEATURES.UI_MOTION ? modalCardEntering(reduceMotion) : FadeIn.duration(1);

    const [name, setName] = useState('');
    const [mg, setMg] = useState('');

    const handleAdd = () => {
        const trimmed = name.trim();
        const mgNum = parseInt(mg, 10);
        if (!trimmed) { Alert.alert('Name required'); return; }
        if (isNaN(mgNum) || mgNum < 1 || mgNum > 1000) {
            Alert.alert('Enter a valid mg between 1 and 1000');
            return;
        }
        addCustomPreset(trimmed, mgNum);
        setName('');
        setMg('');
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
                        <Text style={[styles.title, { color: colors.primary }]}>My Drinks</Text>

                        {/* Existing presets */}
                        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
                            {customPresets.length === 0 && (
                                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                                    No custom drinks yet. Add one below.
                                </Text>
                            )}
                            {customPresets.map((p) => (
                                <View
                                    key={p.id}
                                    style={[
                                        styles.row,
                                        { borderBottomColor: colors.border },
                                    ]}
                                >
                                    <View style={styles.rowText}>
                                        <Text style={[styles.presetName, { color: colors.text }]}>{p.name}</Text>
                                        <Text style={[styles.presetMg, { color: colors.primary }]}>{p.mg} mg</Text>
                                    </View>
                                    <PressableScale
                                        onPress={() =>
                                            Alert.alert('Remove', `Remove "${p.name}"?`, [
                                                { text: 'Cancel', style: 'cancel' },
                                                { text: 'Remove', style: 'destructive', onPress: () => removeCustomPreset(p.id) },
                                            ])
                                        }
                                    >
                                        <Ionicons name="trash-outline" size={18} color={colors.accent} />
                                    </PressableScale>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Add new */}
                        <View style={styles.addRow}>
                            <TextInput
                                style={[
                                    styles.nameInput,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.primary + '11' },
                                ]}
                                placeholder="Name"
                                placeholderTextColor={colors.textSecondary}
                                value={name}
                                onChangeText={setName}
                                maxLength={24}
                            />
                            <TextInput
                                style={[
                                    styles.mgInput,
                                    { color: colors.text, borderColor: colors.border, backgroundColor: colors.primary + '11' },
                                ]}
                                placeholder="mg"
                                placeholderTextColor={colors.textSecondary}
                                value={mg}
                                onChangeText={setMg}
                                keyboardType="number-pad"
                                maxLength={4}
                            />
                            <PressableScale
                                style={[styles.addButton, { backgroundColor: colors.primary }]}
                                onPress={handleAdd}
                            >
                                <Ionicons name="add" size={20} color="#000" />
                            </PressableScale>
                        </View>

                        <PressableScale style={styles.closeButton} onPress={onClose}>
                            <Text style={[styles.closeText, { color: colors.textSecondary }]}>Done</Text>
                        </PressableScale>
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
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 16,
        textAlign: 'center',
    },
    list: {
        maxHeight: 200,
        marginBottom: 16,
    },
    empty: {
        textAlign: 'center',
        fontSize: 13,
        paddingVertical: 20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
    },
    rowText: {
        flex: 1,
    },
    presetName: {
        fontSize: 15,
        fontWeight: '600',
    },
    presetMg: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    addRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 12,
        alignItems: 'center',
    },
    nameInput: {
        flex: 1,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
    },
    mgInput: {
        width: 60,
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 10,
        fontSize: 14,
        textAlign: 'center',
    },
    addButton: {
        width: 42,
        height: 42,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeButton: {
        alignItems: 'center',
        paddingVertical: 10,
    },
    closeText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
