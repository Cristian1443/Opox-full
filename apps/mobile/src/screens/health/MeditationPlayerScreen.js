// Bloque 3 · Salud — Pantalla 3.9a · Reproductor de sesión de meditación
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
    StatusBar,
    Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Polygon } from 'react-native-svg';
import { colors, spacing } from '../../theme';

function MoonIcon({ size = 100, color = '#FFFFFF' }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 192 192" fill="none">
            <Path
                d="M133.733 140.445C114.483 138.696 96.3152 130.774 81.9396 117.859C68.7366 106.357 59.2309 91.2102 54.618 74.3227C47.7233 49.3846 50.9408 25.6226 63.572 3C33.1249 13.8978 -1.60622 50.5424 3.50508 102.422C5.97052 126.629 17.5096 149.008 35.8041 165.061C54.0987 181.114 77.7932 189.652 102.127 188.961C128.603 188.263 151.108 178.063 169.585 159.079C177.547 150.901 189.001 132.708 189.001 128.426C172.325 138.203 152.965 142.412 133.733 140.445Z"
                stroke={color}
                strokeWidth={6}
                strokeLinejoin="round"
            />
        </Svg>
    );
}

// expo-av fue removido: su .so nativo es incompatible con el JSI de React Native
// 0.86.x (UnsatisfiedLinkError en cada arranque de la app). Hasta migrar a
// expo-audio, esta pantalla funciona en modo timer puro (ExpoAudio siempre null).
const ExpoAudio = null;

// Mapa de sesiones → archivo de audio local.
// Para activar audio en una sesión: añadir el .mp3 en apps/mobile/assets/audio/
// y descomentar la línea correspondiente.
const AUDIO_FILES = {
    'Calma antes del examen': null, // require('../../assets/audio/calma_examen.mp3')
    'Respiración 4-7-8':      null, // require('../../assets/audio/respiracion_478.mp3')
    'Bajar la activación':    null, // require('../../assets/audio/bajar_activacion.mp3')
    'Foco en 3 minutos':      null, // require('../../assets/audio/foco_3min.mp3')
};

const { width } = Dimensions.get('window');

const FIGMA = {
    moonCircleBg: '#4B5768',
    subtitleGray: '#C4C4C4',
    progressTrack: '#F1F1F1',
    timeLabel: '#919097',
    outlineIcon: '#E0DFE6',
    secondaryButtonBg: '#EDEDED',
    playTriangle: '#65C681',
};

function ShuffleIcon({ size = 18, color = FIGMA.outlineIcon }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M3 6h4l10 12h4" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M3 18h4l2.5-3" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M14.5 6H21m0 0l-3-3m3 3l-3 3" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M21 18h-6.5m6.5 0l-3 3m3-3l-3-3" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function RepeatIcon({ size = 18, color = FIGMA.outlineIcon }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 9a5 5 0 0 1 5-5h9" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Path d="M18 4l3 3-3 3" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M20 15a5 5 0 0 1-5 5H6" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" />
            <Path d="M6 20l-3-3 3-3" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SkipIcon({ size = 14, color = colors.textDark, direction = 'next' }) {
    const isNext = direction === 'next';
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points={isNext ? '5,4 17,12 5,20' : '19,4 7,12 19,20'} fill={color} />
            <Path d={isNext ? 'M18 4v16' : 'M6 4v16'} stroke={color} strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
    );
}

function PlayTriangleIcon({ size = 20, color = FIGMA.playTriangle }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Polygon points="6,4 20,12 6,20" fill={color} />
        </Svg>
    );
}

const DEFAULT_SESSION = {
    title: 'Calma antes del examen',
    subtitle: 'Gestión de la ansiedad',
    duration: '8:00',
};

const parseDurationSeconds = (str) => {
    if (typeof str !== 'string') return 480;
    if (str.includes(':')) {
        const [mins, secs = 0] = str.split(':').map((n) => Number(n) || 0);
        return mins * 60 + Number(secs);
    }
    const match = str.match(/(\d+)/);
    return match ? Number(match[1]) * 60 : 480;
};

