import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    Animated,
    Easing,
    Alert,
    FlatList,
    ActivityIndicator,
    ScrollView,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Polygon } from 'react-native-svg';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { colors, spacing } from '../../theme';
import { tutorApi, api } from '../../api';
import { API_BASE_URL } from '../../api/config';

// Colores confirmados contra Figma (frame PODCAST, Bloque 8).
const FIGMA = {
    progressTrack: '#F1F1F1',
    timeLabel: '#919097',
    controlBg: '#EDEDED',
    playBg: 'rgba(36,189,144,0.15)',
    playIcon: '#65C681',
    subtitleMuted: 'rgba(65,41,80,0.5)',
};

// Alturas máximas (px) de cada barra del waveform.
const WAVE_HEIGHTS = [10, 18, 26, 16, 22, 12, 20];

const SPEEDS = [0.5, 1.0, 1.5, 2.0];

const DURACIONES = [
    { key: 'corta', label: 'Corta', sub: '≈ 5 min · repaso' },
    { key: 'media', label: 'Media', sub: '≈ 10 min · tema con calma' },
];

const formatTime = (seconds) => {
    if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
};

// ─── Íconos ───────────────────────────────────────────────────────────────────
function ShuffleIcon({ size = 16, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M16 3H21V8M21 3L14 10M8 6H3M3 6L8 11M3 18H8L14 12M16 21H21V16M21 21L14 14" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SkipIcon({ size = 16, color = colors.textDark, direction = 'next' }) {
    const isNext = direction === 'next';
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points={isNext ? '6,5 15,12 6,19' : '18,5 9,12 18,19'} fill={color} />
            <Rect x={isNext ? 16.6 : 5} y={5} width={2.4} height={14} fill={color} />
        </Svg>
    );
}

function PlayTriangleIcon({ size = 24, color = FIGMA.playIcon }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M7 4L20 12L7 20V4Z" fill={color} />
        </Svg>
    );
}

function RepeatIcon({ size = 16, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 7H17L14 4M20 17H7L10 20" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

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
                            opacity: isPlaying ? 0.7 + i * 0.03 : 0.4,
                        },
                    ]}
                />
            ))}
        </View>
    );
}

// ─── 1) Selector de temas ─────────────────────────────────────────────────────
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
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.pickerHeader}>
                <TouchableOpacity onPress={onBack} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.pickerTitle}>Podcast</Text>
                <View style={{ width: 24 }} />
            </View>

            {loading ? (
                <ActivityIndicator style={{ marginTop: 40 }} color={colors.accentOrange} />
            ) : episodes.length === 0 ? (
                <View style={styles.pickerEmpty}>
                    <Ionicons name="headset-outline" size={44} color={colors.textDark} />
                    <Text style={styles.pickerEmptyText}>Aún no hay temas para tu oposición.</Text>
                </View>
            ) : (
                <FlatList
                    data={episodes}
                    keyExtractor={(ep) => ep.id}
                    ListHeaderComponent={
                        <Text style={styles.pickerHint}>
                            Elige un tema y genera un podcast con la IA.
                        </Text>
                    }
                    contentContainerStyle={styles.pickerList}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={styles.episodeRow}
                            onPress={() => onSelect(item)}
                            activeOpacity={0.75}
                        >
                            <View style={styles.episodeIcon}>
                                <Ionicons name="headset-outline" size={22} color={colors.accentOrange} />
                            </View>
                            <View style={styles.episodeInfo}>
                                <Text style={styles.episodeName} numberOfLines={3}>{item.title}</Text>
                                <Text style={styles.episodeDuration}>Generar podcast con IA</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={FIGMA.subtitleMuted} />
                        </TouchableOpacity>
                    )}
                />
            )}
        </SafeAreaView>
    );
}

