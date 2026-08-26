import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Modal,
    Animated,
    Easing,
    Alert,
    FlatList,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// ─── Constantes de color del bloque 8 · Podcast ──────────────────────────────
// Fondo oscuro análogo al de MeditationPlayerScreen pero en azul
const BG_DARK = '#0D2440';
const BLUE_ACCENT = '#4A8FC4';
const WHITE_DIM = 'rgba(255,255,255,0.65)';
const WHITE_FAINT = 'rgba(255,255,255,0.15)';

// Alturas máximas (px) de cada barra del waveform — distribución asimétrica para
// que parezca una onda de audio real y no un bloque uniforme
const WAVE_HEIGHTS = [6, 14, 22, 18, 28, 10, 24, 20, 30, 16, 12, 8];

const SPEEDS = [0.5, 1.0, 1.5, 2.0];
const TOTAL_SECONDS = 600; // 10:00

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// ─── Componente waveform ──────────────────────────────────────────────────────
function Waveform({ waveAnim, isPlaying }) {
    return (
        <View style={styles.waveRow}>
            {WAVE_HEIGHTS.map((maxH, i) => (
                <Animated.View
                    key={i}
                    style={[
                        styles.waveBar,
                        {
                            height: waveAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [4, maxH],
                            }),
                            opacity: isPlaying ? 0.55 + i * 0.04 : 0.25,
                        },
                    ]}
                />
            ))}
        </View>
    );
}

