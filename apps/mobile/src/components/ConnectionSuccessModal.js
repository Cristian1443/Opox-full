// Bloque 3 · Salud — Pop-up "Conectado correctamente" (estado 3.3 · ok)
import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';

// Color confirmado contra Figma sin equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
};

function CheckIcon({ width = 107, height = 70, color = colors.ctaGreen }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 107 70">
            <Path
                d="M8 34L40 62L99 8"
                stroke={color}
                strokeWidth={14}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

export default function ConnectionSuccessModal({ visible, deviceName = 'dispositivo', onClose }) {
    return (
        <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <CheckIcon />
                    <Text style={styles.title}>{deviceName} conectado</Text>
                    <Text style={styles.body}>
                        Ya recibimos tus datos en tiempo real. Te avisaremos si detectamos fatiga.
                    </Text>
                    <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={onClose}>
                        <Text style={styles.ctaButtonText}>Perfecto</Text>
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
});
