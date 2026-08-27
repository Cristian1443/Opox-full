import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
    StyleSheet,
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    TextInput,
    ActivityIndicator,
    Modal,
    FlatList,
    Alert,
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
    { key: 'saved', label: 'Guardadas' },
];

export default function BoeHomeScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('myTopics');
    const [readSet, setReadSet] = useState(() => new Set());
    const [bookmarkSet, setBookmarkSet] = useState(() => new Set());
    const [myTopicsSections, setMyTopicsSections] = useState([]);
    const [watchedCount, setWatchedCount] = useState(null); // null = cargando
    const [totalUnread, setTotalUnread] = useState(0);

    // Sheet de búsqueda y seguimiento de normas
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [followedIds, setFollowedIds] = useState(() => new Set());
    const searchTimeout = useRef(null);

    useFocusEffect(
        useCallback(() => {
            boeApi.getFeed().then(res => {
                if (!res?.error && res?.data) {
                    const d = res.data;
                    const sections = d.sections.map(s => ({
                        section: s.sectionTitle,
                        items: s.data.map(c => ({
                            id: c.id,
                            type: changeTypeToFeedType(c.changeType),
                            title: `${c.articulo} · ${c.shortTitle}`,
                            description: c.affectedQuestionsCount > 0
                                ? `${c.affectedQuestionsCount} pregunta${c.affectedQuestionsCount > 1 ? 's' : ''} afectada${c.affectedQuestionsCount > 1 ? 's' : ''}.`
                                : 'Cambio detectado en tu temario.',
                            read: c.isRead,
                        })),
                    }));
                    setMyTopicsSections(sections);
                    setWatchedCount(d.watchedRegulationsCount ?? 0);
                    setTotalUnread(d.totalUnread ?? 0);
                    const bmarks = new Set();
                    d.sections.flatMap(s => s.data).forEach(c => {
                        if (c.isBookmarked) bmarks.add(c.id);
                    });
                    setBookmarkSet(bmarks);
                } else {
                    setWatchedCount(prev => prev ?? 0);
                }
            }).catch(() => { setWatchedCount(prev => prev ?? 0); });
        }, [])
    );

    // Precarga sugerencias y normas ya seguidas cuando el modal abre
    useEffect(() => {
        if (!searchVisible) return;
        // Cargar normas ya seguidas para mostrar estado correcto en el listado
        boeApi.listRegulations().then(res => {
            if (!res?.error && res?.data) {
                setFollowedIds(new Set((res.data ?? []).map(r => r.boeIdentifier)));
            }
        }).catch(() => {});
        // Cargar catálogo/sugerencias
        setSearchLoading(true);
        boeApi.searchCatalog('', 20).then(res => {
            if (!res?.error && res?.data) setSearchResults(res.data.resultados ?? []);
        }).catch(() => {}).finally(() => setSearchLoading(false));
    }, [searchVisible]);

    function triggerSearch(q) {
        setSearchQuery(q);
        clearTimeout(searchTimeout.current);
        if (!q.trim()) {
            // Sin query: volver a mostrar todas las sugerencias cargadas al abrir
            setSearchLoading(true);
            boeApi.searchCatalog('', 20).then(res => {
                if (!res?.error && res?.data) setSearchResults(res.data.resultados ?? []);
            }).catch(() => {}).finally(() => setSearchLoading(false));
            return;
        }
        searchTimeout.current = setTimeout(() => {
            setSearchLoading(true);
            boeApi.searchCatalog(q, 15).then(res => {
                if (!res?.error && res?.data) {
                    setSearchResults(res.data.resultados ?? []);
                }
            }).catch(() => {}).finally(() => setSearchLoading(false));
        }, 400);
    }

    function handleFollow(entry) {
        const boeId = entry.identificador_boe;
        if (followedIds.has(boeId)) return; // ya seguida — no relanzar
        boeApi.followRegulation(boeId, entry.titulo).then(res => {
            if (!res?.error) {
                setFollowedIds(prev => new Set([...prev, boeId]));
                setWatchedCount(c => (c ?? 0) + 1);
            } else {
                Alert.alert('Error', res.error?.message ?? 'No se pudo añadir la norma.');
            }
        }).catch(() => Alert.alert('Error', 'No se pudo conectar con el servidor.'));
    }

    function toggleBookmark(id) {
        setBookmarkSet(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
        boeApi.toggleBookmark(id).catch(() => {});
    }

    const allItemsFlat = myTopicsSections.flatMap(s => s.items);
    const savedItems = allItemsFlat.filter(item => bookmarkSet.has(item.id));
    const savedSections = savedItems.length > 0 ? [{ section: 'Guardadas', items: savedItems }] : [];
    const feedSections = activeTab === 'saved' ? savedSections : myTopicsSections;

    function markRead(id) {
        setReadSet(prev => { const next = new Set(prev); next.add(id); return next; });
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
                    {totalUnread > 0 && (
                        <View style={styles.unreadBadge}>
                            <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
                        </View>
                    )}
                </View>

                <View style={styles.headerRight}>
                    <View style={styles.liveBadge}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                    </View>
                    <TouchableOpacity
                        onPress={() => setSearchVisible(true)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        accessibilityLabel="Seguir norma"
                    >
                        <Ionicons name="add-circle-outline" size={24} color={BOE_ACCENT} />
                    </TouchableOpacity>
                </View>
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
                    ) : watchedCount === null ? (
                        /* ── Cargando ───────────────────────────────────────────── */
                        <ActivityIndicator style={{ marginTop: 60 }} color={BOE_ACCENT} />
                    ) : watchedCount === 0 ? (
                        /* ── Empty: sin normas seguidas ────────────────────────── */
                        <View style={styles.empty}>
                            <Ionicons name="telescope-outline" size={48} color={colors.textSecondary} />
                            <Text style={styles.emptyTitle}>Empieza a monitorizar</Text>
                            <Text style={styles.emptySubtitle}>
                                Añade las normas de tu temario y te avisaremos en cuanto el BOE publique un cambio que te afecte.
                            </Text>
                            <TouchableOpacity
                                style={styles.followCta}
                                onPress={() => setSearchVisible(true)}
                                accessibilityLabel="Añadir norma"
                            >
                                <Ionicons name="add" size={18} color={colors.white} />
                                <Text style={styles.followCtaText}>Añadir norma</Text>
                            </TouchableOpacity>
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

                                            {/* Footer: chip (View — la card padre ya navega) */}
                                            <View style={styles.cardFooter}>
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
            {/* ── Modal: buscar y seguir normas ──────────────────────────────── */}
            <Modal
                visible={searchVisible}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => {
                    setSearchVisible(false);
                    setSearchQuery('');
                    setSearchResults([]);
                }}
            >
                <SafeAreaView style={styles.modalContainer} edges={['top', 'left', 'right']}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Añadir norma</Text>
                        <TouchableOpacity
                            onPress={() => {
                                setSearchVisible(false);
                                setSearchQuery('');
                                setSearchResults([]);
                            }}
                            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                            accessibilityLabel="Cerrar"
                        >
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.searchBar}>
                        <Ionicons name="search" size={18} color={colors.textSecondary} style={{ marginRight: 8 }} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Buscar por nombre o identificador BOE…"
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={triggerSearch}
                            autoFocus
                            returnKeyType="search"
                        />
                        {searchLoading && <ActivityIndicator size="small" color={BOE_ACCENT} />}
                    </View>

                    {searchResults.length === 0 && !searchLoading ? (
                        <View style={styles.empty}>
                            <Ionicons
                                name={searchQuery.trim() ? 'search-outline' : 'book-outline'}
                                size={40}
                                color={colors.textSecondary}
                            />
                            <Text style={styles.emptyTitle}>
                                {searchQuery.trim() ? 'Sin resultados' : 'Sin normas disponibles'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery.trim()
                                    ? 'Prueba con otro término o identificador BOE (ej. BOE-A-2023-...).'
                                    : 'Verifica que MOTOR_BOE_BASE_URL y MOTOR_BOE_CURSO_ID estén configurados en el backend.'}
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={searchResults}
                            keyExtractor={item => item.id ?? item.identificador_boe}
                            contentContainerStyle={{ padding: spacing.md }}
                            renderItem={({ item }) => (
                                <View style={styles.searchResultRow}>
                                    <View style={{ flex: 1, marginRight: spacing.sm }}>
                                        <Text style={styles.searchResultId}>{item.identificador_boe}</Text>
                                        <Text style={styles.searchResultTitle} numberOfLines={2}>
                                            {item.titulo}
                                        </Text>
                                    </View>
                                    {followedIds.has(item.identificador_boe) ? (
                                        <View style={styles.followedBadge}>
                                            <Text style={styles.followedBadgeText}>Siguiendo</Text>
                                        </View>
                                    ) : (
                                        <TouchableOpacity
                                            style={styles.followBtn}
                                            onPress={() => handleFollow(item)}
                                            accessibilityLabel={`Seguir ${item.titulo}`}
                                        >
                                            <Text style={styles.followBtnText}>Seguir</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            )}
                            ItemSeparatorComponent={() => (
                                <View style={{ height: 1, backgroundColor: colors.separator }} />
                            )}
                        />
                    )}
                </SafeAreaView>
            </Modal>
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
        backgroundColor: BOE_ACCENT,
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
        justifyContent: 'flex-end',
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

    // ── Unread badge ──────────────────────────────────────────────
    unreadBadge: {
        backgroundColor: BOE_ACCENT,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadBadgeText: {
        fontSize: 11,
        fontWeight: '800',
        color: '#fff',
    },

    // ── Follow CTA (empty sin normas) ────────────────────────────
    followCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.lg,
        backgroundColor: BOE_ACCENT,
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        borderRadius: 12,
    },
    followCtaText: {
        fontSize: 15,
        fontWeight: '700',
        color: '#fff',
    },

    // ── Modal de búsqueda ─────────────────────────────────────────
    modalContainer: {
        flex: 1,
        backgroundColor: colors.background,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        backgroundColor: colors.card,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    modalTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        backgroundColor: colors.card,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        padding: 0,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    searchResultId: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 3,
    },
    searchResultTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        lineHeight: 20,
    },
    followBtn: {
        backgroundColor: BOE_ACCENT_BG,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: BOE_ACCENT,
    },
    followBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: BOE_ACCENT,
    },
    followedBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.grayLight,
    },
    followedBadgeText: {
        fontSize: 13,
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
