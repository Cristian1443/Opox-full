import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { api } from '../../api/client';
import { trainingApi } from '../../api/training';

const COLORS = {
    purple: colors.textDark,
    purpleBanner: '#7241B8',
    orange: colors.accentOrange,
    green: colors.ctaGreen,
    white: colors.white,
    cardBorder: 'rgba(65,41,80,0.3)',
    trackGray: 'rgba(65,41,80,0.15)',
    trackOrange: 'rgba(246,150,36,0.15)',
    cardBgCompleted: 'rgba(235,235,235,0.5)',
    subtitleGray: '#C4C4C4',
};

const EMPTY_COPY = 'Aún no hay simulacros disponibles para tu oposición.';

// ─── Tarjeta de simulacro ─────────────────────────────────────────────────────
function ExamCard({ exam, onPress }) {
    const isDone = exam.status === 'completed';
    const isOngoing = exam.status === 'ongoing';
    const action = isDone ? 'Repetir' : isOngoing ? 'Continuar' : 'Empezar';
    const icon = isDone || isOngoing ? 'ribbon-outline' : 'document-text-outline';
    const fillColor = isDone ? COLORS.green : isOngoing ? COLORS.orange : COLORS.trackGray;
    const trackColor = isOngoing ? COLORS.trackOrange : COLORS.trackGray;
    const cardBg = isDone ? COLORS.cardBgCompleted : 'transparent';

    return (
        <TouchableOpacity style={[styles.card, { backgroundColor: cardBg }]} onPress={onPress} activeOpacity={0.85}>
            <View style={styles.cardTopRow}>
                <Ionicons name={icon} size={38} color={COLORS.purple} style={styles.cardIcon} />
                <View style={styles.cardTitleWrap}>
                    <Text style={styles.cardTitle}>Examen {exam.year}</Text>
                    <Text style={styles.cardSubtitle}>{exam.questions} preguntas · {exam.minutes} min</Text>
                </View>
            </View>

            <View style={[styles.track, { backgroundColor: trackColor }]}>
                <View style={[styles.trackFill, { width: `${exam.progress}%`, backgroundColor: fillColor }]} />
            </View>

            <View style={styles.cardBottomRow}>
                <Text style={styles.cardStatus}>{exam.progress}% completado</Text>
                <Text style={styles.cardAction}>{action}</Text>
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

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.nav}>
                    <TouchableOpacity onPress={() => navigation.goBack()}>
                        <Ionicons name="chevron-back" size={22} color={COLORS.purple} />
                    </TouchableOpacity>
                    <View style={styles.navTitleWrap}>
                        <Text style={styles.navTitle}>Simulacros</Text>
                        <Text style={styles.navSubtitle}>Exámenes oficiales</Text>
                    </View>
                    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
                        <Ionicons name="settings-outline" size={22} color={COLORS.purple} />
                    </TouchableOpacity>
                </View>

                {loading ? (
                    <View style={styles.empty}>
                        <ActivityIndicator color={COLORS.orange} />
                    </View>
                ) : loadError ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{loadError}</Text>
                    </View>
                ) : mocks.length === 0 ? (
                    <View style={styles.empty}>
                        <Text style={styles.emptyText}>{EMPTY_COPY}</Text>
                    </View>
                ) : (
                    mocks.map((exam) => (
                        <ExamCard
                            key={exam.id}
                            exam={exam}
                            onPress={() => navigation.navigate('MockInstructions', { exam })}
                        />
                    ))
                )}

                <TouchableOpacity
                    style={styles.banner}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('ErrorLab')}
                >
                    <View style={styles.bannerTextWrap}>
                        <View style={styles.bannerTitleRow}>
                            <Ionicons name="sparkles" size={16} color={COLORS.white} style={{ marginRight: 6 }} />
                            <Text style={styles.bannerTitle}>Iniciar test quirúrgico</Text>
                        </View>
                        <Text style={styles.bannerSubtitle}>
                            Haz clic en el botón para generar test de refuerzo
                        </Text>
                    </View>
                    <View style={styles.playButton}>
                        <Ionicons name="play" size={20} color={COLORS.white} />
                    </View>
                </TouchableOpacity>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: COLORS.white,
    },
    scrollContent: {
        paddingHorizontal: 25,
        paddingTop: 20,
        paddingBottom: 40,
    },

    // Header / NAV
    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 44,
        marginBottom: 20,
    },
    navTitleWrap: {
        alignItems: 'center',
    },
    navTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: COLORS.purple,
        lineHeight: 24,
    },
    navSubtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 20,
        color: COLORS.purple,
        lineHeight: 24,
    },

    // Card
    card: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.cardBorder,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginBottom: 14,
    },
    cardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    cardIcon: {
        marginRight: 12,
    },
    cardTitleWrap: {
        alignItems: 'center',
    },
    cardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: COLORS.purple,
    },
    cardSubtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 11,
        color: COLORS.purple,
        marginTop: 2,
    },
    track: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
        marginBottom: 8,
    },
    trackFill: {
        height: '100%',
        borderRadius: 3,
    },
    cardBottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    cardStatus: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: COLORS.purple,
    },
    cardAction: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: COLORS.purple,
    },

    // Banner
    banner: {
        backgroundColor: COLORS.purpleBanner,
        borderRadius: 16,
        paddingHorizontal: 18,
        paddingVertical: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    bannerTextWrap: {
        flex: 1,
        marginRight: 12,
    },
    bannerTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    bannerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: COLORS.white,
    },
    bannerSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: COLORS.subtitleGray,
        lineHeight: 15,
    },
    playButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: COLORS.orange,
        alignItems: 'center',
        justifyContent: 'center',
    },

    empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
    emptyText: { fontSize: 13, fontFamily: 'Poppins-Regular', color: COLORS.purple, opacity: 0.6, textAlign: 'center' },
});
