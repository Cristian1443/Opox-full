import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Animated,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

// ─── 9.3 · ok · Apuntes digitalizados ────────────────────────────────────────
// Se muestra al completar el análisis IA de un apunte. Da al usuario dos rutas:
//   · Hacer test ahora → generar test con las preguntas recién creadas.
//   · Ver documento    → abrir NoteDetail para inspeccionar el apunte digitalizado.

const NOTES_ACCENT = '#2563EB';
const NOTES_ACCENT_BG = '#EFF6FF';
const SUCCESS = '#10B981';
const SUCCESS_BG = '#D1FAE5';

export default function NotesDigitizedModal({
    visible,
    questionsCount = 0,
    pagesCount = 0,
    onStartTest,
    onViewDocument,
    onRequestClose,
}) {
    const fade = useRef(new Animated.Value(0)).current;
    const translate = useRef(new Animated.Value(24)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
                Animated.spring(translate, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
            ]).start();
        } else {
            fade.setValue(0);
            translate.setValue(24);
        }
    }, [visible]);

    const dismiss = onRequestClose ?? onViewDocument;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            statusBarTranslucent
            onRequestClose={dismiss}
        >
            <Animated.View style={[styles.overlay, { opacity: fade }]}>
                <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    onPress={dismiss}
                />
                <Animated.View
                    style={[
                        styles.card,
                        { transform: [{ translateY: translate }] },
                    ]}
                >
                    <View style={styles.iconWrap}>
                        <Ionicons name="checkmark-circle" size={44} color={SUCCESS} />
                    </View>

                    <Text style={styles.title}>Apuntes digitalizados</Text>

                    <Text style={styles.description}>
                        Hemos creado{' '}
                        <Text style={styles.descriptionStrong}>{questionsCount} preguntas</Text>
                        {' '}a partir de tus {pagesCount} {pagesCount === 1 ? 'página' : 'páginas'}.
                    </Text>

                    <View style={styles.statsBox}>
                        <Text style={styles.statsText}>
                            {pagesCount} {pagesCount === 1 ? 'página procesada' : 'páginas procesadas'}
                        </Text>
                        <Text style={styles.statsDetail}>
                            Banco de preguntas listo para usar
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.btnPrimary}
                        onPress={onStartTest}
                        activeOpacity={0.85}
                        accessibilityLabel="Hacer test ahora"
                        accessibilityRole="button"
                    >
                        <Ionicons name="checkbox-outline" size={18} color={colors.white} />
                        <Text style={styles.btnPrimaryText}>Hacer test ahora</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.btnSecondary}
                        onPress={onViewDocument}
                        activeOpacity={0.75}
                        accessibilityLabel="Ver documento"
                        accessibilityRole="button"
                    >
                        <Ionicons name="document-text-outline" size={18} color={colors.dark} />
                        <Text style={styles.btnSecondaryText}>Ver documento</Text>
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
        paddingHorizontal: 24,
    },
    card: {
        width: '100%',
        maxWidth: 340,
        backgroundColor: colors.card,
        borderRadius: 20,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg + 4,
        paddingBottom: spacing.md + 4,
        alignItems: 'stretch',
        shadowColor: '#0F1B33',
        shadowOffset: { width: 0, height: 20 },
        shadowOpacity: 0.2,
        shadowRadius: 28,
        elevation: 20,
    },
    iconWrap: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: SUCCESS_BG,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
        marginBottom: spacing.sm + 4,
        lineHeight: 26,
    },
    description: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.lg,
    },
    descriptionStrong: {
        fontWeight: '700',
        color: colors.dark,
    },
    statsBox: {
        backgroundColor: NOTES_ACCENT_BG,
        borderRadius: 12,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.md,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    statsText: {
        fontSize: 14,
        fontWeight: '700',
        color: NOTES_ACCENT,
        marginBottom: 4,
    },
    statsDetail: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: NOTES_ACCENT,
        borderRadius: 12,
        paddingVertical: 15,
        marginBottom: spacing.sm + 4,
        shadowColor: NOTES_ACCENT,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '700',
    },
    btnSecondary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: 12,
        paddingVertical: 15,
    },
    btnSecondaryText: {
        color: colors.dark,
        fontSize: 15,
        fontWeight: '700',
    },
});
