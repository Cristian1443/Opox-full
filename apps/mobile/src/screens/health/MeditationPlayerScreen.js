// Bloque 3 · Salud — Pantalla 3.9a · Reproductor de sesión de meditación
import React, { useState, useEffect, useRef } from 'react';
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
import { colors, spacing } from '../../theme';

const { width } = Dimensions.get('window');
const PURPLE_BG = '#3A1F5D';
const PURPLE_LIGHT = 'rgba(255,255,255,0.15)';

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

    const timerRef = useRef(null);

    useEffect(() => {
        setTimeLeft(parseDurationSeconds(session.duration));
    }, [session.duration]);

    useEffect(() => {
        if (isPlaying && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        setIsPlaying(false);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => clearInterval(timerRef.current);
    }, [isPlaying, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const progressed = totalSeconds - timeLeft;
    const progressPct = totalSeconds > 0 ? (progressed / totalSeconds) * 100 : 0;

    const confirmExit = () => {
        setShowExitModal(false);
        setIsPlaying(false);
        navigation.goBack();
    };

    // Skips ±15s.
    const skipBy = (deltaSec) => {
        setTimeLeft((prev) => Math.max(0, Math.min(totalSeconds, prev - deltaSec)));
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={PURPLE_BG} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => setShowExitModal(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                {/* Ícono grande dentro del círculo semitransparente */}
                <View style={styles.moonCircle}>
                    <Ionicons name="moon-outline" size={72} color="#FFFFFF" />
                </View>

                <Text style={styles.title}>{session.title}</Text>
                <Text style={styles.subtitle}>{session.subtitle}</Text>

                {/* Barra de progreso lineal + tiempos */}
                <View style={styles.progressWrap}>
                    <View style={styles.progressBg}>
                        <View style={[styles.progressFg, { width: `${progressPct}%` }]} />
                    </View>
                    <View style={styles.timesRow}>
                        <Text style={styles.timeText}>{formatTime(progressed)}</Text>
                        <Text style={styles.timeText}>{formatTime(totalSeconds)}</Text>
                    </View>
                </View>

                {/* Controles: rewind 15s / play·pause naranja / forward 15s */}
                <View style={styles.controls}>
                    <TouchableOpacity style={styles.skipBtn} onPress={() => skipBy(15)}>
                        <Ionicons name="play-back" size={26} color="#FFFFFF" />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.playBtn}
                        onPress={() => setIsPlaying((v) => !v)}
                    >
                        <Ionicons
                            name={isPlaying ? 'pause' : 'play'}
                            size={34}
                            color="#FFFFFF"
                            style={isPlaying ? null : { marginLeft: 4 }}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.skipBtn} onPress={() => skipBy(-15)}>
                        <Ionicons name="play-forward" size={26} color="#FFFFFF" />
                    </TouchableOpacity>
                </View>
            </View>

            <Modal transparent visible={showExitModal} onRequestClose={() => setShowExitModal(false)} animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>¿Terminar la sesión?</Text>
                        <Text style={styles.modalText}>
                            Si sales ahora, no se completará el tiempo de meditación.
                        </Text>
                        <View style={styles.modalButtons}>
                            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setShowExitModal(false)}>
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
        backgroundColor: PURPLE_BG,
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
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: PURPLE_LIGHT,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: 'rgba(255,255,255,0.7)',
        textAlign: 'center',
        marginBottom: spacing.xl * 2,
    },
    progressWrap: {
        alignSelf: 'stretch',
        marginBottom: spacing.xl,
    },
    progressBg: {
        height: 4,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 2,
        overflow: 'hidden',
        marginBottom: spacing.xs,
    },
    progressFg: {
        height: '100%',
        backgroundColor: '#FFFFFF',
    },
    timesRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    timeText: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xl,
    },
    skipBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
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