export default function MeditationPlayerScreen({ navigation, route }) {
    const session = route?.params?.session ?? DEFAULT_SESSION;
    const totalSeconds = parseDurationSeconds(session.duration);

    const [isPlaying, setIsPlaying] = useState(false);
    const [timeLeft, setTimeLeft] = useState(totalSeconds);
    const [showExitModal, setShowExitModal] = useState(false);
    const [audioReady, setAudioReady] = useState(false);

    const soundRef = useRef(null);
    const timerRef = useRef(null);

    // ── Carga de audio ────────────────────────────────────────────────────────
    useEffect(() => {
        const audioSource = AUDIO_FILES[session.audioKey ?? session.title];
        if (!ExpoAudio || !audioSource) return; // sin audio → timer puro

        let mounted = true;

        (async () => {
            try {
                await ExpoAudio.setAudioModeAsync({
                    allowsRecordingIOS: false,
                    staysActiveInBackground: true,
                    playsInSilentModeIOS: true,    // reproduce con el switch silencio en iOS
                    shouldDuckAndroid: true,
                });

                const { sound } = await ExpoAudio.Sound.createAsync(
                    audioSource,
                    { shouldPlay: false, isLooping: false },
                    (status) => {
                        if (!mounted || !status.isLoaded) return;
                        if (status.didJustFinish) {
                            setIsPlaying(false);
                            setTimeLeft(0);
                            return;
                        }
                        // Sincronizar el timer con la posición real del audio.
                        if (status.isPlaying && status.durationMillis) {
                            const remaining = status.durationMillis - status.positionMillis;
                            setTimeLeft(Math.max(0, Math.ceil(remaining / 1000)));
                        }
                    },
                );

                soundRef.current = sound;
                if (mounted) setAudioReady(true);
            } catch {
                // Fallo al cargar → fallback silencioso a timer puro
            }
        })();

        return () => {
            mounted = false;
            if (soundRef.current) {
                soundRef.current.unloadAsync();
                soundRef.current = null;
            }
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Timer de fallback (solo cuando no hay audio cargado) ──────────────────
    useEffect(() => {
        if (audioReady) return; // el callback de audio maneja el tiempo
        if (isPlaying && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) { setIsPlaying(false); return 0; }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, timeLeft, audioReady]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressed = totalSeconds - timeLeft;
    const progressPct = totalSeconds > 0 ? (progressed / totalSeconds) * 100 : 0;

    // ── Handlers ──────────────────────────────────────────────────────────────

    const handlePlayPause = useCallback(async () => {
        const sound = soundRef.current;
        if (audioReady && sound) {
            try {
                if (isPlaying) {
                    await sound.pauseAsync();
                } else {
                    if (timeLeft === 0) await sound.setPositionAsync(0);
                    await sound.playAsync();
                }
            } catch { /* fallback: el setIsPlaying de abajo maneja la UI */ }
        }
        setIsPlaying((v) => !v);
    }, [audioReady, isPlaying, timeLeft]);

    const skipBy = useCallback(async (deltaSec) => {
        const sound = soundRef.current;
        if (audioReady && sound) {
            try {
                const status = await sound.getStatusAsync();
                if (status.isLoaded) {
                    const newPos = Math.max(
                        0,
                        Math.min(status.durationMillis ?? 0, status.positionMillis + deltaSec * 1000),
                    );
                    await sound.setPositionAsync(newPos);
                }
            } catch { /* ignorar */ }
        }
        // Actualizar timer local también (por si no hay audio o el seek falla)
        setTimeLeft((prev) => Math.max(0, Math.min(totalSeconds, prev - deltaSec)));
    }, [audioReady, totalSeconds]);

    const confirmExit = useCallback(async () => {
        setShowExitModal(false);
        setIsPlaying(false);
        const sound = soundRef.current;
        if (sound) {
            try { await sound.stopAsync(); } catch { /* ok */ }
        }
        navigation.goBack();
    }, [navigation]);

    // ── UI ────────────────────────────────────────────────────────────────────
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={colors.textDark} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setShowExitModal(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <View style={styles.moonCircle}>
                    <MoonIcon size={100} />
                </View>

                <Text style={styles.title}>{session.title}</Text>
                <Text style={styles.subtitle}>{session.subtitle}</Text>

                <View style={styles.progressWrap}>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFg, { width: `${progressPct}%` }]} />
                        <View style={[styles.progressThumb, { left: `${progressPct}%` }]} />
                    </View>
                    <View style={styles.timesRow}>
                        <Text style={styles.timeText}>{formatTime(progressed)}</Text>
                        <Text style={styles.timeText}>{formatTime(totalSeconds)}</Text>
                    </View>
                </View>

                <View style={styles.controls}>
                    <TouchableOpacity activeOpacity={0.7}>
                        <ShuffleIcon />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.75}
                        onPress={() => skipBy(15)}
                    >
                        <SkipIcon direction="previous" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playBtn}
                        activeOpacity={0.85}
                        onPress={handlePlayPause}
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

                    <TouchableOpacity
                        style={styles.secondaryButton}
                        activeOpacity={0.75}
                        onPress={() => skipBy(-15)}
                    >
                        <SkipIcon direction="next" />
                    </TouchableOpacity>

                    <TouchableOpacity activeOpacity={0.7}>
                        <RepeatIcon />
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
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¿Terminar la sesión?</Text>
                        <Text style={styles.modalText}>
                            Si sales ahora, no se completará el tiempo de meditación.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={styles.modalCancelBtn}
                                onPress={() => setShowExitModal(false)}
                            >
                                <Text style={styles.modalCancelText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmExit}>
                                <Text style={styles.modalConfirmText}>Terminar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.textDark,
    },
    header: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    moonCircle: {
        width: 249,
        height: 249,
        borderRadius: 249 / 2,
        backgroundColor: FIGMA.moonCircleBg,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontFamily: 'Poppins-Light',
        fontSize: 13.8,
        color: FIGMA.subtitleGray,
        textAlign: 'center',
        marginBottom: spacing.xl * 2,
    },
    progressWrap: {
        alignSelf: 'stretch',
        marginBottom: spacing.xl,
    },
    progressBg: {
        height: 7.3,
        backgroundColor: FIGMA.progressTrack,
        borderRadius: 1.8,
        marginBottom: spacing.sm,
    },
    progressFg: {
        height: 7.3,
        borderRadius: 1.8,
        backgroundColor: colors.accentOrange,
        position: 'absolute',
        left: 0,
        top: 0,
    },
    progressThumb: {
        position: 'absolute',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: colors.accentOrange,
        top: -6.3,
        marginLeft: -10,
    },
    timesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11,
        letterSpacing: 0.5,
        color: FIGMA.timeLabel,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 20,
    },
    secondaryButton: {
        width: 33,
        height: 33,
        borderRadius: 33 / 2,
        backgroundColor: FIGMA.secondaryButtonBg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    playBtn: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.ctaGreen,
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
        backgroundColor: FIGMA.playTriangle,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        width: width * 0.8,
        backgroundColor: colors.card,
        borderRadius: 20,
        padding: spacing.xl,
        alignItems: 'center',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    modalText: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    modalButtons: {
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
        color: '#FFFFFF',
        fontWeight: '700',
    },
});
