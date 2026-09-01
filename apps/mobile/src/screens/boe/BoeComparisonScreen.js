import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

// ─── 10.3 · Antes/Después · comparativa de redacción ──────────────────────────
// Fiel al Figma (AntesDespuesScreen.tsx). El diff sigue siendo word-by-word
// real, precalculado por el backend (ver CLAUDE.md, boeDiff.ts) — solo cambia
// el tratamiento visual: sin tarjeta ni resaltado de fondo, solo tachado rojo /
// subrayado verde sobre texto corrido Poppins Light.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    infoBoxBg: 'rgba(159, 110, 228, 0.75)',
};

// ─── Mock de comparativa — Paso 2: boeApi.getComparison(itemId) ───────────────
const MOCK_COMPARISON = {
    '1': {
        title: 'Art. 14 · Ley 39/2015',
        subtitle: 'Procedimiento Administrativo Común',
        before: {
            segments: [
                { type: 'normal', content: '"Estarán obligados a relacionarse electrónicamente: las personas jurídicas, las entidades sin personalidad y ' },
                { type: 'deleted', content: 'quienes ejerzan una actividad profesional con colegiación obligatoria.' },
                { type: 'normal', content: '"' },
            ],
        },
        after: {
            segments: [
                { type: 'normal', content: '"Estarán obligados a relacionarse electrónicamente: las personas jurídicas, las entidades sin personalidad ' },
                { type: 'added', content: ', quienes ejerzan cualquier actividad profesional colegiada y los empleados públicos en el ejercicio de sus funciones.' },
                { type: 'normal', content: '"' },
            ],
        },
    },
    default: {
        title: 'Cambio legislativo',
        subtitle: 'Boletín Oficial del Estado',
        before: {
            segments: [
                { type: 'normal', content: 'Texto de la redacción anterior disponible tras conectar el backend.' },
            ],
        },
        after: {
            segments: [
                { type: 'normal', content: 'Texto de la redacción vigente disponible tras conectar el backend.' },
            ],
        },
    },
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Ícono de bombilla del cuadro informativo (ver hallazgo 1: nombrado "Capa_1",
// nodo huérfano en el árbol de capas de Figma — coincide visualmente por
// posición, la estructura de capas está rota).
function LightbulbIcon({ size = 22, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path
                d="M9 18H15M10 21H14M12 3C8.5 3 6 5.5 6 9C6 11.2 7.1 12.7 8.3 13.8C8.8 14.3 9 14.9 9 15.5V16H15V15.5C15 14.9 15.2 14.3 15.7 13.8C16.9 12.7 18 11.2 18 9C18 5.5 15.5 3 12 3Z"
                fill="none"
                stroke={color}
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </Svg>
    );
}

function BulletCircle({ color }) {
    return (
        <Svg width={10} height={10} viewBox="0 0 10 10">
            <Circle cx={5} cy={5} r={4} fill="none" stroke={color} strokeWidth={1.4} />
        </Svg>
    );
}

// ─── Componente de texto enriquecido inline ───────────────────────────────────
// Usa <Text> anidados dentro de un <Text> padre para que el texto fluya de
// forma natural (wrapping correcto en Android e iOS).
function InlineRichText({ segments, variant }) {
    return (
        <Text style={styles.quote}>
            {segments.map((seg, i) => {
                // El API devuelve { type, text }; el mock local usa { type, content }
                const txt = seg.text ?? seg.content ?? '';
                if (variant === 'before' && seg.type === 'deleted') {
                    return (
                        <Text key={i} style={styles.strikethrough}>
                            {txt}
                        </Text>
                    );
                }
                if (variant === 'after' && seg.type === 'added') {
                    return (
                        <Text key={i} style={styles.addedText}>
                            {txt}
                        </Text>
                    );
                }
                return <Text key={i}>{txt}</Text>;
            })}
        </Text>
    );
}

export default function BoeComparisonScreen({ route, navigation }) {
    const { itemId = '1', title, subtitle } = route.params ?? {};
    const mockData = MOCK_COMPARISON[itemId] ?? MOCK_COMPARISON.default;

    const [apiData, setApiData] = useState(null);

    useEffect(() => {
        boeApi.getComparison(itemId).then(res => {
            if (res?.data) {
                const d = res.data;
                const beforeBlock = d.blocks?.find(b => b.type === 'antes');
                const afterBlock = d.blocks?.find(b => b.type === 'despues');
                setApiData({
                    title: `${d.articulo} · ${d.regulationTitle}`,
                    subtitle: d.boeIdentifier,
                    before: { segments: beforeBlock?.segments ?? [] },
                    after: { segments: afterBlock?.segments ?? [] },
                });
            }
        }).catch(() => {});
    }, [itemId]);

    const data = apiData ?? mockData;
    const displayTitle = title ?? data.title;
    const displaySubtitle = subtitle ?? data.subtitle;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.screen}>
                {/* ── Header ──────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                        accessibilityLabel="Volver"
                    >
                        <ChevronLeftIcon />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>Antes/Después</Text>
                        <Text style={styles.headerSubtitle}>{displayTitle}</Text>
                    </View>
                    <View style={styles.iconButton} />
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* ── REDACCIÓN ANTERIOR ── */}
                    <View style={styles.sectionRow}>
                        <BulletCircle color={colors.statRed} />
                        <Text style={[styles.sectionLabel, { color: colors.statRed }]}>
                            REDACCIÓN ANTERIOR
                        </Text>
                    </View>
                    <InlineRichText segments={data.before.segments} variant="before" />

                    {/* ── REDACCIÓN VIGENTE ── */}
                    <View style={[styles.sectionRow, styles.sectionSpacing]}>
                        <BulletCircle color={colors.ctaGreen} />
                        <Text style={[styles.sectionLabel, { color: colors.ctaGreen }]}>
                            REDACCIÓN VIGENTE
                        </Text>
                    </View>
                    <InlineRichText segments={data.after.segments} variant="after" />

                    {/* ── Cuadro informativo (ver hallazgo 1) ── */}
                    <View style={styles.infoBox}>
                        <LightbulbIcon />
                        <Text style={styles.infoBoxText}>
                            La IA destaca en verde lo añadido y tacha en rojo lo derogado para que veas el cambio de un vistazo.
                        </Text>
                    </View>

                    <View style={{ height: spacing.xl }} />
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    screen: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },

    // ── Header ────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitles: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
    },
    headerSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        marginTop: 2,
    },

    // ── Scroll ────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },

    // ── Etiquetas de sección ──────────────────────────────────────
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: 10,
    },
    sectionSpacing: {
        marginTop: spacing.lg,
    },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
    },

    // ── Cita / texto enriquecido inline ───────────────────────────
    quote: {
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        color: colors.textDark,
        lineHeight: 22.4,
    },
    strikethrough: {
        color: colors.statRed,
        textDecorationLine: 'line-through',
    },
    addedText: {
        color: colors.ctaGreen,
        textDecorationLine: 'underline',
    },

    // ── Cuadro informativo ─────────────────────────────────────────
    infoBox: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm + 4,
        backgroundColor: FIGMA.infoBoxBg,
        borderRadius: 12,
        padding: spacing.md,
        marginTop: spacing.lg + spacing.sm,
    },
    infoBoxText: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: colors.white,
        lineHeight: 17,
    },
});
