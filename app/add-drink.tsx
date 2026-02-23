import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Pressable, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { DrinkPresetCard } from '../src/components/DrinkPresetCard';
import { StyledButton } from '../src/components/StyledButton';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';

export default function AddDrinkScreen() {
    const router = useRouter();
    const addDose = useCaffeineStore(state => state.addDose);
    const theme = useCaffeineStore(state => state.theme);
    const colors = Colors[theme];

    const [customMg, setCustomMg] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCustomTime, setIsCustomTime] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [pendingDrink, setPendingDrink] = useState<{ name: string; mg: number } | null>(null);

    const PRESETS = [
        { name: 'Espresso', mg: 63 },
        { name: 'Coffee (8oz)', mg: 95 },
        { name: 'Matcha', mg: 70 },
        { name: 'Energy Drink', mg: 150 },
        { name: 'Cola', mg: 34 },
        { name: 'Double Shot', mg: 126 },
    ];

    const getTimestamp = () => {
        return selectedDate.getTime();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const showConfirmation = (name: string, mg: number) => {
        setPendingDrink({ name, mg });
        setSelectedDate(new Date());
        setIsCustomTime(false);
        setShowPicker(false);
        setModalVisible(true);
    };

    const handlePickerChange = (_event: DateTimePickerEvent, date?: Date) => {
        setShowPicker(Platform.OS === 'ios');
        if (date) {
            setSelectedDate(date);
        }
    };

    const handleConfirm = () => {
        if (pendingDrink) {
            addDose(pendingDrink.mg, getTimestamp());
            setModalVisible(false);
            setPendingDrink(null);
            router.back();
        }
    };

    const handleCancel = () => {
        setModalVisible(false);
        setPendingDrink(null);
    };

    const handleCustomAdd = () => {
        const mg = parseInt(customMg);
        if (isNaN(mg) || mg <= 0) {
            Alert.alert('Invalid Amount', 'Please enter a valid caffeine amount.');
            return;
        }
        showConfirmation('Custom', mg);
    };

    return (
        <View style={[styles.container, { backgroundColor: theme === 'dark' ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)' }]}>
            <BlurView intensity={80} tint={theme === 'dark' ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Add Caffeine</Text>
                <TouchableOpacity onPress={() => router.back()} style={[styles.closeButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.content}>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Quick Presets</Text>
                <View style={styles.grid}>
                    {PRESETS.map((preset) => (
                        <DrinkPresetCard
                            key={preset.name}
                            name={preset.name}
                            mg={preset.mg}
                            onPress={() => showConfirmation(preset.name, preset.mg)}
                        />
                    ))}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Custom Amount</Text>
                <View style={styles.customRow}>
                    <TextInput
                        style={[styles.input, {
                            color: colors.text,
                            backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                            borderColor: colors.border
                        }]}
                        placeholder="mg"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={customMg}
                        onChangeText={setCustomMg}
                    />
                    <StyledButton
                        title="Add"
                        onPress={handleCustomAdd}
                        style={styles.addButton}
                    />
                </View>

            </ScrollView>

            {/* Custom Confirmation Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={modalVisible}
                onRequestClose={handleCancel}
            >
                <Pressable style={styles.modalOverlay} onPress={handleCancel}>
                    <Pressable style={[styles.modalCard, {
                        backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7',
                    }]} onPress={() => { }}>
                        {/* Header */}
                        <Text style={[styles.modalTitle, { color: colors.text }]}>
                            Add {pendingDrink?.name}?
                        </Text>
                        <Text style={[styles.modalSubtext, { color: colors.textSecondary }]}>
                            Adding {pendingDrink?.mg}mg to your log.
                        </Text>

                        {/* Time Selection Chips */}
                        <Text style={[styles.modalSectionLabel, { color: colors.textSecondary }]}>
                            When did you drink it?
                        </Text>
                        <View style={styles.modalTimeRow}>
                            {/* Chip 1: Just Now */}
                            <TouchableOpacity
                                style={[
                                    styles.modalTimeChip,
                                    {
                                        backgroundColor: !isCustomTime
                                            ? colors.primary
                                            : 'rgba(255,255,255,0.1)',
                                        borderColor: !isCustomTime
                                            ? colors.primary
                                            : 'rgba(255,255,255,0.1)',
                                    },
                                ]}
                                onPress={() => {
                                    setIsCustomTime(false);
                                    setSelectedDate(new Date());
                                    setShowPicker(false);
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.modalTimeText,
                                        {
                                            color: !isCustomTime ? '#FFFFFF' : '#A1A1AA',
                                            fontWeight: !isCustomTime ? '700' : '600',
                                        },
                                    ]}
                                >
                                    Just Now
                                </Text>
                            </TouchableOpacity>

                            {/* Chip 2: Custom Time */}
                            <TouchableOpacity
                                style={[
                                    styles.modalTimeChip,
                                    {
                                        backgroundColor: isCustomTime
                                            ? colors.primary
                                            : 'rgba(255,255,255,0.1)',
                                        borderColor: isCustomTime
                                            ? colors.primary
                                            : 'rgba(255,255,255,0.1)',
                                    },
                                ]}
                                onPress={() => {
                                    setIsCustomTime(true);
                                    setShowPicker(true);
                                }}
                            >
                                <Text
                                    numberOfLines={1}
                                    style={[
                                        styles.modalTimeText,
                                        {
                                            color: isCustomTime ? '#FFFFFF' : '#A1A1AA',
                                            fontWeight: isCustomTime ? '700' : '600',
                                        },
                                    ]}
                                >
                                    {isCustomTime ? formatTime(selectedDate) : 'Pick Time'}
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {/* Native DateTimePicker */}
                        {showPicker && (
                            <DateTimePicker
                                value={selectedDate}
                                mode="time"
                                maximumDate={new Date()}
                                onChange={handlePickerChange}
                            />
                        )}

                        {/* Action Buttons */}
                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton, {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }]}
                                onPress={handleCancel}
                            >
                                <Text style={[styles.modalButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton, {
                                    backgroundColor: colors.primary,
                                }]}
                                onPress={handleConfirm}
                            >
                                <Text style={[styles.modalButtonText, { color: '#FFFFFF', fontWeight: '800' }]}>Confirm Add</Text>
                            </TouchableOpacity>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        marginTop: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 8,
        borderRadius: 20,
    },
    content: {
        padding: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginTop: 20,
        marginBottom: 10,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 0,
    },
    customRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 18,
        borderWidth: 1,
        marginRight: 10,
    },
    addButton: {
        minWidth: 100,
    },
    // Modal styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    modalCard: {
        width: '100%',
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
        width: '100%',
    },
    modalSubtext: {
        fontSize: 15,
        marginBottom: 20,
        opacity: 0.8,
        textAlign: 'center',
        width: '100%',
    },
    modalSectionLabel: {
        fontSize: 13,
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10,
        textAlign: 'center',
        width: '100%',
    },
    modalTimeRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
        gap: 12,
        width: '100%',
    },
    modalTimeChip: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalTimeText: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    modalActions: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    cancelButton: {},
    confirmButton: {},
    modalButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
});
