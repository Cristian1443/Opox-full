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
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

function changeTypeToFeedType(ct) {
    if (ct === 'modificacion' || ct === 'derogacion') return 'critical';
    if (ct === 'tipografica') return 'review';
    return 'info';
}

// ─── 10.1 · Monitor BOE · feed "LEYES ACTUALIZADAS" ───────────────────────────
// Fiel al Figma (archivo OPOX_AI (2), Bloque 10, 905 x 2176px). Subtítulo
// atenuado a rgba propia porque colors.textMuted (#343A3D) es sólido y el
// diseño lo usa al 50% de opacidad.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
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

const TABS = [
    { key: 'myTopics', label: 'Mi temario' },
    { key: 'allOpo', label: 'Toda mi opo' },
    { key: 'saved', label: 'Guardados' },
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
                    read: false,
                },
            ],
        },
    ],
    saved: [],
};

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

// Ícono de refrescar confirmado en Figma — capa nombrada genéricamente
// "Capa_1" (mismo patrón de nombres reutilizados visto en Bloques 8/9).
// Sustituye al botón de notificaciones que tenía esta pantalla; el acceso a
// Notificaciones sigue disponible desde el header del Dashboard.
function RefreshIcon({ size = 22, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 12a8 8 0 0114-5.3M20 12a8 8 0 01-14 5.3" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" />
            <Path d="M18 3v4.5h-4.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M6 21v-4.5h4.5" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

function FilterIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 6H20" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M7 12H17" stroke={color} strokeWidth={2} strokeLinecap="round" />
            <Path d="M10 18H14" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

export default function BoeHomeScreen({ navigation }) {
    const [activeTab, setActiveTab] = useState('myTopics');
    const [readSet, setReadSet] = useState(() => new Set());
    const [bookmarkSet, setBookmarkSet] = useState(() => new Set());
    const [demoEmpty, setDemoEmpty] = useState(false);
    const [apiMyTopicsSections, setApiMyTopicsSections] = useState(null);

    // Recarga el feed: al entrar en foco (refleja cambios de isRead/isBookmarked
    // hechos en Detalle, Comparativa o Mini-test) y también al pulsar el ícono
    // de refrescar del header.
    const loadFeed = useCallback(() => {
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
    }, []);

    useFocusEffect(useCallback(() => { loadFeed(); }, [loadFeed]));

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
    const myTopicsItems = flattenSections(myTopicsSections);
    const allOpoItems = flattenSections(MOCK_FEED.allOpo);
    const allItemsFlat = [...myTopicsItems, ...allOpoItems];
    const savedItems = allItemsFlat.filter(item => bookmarkSet.has(item.id));

    const feedItems = demoEmpty ? [] : (
        activeTab === 'saved' ? savedItems :
        activeTab === 'myTopics' ? myTopicsItems :
        allOpoItems
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
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

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
                    <Text style={styles.headerTitle}>Monitor BOE</Text>
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={loadFeed}
                        accessibilityLabel="Actualizar"
                    >
                        <RefreshIcon />
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

    // ── Empty: tab Guardados ──────────────────────────────────────
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
        fontFamily: 'Poppins-Bold',
        fontSize: 10,
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
        fontFamily: 'Poppins-SemiBold',
        fontSize: 11,
        color: '#BFA000',
    },
    demoPillTextActive: {
        color: colors.white,
    },
});
