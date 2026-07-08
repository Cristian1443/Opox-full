// Bloque 3 · Salud — Pop-up "Error de conexión" (estado 3.2 · err)
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

export default function ConnectionErrorModal({ visible, onClose, onRetry }) {
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
                        <Ionicons name="alert-circle" size={48} color={colors.error} />
                    </View>

                    <Text style={styles.title}>No encontramos el dispositivo</Text>

                    <Text style={styles.message}>
                        Comprueba que el Bluetooth está activo y el reloj cerca y desbloqueado.
                    </Text>

                    <View style={styles.buttonContainer}>
                        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                            <Text style={styles.retryButtonText}>Reintentar</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.cancelLink} onPress={onClose}>
                            <Text style={styles.cancelLinkText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.errorBg,
        justifyContent: 'center',
        alignItems: 'center',
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
    buttonContainer: {
        width: '100%',
        gap: spacing.sm,
    },
    retryButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '700',
    },
    cancelLink: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelLinkText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
