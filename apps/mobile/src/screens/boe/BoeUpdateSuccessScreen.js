import React from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 10.5 · Actualización al día · éxito tras mini-test ───────────────────────
// Fiel al Figma (MonitorBoeModalesScreen.tsx → TemarioAlDiaModal, "ACTUALIZACION
// AL DIA"). El TSX de referencia lo compone como Modal solo como convención de
// previsualización (mismo patrón que FactoriaModalesScreen de Bloque 9); en la
// app real esta es una pantalla de navegación de pleno derecho a la que se
// llega tras terminar el mini-test — se conserva como pantalla completa en
// vez de encogerla a un popup, ya que es el cierre natural de esa sesión.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
};

// Ícono confirmado en Figma: círculo + check verde, sin círculo de fondo
// adicional detrás (mismo lenguaje visual que NotesDigitizedModal, Bloque 9).
function SuccessCheckIcon({ size = 64, color = colors.ctaGreen }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 48 48">
            <Circle cx={24} cy={24} r={22} stroke={color} strokeWidth={3} fill="none" />
            <Path d="M14 24.5L20.5 31L34 16.5" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function BoeUpdateSuccessScreen({ route, navigation }) {
    // articleRef: título corto del artículo (ej. "art. 14") pasado desde BoeMiniTestScreen
    const { articleRef = 'el artículo' } = route.params ?? {};

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.content}>
                <SuccessCheckIcon />

                <Text style={styles.title}>¡Temario al día!</Text>

                <Text style={styles.subtitle}>
                    {`Has asimilado el cambio del ${articleRef}. Tus tests ya usan la redacción vigente.`}
                </Text>

                <TouchableOpacity
                    style={styles.primaryBtn}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('BoeHome')}
                    accessibilityLabel="Volver al feed del Monitor BOE"
                >
                    <Text style={styles.primaryBtnText}>Volver al feed</Text>
                </TouchableOpacity>

                {/* ── CTA secundario: practicar con preguntas actualizadas ──── */}
                <TouchableOpacity
                    style={styles.secondaryBtn}
                    activeOpacity={0.78}
                    onPress={() => navigation.navigate('GeneratorConfig', { questionCount: 10 })}
                    accessibilityLabel="Practicar con preguntas actualizadas"
                >
                    <Ionicons name="barbell-outline" size={18} color={colors.ctaGreen} />
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
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: colors.textDark,
        textAlign: 'center',
        lineHeight: 19,
        maxWidth: 320,
        marginTop: spacing.sm,
    },
    primaryBtn: {
        width: '100%',
        maxWidth: 322,
        height: 61.3,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    primaryBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        width: '100%',
        maxWidth: 322,
        paddingVertical: 14,
        borderRadius: 14.2,
        borderWidth: 1,
        borderColor: colors.ctaGreen,
        marginTop: spacing.sm,
    },
    secondaryBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.ctaGreen,
    },

    // ── Hint ──────────────────────────────────────────────────────
    hint: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
});
