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
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

function changeTypeToFeedType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

// ─── 10.1 · Monitor BOE · feed "LEYES ACTUALIZADAS" ───────────────────────────
// Fiel al Figma (archivo OPOX_AI (2), Bloque 10, 905 x 2176px) para header,
// filtro, tarjeta y estado "Todo en orden". El sistema de búsqueda/seguimiento
// de normas (modal "Añadir norma") y los estados de carga no tienen
// equivalente en el reference — son funcionalidad real imprescindible (sin
// seguir ninguna norma no hay nada que monitorizar) y se conservan,
// reestilizados con la misma paleta confirmada.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    borderMuted: 'rgba(65, 41, 80, 0.3)',
};

// Mapeo confirmado por Figma: los 3 ítems mock ("Modificación del art. 14",
// "Nueva instrucción · Registro electrónico", "Corrección de errores · Ley
// 40/2015") son los mismos 3 del reference TSX, con categorías
// urgente(rojo)/afecta(naranja)/informativa(verde) — reemplaza la paleta
// azul/amarilla que tenía este archivo antes del rediseño.
const TYPE_CFG = {
    critical: { color: colors.statRed, label: 'Afecta a tu tema' },
    info: { color: colors.accentOrange, label: 'Afecta a tu tema' },
    review: { color: colors.ctaGreen, label: 'Informativa' },
};

// Solo "Mi temario"/"Guardados": "Toda mi opo" era mock puro (sin backend
// real detrás) y se retiró al conectar el feed real — ver handleFollow/
// watchedCount más abajo, que reemplazan por completo el sistema de mocks.
const TABS = [
    { key: 'myTopics', label: 'Mi temario' },
    { key: 'saved', label: 'Guardados' },
];

// El feed real llega agrupado por sección (fecha) desde boeApi.getFeed(). El
// Figma confirmado no muestra encabezados de sección: cada tarjeta lleva su
// propia marca de tiempo coloreada por categoría. Aplanamos sin perder el
// dato — el nombre de la sección pasa a ser el timestamp de cada ítem.
function flattenSections(sections) {
    return sections.flatMap(s => s.items.map(item => ({ ...item, timestamp: s.section })));
}

// ─── Íconos confirmados en Figma ───────────────────────────────────────────
function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function FilterIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 6H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M7 12H17" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M10 18H14" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

