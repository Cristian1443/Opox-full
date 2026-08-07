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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

// Transforma un fragmento de texto plano (antes/después) en segments para InlineRichText.
// Sin diff word-by-word: muestra todo el bloque como 'normal'.
// El diff real requeriría una librería diff — para esta fase es suficiente.
function textToSegments(text) {
    return [{ type: 'normal', content: text || 'Sin texto disponible.' }];
}

// ─── Paleta específica de la comparativa (alineada con mockup 10.3) ──────────
const DELETED_COLOR = '#FF3B30';
const DELETED_BG = '#FFE5E5';
const ADDED_COLOR = '#34C759';
const ADDED_BG = '#E5FFE9';
const HINT_BG = '#F0ECFB';
const HINT_TEXT = '#5B3FA6';

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

// ─── Componente de texto enriquecido inline ───────────────────────────────────
// Usa <Text> anidados dentro de un <Text> padre para que el texto fluya de
// forma natural (wrapping correcto en Android e iOS).
function InlineRichText({ segments, variant }) {
    return (
        <Text style={styles.richParagraph}>
            {segments.map((seg, i) => {
                if (variant === 'before' && seg.type === 'deleted') {
                    return (
                        <Text
                            key={i}
                            style={[styles.segBase, styles.deletedSeg]}
                        >
                            {seg.content}
                        </Text>
                    );
                }
                if (variant === 'after' && seg.type === 'added') {
                    return (
                        <Text
                            key={i}
                            style={[styles.segBase, styles.addedSeg]}
                        >
                            {seg.content}
                        </Text>
                    );
                }
                return (
                    <Text key={i} style={styles.segBase}>
                        {seg.content}
                    </Text>
                );
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* ── Header ────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Antes / Después</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* ── Título del artículo (centrado, debajo del header) ─────────── */}
            <View style={styles.articleHeader}>
                <Text style={styles.articleTitle}>{displayTitle}</Text>
            </View>

            {/* ── Diff ──────────────────────────────────────────────────────── */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* ── REDACCIÓN ANTERIOR ── */}
                <View style={styles.blockLabel}>
                    <View style={[styles.labelDot, { backgroundColor: DELETED_COLOR }]} />
                    <Text style={[styles.labelText, { color: DELETED_COLOR }]}>
                        REDACCIÓN ANTERIOR
                    </Text>
                </View>
                <View style={[styles.textCard, { borderLeftColor: DELETED_COLOR }]}>
                    <InlineRichText segments={data.before.segments} variant="before" />
                </View>

                {/* ── REDACCIÓN VIGENTE ── */}
                <View style={[styles.blockLabel, { marginTop: spacing.lg }]}>
                    <View style={[styles.labelDot, { backgroundColor: ADDED_COLOR }]} />
                    <Text style={[styles.labelText, { color: ADDED_COLOR }]}>
                        REDACCIÓN VIGENTE
                    </Text>
                </View>
                <View style={[styles.textCard, { borderLeftColor: ADDED_COLOR }]}>
                    <InlineRichText segments={data.after.segments} variant="after" />
                </View>

                {/* ── Hint IA ── */}
                <View style={styles.hintCard}>
                    <Text style={styles.hintText}>
                        La IA destaca en verde lo añadido y tacha lo derogado para que veas el cambio de un vistazo.
                    </Text>
                </View>

                <View style={{ height: spacing.xl }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // ── Header ────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },

    // ── Título del artículo ───────────────────────────────────────
    articleHeader: {
        paddingHorizontal: spacing.md + 4,
        paddingVertical: spacing.md,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
        alignItems: 'center',
    },
    articleTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
    },

    // ── Scroll ────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md + 4,
    },

    // ── Etiquetas de sección ──────────────────────────────────────
    blockLabel: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: spacing.sm,
    },
    labelDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        flexShrink: 0,
    },
    labelText: {
        fontSize: 11,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },

    // ── Tarjeta de texto con borde izquierdo de color ─────────────
    textCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },

    // ── Texto enriquecido inline ──────────────────────────────────
    richParagraph: {
        fontSize: 15,
        lineHeight: 26,
        color: colors.text,
    },
    segBase: {
        fontSize: 15,
        lineHeight: 26,
        color: colors.text,
    },
    deletedSeg: {
        color: '#C0392B',
        textDecorationLine: 'line-through',
        backgroundColor: DELETED_BG,
    },
    addedSeg: {
        color: '#1A7A36',
        fontWeight: '700',
        backgroundColor: ADDED_BG,
    },

    // ── Hint IA ───────────────────────────────────────────────────
    hintCard: {
        marginTop: spacing.lg,
        backgroundColor: HINT_BG,
        borderRadius: 12,
        padding: spacing.md,
    },
    hintText: {
        fontSize: 13,
        color: HINT_TEXT,
        lineHeight: 20,
        fontWeight: '500',
    },
});
