import React, { useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

export default function BoeUpdateSuccessScreen({ route, navigation }) {
    // articleRef: título corto del artículo (ej. "art. 14") pasado desde BoeMiniTestScreen
    const { articleRef = 'el artículo' } = route.params ?? {};

    const scale = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Entrada: crece hasta 0.8 con ease-out, luego spring a 1 (rebote suave)
        Animated.sequence([
            Animated.timing(scale, {
                toValue: 0.8,
                duration: 200,
                easing: Easing.out(Easing.ease),
                useNativeDriver: true,
            }),
            Animated.spring(scale, {
                toValue: 1,
                tension: 50,
                friction: 7,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <View style={styles.content}>
                {/* ── Icono animado con anillo decorativo ───────────────────── */}
                <Animated.View style={[styles.iconWrap, { transform: [{ scale }] }]}>
                    {/* Anillo exterior decorativo */}
                    <View style={styles.ring} />
                    {/* Círculo con sombra verde */}
                    <View style={styles.iconCircle}>
                        <Ionicons
                            name="checkmark-circle-outline"
                            size={96}
                            color={colors.success}
                        />
                    </View>
                </Animated.View>

                {/* ── Título ────────────────────────────────────────────────── */}
                <Text style={styles.title}>¡Temario al día!</Text>

                {/* ── Descripción con referencia al artículo ────────────────── */}
                <Text style={styles.description}>
                    {'Has asimilado el cambio del '}
                    <Text style={styles.highlight}>{articleRef}</Text>
                    {'. Tus tests ya usan la redacción vigente.'}
                </Text>

                {/* ── CTA principal ─────────────────────────────────────────── */}
                <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('BoeHome')}
                    accessibilityLabel="Volver al feed del Monitor BOE"
                >
                    <Text style={styles.primaryBtnText}>Volver al feed</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </TouchableOpacity>

                {/* ── CTA secundario: practicar con preguntas actualizadas ──── */}
                <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.78}
                    onPress={() => navigation.navigate('GeneratorConfig', { questionCount: 10 })}
                    accessibilityLabel="Practicar con preguntas actualizadas"
                >
                    <Ionicons name="barbell-outline" size={18} color={colors.success} />
                    <Text style={styles.secondaryBtnText}>Practicar con preguntas actualizadas</Text>
                </TouchableOpacity>

                {/* ── Hint ──────────────────────────────────────────────────── */}
                <Text style={styles.hint}>
                    Puedes seguir estudiando o revisar otros cambios.
                </Text>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },

    // ── Icono animado ─────────────────────────────────────────────
    iconWrap: {
        position: 'relative',
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    ring: {
        position: 'absolute',
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 2,
        borderColor: `${colors.success}30`, // 30% opacity
    },
    iconCircle: {
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: colors.successBg,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.28,
        shadowRadius: 16,
        elevation: 8,
    },

    // ── Textos ────────────────────────────────────────────────────
    title: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        lineHeight: 34,
        marginBottom: spacing.md,
    },
    description: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 300,
        marginBottom: spacing.xl + spacing.md,
    },
    highlight: {
        color: colors.success,
        fontWeight: '700',
    },

    // ── Botón principal ───────────────────────────────────────────
    primaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.success,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.xl,
        borderRadius: 16,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
        marginBottom: spacing.md,
    },
    primaryBtnText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 14,
        paddingHorizontal: spacing.lg,
        borderRadius: 16,
        borderWidth: 1.5,
        borderColor: colors.success,
        backgroundColor: '#F0FFF4',
        marginBottom: spacing.sm,
    },
    secondaryBtnText: {
        color: colors.success,
        fontSize: 15,
        fontWeight: '700',
    },

    // ── Hint ──────────────────────────────────────────────────────
    hint: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        opacity: 0.7,
    },
});