// Ícono confirmado en Figma para el estado "Todo en orden" (10.1·vacío) —
// círculo + check verde grande, sin círculo de fondo detrás.
function SuccessCheckIcon({ size = 96, color = colors.ctaGreen }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 96 96">
            <Circle cx={48} cy={48} r={44} stroke={color} strokeWidth={4} fill="none" />
            <Path d="M28 49L42 62L68 33" stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function BoeHomeScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('myTopics');
    const [readSet, setReadSet] = useState(() => new Set());
    const [bookmarkSet, setBookmarkSet] = useState(() => new Set());
    const [myTopicsSections, setMyTopicsSections] = useState([]);
    const [watchedCount, setWatchedCount] = useState(null); // null = cargando
    const [totalUnread, setTotalUnread] = useState(0);

    // Sheet de búsqueda y seguimiento de normas ("Añadir norma")
    const [searchVisible, setSearchVisible] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [followedIds, setFollowedIds] = useState(() => new Set());
    const searchTimeout = useRef(null);

    // Recarga el feed cada vez que la pantalla entra en foco, para reflejar
    // cambios de isRead/isBookmarked producidos en Detalle, Comparativa o Mini-test.
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
        boeApi.listRegulations().then(res => {
            if (!res?.error && res?.data) {
                setFollowedIds(new Set((res.data ?? []).map(r => r.boeIdentifier)));
            }
        }).catch(() => {});
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

    const myTopicsItems = flattenSections(myTopicsSections);
    const savedItems = myTopicsItems.filter(item => bookmarkSet.has(item.id));
    const feedItems = activeTab === 'saved' ? savedItems : myTopicsItems;

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
                    <View style={styles.headerTitleRow}>
                        <Text style={styles.headerTitle}>Monitor BOE</Text>
                        {totalUnread > 0 && (
                            <View style={styles.unreadBadge}>
                                <Text style={styles.unreadBadgeText}>{totalUnread}</Text>
                            </View>
                        )}
                    </View>
                    {/* Añadir norma a monitorizar — única vía persistente para seguir
                        más normas una vez el temario ya tiene alguna (el CTA del
                        estado vacío solo aparece antes de la primera). */}
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => setSearchVisible(true)}
                        accessibilityLabel="Seguir norma"
                    >
                        <Ionicons name="add-circle-outline" size={24} color={colors.accentOrange} />
                    </TouchableOpacity>
                </View>

                {/* ── Filtro ──────────────────────────────────────────────────── */}
                <View style={styles.filterRow}>
                    <FilterIcon />
                    {TABS.map(tab => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[styles.filterTab, isActive && styles.filterTabActive]}
                                onPress={() => setActiveTab(tab.key)}
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

                {/* ── Feed ────────────────────────────────────────────────────── */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {feedItems.length === 0 ? (
                        activeTab === 'saved' ? (
                            /* ── Empty: tab Guardados ──────────────────────────── */
                            <View style={styles.empty}>
                                <Ionicons name="bookmark-outline" size={44} color={colors.textSecondary} />
                                <Text style={styles.emptyTitle}>Nada guardado aún</Text>
                                <Text style={styles.emptySubtitle}>
                                    Guarda artículos desde el feed para revisarlos después.
                                </Text>
                            </View>
                        ) : watchedCount === null ? (
                            /* ── Cargando ───────────────────────────────────────── */
                            <ActivityIndicator style={{ marginTop: 60 }} color={colors.accentOrange} />
                        ) : watchedCount === 0 ? (
                            /* ── Empty: sin normas seguidas ────────────────────── */
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
                            /* ── Empty: temario al día (10.1·vacío) ────────────── */
                            <View style={styles.upToDate}>
                                <SuccessCheckIcon />
                                <Text style={styles.upToDateTitle}>Todo en orden</Text>
                                <Text style={styles.upToDateDesc}>
                                    Tu temario está actualizado. Te avisaremos en cuanto el BOE publique
                                    algún cambio que te afecte.
                                </Text>
                            </View>
                        )
                    ) : (
                        feedItems.map(item => {
                            const cfg = TYPE_CFG[item.type];
                            const isRead = readSet.has(item.id) || item.read;
                            const isBookmarked = bookmarkSet.has(item.id);
                            return (
                                <TouchableOpacity
                                    key={item.id}
                                    style={[styles.card, !isRead && { borderColor: cfg.color, borderWidth: 1.5 }]}
                                    activeOpacity={0.8}
                                    onPress={() => handleCardPress(item)}
                                    accessibilityLabel={item.title}
                                >
                                    <View style={styles.cardHeaderRow}>
                                        <View style={[styles.tag, { backgroundColor: `${cfg.color}1A` }]}>
                                            <Text style={[styles.tagText, { color: cfg.color }]}>{cfg.label}</Text>
                                        </View>
                                        <View style={styles.cardTopRight}>
                                            <Text style={[styles.timestamp, { color: cfg.color }]}>
                                                {item.timestamp}
                                            </Text>
                                            <TouchableOpacity
                                                onPress={() => toggleBookmark(item.id)}
                                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                                accessibilityLabel={isBookmarked ? 'Quitar de guardados' : 'Guardar artículo'}
                                            >
                                                <Ionicons
                                                    name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                                                    size={14}
                                                    color={isBookmarked ? colors.purple : colors.textSecondary}
                                                />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <Text style={styles.cardTitle}>{item.title}</Text>
                                    <Text style={styles.cardSubtitle}>{item.description}</Text>
                                </TouchableOpacity>
                            );
                        })
                    )}
                </ScrollView>
            </View>

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
                            <Ionicons name="close" size={22} color={colors.textDark} />
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
                        {searchLoading && <ActivityIndicator size="small" color={colors.accentOrange} />}
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
    headerTitleRow: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    unreadBadge: {
        backgroundColor: colors.statRed,
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 5,
    },
    unreadBadgeText: {
        fontFamily: 'Poppins-Bold',
        fontSize: 11,
        color: colors.white,
    },

    // ── Filtro ────────────────────────────────────────────────────
    filterRow: {
        flexDirection: 'row',
        alignItems: 'center',
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

    // ── Feed ──────────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.lg,
    },

    // ── Card ──────────────────────────────────────────────────────
    card: {
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'transparent',
        paddingVertical: 14,
        paddingHorizontal: 16,
        marginBottom: spacing.sm,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6,
    },
    tag: {
        borderRadius: 20,
        paddingVertical: 4,
        paddingHorizontal: 10,
    },
    tagText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 10.2,
    },
    cardTopRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    timestamp: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.2,
    },
    cardTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 17.8,
        color: colors.textDark,
    },
    cardSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        marginTop: 2,
    },

    // ── Empty (Guardados / sin normas / búsqueda sin resultados) ──
    empty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
        paddingHorizontal: spacing.xl,
    },
    emptyTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 16,
        color: colors.textDark,
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    emptySubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 19,
    },
    followCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: spacing.lg,
        backgroundColor: colors.purple,
        paddingHorizontal: spacing.lg,
        paddingVertical: 12,
        borderRadius: 12,
    },
    followCtaText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },

    // ── Empty: temario al día (10.1·vacío) ───────────────────────
    upToDate: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.xl,
    },
    upToDateTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.lg,
    },
    upToDateDesc: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        lineHeight: 17,
        marginTop: spacing.sm,
    },

    // ── Modal de búsqueda / seguimiento de normas ──────────────────
    modalContainer: {
        flex: 1,
        backgroundColor: colors.white,
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 17,
        color: colors.textDark,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        margin: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: FIGMA.borderMuted,
    },
    searchInput: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
        padding: 0,
    },
    searchResultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    searchResultId: {
        fontFamily: 'Poppins-Bold',
        fontSize: 10,
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.3,
        marginBottom: 3,
    },
    searchResultTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
        lineHeight: 20,
    },
    followBtn: {
        backgroundColor: `${colors.purple}1A`,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.purple,
    },
    followBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.purple,
    },
    followedBadge: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: colors.grayLight,
    },
    followedBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 13,
        color: colors.textSecondary,
    },
});