// ─── 2) Configuración: duración + velocidad ─────────────────────────────────
function PodcastConfig({ topic, oposicion, onGenerated, onBack }) {
    const [duracion, setDuracion]     = useState('media');
    const [velocidad, setVelocidad]   = useState(1.0);
    const [generating, setGenerating] = useState(false);
    const [error, setError]           = useState(null);

    const handleGenerate = useCallback(async () => {
        setGenerating(true);
        setError(null);
        try {
            const res = await tutorApi.generatePodcast(
                topic.topicId,
                topic.title,
                oposicion,
                duracion,
                velocidad,
            );
            if (res?.error || !res?.data?.filename) {
                setError(res?.error?.message ?? 'No se pudo generar el podcast');
                setGenerating(false);
                return;
            }
            const mp3Url = `${API_BASE_URL}/tutor/podcast/audio/${res.data.filename}`;
            onGenerated({ ...res.data, mp3Url, velocidad });
        } catch (e) {
            setError('Error inesperado generando el podcast');
            setGenerating(false);
        }
    }, [topic, oposicion, duracion, velocidad, onGenerated]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={onBack} style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Podcast</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView contentContainerStyle={styles.genBody} showsVerticalScrollIndicator={false}>
                <Text style={styles.genTopicTitle} numberOfLines={4}>{topic.title}</Text>
                <Text style={styles.genTopicSub}>narrado por la IA</Text>

                <Text style={styles.sectionLabel}>Duración</Text>
                <View style={styles.optRow}>
                    {DURACIONES.map((d) => {
                        const active = duracion === d.key;
                        return (
                            <TouchableOpacity
                                key={d.key}
                                style={[styles.optPill, active && styles.optPillActive]}
                                onPress={() => setDuracion(d.key)}
                                disabled={generating}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.optLabel, active && styles.optLabelActive]}>{d.label}</Text>
                                <Text style={[styles.optSub, active && styles.optSubActive]}>{d.sub}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.sectionLabel}>Velocidad</Text>
                <View style={styles.optRow}>
                    {SPEEDS.map((v) => {
                        const active = velocidad === v;
                        return (
                            <TouchableOpacity
                                key={v}
                                style={[styles.optSmall, active && styles.optSmallActive]}
                                onPress={() => setVelocidad(v)}
                                disabled={generating}
                                activeOpacity={0.75}
                            >
                                <Text style={[styles.optLabel, active && styles.optLabelActive]}>{v}x</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {error ? (
                    <View style={styles.errorCard}>
                        <Ionicons name="alert-circle" size={18} color="#c33" />
                        <Text style={styles.errorText}>{error}</Text>
                    </View>
                ) : null}

                {generating ? (
                    <View style={styles.loadingBlock}>
                        <ActivityIndicator size="large" color={colors.accentOrange} />
                        <Text style={styles.loadingTitle}>Generando podcast…</Text>
                        <Text style={styles.loadingSub}>
                            La IA está redactando y sintetizando el audio.{'\n'}
                            Puede tardar entre 30 s y 2 minutos.
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={handleGenerate}
                        activeOpacity={0.85}
                    >
                        <Ionicons name="sparkles" size={18} color={colors.white} />
                        <Text style={styles.primaryButtonText}>  Generar podcast con IA</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

// ─── 3) Player Figma con expo-audio ──────────────────────────────────────────
function PodcastPlayer({ topic, podcast, onBack, onNewPodcast }) {
    // podcast.velocidad viene del config — la velocidad Ya va grabada en el mp3,
    // pero también podemos aplicar rate del player para ajuste fino.
    const player = useAudioPlayer({ uri: podcast.mp3Url });
    const status = useAudioPlayerStatus(player);

    const [showExitModal, setShowExitModal] = useState(false);
    const [sleepMinutes, setSleepMinutes]   = useState(null);
    const sleepTimerRef = useRef(null);
    const waveAnim      = useRef(new Animated.Value(0)).current;
    const waveLoop      = useRef(null);

    const isPlaying = status?.playing ?? false;
    const elapsed   = status?.currentTime ?? 0;
    const totalSecs = status?.duration ?? podcast.totalSeconds ?? 600;
    const progressPct = totalSecs > 0 ? Math.min((elapsed / totalSecs) * 100, 100) : 0;

    // Waveform animado mientras reproduce
    useEffect(() => {
        if (isPlaying) {
            waveLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnim, { toValue: 1, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                    Animated.timing(waveAnim, { toValue: 0, duration: 480, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
                ]),
            );
            waveLoop.current.start();
        } else {
            waveLoop.current?.stop();
            waveAnim.setValue(0);
        }
        return () => waveLoop.current?.stop();
    }, [isPlaying, waveAnim]);

    // Cleanup del sleep timer al desmontar
    useEffect(() => () => clearTimeout(sleepTimerRef.current), []);

    const togglePlay = useCallback(() => {
        if (isPlaying) player.pause();
        else player.play();
    }, [player, isPlaying]);

    const skipBy = useCallback((delta) => {
        const nextTime = Math.max(0, Math.min(totalSecs, elapsed + delta));
        player.seekTo(nextTime);
    }, [player, elapsed, totalSecs]);

    const scheduleSleep = useCallback((minutes) => {
        clearTimeout(sleepTimerRef.current);
        setSleepMinutes(minutes);
        sleepTimerRef.current = setTimeout(() => {
            player.pause();
            setSleepMinutes(null);
        }, minutes * 60 * 1000);
    }, [player]);

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

    const confirmExit = useCallback(() => {
        setShowExitModal(false);
        player.pause();
        onBack();
    }, [player, onBack]);

    const handleMoreOptions = useCallback(() => {
        Alert.alert('Opciones', null, [
            { text: 'Generar otro podcast', onPress: onNewPodcast },
            { text: 'Cancelar', style: 'cancel' },
        ]);
    }, [onNewPodcast]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setShowExitModal(true)}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Podcast</Text>
                <TouchableOpacity
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    onPress={handleMoreOptions}
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color={colors.textDark} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.artwork}>
                    <Waveform waveAnim={waveAnim} isPlaying={isPlaying} />
                </View>

                <Text style={styles.title} numberOfLines={3}>{topic.title}</Text>
                <Text style={styles.subtitle}>{podcast.velocidad}x · narrado por la IA</Text>

                <View style={styles.progressWrap}>
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
                        <View style={[styles.progressThumb, { left: `${progressPct}%` }]} />
                    </View>
                    <View style={styles.timesRow}>
                        <Text style={styles.timeText}>{formatTime(elapsed)}</Text>
                        <Text style={styles.timeText}>{formatTime(totalSecs)}</Text>
                    </View>
                </View>

                <View style={styles.controlsRow}>
                    <TouchableOpacity activeOpacity={0.7}>
                        <ShuffleIcon />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton} activeOpacity={0.7} onPress={() => skipBy(-15)}>
                        <SkipIcon direction="prev" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playButton}
                        activeOpacity={0.85}
                        onPress={togglePlay}
                        accessibilityLabel={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                        {isPlaying ? (
                            <View style={styles.pauseIconWrap}>
                                <View style={styles.pauseBar} />
                                <View style={styles.pauseBar} />
                            </View>
                        ) : (
                            <PlayTriangleIcon />
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.controlButton} activeOpacity={0.7} onPress={() => skipBy(15)}>
                        <SkipIcon direction="next" />
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7}>
                        <RepeatIcon />
                    </TouchableOpacity>
                </View>

                <View style={styles.secondaryControls}>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        accessibilityLabel="Temporizador de sueño"
                        onPress={handleSleepTimer}
                    >
                        <Ionicons
                            name="timer-outline"
                            size={16}
                            color={sleepMinutes ? colors.accentOrange : colors.textDark}
                        />
                        <Text style={[styles.secondaryBtnText, sleepMinutes && { color: colors.accentOrange }]}>
                            {sleepMinutes ? `${sleepMinutes} min` : 'Dormir'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>

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
                            El audio se detendrá.
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

// ─── Pantalla principal ───────────────────────────────────────────────────────
export default function TutorPodcastScreen({ navigation, route }) {
    const [oposicion, setOposicion] = useState(route?.params?.oposicion ?? 'policia-local-galicia');

    useEffect(() => {
        if (route?.params?.oposicion) return;
        api.loadSession().then((session) => {
            const s = session?.user?.oposicion ?? session?.user?.user_metadata?.oposicion;
            if (s) setOposicion(s);
        }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Estados de navegación interna:
    // - selectedTopic === null            → picker
    // - selectedTopic && !podcast         → config
    // - podcast                           → player
    const [selectedTopic, setSelectedTopic] = useState(null);
    const [podcast, setPodcast]             = useState(null);

    if (podcast && selectedTopic) {
        return (
            <PodcastPlayer
                topic={selectedTopic}
                podcast={podcast}
                onBack={() => navigation.goBack()}
                onNewPodcast={() => { setPodcast(null); }}
            />
        );
    }

    if (selectedTopic) {
        return (
            <PodcastConfig
                topic={selectedTopic}
                oposicion={oposicion}
                onGenerated={(p) => setPodcast(p)}
                onBack={() => setSelectedTopic(null)}
            />
        );
    }

    return (
        <EpisodePicker
            oposicion={oposicion}
            onSelect={(ep) => setSelectedTopic({ topicId: ep.topicId, title: ep.title })}
            onBack={() => navigation.goBack()}
        />
    );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
    },
    iconBtn: { width: 32, alignItems: 'center' },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    // ── Picker ──────────────────────────────────────────────────────────────
    pickerHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingVertical: 14,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: FIGMA.progressTrack,
    },
    pickerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
    },
    pickerHint: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: FIGMA.subtitleMuted,
        marginBottom: spacing.md,
    },
    pickerList: { padding: spacing.md, gap: spacing.sm },
    pickerEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
    pickerEmptyText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
    },
    episodeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: FIGMA.controlBg,
        borderRadius: 14,
        padding: spacing.md,
        gap: spacing.md,
    },
    episodeIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: `${colors.accentOrange}20`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    episodeInfo: { flex: 1 },
    episodeName: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.textDark, marginBottom: 3 },
    episodeDuration: { fontFamily: 'Poppins-Regular', fontSize: 12, color: FIGMA.subtitleMuted },

    // ── Config ──────────────────────────────────────────────────────────────
    genBody: { padding: spacing.md, paddingBottom: spacing.xl },
    genTopicTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: colors.textDark,
        textAlign: 'center',
        marginTop: spacing.md,
    },
    genTopicSub: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    optRow: { flexDirection: 'row', gap: 8 },
    optPill: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: FIGMA.controlBg,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optPillActive: { backgroundColor: `${colors.accentOrange}20`, borderColor: colors.accentOrange },
    optSmall: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 10,
        backgroundColor: FIGMA.controlBg,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    optSmallActive: { backgroundColor: `${colors.accentOrange}20`, borderColor: colors.accentOrange },
    optLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.textDark },
    optLabelActive: { color: colors.accentOrange },
    optSub: { fontFamily: 'Poppins-Regular', fontSize: 10.5, color: FIGMA.subtitleMuted, marginTop: 2 },
    optSubActive: { color: colors.accentOrange, opacity: 0.85 },

    errorCard: {
        marginTop: spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: spacing.md,
        borderRadius: 10,
        backgroundColor: '#fbeaea',
    },
    errorText: { flex: 1, fontFamily: 'Poppins-Regular', fontSize: 13, color: '#a33' },

    loadingBlock: { alignItems: 'center', marginTop: spacing.lg, gap: spacing.sm, paddingHorizontal: spacing.md },
    loadingTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginTop: spacing.sm,
    },
    loadingSub: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
    },
    primaryButton: {
        marginTop: spacing.lg,
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'row',
        paddingHorizontal: spacing.lg,
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        fontSize: 15,
    },

    // ── Player ──────────────────────────────────────────────────────────────
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    artwork: {
        width: 199,
        height: 199,
        borderRadius: 99.5,
        backgroundColor: colors.textDark,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.lg,
    },
    waveRow: { flexDirection: 'row', alignItems: 'center', height: 30, gap: 6 },
    waveBar: { width: 5, borderRadius: 2.5, backgroundColor: colors.accentOrange },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    progressWrap: { alignSelf: 'stretch', marginBottom: spacing.xl },
    progressTrack: { height: 7.3, borderRadius: 1.78, backgroundColor: FIGMA.progressTrack },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        height: 7.3,
        borderRadius: 1.78,
        backgroundColor: colors.accentOrange,
    },
    progressThumb: {
        position: 'absolute',
        width: 20.1,
        height: 20.1,
        borderRadius: 10.05,
        backgroundColor: colors.accentOrange,
        top: -6.4,
        marginLeft: -10.05,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    timesRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
    timeText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        letterSpacing: 0.44,
        color: FIGMA.timeLabel,
    },
    controlsRow: { flexDirection: 'row', alignItems: 'center', gap: 20, marginBottom: spacing.lg },
    controlButton: {
        width: 33,
        height: 33,
        borderRadius: 16.5,
        backgroundColor: FIGMA.controlBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playButton: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: FIGMA.playBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    pauseIconWrap: { flexDirection: 'row', gap: 4 },
    pauseBar: { width: 3.5, height: 16, borderRadius: 1.5, backgroundColor: FIGMA.playIcon },
    secondaryControls: { flexDirection: 'row', gap: spacing.md },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: FIGMA.controlBg,
    },
    secondaryBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 12, color: colors.textDark },

    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCard: {
        width: width * 0.8,
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        marginBottom: spacing.sm,
    },
    modalText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: spacing.lg,
    },
    modalBtns: { flexDirection: 'row', gap: spacing.sm, width: '100%' },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: FIGMA.controlBg,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: { fontFamily: 'Poppins-SemiBold', color: colors.textDark },
    modalConfirmBtn: {
        flex: 1,
        backgroundColor: colors.accentOrange,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalConfirmText: { fontFamily: 'Poppins-SemiBold', color: colors.white },
});
