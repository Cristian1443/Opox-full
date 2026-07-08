// Bloque 3 · Salud — Pop-up "Conectado correctamente" (estado 3.2 · ok)
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

export default function ConnectedSuccessModal({ visible, onClose, deviceName = 'Dispositivo' }) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContent}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="checkmark-circle" size={64} color={colors.success} />
                    </View>

                    <Text style={styles.title}>{deviceName} conectado</Text>

                    <Text style={styles.message}>
                        Ya recibimos tus datos en tiempo real. Te avisaremos si detectamos fatiga.
                    </Text>

                    <TouchableOpacity style={styles.button} onPress={onClose}>
                        <Text style={styles.buttonText}>Perfecto</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.85,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.md,
    },
    message: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: spacing.xl,
    },
    button: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
    },
});
