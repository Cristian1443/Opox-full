import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
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

function changeTypeToFeedType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

function formatDetectedAt(iso) {
    const d = new Date(iso);
    return d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// ─── Tokens de color Bloque 10 · Monitor BOE ──────────────────────────────────
// Acento rojo alineado con el nudge BOE del Dashboard (NUDGE_VISUALS.boe → #E2483D).
const BOE_ACCENT = '#E2483D';
const BOE_ACCENT_BG = '#FDEBE9';

// Configuración visual por tipo de alerta
const TYPE_CFG = {
    critical: {
        borderColor: '#FF3B30',
        badgeLabel: 'AFECTA A TU TEMA',
        badgeColor: '#FF3B30',
        badgeBg: '#FF3B3012',
        actionLabel: 'REVISAR',
    },
    info: {
        borderColor: '#007AFF',
        badgeLabel: 'INFORMATIVO',
        badgeColor: '#007AFF',
        badgeBg: '#007AFF12',
        actionLabel: 'VER',
    },
    review: {
        borderColor: '#BFA000',
        badgeLabel: 'REVISAR',
        badgeColor: '#BFA000',
        badgeBg: '#FFCC0015',
        actionLabel: 'DETALLE',
    },
};

const TABS = [
    { key: 'myTopics', label: 'Mi temario' },
    { key: 'allOpo', label: 'Toda mi opo' },
    { key: 'saved', label: 'Guardadas' },
];

// Mock estructurado por tab — se sustituye por boeApi.getFeed() en Paso 2
const MOCK_FEED = {
    myTopics: [
        {
            section: 'Hoy',
            items: [
                {
                    id: '1',
                    type: 'critical',
                    title: 'Modificación del art. 14 · Ley 39/2015',
                    description: 'Cambia la obligación de relación electrónica para ciertos colectivos.',
                    time: '10:41',
                    read: false,
                },
            ],
        },
        {
            section: 'Ayer',
            items: [
                {
                    id: '2',
                    type: 'info',
                    title: 'Nueva instrucción · Registro electrónico',
                    description: 'Afecta a los plazos de presentación telemática.',
                    time: '14:30',
                    read: false,
                },
            ],
        },
        {
            section: '12 jun',
            items: [
                {
                    id: '3',
                    type: 'review',
                    title: 'Corrección de errores · Ley 40/2015',
                    description: 'Ajuste menor de redacción, sin impacto en el test.',
                    time: '09:15',
                    read: true,
                },
            ],
        },
    ],
    allOpo: [
        {
            section: 'Hoy',
            items: [
                {
                    id: '4',
                    type: 'info',
                    title: 'RD 203/2021 — Reglamento LPACAP',
                    description: 'Nuevo reglamento de desarrollo de la Ley 39/2015.',
                    time: '11:00',
                    read: false,
                },
            ],
        },
    ],
    saved: [],
};

// Todos los ítems aplanados para lookup de guardados — se sustituirá por boeApi en Paso 2
const ALL_ITEMS_FLAT = [...MOCK_FEED.myTopics, ...MOCK_FEED.allOpo].flatMap(s => s.items);

export default function BoeHomeScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('myTopics');
    const [readSet, setReadSet] = useState(() => new Set());
    const [bookmarkSet, setBookmarkSet] = useState(() => new Set());
    const [demoEmpty, setDemoEmpty] = useState(false);
    const [apiMyTopicsSections, setApiMyTopicsSections] = useState(null);

    // Recarga el feed cada vez que la pantalla entra en foco, para reflejar
    // cambios de isRead/isBookmarked producidos en Detalle, Comparativa o Mini-test.
    useFocusEffect(
        useCallback(() => {
            boeApi.getFeed().then(res => {
                if (res?.data?.sections) {
                    const sections = res.data.sections.map(s => ({
                        section: s.sectionTitle,
                        items: s.data.map(c => ({
                            id: c.id,
                            type: changeTypeToFeedType(c.changeType),
                            title: `${c.articulo} · ${c.shortTitle}`,
                            description: c.affectedQuestionsCount > 0
                                ? `${c.affectedQuestionsCount} pregunta${c.affectedQuestionsCount > 1 ? 's' : ''} afectada${c.affectedQuestionsCount > 1 ? 's' : ''}.`
                                : 'Cambio detectado en tu temario.',
                            time: formatDetectedAt(c.detectedAt),
                            read: c.isRead,
                        })),
                    }));
                    setApiMyTopicsSections(sections);
                    const bmarks = new Set();
                    res.data.sections.flatMap(s => s.data).forEach(c => {
                        if (c.isBookmarked) bmarks.add(c.id);
                    });
                    setBookmarkSet(bmarks);
                }
            }).catch(() => {});
        }, [])
    );

    function toggleBookmark(id) {
        setBookmarkSet(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        boeApi.toggleBookmark(id).catch(() => {});
    }

    const myTopicsSections = apiMyTopicsSections ?? MOCK_FEED.myTopics;
    const allItemsFlat = [
        ...myTopicsSections,
        ...MOCK_FEED.allOpo,
    ].flatMap(s => s.items);
    const savedItems = allItemsFlat.filter(item => bookmarkSet.has(item.id));
    const savedSections = savedItems.length > 0 ? [{ section: 'Guardadas', items: savedItems }] : [];
    const feedSections = demoEmpty ? [] : (
        activeTab === 'saved' ? savedSections :
        activeTab === 'myTopics' ? myTopicsSections :
        (MOCK_FEED[activeTab] ?? [])
    );

    function markRead(id) {
        setReadSet(prev => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
        boeApi.markRead(id).catch(() => {});
    }

    function handleCardPress(item) {
        markRead(item.id);
        navigation.navigate('BoeDetail', { itemId: item.id, type: item.type });
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* ── Header ──────────────────────────────────────────────────────── */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Volver"
                    >
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>Monitor BOE</Text>
                </View>

                <View style={styles.headerRight}>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => navigation.navigate('Notifications')}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Notificaciones"
                    >
                        <Ionicons name="notifications-outline" size={22} color={colors.text} />
                    </TouchableOpacity>
                </View>
            </View>

            {/* ── Demo row (quitar en producción) ─────────────────────────────── */}
            <View style={styles.demoRow}>
                <Text style={styles.demoLabel}>DEMO</Text>
                <TouchableOpacity
                    style={[styles.demoPill, demoEmpty && styles.demoPillActive]}
                    onPress={() => setDemoEmpty(e => !e)}
                >
                    <Text style={[styles.demoPillText, demoEmpty && styles.demoPillTextActive]}>
                        {demoEmpty ? '✓ Sin novedades' : 'Sin novedades'}
                    </Text>
                </TouchableOpacity>
            </View>

            {/* ── Tabs ────────────────────────────────────────────────────────── */}
            <View style={styles.tabsWrapper}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabsContent}
                >
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.tabPill, isActive && styles.tabPillActive]}
                                onPress={() => setActiveTab(tab.key)}
                                accessibilityLabel={tab.label}
                                accessibilityState={{ selected: isActive }}
                            >
                                <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>
                <View style={styles.tabDivider} />
            </View>

            {/* ── Feed ────────────────────────────────────────────────────────── */}
            <ScrollView
                style={styles.feed}
                contentContainerStyle={styles.feedContent}
                showsVerticalScrollIndicator={false}
            >
                {feedSections.length === 0 ? (
                    activeTab === 'saved' ? (
                        /* ── Empty: tab Guardadas ──────────────────────────────── */
                        <View style={styles.empty}>
                            <Ionicons name="bookmark-outline" size={44} color={colors.textSecondary} />
                            <Text style={styles.emptyTitle}>Nada guardado aún</Text>
                            <Text style={styles.emptySubtitle}>
                                Guarda artículos desde el feed para revisarlos después.
                            </Text>
                        </View>
                    ) : (
                        /* ── Empty: temario al día (10.1·vacío) ────────────────── */
                        <View style={styles.upToDate}>
                            {/* Ícono de éxito */}
                            <View style={styles.upToDateCircle}>
                                <MaterialCommunityIcons
                                    name="check-circle"
                                    size={72}
                                    color={colors.success}
                                />
                            </View>

                            <Text style={styles.upToDateTitle}>¡Temario al día!</Text>
                            <Text style={styles.upToDateDesc}>
                                Has asimilado los cambios recientes. Tus tests ya usan la redacción vigente.
                            </Text>

                            {/* Card secundaria "Todo en orden" */}
                            <View style={styles.upToDateCard}>
                                <MaterialCommunityIcons
                                    name="newspaper-check"
                                    size={36}
                                    color={colors.grayMid}
                                />
                                <Text style={styles.upToDateCardTitle}>Todo en orden</Text>
                                <Text style={styles.upToDateCardDesc}>
                                    Tu temario está actualizado. Te avisaremos en cuanto el BOE publique
                                    algún cambio que te afecte.
                                </Text>
                            </View>

                            <TouchableOpacity
                                style={styles.upToDateBtn}
                                onPress={() => navigation.goBack()}
                                accessibilityLabel="Volver al inicio"
                            >
                                <Text style={styles.upToDateBtnText}>Volver al inicio</Text>
                            </TouchableOpacity>
                        </View>
                    )
                ) : (
                    feedSections.map(section => (
                        <View key={section.section}>
                            <Text style={styles.sectionLabel}>{section.section}</Text>
                            {section.items.map(item => {
                                const cfg = TYPE_CFG[item.type];
                                const isRead = readSet.has(item.id) || item.read;
                                const isBookmarked = bookmarkSet.has(item.id);
                                return (
                                    <TouchableOpacity
                                        key={item.id}
                                        style={styles.card}
                                        activeOpacity={0.72}
                                        onPress={() => handleCardPress(item)}
                                        accessibilityLabel={item.title}
                                    >
                                        {/* Barra de color izquierda */}
                                        <View style={[styles.cardBar, { backgroundColor: cfg.borderColor }]} />

                                        {/* Cuerpo de la card */}
                                        <View style={styles.cardBody}>
                                            {/* Badge + indicadores derecha */}
                                            <View style={styles.cardTopRow}>
                                                <View style={[styles.badgePill, { backgroundColor: cfg.badgeBg }]}>
                                                    <Text style={[styles.badgeText, { color: cfg.badgeColor }]}>
                                                        {cfg.badgeLabel}
                                                    </Text>
                                                </View>
                                                <View style={styles.cardTopRight}>
                                                    {!isRead && <View style={styles.unreadDot} />}
                                                    <TouchableOpacity
                                                        onPress={() => toggleBookmark(item.id)}
                                                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                        accessibilityLabel={isBookmarked ? 'Quitar de guardadas' : 'Guardar artículo'}
                                                    >
                                                        <Ionicons
                                                            name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                            size={16}
                                                            color={isBookmarked ? BOE_ACCENT : colors.textSecondary}
                                                        />
                                                    </TouchableOpacity>
                                                </View>
                                            </View>

                                            <Text style={styles.cardTitle}>{item.title}</Text>
                                            <Text style={styles.cardDesc} numberOfLines={2}>
                                                {item.description}
                                            </Text>

                                            {/* Footer: hora + chip (View — la card padre ya navega) */}
                                            <View style={styles.cardFooter}>
                                                <Text style={styles.cardTime}>{item.time}</Text>
                                                <View style={[styles.actionChip, { backgroundColor: cfg.badgeBg }]}>
                                                    <Text style={[styles.actionChipText, { color: cfg.badgeColor }]}>
                                                        {cfg.actionLabel}
                                                    </Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))
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
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    liveBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.successBg,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    liveDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '800',
        color: colors.success,
        letterSpacing: 0.4,
    },

    // ── Tabs ──────────────────────────────────────────────────────
    tabsWrapper: {
        backgroundColor: colors.card,
    },
    tabsContent: {
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        gap: spacing.sm,
        flexDirection: 'row',
    },
    tabPill: {
        paddingHorizontal: spacing.md,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: colors.grayLight,
    },
    tabPillActive: {
        backgroundColor: BOE_ACCENT,
    },
    tabLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabLabelActive: {
        color: colors.white,
    },
    tabDivider: {
        height: 1,
        backgroundColor: colors.separator,
    },

    // ── Feed ──────────────────────────────────────────────────────
    feed: {
        flex: 1,
    },
    feedContent: {
        padding: spacing.md,
    },
    sectionLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.6,
        marginTop: spacing.sm,
        marginBottom: 10,
    },

    // ── Card ──────────────────────────────────────────────────────
    card: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    cardBar: {
        width: 5,
        flexShrink: 0,
    },
    cardBody: {
        flex: 1,
        padding: spacing.md,
        paddingLeft: 12,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    badgePill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 4,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },
    cardTopRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    unreadDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF7F50',
    },
    cardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
        lineHeight: 21,
    },
    cardDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 19,
        marginBottom: 10,
    },
    cardFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardTime: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    actionChip: {
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    actionChipText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.3,
    },

    // ── Empty: tab Guardadas ──────────────────────────────────────
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
    },

    // ── Empty: temario al día (10.1·vacío) ───────────────────────
    upToDate: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    upToDateCircle: {
        width: 112,
        height: 112,
        borderRadius: 56,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
    },
    upToDateTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 10,
    },
    upToDateDesc: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 23,
        marginBottom: spacing.xl,
    },
    upToDateCard: {
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        paddingVertical: spacing.lg,
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.xl,
        width: '100%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    upToDateCardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.sm,
        marginBottom: 6,
    },
    upToDateCardDesc: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    upToDateBtn: {
        paddingVertical: 12,
        paddingHorizontal: spacing.lg,
        borderRadius: 12,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    upToDateBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },

    // ── Demo row ──────────────────────────────────────────────────
    demoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        backgroundColor: '#FFFBE6',
        borderBottomWidth: 1,
        borderBottomColor: '#F0DC80',
    },
    demoLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#BFA000',
        letterSpacing: 0.5,
    },
    demoPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFA000',
    },
    demoPillActive: {
        backgroundColor: '#BFA000',
    },
    demoPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#BFA000',
    },
    demoPillTextActive: {
        color: colors.white,
    },
});
