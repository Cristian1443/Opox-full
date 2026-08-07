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
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

function changeTypeToDetailType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

const BOE_ACCENT = '#E2483D';

const TYPE_CFG = {
    critical: {
        badgeLabel: 'AFECTA A TU TEMARIO',
        badgeColor: BOE_ACCENT,
        badgeBg: '#FDEBE9',
        cardBorder: '#F5C6C0',
    },
    info: {
        badgeLabel: 'INFORMATIVO',
        badgeColor: '#007AFF',
        badgeBg: '#EBF4FF',
        cardBorder: '#BFDDFF',
    },
    review: {
        badgeLabel: 'REVISAR',
        badgeColor: '#BFA000',
        badgeBg: '#FFF9E6',
        cardBorder: '#F0DC80',
    },
};

const MOCK_DETAIL = {
    '1': {
        title: 'Art. 14 · Ley 39/2015',
        subtitle: 'Procedimiento Administrativo Común',
        type: 'critical',
        summary:
            'Se amplía el listado de sujetos obligados a relacionarse electrónicamente con la Administración, incluyendo a determinados profesionales antes exentos.',
        source: 'BOE núm. 142 · 13 jun 2026',
        date: 'Hoy, 10:41',
    },
    '2': {
        title: 'Nueva instrucción · Registro electrónico',
        subtitle: 'Ley 39/2015 — Capítulo III',
        type: 'info',
        summary:
            'La instrucción concreta los plazos de presentación telemática y establece el horario de cierre del registro electrónico los días inhábiles.',
        source: 'BOE núm. 141 · 12 jun 2026',
        date: 'Ayer, 14:30',
    },
    '3': {
        title: 'Corrección de errores · Ley 40/2015',
        subtitle: 'Régimen Jurídico del Sector Público',
        type: 'review',
        summary:
            'Corrección de errata tipográfica en el art. 3.2. Sin impacto sobre el contenido normativo ni sobre los tests existentes.',
        source: 'BOE núm. 140 · 12 jun 2026',
        date: '12 jun, 09:15',
    },
};

export default function BoeDetailScreen({ route, navigation }) {
    const { itemId = '1', type: routeType } = route.params ?? {};
    const mockDetail = MOCK_DETAIL[itemId] ?? MOCK_DETAIL['1'];

    const [apiDetail, setApiDetail] = useState(null);
    const [bookmarked, setBookmarked] = useState(mockDetail.type === 'critical' ? false : false);

    useEffect(() => {
        boeApi.getDetail(itemId).then(res => {
            if (res?.data) {
                const d = res.data;
                setApiDetail({
                    title: `${d.articulo} · ${d.shortTitle}`,
                    subtitle: d.regulationTitle,
                    type: changeTypeToDetailType(d.changeType),
                    summary: d.hint,
                    source: d.sourceDescription,
                    date: new Date(d.detectedAt).toLocaleDateString('es-ES'),
                });
                setBookmarked(d.isBookmarked);
            }
        }).catch(() => {});
    }, [itemId]);

    const detail = apiDetail ?? mockDetail;
    const type = routeType ?? detail.type;
    const cfg = TYPE_CFG[type] ?? TYPE_CFG.critical;

    function handleBookmarkToggle() {
        setBookmarked(b => !b);
        boeApi.toggleBookmark(itemId).catch(() => {});
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={BOE_ACCENT} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Cambio legal</Text>

                <TouchableOpacity
                    onPress={handleBookmarkToggle}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    accessibilityLabel={bookmarked ? 'Quitar de guardados' : 'Guardar cambio'}
                >
                    <Ionicons
                        name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                        size={22}
                        color={bookmarked ? BOE_ACCENT : colors.text}
                    />
                </TouchableOpacity>
            </View>

            {/* ── Contenido ───────────────────────────────────────────────────── */}
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Card de identificación del cambio */}
                <View style={[styles.identityCard, { borderColor: cfg.cardBorder }]}>
                    {/* Badge de impacto */}
                    <View style={[styles.badgePill, { backgroundColor: cfg.badgeBg }]}>
                        <Text style={[styles.badgeText, { color: cfg.badgeColor }]}>
                            {cfg.badgeLabel}
                        </Text>
                    </View>

                    <Text style={styles.identityTitle}>{detail.title}</Text>
                    <Text style={styles.identitySubtitle}>{detail.subtitle}</Text>
                </View>

                {/* Sección: Qué ha cambiado */}
                <Text style={styles.sectionLabel}>QUÉ HA CAMBIADO</Text>
                <Text style={styles.summaryText}>{detail.summary}</Text>

                {/* Sección: Publicado en */}
                <Text style={styles.sectionLabel}>PUBLICADO EN</Text>
                <View style={styles.sourceRow}>
                    <MaterialCommunityIcons
                        name="file-document-outline"
                        size={16}
                        color={colors.textSecondary}
                    />
                    <Text style={styles.sourceText}>{detail.source}</Text>
                </View>

                {/* ── CTAs — solo para cambios que afectan al banco de preguntas ─── */}
                {type !== 'review' && (
                    <View style={styles.ctas}>
                        <TouchableOpacity
                            style={styles.primaryBtn}
                            activeOpacity={0.82}
                            onPress={() =>
                                navigation.navigate('BoeComparison', {
                                    itemId,
                                    title: detail.title,
                                    subtitle: detail.subtitle,
                                })
                            }
                            accessibilityLabel="Ver comparativa antes y después"
                        >
                            <Text style={styles.primaryBtnText}>Ver comparativa</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.secondaryBtn}
                            activeOpacity={0.78}
                            onPress={() =>
                                navigation.navigate('BoeMiniTest', { itemId, title: detail.title })
                            }
                            accessibilityLabel="Mini-test para validar aprendizaje"
                        >
                            <Text style={styles.secondaryBtnText}>Mini-test</Text>
                        </TouchableOpacity>
                    </View>
                )}

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

    // ── Scroll ────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md + 4,
    },

    // ── Card de identidad ─────────────────────────────────────────
    identityCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1.5,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    badgePill: {
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 6,
        marginBottom: 10,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    identityTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        lineHeight: 28,
        marginBottom: 4,
    },
    identitySubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
        fontWeight: '500',
    },

    // ── Secciones ─────────────────────────────────────────────────
    sectionLabel: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    summaryText: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 23,
        marginBottom: spacing.sm,
    },
    sourceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 7,
    },
    sourceText: {
        fontSize: 14,
        color: colors.textSecondary,
    },

    // ── CTAs ──────────────────────────────────────────────────────
    ctas: {
        marginTop: spacing.xl + spacing.sm,
        gap: spacing.sm + 4,
    },
    primaryBtn: {
        backgroundColor: BOE_ACCENT,
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: BOE_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
    },
    primaryBtnText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.separator,
        backgroundColor: colors.card,
    },
    secondaryBtnText: {
        color: colors.text,
        fontSize: 17,
        fontWeight: '700',
    },
});
