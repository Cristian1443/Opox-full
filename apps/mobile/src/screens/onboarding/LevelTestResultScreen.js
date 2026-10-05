import React from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import AppHeader from '../../components/AppHeader';

// ─── Rosco circular (full ring) de progreso ─────────────────────────────────
const RING_SIZE = 190;
const RING_STROKE = 18;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function ScoreRing({ percent = 58 }) {
    const clamped = Math.max(0, Math.min(100, percent));
    const displayPercent = Math.round(clamped);
    const filled = (clamped / 100) * RING_CIRCUMFERENCE;

    return (
        <View style={styles.ringWrap}>
            <View style={styles.ringInner}>
                <Svg width={RING_SIZE} height={RING_SIZE} viewBox={`0 0 ${RING_SIZE} ${RING_SIZE}`}>
                    {/* Track (remanente) */}
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        stroke={colors.textDark}
                        strokeWidth={RING_STROKE}
                        fill="none"
                    />
                    {/* Fill de progreso */}
                    <Circle
                        cx={RING_SIZE / 2}
                        cy={RING_SIZE / 2}
                        r={RING_RADIUS}
                        stroke={colors.statGreen}
                        strokeWidth={RING_STROKE}
                        strokeLinecap="round"
                        strokeDasharray={`${filled} ${RING_CIRCUMFERENCE}`}
                        fill="none"
                        rotation={-90}
                        origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                    />
                </Svg>
                <View style={styles.ringLabel} pointerEvents="none">
                    <Text style={styles.ringPercent}>
                        {displayPercent}
                        <Text style={styles.ringPercentSign}>%</Text>
                    </Text>
                </View>
            </View>
        </View>
    );
}

// ─── Chip de punto fuerte (verde) ────────────────────────────────────────────
function ChipStrength({ label }) {
    return (
        <View style={styles.chipStrength}>
            <Text style={styles.chipStrengthText}>{label}</Text>
        </View>
    );
}

// ─── Chip a reforzar (rojo) ──────────────────────────────────────────────────
function ChipWeakness({ label }) {
    return (
        <View style={styles.chipWeakness}>
            <Text style={styles.chipWeaknessText}>{label}</Text>
        </View>
    );
}

