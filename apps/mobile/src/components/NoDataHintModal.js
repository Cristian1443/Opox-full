// Bloque 3 · Salud — Modal explicativo cuando una métrica de wearable no
// tiene datos. Mismo lenguaje visual que ConnectionSuccessModal (card
// blanca, esquinas 14, Poppins, borde suave morado). Sustituye al
// Alert.alert nativo que rompía la línea Figma.
import React from 'react';
import {
    Modal,
    View,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Text from './AppText';
import { colors, spacing } from '../theme';

const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.3)',
    subtitleMuted: 'rgba(65,41,80,0.6)',
    iconBgPurple: 'rgba(128,76,201,0.12)',
};

/**
 * @param {{
 *   visible: boolean,
 *   metricName?: string,       // "Ritmo cardíaco", "HRV", …
 *   onClose: () => void,
 *   onGuide: () => void,       // navegar al onboarding wearable
 * }} props
 */
export default function NoDataHintModal({ visible, metricName = 'Este dato', onClose, onGuide }) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <Ionicons name="watch-outline" size={38} color={colors.bannerPurple} />
                    </View>

                    <Text style={styles.title}>{metricName} sin datos</Text>

                    <Text style={styles.body}>
                        Este dato solo se puede medir con un reloj o pulsera
                        sincronizada con Health Connect. Sin sensor físico no hay
                        forma de calcularlo.
                    </Text>
                    <Text style={styles.bodySecondary}>
                        Si tienes uno, te guiamos paso a paso para conectarlo.
                    </Text>

                    <TouchableOpacity
                        style={styles.primary}
                        onPress={onGuide}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryText}>Ver cómo conectar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondary}
                        onPress={onClose}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.secondaryText}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 348,
        backgroundColor: colors.white,
        borderRadius: 14,
        borderWidth: 0.5,
        borderColor: FIGMA.cardBorder,
        paddingVertical: 28,
        paddingHorizontal: 24,
        alignItems: 'center',
    },
    iconWrap: {
        width: 74,
        height: 74,
        borderRadius: 37,
        backgroundColor: FIGMA.iconBgPurple,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 14,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    body: {
        fontFamily: 'Poppins-Light',
        fontSize: 13,
        lineHeight: 18,
        color: colors.textDark,
        textAlign: 'center',
    },
    bodySecondary: {
        marginTop: 8,
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        lineHeight: 17,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
    },
    primary: {
        marginTop: 20,
        alignSelf: 'stretch',
        height: 52,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
    secondary: {
        marginTop: 4,
        height: 44,
        alignSelf: 'stretch',
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: FIGMA.subtitleMuted,
    },
});
