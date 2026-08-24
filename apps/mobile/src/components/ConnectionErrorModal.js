// Bloque 3 · Salud — Pop-up "Error de conexión" (estado 3.2 · err)
//
// NOTA: en el archivo de Figma esta capa está guardada como "POP-UP TE
// SALTASTE DIAS" (sugiere un nudge de racha/hábito), pero su contenido
// real es este modal de error de conexión Bluetooth. Se implementa el
// contenido real, no el nombre de la capa — si en algún momento se
// necesita el pop-up real de "racha/hábito", ese diseño no existe todavía.
import React from 'react';
import {
    Modal,
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
} from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

// Color confirmado contra Figma: naranja de advertencia ligeramente
// distinto al accentOrange del resto del sistema (#F77D27 vs #F69624).
const WARNING_ORANGE = '#F77D27';

function WarningIcon({ size = 73, color = WARNING_ORANGE }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 73 73">
            <Circle cx="36.5" cy="36.5" r="30" stroke={color} strokeWidth={6.8} fill="none" />
            <Rect x="32.5" y="18" width="8" height="26" rx="4" fill={color} />
            <Circle cx="36.5" cy="53" r="4.2" fill={color} />
        </Svg>
    );
}

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
                    <WarningIcon />

                    <Text style={styles.title}>No encontramos el dispositivo</Text>

                    <Text style={styles.message}>
                        Comprueba que el Bluetooth está activo y el reloj cerca y desbloqueado.
                    </Text>

                    <TouchableOpacity style={styles.retryButton} activeOpacity={0.85} onPress={onRetry}>
                        <Text style={styles.retryButtonText}>Reintentar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.cancelLink} activeOpacity={0.7} onPress={onClose}>
                        <Text style={styles.cancelLinkText}>Cancelar</Text>
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
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.lg,
    },
    modalContent: {
        width: width * 0.85,
        maxWidth: 348,
        backgroundColor: colors.white,
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
    message: {
        marginTop: 8,
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 18,
    },
    retryButton: {
        marginTop: 24,
        width: '100%',
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    retryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    cancelLink: {
        marginTop: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelLinkText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
    },
});