// ─── Selector de episodios ────────────────────────────────────────────────────
function EpisodePicker({ oposicion, onSelect, onBack }) {
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        tutorApi.listEpisodes(oposicion)
            .then((res) => {
                if (!res?.error && Array.isArray(res?.data)) setEpisodes(res.data);
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [oposicion]);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
            <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="arrow-back" size={22} color={colors.dark} />
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Episodios</Text>
                <View style={{ width: 22 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.primary} />
            ) : episodes.length === 0 ? (
                <View style={styles.pickerEmpty}>
                    <Ionicons name="headset-outline" size={44} color={colors.textSecondary} />
                    <Text style={styles.pickerEmptyText}>No hay episodios disponibles</Text>
                </View>
            ) : (
                <FlatList
                    data={episodes}
                    keyExtractor={(ep) => ep.id}
                    contentContainerStyle={styles.pickerList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.episodeRow}
                            onPress={() => onSelect(item)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.episodeIcon}>
                                <Ionicons name="headset-outline" size={22} color={BLUE_ACCENT} />
                            </View>
                            <View style={styles.episodeInfo}>
                                <Text style={styles.episodeName} numberOfLines={2}>{item.title}</Text>
                                <Text style={styles.episodeDuration}>
                                    {Math.floor((item.totalSeconds ?? TOTAL_SECONDS) / 60)} min
                                </Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function TutorPodcastScreen({ navigation, route }) {
    const oposicion        = route?.params?.oposicion ?? 'aux-adm-estado';
    const initialEpisodeId = route?.params?.episodeId ?? null;

    // ── Todos los hooks deben ir ANTES de cualquier return condicional ─────────
    const [selectedEpisode, setSelectedEpisode] = useState(
        initialEpisodeId ? { id: initialEpisodeId, title: route?.params?.title, totalSeconds: null } : null
    );
    const [title, setTitle]                     = useState(route?.params?.title    ?? 'Constitución Española');
    const [subtitle, setSubtitle]               = useState(route?.params?.subtitle ?? 'Título I');
    const [totalSecs, setTotalSecs]             = useState(TOTAL_SECONDS);
    const [isPlaying, setIsPlaying]             = useState(false);
    const [elapsed, setElapsed]                 = useState(0);
    const [speedIdx, setSpeedIdx]               = useState(2);
    const [showExitModal, setShowExitModal]     = useState(false);
    const [sleepMinutes, setSleepMinutes]       = useState(null);

    const waveAnim        = useRef(new Animated.Value(0)).current;
    const waveLoop        = useRef(null);
    const timerRef        = useRef(null);
    const sleepTimerRef   = useRef(null);
    const progressSaveRef = useRef(null);

    const episodeId = selectedEpisode?.id ?? null;

    useEffect(() => () => clearTimeout(sleepTimerRef.current), []);

    // Carga el progreso guardado del episodio (metadatos ya vienen del selector o params)
    useEffect(() => {
        if (!episodeId) return;
        tutorApi.getProgress(episodeId)
            .then((progRes) => {
                if (!progRes?.error && progRes?.data?.positionSecs != null) {
                    setElapsed(progRes.data.positionSecs);
                }
            })
            .catch(() => {});
    }, [episodeId]);

    // Guarda el progreso cada 10 s mientras se reproduce
    useEffect(() => {
        if (!episodeId || !isPlaying) return;
        progressSaveRef.current = setInterval(() => {
            tutorApi.saveProgress(episodeId, elapsed).catch(() => {});
        }, 10_000);
        return () => clearInterval(progressSaveRef.current);
    }, [episodeId, isPlaying, elapsed]);

    // ── Animación de onda ─────────────────────────────────────────────────────
    useEffect(() => {
        if (!selectedEpisode) return;
        if (isPlaying) {
            waveLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnim, {
                        toValue: 1,
                        duration: 480,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                    Animated.timing(waveAnim, {
                        toValue: 0,
                        duration: 480,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false,
                    }),
                ])
            );
            waveLoop.current.start();
        } else {
            waveLoop.current?.stop();
            waveAnim.setValue(0);
        }
        return () => waveLoop.current?.stop();
    }, [isPlaying, selectedEpisode]);

    // ── Timer simulado — TODO: reemplazar por expo-av cuando se integre audio real ──
    useEffect(() => {
        if (!selectedEpisode || !isPlaying || elapsed >= totalSecs) return;
        const speed = SPEEDS[speedIdx];
        timerRef.current = setInterval(() => {
            setElapsed((prev) => {
                if (prev + 1 >= totalSecs) {
                    setIsPlaying(false);
                    return totalSecs;
                }
                return prev + 1;
            });
        }, 1000 / speed);
        return () => clearInterval(timerRef.current);
    }, [isPlaying, speedIdx, elapsed, totalSecs, selectedEpisode]);

    const skipBy = useCallback((delta) => {
        setElapsed((prev) => Math.max(0, Math.min(totalSecs, prev + delta)));
    }, [totalSecs]);

    const cycleSpeed = useCallback(() => {
        setSpeedIdx((prev) => (prev + 1) % SPEEDS.length);
    }, []);

    const confirmExit = useCallback(() => {
        setShowExitModal(false);
        setIsPlaying(false);
        navigation.goBack();
    }, [navigation]);

    const scheduleSleep = useCallback((minutes) => {
        clearTimeout(sleepTimerRef.current);
        setSleepMinutes(minutes);
        sleepTimerRef.current = setTimeout(() => {
            setIsPlaying(false);
            setSleepMinutes(null);
        }, minutes * 60 * 1000);
    }, []);

    const handleSleepTimer = useCallback(() => {
        Alert.alert('Apagar en…', sleepMinutes ? `Activo: ${sleepMinutes} min` : null, [
            { text: '15 minutos', onPress: () => scheduleSleep(15) },
            { text: '30 minutos', onPress: () => scheduleSleep(30) },
            { text: '60 minutos', onPress: () => scheduleSleep(60) },
            {
                text: sleepMinutes ? 'Cancelar temporizador' : 'Cancelar',
                style: 'cancel',
                onPress: () => {
                    if (sleepMinutes) {
                        clearTimeout(sleepTimerRef.current);
                        setSleepMinutes(null);
                    }
                },
            },
        ]);
    }, [sleepMinutes, scheduleSleep]);

    const handleMoreOptions = useCallback(() => {
        Alert.alert('Opciones', null, [
            { text: 'Compartir episodio', onPress: () => {} },
            { text: 'Ver transcripción', onPress: () => {} },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    }, []);

    const speed       = SPEEDS[speedIdx];
    const progressPct = Math.min((elapsed / totalSecs) * 100, 100);

    // ── Selector de episodios (return condicional DESPUÉS de todos los hooks) ──
    if (!selectedEpisode) {
        return (
            <EpisodePicker
                oposicion={oposicion}
                onSelect={(ep) => {
                    setTitle(ep.title);
                    setSubtitle(ep.oposicion ?? oposicion);
                    setTotalSecs(ep.totalSeconds ?? TOTAL_SECONDS);
                    setSelectedEpisode(ep);
                }}
                onBack={() => navigation.goBack()}
            />
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={BG_DARK} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setShowExitModal(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Minimizar reproductor"
                >
                    <Ionicons name="chevron-down" size={26} color="#fff" />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>Modo Podcast</Text>

                <TouchableOpacity
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Más opciones"
                    onPress={handleMoreOptions}
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Portada */}
                <View style={styles.coverWrap}>
                    <Ionicons name="headset-outline" size={68} color="#fff" />
                </View>

                {/* Waveform */}
                <Waveform waveAnim={waveAnim} isPlaying={isPlaying} />

                {/* Info */}
                <View style={styles.infoBlock}>
                    <Text style={styles.title} numberOfLines={2}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                    <View style={styles.narratorBadge}>
                        <Ionicons name="sparkles-outline" size={12} color={BLUE_ACCENT} />
                        <Text style={styles.narratorText}>Narrado por la IA</Text>
                    </View>
                </View>

                {/* Barra de progreso */}
                <View style={styles.progressWrap}>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFg, { width: `${progressPct}%` }]} />
                    </View>
                    <View style={styles.timesRow}>
                        <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
                        <Text style={styles.timeText}>{formatTime(totalSecs)}</Text>
                    </View>
                </View>

                {/* Controles principales */}
                <View style={styles.controls}>
                    <TouchableOpacity
                        onPress={() => skipBy(-15)}
                        style={styles.skipBtn}
                        accessibilityLabel="Retroceder 15 segundos"
                    >
                        <Ionicons name="play-back" size={26} color="#fff" />
                        <Text style={styles.skipLabel}>15</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playBtn}
                        onPress={() => setIsPlaying((v) => !v)}
                        accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={34}
                            color="#fff"
                            style={isPlaying ? null : { marginLeft: 4 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => skipBy(15)}
                        style={styles.skipBtn}
                        accessibilityLabel="Avanzar 15 segundos"
                    >
                        <Ionicons name="play-forward" size={26} color="#fff" />
                        <Text style={styles.skipLabel}>15</Text>
                    </TouchableOpacity>
                </View>

                {/* Controles secundarios: velocidad y temporizador */}
                <View style={styles.secondaryControls}>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={cycleSpeed}
                        accessibilityLabel={`Velocidad: ${speed}x`}
                    >
                        <Ionicons name="speedometer-outline" size={16} color={WHITE_DIM} />
                        <Text style={styles.secondaryBtnText}>{speed}x</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        accessibilityLabel="Temporizador de sueño"
                        onPress={handleSleepTimer}
                    >
                        <Ionicons
                            name="timer-outline"
                            size={16}
                            color={sleepMinutes ? BLUE_ACCENT : WHITE_DIM}
                        />
                        <Text style={[styles.secondaryBtnText, sleepMinutes && { color: BLUE_ACCENT }]}>
                            {sleepMinutes ? `${sleepMinutes} min` : 'Dormir'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Modal de confirmación de salida */}
            <Modal
                transparent
                visible={showExitModal}
                onRequestClose={() => setShowExitModal(false)}
                animationType="fade"
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>¿Salir del podcast?</Text>
                        <Text style={styles.modalText}>
                            El audio se detendrá. Tu progreso está guardado automáticamente.
                        </Text>
                        <View style={styles.modalBtns}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowExitModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Quedarme</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalConfirmBtn}
                                onPress={confirmExit}
                            >
                                <Text style={styles.modalConfirmText}>Salir</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: BG_DARK,
    },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: WHITE_DIM,
        letterSpacing: 0.4,
        textTransform: 'uppercase',
    },

    // Contenido central
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },

    // Portada
    coverWrap: {
        width: 140,
        height: 140,
        borderRadius: 28,
        backgroundColor: WHITE_FAINT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },

    // Waveform
    waveRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 34,
        gap: 4,
        marginBottom: spacing.lg,
    },
    waveBar: {
        width: 4,
        borderRadius: 2,
        backgroundColor: BLUE_ACCENT,
    },

    // Info
    infoBlock: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: '#fff',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: WHITE_DIM,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    narratorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: WHITE_FAINT,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10,
    },
    narratorText: {
        fontSize: 11,
        fontWeight: '600',
        color: BLUE_ACCENT,
    },

    // Progreso
    progressWrap: {
        alignSelf: 'stretch',
        marginBottom: spacing.xl,
    },
    progressBg: {
        height: 4,
        backgroundColor: WHITE_FAINT,
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFg: {
        height: '100%',
        backgroundColor: BLUE_ACCENT,
        borderRadius: 2,
    },
    timesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        color: WHITE_DIM,
        fontSize: 12,
        fontWeight: '600',
    },

    // Controles principales
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xl,
        marginBottom: spacing.xl,
    },
    skipBtn: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
    },
    skipLabel: {
        color: WHITE_DIM,
        fontSize: 10,
        fontWeight: '700',
        marginTop: 2,
    },
    playBtn: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 14,
        elevation: 10,
    },

    // Controles secundarios
    secondaryControls: {
        flexDirection: 'row',
        gap: spacing.lg,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: WHITE_FAINT,
    },
    secondaryBtnText: {
        color: WHITE_DIM,
        fontSize: 13,
        fontWeight: '700',
    },

    // Selector de episodios
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    pickerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.dark,
    },
    pickerList: {
        padding: spacing.md,
        gap: spacing.sm,
    },
    pickerEmpty: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.md,
    },
    pickerEmptyText: {
        fontSize: 15,
        color: colors.textSecondary,
    },
    episodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        gap: spacing.md,
    },
    episodeIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${BLUE_ACCENT}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    episodeInfo: { flex: 1 },
    episodeName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.dark,
        marginBottom: 3,
    },
    episodeDuration: {
        fontSize: 12,
        color: colors.textSecondary,
    },

    // Modal de salida
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: width * 0.8,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.dark,
        marginBottom: spacing.sm,
    },
    modalText: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    modalBtns: {
        flexDirection: 'row',
        gap: spacing.sm,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: colors.background,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        color: colors.textSecondary,
        fontWeight: '700',
    },
    modalConfirmBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalConfirmText: {
        color: '#fff',
        fontWeight: '700',
    },
});
