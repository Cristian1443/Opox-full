import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    Modal,
    Animated,
    Easing,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect, Polygon } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// Colores confirmados contra Figma (frame PODCAST, Bloque 8) sin
// equivalente exacto en theme.js.
const FIGMA = {
    progressTrack: '#F1F1F1',
    timeLabel: '#919097',
    controlBg: '#EDEDED',
    playBg: 'rgba(36,189,144,0.15)',
    // Verde más claro que colors.ctaGreen, documentado tal cual está en
    // Figma (a confirmar con diseño si debería unificarse).
    playIcon: '#65C681',
    subtitleMuted: 'rgba(65,41,80,0.5)',
};

// Alturas máximas (px) de cada barra del waveform — distribución asimétrica
// para que parezca una onda de audio real y no un bloque uniforme.
const WAVE_HEIGHTS = [10, 18, 26, 16, 22, 12, 20];

const SPEEDS = [0.5, 1.0, 1.5, 2.0];
const TOTAL_SECONDS = 600; // 10:00

const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
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

// Waveform animado (mejora funcional, no viene del diseño estático) dentro
// de la carátula circular, con las barras naranjas confirmadas en Figma.
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

export default function TutorPodcastScreen({ navigation, route }) {
    const episodeId = route?.params?.episodeId ?? null;

    const [title, setTitle]       = useState(route?.params?.title    ?? 'Constitución Española');
    const [subtitle, setSubtitle] = useState(route?.params?.subtitle ?? 'Título I');
    const [totalSecs, setTotalSecs] = useState(TOTAL_SECONDS);

    const [isPlaying, setIsPlaying]       = useState(false);
    const [elapsed, setElapsed]           = useState(0);
    const [speedIdx, setSpeedIdx]         = useState(2);
    const [showExitModal, setShowExitModal] = useState(false);
    const [sleepMinutes, setSleepMinutes]   = useState(null);

    const waveAnim     = useRef(new Animated.Value(0)).current;
    const waveLoop     = useRef(null);
    const timerRef     = useRef(null);
    const sleepTimerRef = useRef(null);
    const progressSaveRef = useRef(null);

    useEffect(() => () => clearTimeout(sleepTimerRef.current), []);

    // Carga los metadatos y el progreso guardado del episodio
    useEffect(() => {
        if (!episodeId) {
            setElapsed(252); // posición demo cuando no hay episodio real
            return;
        }
        Promise.all([
            tutorApi.getEpisode(episodeId).catch(() => null),
            tutorApi.getProgress(episodeId).catch(() => null),
        ]).then(([epRes, progRes]) => {
            if (!epRes?.error && epRes?.data) {
                const ep = epRes.data;
                setTitle(ep.title);
                setSubtitle(ep.oposicion ?? '');
                setTotalSecs(ep.totalSeconds ?? TOTAL_SECONDS);
            }
            if (!progRes?.error && progRes?.data?.positionSecs != null) {
                setElapsed(progRes.data.positionSecs);
            }
        });
    }, [episodeId]);

    // Guarda el progreso cada 10 s mientras se reproduce
    useEffect(() => {
        if (!episodeId || !isPlaying) return;
        progressSaveRef.current = setInterval(() => {
            tutorApi.saveProgress(episodeId, elapsed).catch(() => {});
        }, 10_000);
        return () => clearInterval(progressSaveRef.current);
    }, [episodeId, isPlaying, elapsed]);

    const speed = SPEEDS[speedIdx];
    const progressPct = Math.min((elapsed / totalSecs) * 100, 100);

    // ── Animación de onda ─────────────────────────────────────────────────────
    useEffect(() => {
        if (isPlaying) {
            waveLoop.current = Animated.loop(
                Animated.sequence([
                    Animated.timing(waveAnim, {
                        toValue: 1,
                        duration: 480,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: false, // height no admite native driver
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
    }, [isPlaying]);

    // ── Timer simulado — TODO: reemplazar por expo-av cuando se integre audio real ──
    useEffect(() => {
        if (isPlaying && elapsed < totalSecs) {
            timerRef.current = setInterval(() => {
                setElapsed((prev) => {
                    if (prev + 1 >= totalSecs) {
                        setIsPlaying(false);
                        return totalSecs;
                    }
                    return prev + 1;
                });
            }, 1000 / speed);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, speed, elapsed, totalSecs]);

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
                <Text style={styles.headerTitle}>Podcasts</Text>
                <TouchableOpacity
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Más opciones"
                    onPress={handleMoreOptions}
                >
                    <Ionicons name="ellipsis-horizontal" size={22} color={colors.textDark} />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.artwork}>
                    <Waveform waveAnim={waveAnim} isPlaying={isPlaying} />
                </View>

                <Text style={styles.title} numberOfLines={2}>{title}</Text>
                <Text style={styles.subtitle}>{subtitle} · narrado por la IA</Text>

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

                {/* Controles: aleatorio y repetir son decorativos (no hay cola de
                    reproducción real); anterior/siguiente hacen skip ±15s real —
                    mismo patrón usado en MeditationPlayerScreen. */}
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
                        onPress={() => setIsPlaying((v) => !v)}
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

                {/* Controles secundarios (velocidad, temporizador de sueño) — sin
                    datos de Figma, restyleados al lenguaje visual claro del bloque. */}
                <View style={styles.secondaryControls}>
                    <TouchableOpacity
                        style={styles.secondaryBtn}
                        onPress={cycleSpeed}
                        accessibilityLabel={`Velocidad: ${speed}x`}
                    >
                        <Ionicons name="speedometer-outline" size={16} color={colors.textDark} />
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
                            Perderás el progreso de esta sesión de audio.
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

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
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
    waveRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 30,
        gap: 6,
    },
    waveBar: {
        width: 5,
        borderRadius: 2.5,
        backgroundColor: colors.accentOrange,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    progressWrap: {
        alignSelf: 'stretch',
        marginBottom: spacing.xl,
    },
    progressTrack: {
        height: 7.3,
        borderRadius: 1.78,
        backgroundColor: FIGMA.progressTrack,
    },
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
    timesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    timeText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 5.3,
        letterSpacing: 0.44,
        color: FIGMA.timeLabel,
    },
    controlsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
        marginBottom: spacing.lg,
    },
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
    pauseIconWrap: {
        flexDirection: 'row',
        gap: 4,
    },
    pauseBar: {
        width: 3.5,
        height: 16,
        borderRadius: 1.5,
        backgroundColor: FIGMA.playIcon,
    },
    secondaryControls: {
        flexDirection: 'row',
        gap: spacing.md,
    },
    secondaryBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: FIGMA.controlBg,
    },
    secondaryBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12,
        color: colors.textDark,
    },
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
    modalBtns: {
        flexDirection: 'row',
        gap: spacing.sm,
        width: '100%',
    },
    modalCancelBtn: {
        flex: 1,
        backgroundColor: FIGMA.controlBg,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
    },
    modalConfirmBtn: {
        flex: 1,
        backgroundColor: colors.accentOrange,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
    },
    modalConfirmText: {
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
    },
});
