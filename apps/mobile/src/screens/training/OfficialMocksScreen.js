import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { api } from '../../api/client';
import { trainingApi } from '../../api/training';

const FILTERS = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'completed', label: 'Completados' },
];

const EMPTY_COPY = {
    all: 'Aún no hay simulacros disponibles para tu oposición.',
    pending: '¡Los tienes todos hechos! Puedes repetir cualquiera desde "Completados".',
    completed: 'Todavía no has completado ningún simulacro. Empieza por el más reciente.',
};

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

function IconDoc({ color = '#9AA2B1' }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v14H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
        </Svg>
    );
}

function IconClockProgress({ color = '#FF6B4A' }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconCheckDone({ color = '#1f9d6b' }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Path d="M8 12.5l3 3 5-6" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconHash({ color = '#8A92A0' }) {
    return (
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Path d="M9 3v18M15 3v18M3 9h18M3 15h18" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconTimer({ color = '#8A92A0' }) {
    return (
        <Svg width={13} height={13} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={13} r={8} stroke={color} strokeWidth={1.6} />
            <Path d="M12 8v5l3 2M9 3h6" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
    );
}

function IconEmpty({ color = '#C4CBD6' }) {
    return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v14H6z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <Circle cx={12} cy={13} r={2.5} stroke={color} strokeWidth={1.5} />
            <Path d="M13.7 14.7L16 17" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

// ─── Config por estado ───────────────────────────────────────────────────────
const STATUS = {
    pending: {
        Icon: IconDoc,
        accent: '#8A92A0',
        label: 'Sin empezar',
        cta: 'Empezar',
        ctaStyle: 'solid',
    },
    ongoing: {
        Icon: IconClockProgress,
        accent: '#FF6B4A',
        label: 'En curso',
        cta: 'Continuar',
        ctaStyle: 'solid',
    },
    completed: {
        Icon: IconCheckDone,
        accent: '#1f9d6b',
        label: 'Completado',
        cta: 'Repetir',
        ctaStyle: 'ghost',
    },
};

// ─── Chip del filtro ─────────────────────────────────────────────────────────
function FilterChip({ label, active, onPress }) {
    return (
        <TouchableOpacity
            style={[styles.filterChip, active && styles.filterChipActive]}
            onPress={onPress}
            activeOpacity={0.8}
        >
            <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
        </TouchableOpacity>
    );
}

// ─── Card por examen ─────────────────────────────────────────────────────────
function MockCard({ item, onPress }) {
    const cfg = STATUS[item.status];
    const Icon = cfg.Icon;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardHead}>
                <View style={styles.yearBadge}>
                    <Text style={styles.yearText}>{item.year}</Text>
                </View>
                <View style={styles.statusRow}>
                    <Icon />
                    <Text style={[styles.statusLabel, { color: cfg.accent }]}>{cfg.label}</Text>
                </View>
            </View>

            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.category}</Text>

            <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                    <IconHash />
                    <Text style={styles.metaText}>{item.questions} preguntas</Text>
                </View>
                <View style={styles.metaItem}>
                    <IconTimer />
                    <Text style={styles.metaText}>{item.minutes} min</Text>
                </View>
            </View>

            {item.status === 'ongoing' && (
                <View style={styles.progressBlock}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>{item.progress}%</Text>
                </View>
            )}

            {item.status === 'completed' && (
                <View style={styles.scoreBlock}>
                    <Text style={styles.scoreLabel}>Acierto</Text>
                    <Text style={[styles.scoreValue, { color: cfg.accent }]}>{item.score}%</Text>
                </View>
            )}

            <View
                style={[
                    styles.cta,
                    cfg.ctaStyle === 'ghost'
                        ? { backgroundColor: '#fff', borderWidth: 1.5, borderColor: cfg.accent }
                        : { backgroundColor: cfg.accent },
                ]}
            >
                <Text style={[styles.ctaText, { color: cfg.ctaStyle === 'ghost' ? cfg.accent : '#fff' }]}>
                    {cfg.cta}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

// ─── Pantalla 6.6 · Simulacros Oficiales · Listado ───────────────────────────
export default function OfficialMocksScreen({ navigation }) {
    const [filter, setFilter] = useState('all');
    const [mocks, setMocks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const session = await api.loadSession();
            const oposicion =
                session?.user?.oposicion ??
                session?.user?.user_metadata?.oposicion ??
                'justicia-tramitacion';
            const { data, error } = await trainingApi.listMocks(oposicion);
            if (cancelled) return;
            if (error) {
                setLoadError(error.message);
            } else {
                // Mapea MockExamWithStatus → formato de tarjeta
                setMocks((data ?? []).map((item) => ({
                    id: item.exam.id,
                    year: String(item.exam.year),
                    title: item.exam.title,
                    category: item.exam.category ?? item.exam.oposicion,
                    questions: item.exam.questionCount,
                    minutes: item.exam.durationMinutes,
                    status: item.status,
                    score: item.bestScore !== null ? Math.round(item.bestScore * 10) : null,
                    progress: null,
                })));
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const filtered = mocks.filter((item) => {
        if (filter === 'all') return true;
        // "Pendientes" agrupa lo que aún no está terminado: sin empezar + en curso.
        if (filter === 'pending') return item.status === 'pending' || item.status === 'ongoing';
        return item.status === filter;
    });

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader title="Simulacros oficiales" onBack={() => navigation.goBack()} />

            <View style={styles.filterRow}>
                {FILTERS.map((f) => (
                    <FilterChip
                        key={f.id}
                        label={f.label}
                        active={filter === f.id}
                        onPress={() => setFilter(f.id)}
                    />
                ))}
            </View>

            {loading ? (
                <View style={styles.empty}>
                    <ActivityIndicator color="#FF6B4A" />
                </View>
            ) : loadError ? (
                <View style={styles.empty}>
                    <IconEmpty />
                    <Text style={styles.emptyText}>{loadError}</Text>
                </View>
            ) : (
                <FlatList
                    data={filtered}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MockCard
                            item={item}
                            onPress={() => navigation.navigate('MockInstructions', { exam: item })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <IconEmpty />
                            <Text style={styles.emptyText}>{EMPTY_COPY[filter]}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },

    filterRow: {
        flexDirection: 'row',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
    },
    filterChipActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
    filterChipText: { fontSize: 12, fontWeight: '700', color: '#5A6373' },
    filterChipTextActive: { color: '#fff' },

    list: { paddingHorizontal: 16, paddingBottom: 32 },

    card: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 14,
        marginBottom: 11,
    },
    cardHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
    },
    yearBadge: {
        backgroundColor: '#F4F6FA',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    yearText: { fontSize: 11, fontWeight: '800', color: '#1B2A4A' },
    statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    statusLabel: { fontSize: 11, fontWeight: '700' },

    cardTitle: { fontSize: 14, fontWeight: '800', color: '#0F1B33', marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: '#7A8290', marginBottom: 10 },

    metaRow: { flexDirection: 'row', gap: 14, marginBottom: 10 },
    metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    metaText: { fontSize: 11, color: '#7A8290' },

    progressBlock: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 10,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEF1F7',
    },
    progressTrack: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F4F6FA',
        overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#FF6B4A', borderRadius: 3 },
    progressText: { fontSize: 11, fontWeight: '700', color: '#FF6B4A', minWidth: 32, textAlign: 'right' },

    scoreBlock: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingTop: 10,
        marginBottom: 12,
        borderTopWidth: 1,
        borderTopColor: '#EEF1F7',
    },
    scoreLabel: { fontSize: 12, color: '#7A8290' },
    scoreValue: { fontSize: 18, fontWeight: '800' },

    cta: {
        borderRadius: 10,
        paddingVertical: 10,
        alignItems: 'center',
    },
    ctaText: { fontSize: 12.5, fontWeight: '800' },

    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: { fontSize: 13, color: '#8A92A0', marginTop: 12 },
});
