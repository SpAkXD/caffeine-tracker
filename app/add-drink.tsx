import React, { useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Modal, Pressable, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { DrinkPresetCard } from '../src/components/DrinkPresetCard';
import { StyledButton } from '../src/components/StyledButton';
import { useCaffeineStore } from '../src/store/useCaffeineStore';
import { Colors } from '../src/constants/Colors';

const ITEM_HEIGHT = 45;
const VISIBLE_ITEMS = 3;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

interface WheelPickerProps {
    data: string[];
    selectedIndex: number;
    onIndexChange: (index: number) => void;
    textColor: string;
    secondaryColor: string;
    width?: number;
}

function WheelPicker({ data, selectedIndex, onIndexChange, textColor, secondaryColor, width = 60 }: WheelPickerProps) {
    const flatListRef = useRef<FlatList>(null);
    const isUserScrolling = useRef(false);

    useEffect(() => {
        if (!isUserScrolling.current && flatListRef.current) {
            flatListRef.current.scrollToOffset({
                offset: selectedIndex * ITEM_HEIGHT,
                animated: false,
            });
        }
    }, [selectedIndex]);

    const handleScrollEnd = useCallback(
        (event: NativeSyntheticEvent<NativeScrollEvent>) => {
            const offsetY = event.nativeEvent.contentOffset.y;
            const index = Math.round(offsetY / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(index, data.length - 1));
            isUserScrolling.current = false;
            onIndexChange(clampedIndex);
        },
        [data.length, onIndexChange]
    );

    const handleScrollBeginDrag = useCallback(() => {
        isUserScrolling.current = true;
    }, []);

    const renderItem = useCallback(
        ({ item, index }: { item: string; index: number }) => {
            const isSelected = index === selectedIndex;

            return (
                <View style={{ height: ITEM_HEIGHT, width, alignItems: 'center', justifyContent: 'center' }}>
                    <Text
                        style={{
                            color: isSelected ? textColor : secondaryColor,
                            fontSize: isSelected ? 24 : 16,
                            fontWeight: isSelected ? '700' : '400',
                            opacity: isSelected ? 1 : 0.35,
                            textAlign: 'center',
                        }}
                    >
                        {item}
                    </Text>
                </View>
            );
        },
        [selectedIndex, textColor, secondaryColor, width]
    );

    const keyExtractor = useCallback((_: string, i: number) => i.toString(), []);

    return (
        <View style={{ height: WHEEL_HEIGHT, width, overflow: 'hidden' }} pointerEvents="auto">
            <FlatList
                ref={flatListRef}
                data={data}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
                showsVerticalScrollIndicator={false}
                nestedScrollEnabled={true}
                scrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                onScrollBeginDrag={handleScrollBeginDrag}
                contentContainerStyle={{ paddingVertical: ITEM_HEIGHT }}
                getItemLayout={(_, index) => ({
                    length: ITEM_HEIGHT,
                    offset: ITEM_HEIGHT * index,
                    index,
                })}
            />
        </View>
    );
}

export default function AddDrinkScreen() {
    const router = useRouter();
    const addDose = useCaffeineStore(state => state.addDose);
    const theme = useCaffeineStore(state => state.theme);
    const use24HourFormat = useCaffeineStore(state => state.use24HourFormat);
    const colors = Colors[theme];

    const [customMg, setCustomMg] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [isCustomTime, setIsCustomTime] = useState(false);
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

    // Generate wheel data
    const hoursData = use24HourFormat
        ? Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'))
        : Array.from({ length: 12 }, (_, i) => (i + 1).toString());
    const minutesData = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));
    const amPmData = ['AM', 'PM'];

    // Derive selected indices from selectedDate
    const currentHour = selectedDate.getHours();
    const currentMinute = selectedDate.getMinutes();
    const hourIndex = use24HourFormat
        ? currentHour
        : (currentHour % 12 === 0 ? 11 : (currentHour % 12) - 1);
    const minuteIndex = currentMinute;
    const amPmIndex = currentHour >= 12 ? 1 : 0;

    const handleHourChange = useCallback((index: number) => {
        const newDate = new Date(selectedDate);
        let hour: number;
        if (use24HourFormat) {
            hour = index;
        } else {
            const display12 = index + 1; // 1-12
            const isPm = newDate.getHours() >= 12;
            if (isPm) {
                hour = display12 === 12 ? 12 : display12 + 12;
            } else {
                hour = display12 === 12 ? 0 : display12;
            }
        }
        newDate.setHours(hour);
        newDate.setSeconds(0, 0);
        const now = new Date();
        setSelectedDate(newDate.getTime() > now.getTime() ? now : newDate);
    }, [selectedDate, use24HourFormat]);

    const handleMinuteChange = useCallback((index: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMinutes(index);
        newDate.setSeconds(0, 0);
        const now = new Date();
        setSelectedDate(newDate.getTime() > now.getTime() ? now : newDate);
    }, [selectedDate]);

    const handleAmPmChange = useCallback((index: number) => {
        const newDate = new Date(selectedDate);
        const currentH = newDate.getHours();
        const currentlyPm = currentH >= 12;
        const wantPm = index === 1;
        if (wantPm && !currentlyPm) {
            newDate.setHours(currentH + 12);
        } else if (!wantPm && currentlyPm) {
            newDate.setHours(currentH - 12);
        }
        newDate.setSeconds(0, 0);
        const now = new Date();
        setSelectedDate(newDate.getTime() > now.getTime() ? now : newDate);
    }, [selectedDate]);

    const getTimestamp = () => {
        return selectedDate.getTime();
    };

    const formatTime = (date: Date) => {
        if (use24HourFormat) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
        }
        return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    };

    const showConfirmation = (name: string, mg: number) => {
        setPendingDrink({ name, mg });
        setSelectedDate(new Date());
        setIsCustomTime(false);
        setModalVisible(true);
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
                <View style={styles.modalOverlay}>
                    {/* Background dismiss layer — sibling to the card, NOT a parent */}
                    <Pressable style={StyleSheet.absoluteFill} onPress={handleCancel} />

                    {/* Card content — completely outside Pressable responder chain */}
                    <View
                        style={[styles.modalCard, {
                            backgroundColor: theme === 'dark' ? '#1C1C1E' : '#F2F2F7',
                        }]}
                    >
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

                        {/* Scroll Wheel Time Picker */}
                        {isCustomTime && (
                            <View
                                style={[styles.wheelContainer, {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                                }]}
                            >
                                {/* Selection indicator */}
                                <View style={[styles.wheelIndicator, {
                                    backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                                }]} />

                                <View style={styles.wheelRow}>
                                    <WheelPicker
                                        data={hoursData}
                                        selectedIndex={hourIndex}
                                        onIndexChange={handleHourChange}
                                        textColor={colors.text}
                                        secondaryColor={colors.textSecondary}
                                        width={use24HourFormat ? 60 : 50}
                                    />
                                    <Text style={[styles.wheelSeparator, { color: colors.text }]}>:</Text>
                                    <WheelPicker
                                        data={minutesData}
                                        selectedIndex={minuteIndex}
                                        onIndexChange={handleMinuteChange}
                                        textColor={colors.text}
                                        secondaryColor={colors.textSecondary}
                                        width={60}
                                    />
                                    {!use24HourFormat && (
                                        <WheelPicker
                                            data={amPmData}
                                            selectedIndex={amPmIndex}
                                            onIndexChange={handleAmPmChange}
                                            textColor={colors.text}
                                            secondaryColor={colors.textSecondary}
                                            width={50}
                                        />
                                    )}
                                </View>
                            </View>
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
                    </View>
                </View>
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
    // Scroll Wheel Picker styles
    wheelContainer: {
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 20,
        marginBottom: 24,
        position: 'relative',
        overflow: 'hidden',
    },
    wheelIndicator: {
        position: 'absolute',
        left: 12,
        right: 12,
        top: ITEM_HEIGHT + 12, // paddingVertical(12) + 1 item
        height: ITEM_HEIGHT,
        borderRadius: 8,
    },
    wheelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    wheelSeparator: {
        fontSize: 24,
        fontWeight: '700',
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
