import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';

interface InfoPopupModalProps {
    visible: boolean;
    title: string;
    description: string;
    onClose: () => void;
}

export const InfoPopupModal: React.FC<InfoPopupModalProps> = ({
    visible,
    title,
    description,
    onClose,
}) => {
    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.card} onPress={() => { }}>
                    <Text style={styles.title}>{title}</Text>
                    <Text style={styles.description}>{description}</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>Close</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 30,
    },
    card: {
        width: '100%',
        backgroundColor: '#1C1C1E',
        borderRadius: 20,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(0, 240, 255, 0.15)',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#00F0FF',
        marginBottom: 14,
    },
    description: {
        fontSize: 15,
        color: 'rgba(255, 255, 255, 0.85)',
        lineHeight: 22,
        marginBottom: 24,
    },
    closeButton: {
        alignSelf: 'center',
        paddingVertical: 12,
        paddingHorizontal: 40,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 240, 255, 0.15)',
    },
    closeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#00F0FF',
    },
});
