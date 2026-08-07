import React from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── Rosco circular (full ring) de progreso ─────────────────────────────────
const RING_SIZE = 150;
const RING_STROKE = 14;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const BACK_BTN_SIZE = 32;

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

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.backIcon}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Test completado</Text>
            </View>

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
                        <Text style={styles.statLabel}>Aciertos</Text>
                    </View>
                    <View style={styles.statTile}>
                        <Text style={[styles.statValue, styles.statValueRed]}>{fallos}</Text>
                        <Text style={styles.statLabel}>Fallos</Text>
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
                    {strengths.map((label) => (
                        <ChipStrength key={label} label={label} />
                    ))}
                </View>

                {/* ── A reforzar ── */}
                <Text style={[styles.sectionLabel, styles.sectionLabelWeak]}>A REFORZAR:</Text>
                <View style={styles.chipsRow}>
                    {weaknesses.map((label) => (
                        <ChipWeakness key={label} label={label} />
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => navigation.navigate('Permissions')}
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

    // ── Header (back-chevron + título) ───────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
    },
    backBtn: {
        width: BACK_BTN_SIZE,
        height: BACK_BTN_SIZE,
        borderRadius: BACK_BTN_SIZE / 2,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backIcon: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.textDark,
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        marginRight: BACK_BTN_SIZE, // compensa el ancho del botón de back para centrar el título
        fontSize: 17,
        fontWeight: '700',
        color: colors.textDark,
    },

    // ScrollView
    scroll: {
        flex: 1,
    },
    body: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.md,
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
        fontSize: 32,
        fontWeight: '800',
        color: colors.textDark,
    },
    ringPercentSign: {
        fontSize: 22,
        fontWeight: '400',
        color: colors.textDark,
    },

    // ── "X de Y correctas" ───────────────────────
    correctLine: {
        fontSize: 15,
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
        backgroundColor: colors.textDark,
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
        fontSize: 20,
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
        fontSize: 11,
        color: colors.textDark,
        marginTop: 2,
    },

    // ── Section labels ───────────────────────────
    sectionLabel: {
        marginTop: spacing.md,
        fontSize: 11,
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
        gap: 6,
        marginTop: 6,
    },

    // Chip verde (puntos fuertes) — fill/stroke/texto #24bd90 (ctaGreen), fondo al 15% de opacidad
    chipStrength: {
        backgroundColor: 'rgba(36, 189, 144, 0.15)',
        borderWidth: 1,
        borderColor: colors.ctaGreen,
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 9,
    },
    chipStrengthText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.ctaGreen,
    },

    // Chip rojo (a reforzar) — fill/stroke/texto #ff2638, fondo al 15% de opacidad
    chipWeakness: {
        backgroundColor: 'rgba(255, 38, 56, 0.15)',
        borderWidth: 1,
        borderColor: colors.statRed,
        borderRadius: 10,
        paddingVertical: 4,
        paddingHorizontal: 9,
    },
    chipWeaknessText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.statRed,
    },

    // ── Botón CTA ────────────────────────────────
    btnPrimary: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 12,
        paddingVertical: 13,
        alignItems: 'center',
        marginTop: spacing.lg - 6,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 13.5,
        fontWeight: '700',
    },
});
