import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../theme';

// ─── Bloque 1 · Acceso — Pop-up "Ese email ya tiene cuenta" (1.2 · err) ──────
// Figma (elDJ7bHPEsMt5MMlSJ4BcI, frame "ERROR EMAIL", node 2349:820).
// Se muestra cuando authApi.register() devuelve error.code === 'auth/email-already-registered'
// (ver RegistroScreen.js). Modal propio (no AlertCardModal) porque Figma pide el CTA
// secundario "Usar otro email" en morado de marca (#7241B8 = colors.purple) en vez
// del estilo por defecto de AlertCardModal, y no lleva icono.
export default function EmailAlreadyRegisteredModal({
    visible,
    email,
    onGoToLogin,
    onUseAnotherEmail,
}) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onUseAnotherEmail}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <Text style={styles.title}>Ese email ya tiene cuenta</Text>
                    <Text style={styles.body}>
                        Parece que ya te registraste con{' '}
                        <Text style={styles.bodyEmail}>{email}</Text>
                        . ¿Quieres iniciar sesión?
                    </Text>

                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={onGoToLogin}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>Ir a iniciar sesión</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        onPress={onUseAnotherEmail}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryButtonText}>Usar otro email</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 28,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(65, 41, 80, 0.3)',
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 19,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    body: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
        opacity: 0.5,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 22,
    },
    bodyEmail: {
        fontFamily: 'Poppins-SemiBold',
    },
    primaryButton: {
        width: '100%',
        height: 58,
        backgroundColor: colors.purple,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
    },
    primaryButtonText: {
        color: colors.white,
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
    secondaryButton: {
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        color: colors.purple,
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
    },
});
