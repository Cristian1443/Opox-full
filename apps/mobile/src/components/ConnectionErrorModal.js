// Bloque 3 · Salud — Pop-up "No se pudo conectar" (estado 3.3 · timeout)
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';

// Color confirmado contra Figma sin equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
};

function AlertCircleIcon({ size = 90, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 185 185" fill="none">
            <Path
                d="M92.4995 175C138.063 175 175 138.063 175 92.5C175 46.9365 138.063 10 92.4995 10C46.936 10 9.99951 46.9365 9.99951 92.5C9.99951 138.063 46.936 175 92.4995 175Z"
                stroke={color}
                strokeWidth={15.32}
                strokeMiterlimit={10}
            />
            <Path d="M75.9995 42L84.2495 115H100.75L109 42H75.9995Z" fill={color} />
            <Path
                d="M106 138.5C106 131.044 99.9554 125 92.4995 125C85.0437 125 78.9995 131.044 78.9995 138.5C78.9995 145.956 85.0437 152 92.4995 152C99.9554 152 106 145.956 106 138.5Z"
                fill={color}
            />
        </Svg>
    );
}

export default function ConnectionErrorModal({ visible, deviceName = 'dispositivo', onRetry, onCancel }) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <AlertCircleIcon />
                    <Text style={styles.title}>No se pudo conectar</Text>
                    <Text style={styles.body}>
                        Comprueba que el Bluetooth está activo y el {deviceName} cerca y desbloqueado.
                    </Text>
                    <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={onRetry}>
                        <Text style={styles.ctaButtonText}>Reintentar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} activeOpacity={0.7} onPress={onCancel}>
                        <Text style={styles.cancelButtonText}>Cancelar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 348,
        backgroundColor: colors.white,
        borderWidth: 0.3,
        borderColor: FIGMA.cardBorder,
        paddingVertical: 32,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    title: {
        marginTop: 16,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    body: {
        marginTop: 8,
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 18,
    },
    ctaButton: {
        marginTop: 24,
        width: '100%',
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    cancelButton: {
        marginTop: 14,
        paddingVertical: 6,
    },
    cancelButtonText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 14,
        color: colors.textDark,
    },
});