// ─── Pantalla principal ──────────────────────────────────────────────────────
export default function LevelTestResultScreen({ navigation, route }) {
    // NOTA: `LevelTestInProgressScreen` todavía navega con
    // `navigation.replace('LevelTestResult')` sin parámetros (no calcula
    // aciertos/fallos/tiempo/fortalezas reales todavía). Hasta que ese flujo
    // exista, esta pantalla acepta todo por route.params con defaults de
    // wireframe para no romper la presentación.
    const {
        percent = 58,
        correct = 8,
        total = 20,
        level = 'Intermedio',
        aciertos = 15,
        fallos = 5,
        tiempo = '8:12',
        strengths = ['Constitución', 'Org. del Estado'],
        weaknesses = ['Ley 39/2015', 'Procedimiento'],
    } = route?.params || {};

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <AppHeader title="Test completado" onBack={() => navigation.goBack()} />

            {/* Cuerpo scrollable */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
            >
                {/* Rosco circular */}
                <ScoreRing percent={percent} />

                {/* Aciertos de total */}
                <Text style={styles.correctLine}>{correct} de {total} correctas</Text>

                {/* Nivel + descripción */}
                <Text style={styles.levelLine}>
                    Nivel <Text style={styles.levelBold}>{String(level).toUpperCase()}</Text>. Buen punto de partida.
                </Text>

                <View style={styles.separator} />

                {/* ── Estadísticas ── */}
                <View style={styles.statsRow}>
                    <View style={styles.statTile}>
                        <Text style={[styles.statValue, styles.statValueGreen]}>{aciertos}</Text>
                        <Text style={[styles.statLabel, styles.statValueGreen]}>Aciertos</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={[styles.statValue, styles.statValueRed]}>{fallos}</Text>
                        <Text style={[styles.statLabel, styles.statValueRed]}>Fallos</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={[styles.statValue, styles.statValueDark]}>{tiempo}</Text>
                        <Text style={styles.statLabel}>Tiempo</Text>
                    </View>
                </View>

                <View style={styles.separator} />

                {/* ── Puntos fuertes ── */}
                <Text style={styles.sectionLabel}>PUNTOS FUERTES:</Text>
                <View style={styles.chipsRow}>
                    {strengths.map((label, i) => (
                        <ChipStrength key={`${label}-${i}`} label={label} />
                    ))}
                </View>

                {/* ── A reforzar ── */}
                <Text style={[styles.sectionLabel, styles.sectionLabelWeak]}>A REFORZAR:</Text>
                <View style={styles.chipsRow}>
                    {weaknesses.map((label, i) => (
                        <ChipWeakness key={`${label}-${i}`} label={label} />
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigation.replace('Permissions')}
                    activeOpacity={0.85}
                >
                    <Text style={styles.btnPrimaryText}>Crear mi plan de estudio</Text>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── Estilos ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },

    // ScrollView
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },

    // ── Rosco ────────────────────────────────────
    ringWrap: {
        alignItems: 'center',
        paddingVertical: spacing.sm,
    },
    ringInner: {
        width: RING_SIZE,
        height: RING_SIZE,
    },
    ringLabel: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ringPercent: {
        fontSize: 46,
        fontWeight: '600',
        color: colors.textDark,
    },
    ringPercentSign: {
        fontSize: 28,
        fontWeight: '400',
        color: colors.textDark,
    },

    // ── "X de Y correctas" ───────────────────────
    correctLine: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.sm,
    },

    // ── Nivel line ───────────────────────────────
    levelLine: {
        fontSize: 12.5,
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.xs,
    },
    levelBold: {
        fontWeight: '700',
        color: colors.textDark,
    },

    // ── Separador ────────────────────────────────
    separator: {
        height: 1,
        backgroundColor: 'rgba(65, 41, 80, 0.15)',
        marginVertical: spacing.md,
    },

    // ── Estadísticas ─────────────────────────────
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    statTile: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 28,
        fontWeight: '700',
    },
    statValueGreen: {
        color: colors.statGreen,
    },
    statValueRed: {
        color: colors.statRed,
    },
    statValueDark: {
        color: colors.textDark,
    },
    statLabel: {
        fontSize: 15,
        color: colors.textDark,
        marginTop: 2,
    },

    // ── Section labels ───────────────────────────
    sectionLabel: {
        marginTop: spacing.md,
        fontSize: 15,
        fontWeight: '700',
        color: colors.textDark,
    },
    sectionLabelWeak: {
        marginTop: spacing.sm + spacing.xs,
    },

    // ── Chips row ────────────────────────────────
    chipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
        marginTop: 10,
        paddingLeft: spacing.sm,
    },

    // Chip verde (puntos fuertes) — fill/stroke/texto #24bd90 (ctaGreen), fondo al 15% de opacidad
    chipStrength: {
        backgroundColor: 'rgba(36, 189, 144, 0.15)',
        borderWidth: 1,
        borderColor: colors.ctaGreen,
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 14,
    },
    chipStrengthText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.ctaGreen,
    },

    // Chip rojo (a reforzar) — fill/stroke/texto #ff2638, fondo al 15% de opacidad
    chipWeakness: {
        backgroundColor: 'rgba(255, 38, 56, 0.15)',
        borderWidth: 1,
        borderColor: colors.statRed,
        borderRadius: 6,
        paddingVertical: 5,
        paddingHorizontal: 14,
    },
    chipWeaknessText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.statRed,
    },

    // ── Botón CTA — mismo formato Figma que el del test (centrado, alto) ──
    btnPrimary: {
        alignSelf: 'center',
        width: '78%',
        backgroundColor: colors.ctaGreen,
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: spacing.lg + 4,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '600',
    },
});
