import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../theme';

// Colores confirmados contra Figma (frame FLASHCARDS CREADAS, Bloque 8)
// sin equivalente exacto en theme.js. Mismo patrón de overlay + tarjeta
// blanca que los pop-ups del Bloque 4.
const FIGMA = {
    overlay: '#000000',
    cardBorder: 'rgba(65,41,80,0.3)',
};

function ThumbsUpIcon({ width = 58, height = 57, color = colors.accentOrange }) {
    return (
        <Svg width={width} height={height} viewBox="0 0 58 57">
            <Path d="M8 24H15V52H8C6 52 4 50 4 48V28C4 26 6 24 8 24Z" fill={color} />
            <Path
                d="M20 24L30 4C32 4 36 6 36 11V20H49C52 20 54 23 53 26L47 47C46 50 44 52 41 52H20V24Z"
                fill="none"
                stroke={color}
                strokeWidth={4}
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// ─── Pop-up · Flashcards creadas (8.2 · ok) ──────────────────────────────────
// Modal de éxito que aparece al terminar la generación de un mazo.
// - onReviewNow: navega al visor de flashcards.
// - onClose: cierra sin repasar (el mazo queda guardado).
export default function FlashcardsSuccessModal({
    visible,
    onClose,
    onReviewNow,
    mazoName = 'Constitución',
    count = 12,
}) {
    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />

                <View style={styles.card}>
                    <View style={styles.iconWrap}>
                        <ThumbsUpIcon />
                    </View>

                    <Text style={styles.title}>{count} flashcards listas</Text>
                    <Text style={styles.subtitle}>Las hemos guardado en tu mazo de {mazoName}.</Text>

                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onReviewNow}
                        activeOpacity={0.85}
                        accessibilityLabel="Repasar las flashcards ahora"
                    >
                        <Text style={styles.primaryBtnText}>Repasar ahora</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={onClose}
                        activeOpacity={0.6}
                        accessibilityLabel="Repasar más tarde"
                    >
                        <Text style={styles.secondaryLink}>Luego</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: FIGMA.overlay,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 27,
    },
    card: {
        width: 348,
        backgroundColor: colors.white,
        borderRadius: 24,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        alignItems: 'center',
        paddingVertical: 32,
        paddingHorizontal: 28,
    },
    iconWrap: {
        marginBottom: spacing.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 16.6,
        marginBottom: spacing.lg,
    },
    primaryBtn: {
        width: 322,
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    secondaryLink: {
        marginTop: 16,
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
    },
});
