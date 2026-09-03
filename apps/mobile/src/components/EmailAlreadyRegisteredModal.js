import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

// Ruta exacta exportada de Figma (icono "ERROR EMAIL", 125×93 — sobre).
function EmailIcon({ size = 40, color = colors.textDark }) {
    return (
        <Svg width={size} height={size * (93 / 125)} viewBox="0 0 125 93" fill="none" style={{ marginBottom: 14 }}>
            <Path d="M114.48 92.07H10.41C7.65083 92.07 5.00452 90.9746 3.05255 89.0245C1.10059 87.0744 0.0026505 84.4292 0 81.67V10.41C0.00264757 7.64991 1.10026 5.00362 3.05194 3.05194C5.00362 1.10026 7.64991 0.00264757 10.41 0L114.48 0C117.24 0.00264757 119.886 1.10026 121.838 3.05194C123.79 5.00362 124.887 7.64991 124.89 10.41V81.67C124.887 84.4292 123.789 87.0744 121.837 89.0245C119.885 90.9746 117.239 92.07 114.48 92.07ZM10.41 6.94C9.4897 6.94 8.60709 7.30559 7.95634 7.95634C7.30559 8.60709 6.94 9.4897 6.94 10.41V81.67C6.94 82.5903 7.30559 83.4729 7.95634 84.1237C8.60709 84.7744 9.4897 85.14 10.41 85.14H114.48C114.94 85.1453 115.396 85.0595 115.822 84.8876C116.248 84.7157 116.636 84.4611 116.963 84.1385C117.29 83.8159 117.55 83.4316 117.728 83.008C117.906 82.5843 117.999 82.1295 118 81.67V10.41C117.997 9.49051 117.631 8.60943 116.981 7.95925C116.331 7.30907 115.449 6.94264 114.53 6.94H10.41Z" fill={color} />
            <Path d="M62.4399 59C61.6187 58.9963 60.8252 58.7023 60.1999 58.17L2.99988 9.57996C2.59962 9.30611 2.2612 8.9514 2.00646 8.5387C1.75173 8.126 1.58633 7.66449 1.52094 7.18394C1.45555 6.70338 1.49163 6.21445 1.62683 5.7487C1.76204 5.28294 1.99338 4.8507 2.30593 4.47986C2.61848 4.10902 3.00529 3.80781 3.44141 3.59567C3.87754 3.38353 4.35329 3.26516 4.83798 3.24821C5.32267 3.23126 5.80552 3.3161 6.2554 3.49726C6.70528 3.67841 7.11219 3.95186 7.44988 4.29996L62.4399 51L117.44 4.33996C117.782 4.01724 118.187 3.76755 118.629 3.60608C119.071 3.44461 119.541 3.37472 120.011 3.40068C120.481 3.42664 120.941 3.5479 121.362 3.75708C121.784 3.96626 122.158 4.25899 122.463 4.61748C122.768 4.97596 122.997 5.39271 123.135 5.84237C123.274 6.29203 123.32 6.76522 123.27 7.23314C123.22 7.70107 123.076 8.15397 122.845 8.56429C122.615 8.97461 122.303 9.33378 121.93 9.61996L64.6899 58.15C64.0648 58.6917 63.2671 58.9931 62.4399 59Z" fill={color} />
        </Svg>
    );
}

// ─── Bloque 1 · Acceso — Pop-up "Ese email ya tiene cuenta" (1.2 · err) ──────
// Figma (elDJ7bHPEsMt5MMlSJ4BcI, frame "ERROR EMAIL", node 2349:820).
// Se muestra cuando authApi.register() devuelve error.code === 'auth/email-already-registered'
// (ver RegistroScreen.js). Modal propio (no AlertCardModal) porque Figma pide el CTA
// secundario "Usar otro email" en morado de marca (#7241B8 = colors.purple) en vez
// del estilo por defecto de AlertCardModal.
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
                    <EmailIcon />
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
