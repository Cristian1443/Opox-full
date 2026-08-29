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

function changeTypeToDetailType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

// ─── 10.2 · Cambio legal · resumen del cambio ─────────────────────────────────
// Fiel al Figma (CambioLegalScreen.tsx). Mismo mapeo de categoría confirmado en
// 10.1 (BoeHomeScreen): critical=rojo/afecta, info=naranja/afecta, review=verde/informativa.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    bodyMuted: 'rgba(52, 58, 61, 0.7)',
    borderMuted: 'rgba(65, 41, 80, 0.3)',
};

const TYPE_CFG = {
    critical: { color: colors.statRed, bg: 'rgba(255, 38, 56, 0.06)', label: 'Afecta a tu temario' },
    info: { color: colors.accentOrange, bg: `${colors.accentOrange}0F`, label: 'Afecta a tu temario' },
    review: { color: colors.ctaGreen, bg: `${colors.ctaGreen}0F`, label: 'Informativa' },
};

const FILTER_TABS = [
    { key: 'temario', label: 'Mi temario' },
    { key: 'opo', label: 'Toda mi opo' },
    { key: 'guardados', label: 'Guardados' },
];

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

function BulletDot({ color }) {
    return <View style={[styles.bulletDot, { backgroundColor: color }]} />;
}

export default function BoeDetailScreen({ route, navigation }) {
    const { itemId = '1', type: routeType } = route.params ?? {};
    const mockDetail = MOCK_DETAIL[itemId] ?? MOCK_DETAIL['1'];

    const [apiDetail, setApiDetail] = useState(null);
    const [bookmarked, setBookmarked] = useState(false);
    // Filtro decorativo — mismo componente visual que Monitor BOE (10.1),
    // reutilizado tal cual por Figma. Sin acción funcional confirmada sobre
    // esta pantalla de detalle (no navega ni refiltra nada aquí).
    const [filterTab, setFilterTab] = useState('temario');

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
                        <Ionicons name="chevron-back" size={20} color={colors.textDark} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Cambio legal</Text>
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={handleBookmarkToggle}
                        accessibilityLabel={bookmarked ? 'Quitar de guardados' : 'Guardar cambio'}
                    >
                        <Ionicons
                            name={bookmarked ? 'bookmark' : 'bookmark-outline'}
                            size={18}
                            color={bookmarked ? colors.purple : FIGMA.subtitleMuted}
                        />
                    </TouchableOpacity>
                </View>

                {/* ── Filtro (decorativo, ver nota arriba) ───────────────────── */}
                <View style={styles.filterRow}>
                    {FILTER_TABS.map(tab => {
                        const isActive = filterTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.filterTab, isActive && styles.filterTabActive]}
                                onPress={() => setFilterTab(tab.key)}
                                accessibilityLabel={tab.label}
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[styles.filterTabText, isActive && styles.filterTabTextActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Tarjeta de alerta */}
                    <View style={[styles.alertCard, { borderColor: cfg.color, backgroundColor: cfg.bg }]}>
                        <Text style={[styles.alertTag, { color: cfg.color }]}>{cfg.label}</Text>
                        <Text style={styles.alertTitle}>{detail.title}</Text>
                        <Text style={styles.alertCategory}>{detail.subtitle}</Text>
                    </View>

                    {/* Qué ha cambiado */}
                    <View style={styles.sectionRow}>
                        <BulletDot color={colors.accentOrange} />
                        <Text style={styles.sectionLabel}>QUÉ HA CAMBIADO</Text>
                    </View>
                    <Text style={styles.sectionBody}>{detail.summary}</Text>

                    {/* Publicado en */}
                    <View style={[styles.sectionRow, styles.sectionSpacing]}>
                        <BulletDot color={colors.accentOrange} />
                        <Text style={styles.sectionLabel}>PUBLICADO EN:</Text>
                    </View>
                    <Text style={styles.sectionBody}>{detail.source}</Text>

                    {/* ── CTAs — solo para cambios que afectan al banco de preguntas ─── */}
                    {type !== 'review' && (
                        <View style={styles.buttonRow}>
                            <TouchableOpacity
                                style={styles.primaryButton}
                                activeOpacity={0.85}
                                onPress={() =>
                                    navigation.navigate('BoeComparison', {
                                        itemId,
                                        title: detail.title,
                                        subtitle: detail.subtitle,
                                    })
                                }
                                accessibilityLabel="Ver comparativa antes y después"
                            >
                                <Text style={styles.primaryButtonText}>Ver comparativa</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.secondaryButton}
                                activeOpacity={0.78}
                                onPress={() =>
                                    navigation.navigate('BoeMiniTest', { itemId, title: detail.title })
                                }
                                accessibilityLabel="Mini-test para validar aprendizaje"
                            >
                                <Text style={styles.secondaryButtonText}>Mini-test</Text>
                            </TouchableOpacity>
                        </View>
                    )}
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
        marginBottom: spacing.md,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    // ── Filtro ────────────────────────────────────────────────────
    filterRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    filterTab: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 16,
    },
    filterTabActive: {
        backgroundColor: colors.purple,
    },
    filterTabText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: FIGMA.subtitleMuted,
    },
    filterTabTextActive: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
    },

    // ── Scroll ────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.xl,
    },

    // ── Tarjeta de alerta ─────────────────────────────────────────
    alertCard: {
        borderWidth: 1,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.lg,
    },
    alertTag: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10.2,
        marginBottom: 6,
    },
    alertTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: colors.textDark,
    },
    alertCategory: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        marginTop: 2,
    },

    // ── Secciones ─────────────────────────────────────────────────
    sectionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.sm,
    },
    sectionSpacing: {
        marginTop: 20,
    },
    bulletDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.textDark,
    },
    sectionBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13.5,
        color: FIGMA.bodyMuted,
        lineHeight: 19,
    },

    // ── Botones ───────────────────────────────────────────────────
    buttonRow: {
        flexDirection: 'row',
        gap: spacing.sm + 4,
        marginTop: spacing.xl + spacing.sm,
    },
    primaryButton: {
        flex: 1,
        height: 61.3,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
    secondaryButton: {
        flex: 1,
        height: 61.3,
        borderRadius: 14.2,
        borderWidth: 1,
        borderColor: FIGMA.borderMuted,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.textDark,
    },
});
