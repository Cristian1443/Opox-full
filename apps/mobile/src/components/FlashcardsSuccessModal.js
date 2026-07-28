import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

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
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.85)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 220,
                    useNativeDriver: true,
                }),
                Animated.spring(scaleAnim, {
                    toValue: 1,
                    tension: 60,
                    friction: 8,
                    useNativeDriver: true,
                }),
            ]).start();
        } else {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.85);
        }
    }, [visible]);

    return (
        <Modal
            transparent
            visible={visible}
            animationType="none"
            statusBarTranslucent
            onRequestClose={onClose}
        >
            <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
                {/* Área de toque fuera del card para cerrar */}
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={onClose}
                />

                <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }] }]}>
                    {/* Icono de éxito */}
                    <View style={styles.iconWrap}>
                        <Ionicons name="checkmark-circle" size={48} color={colors.success} />
                    </View>

                    <Text style={styles.title}>¡Mazo creado!</Text>

                    <Text style={styles.message}>
                        <Text style={styles.highlight}>{count}</Text> flashcards listas
                    </Text>

                    <Text style={styles.subtitle}>
                        Las hemos guardado en tu mazo de{' '}
                        <Text style={styles.highlight}>{mazoName}</Text>.
                    </Text>

                    <View style={styles.divider} />

                    {/* CTA primario */}
                    <TouchableOpacity
                        style={styles.primaryBtn}
                        onPress={onReviewNow}
                        activeOpacity={0.85}
                        accessibilityLabel="Repasar las flashcards ahora"
                    >
                        <Text style={styles.primaryBtnText}>Repasar ahora</Text>
                        <Ionicons name="play-circle" size={18} color="#fff" />
                    </TouchableOpacity>

                    {/* CTA secundario */}
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={onClose}
                        activeOpacity={0.7}
                        accessibilityLabel="Repasar más tarde"
                    >
                        <Text style={styles.secondaryBtnText}>Luego</Text>
                    </TouchableOpacity>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 27, 51, 0.55)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: colors.card,
        borderRadius: 24,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
        paddingBottom: spacing.md,
        alignItems: 'center',
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.2,
        shadowRadius: 24,
        elevation: 16,
    },

    // Icono
    iconWrap: {
        width: 76,
        height: 76,
        borderRadius: 38,
        backgroundColor: colors.successBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },

    // Texto
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.dark,
        marginBottom: 6,
        textAlign: 'center',
    },
    message: {
        fontSize: 15,
        color: colors.text,
        textAlign: 'center',
        marginBottom: 4,
    },
    highlight: {
        fontWeight: '800',
        color: colors.purple,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
        marginBottom: spacing.lg,
    },
    divider: {
        height: 1,
        width: '100%',
        backgroundColor: colors.separator,
        marginBottom: spacing.md,
    },

    // Botones
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.purple,
        borderRadius: 14,
        paddingVertical: 14,
        width: '100%',
        marginBottom: spacing.sm,
        shadowColor: colors.purple,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 13,
        width: '100%',
        borderRadius: 14,
        alignItems: 'center',
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    secondaryBtnText: {
        color: colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
    },
});
