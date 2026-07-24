import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, FlatList, ActivityIndicator } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';
import { api } from '../../api/client';
import { trainingApi } from '../../api/training';

// Icono documento+medalla — igual que en el hub
function IconDocMedal({ color = colors.primary }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v10H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Circle cx={12} cy={17} r={3} stroke={color} strokeWidth={1.5} />
            <Path d="M11 20l-.5 2M13 20l.5 2" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
        </Svg>
    );
}

function IconDocMedalDone({ color = colors.success }) {
    return (
        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v10H6z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Circle cx={12} cy={17} r={3} stroke={color} strokeWidth={1.5} />
            <Path d="M10.5 17l1 1 2-2" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconSurgical({ color = '#fff' }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

const EMPTY_COPY = 'Aún no hay simulacros disponibles para tu oposición.';

// ─── Tarjeta de simulacro ─────────────────────────────────────────────────────
function MockCard({ item, onPress }) {
    const isDone = item.status === 'completed';
    const isOngoing = item.status === 'ongoing';
    const ctaLabel = isDone ? 'Repetir' : isOngoing ? 'Continuar' : 'Empezar';
    const progressPct = item.progress ?? 0;
    const barColor = isDone ? colors.success : colors.primary;

    return (
        <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardRow}>
                <View style={styles.cardIcon}>
                    {isDone
                        ? <IconDocMedalDone />
                        : <IconDocMedal color={isOngoing ? colors.primary : colors.grayMid} />
                    }
                </View>
                <View style={styles.cardMeta}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>{item.questions} preguntas · {item.minutes} min</Text>
                </View>
            </View>

            {/* Barra de progreso */}
            <View style={styles.progressBlock}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progressPct}%`, backgroundColor: barColor }]} />
                </View>
                <View style={styles.progressLabel}>
                    <Text style={[styles.progressPct, { color: barColor }]}>{progressPct}% completado</Text>
                    <Text style={[styles.progressCta, { color: barColor }]}>{ctaLabel}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );
}

// ─── Pantalla 6.6 · Simulacros Oficiales · Listado ───────────────────────────
export default function OfficialMocksScreen({ navigation }) {
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
                setMocks((data ?? []).map((item) => ({
                    id: item.exam.id,
                    year: String(item.exam.year),
                    title: item.exam.title,
                    category: item.exam.category ?? item.exam.oposicion,
                    questions: item.exam.questionCount,
                    minutes: item.exam.durationMinutes,
                    status: item.status,
                    score: item.bestScore !== null ? Math.round(item.bestScore * 10) : null,
                    progress: item.status === 'completed' ? 100 : item.status === 'ongoing' ? 70 : 0,
                })));
            }
            setLoading(false);
        })();
        return () => { cancelled = true; };
    }, []);

    const ListFooter = () => (
        <TouchableOpacity
            style={styles.surgicalBanner}
            onPress={() => navigation.navigate('ErrorLab')}
            activeOpacity={0.85}
        >
            <View style={styles.surgicalLeft}>
                <Text style={styles.surgicalIcon}>✦</Text>
                <View>
                    <Text style={styles.surgicalTitle}>Iniciar test quirúrgico</Text>
                    <Text style={styles.surgicalSub}>Haz clic en el botón para generar test de refuerzo</Text>
                </View>
            </View>
            <View style={styles.surgicalPlay}>
                <IconSurgical />
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScreenHeader title="Simulacros" subtitle="Exámenes oficiales" onBack={() => navigation.goBack()} />

            {loading ? (
                <View style={styles.empty}>
                    <ActivityIndicator color={colors.primary} />
                </View>
            ) : loadError ? (
                <View style={styles.empty}>
                    <Text style={styles.emptyText}>{loadError}</Text>
                </View>
            ) : (
                <FlatList
                    data={mocks}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <MockCard
                            item={item}
                            onPress={() => navigation.navigate('MockInstructions', { exam: item })}
                        />
                    )}
                    contentContainerStyle={styles.list}
                    showsVerticalScrollIndicator={false}
                    ListFooterComponent={<ListFooter />}
                    ListEmptyComponent={
                        <View style={styles.empty}>
                            <Text style={styles.emptyText}>{EMPTY_COPY}</Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    list: { paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.lg },

    card: {
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 2,
    },
    cardRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    cardIcon: {
        width: 46,
        height: 46,
        borderRadius: 12,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },
    cardMeta: { flex: 1 },
    cardTitle: { fontSize: 15, fontWeight: '800', color: colors.dark, marginBottom: 2 },
    cardSubtitle: { fontSize: 12, color: colors.textSecondary },

    progressBlock: { gap: 6 },
    progressTrack: {
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.grayLight,
        overflow: 'hidden',
    },
    progressFill: { height: '100%', borderRadius: 4 },
    progressLabel: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressPct: { fontSize: 11, fontWeight: '600' },
    progressCta: { fontSize: 11, fontWeight: '800' },

    // Banner quirúrgico
    surgicalBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.purple,
        borderRadius: 14,
        padding: spacing.md,
        marginTop: 4,
    },
    surgicalLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    surgicalIcon: { color: '#FFD84A', fontSize: 16 },
    surgicalTitle: { fontSize: 13, fontWeight: '800', color: colors.white },
    surgicalSub: { fontSize: 11, color: 'rgba(255,255,255,0.70)', marginTop: 2 },
    surgicalPlay: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
    },

    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 13, color: colors.textSecondary, marginTop: 12 },
});
