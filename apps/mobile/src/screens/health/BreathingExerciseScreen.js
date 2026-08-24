// Bloque 3 · Salud — Pantalla 3.5 · Aviso de descanso · Respiración guiada
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Animated,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

// Ejercicio 4-4 (inspira 4s + espira 4s).
const PHASE_DURATION = 4000;
const TOTAL_SECONDS = 600; // 10 minutos

// Colores confirmados contra Figma (frame RESPIRACION, Bloque 3): fondo
// morado de marca (mismo que colors.textDark) + los 3 círculos en el
// MISMO verde ctaGreen a distinta opacidad, no verdes distintos.
const SCREEN_BG = colors.textDark;
const GREEN_INNER = colors.ctaGreen;
const GREEN_MID = 'rgba(36,189,144,0.5)';
const GREEN_OUTER = 'rgba(36,189,144,0.25)';

export default function BreathingExerciseScreen({ navigation }) {
    const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
    const [phase, setPhase] = useState('inspira');
    const [isActive, setIsActive] = useState(true);

    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isMountedRef = useRef(true);

    useEffect(() => {
        if (!isActive) return;

        const runCycle = () => {
            if (!isMountedRef.current) return;
            setPhase('inspira');
            Animated.timing(scaleAnim, {
                toValue: 1.4,
                duration: PHASE_DURATION,
                useNativeDriver: true,
            }).start(({ finished }) => {
                if (!finished || !isMountedRef.current) return;
                setPhase('espira');
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: PHASE_DURATION,
                    useNativeDriver: true,
                }).start(({ finished: f2 }) => {
                    if (f2 && isMountedRef.current) runCycle();
                });
            });
        };

        runCycle();

        return () => {
            scaleAnim.stopAnimation();
            if (!isActive) scaleAnim.setValue(1);
        };
    }, [isActive, scaleAnim]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    setIsActive(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="light-content" backgroundColor={SCREEN_BG} />

            <View style={styles.content}>
                {/* Círculos concéntricos: outer + middle + inner solid. Tap para pausar. */}
                <TouchableWithoutFeedback onPress={() => setIsActive((v) => !v)}>
                    <View style={styles.ringsWrapper}>
                        <Animated.View
                            style={[
                                styles.ringOuter,
                                { transform: [{ scale: scaleAnim }] },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.ringMiddle,
                                { transform: [{ scale: scaleAnim }] },
                            ]}
                        />
                        <Animated.View
                            style={[
                                styles.ringInner,
                                { transform: [{ scale: scaleAnim }] },
                            ]}
                        >
                            <Text style={styles.phaseText}>
                                {isActive ? (phase === 'inspira' ? 'Inspira' : 'Espira') : 'Pausa'}
                            </Text>
                        </Animated.View>
                    </View>
                </TouchableWithoutFeedback>

                <Text style={styles.title}>Respiración guiada</Text>
                <Text style={styles.subtitle}>Sigue el círculo · 4 s inspira, 4 s espira</Text>

                <Text style={styles.timer}>{formatTime(timeLeft)}</Text>

                <TouchableOpacity
                    style={styles.finishButton}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={styles.finishButtonText}>Terminar antes</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const RING_SIZE = 265;
const RING_INNER = 109;
const RING_MID = 185;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: SCREEN_BG,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    ringsWrapper: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    ringOuter: {
        position: 'absolute',
        width: RING_SIZE,
        height: RING_SIZE,
        borderRadius: RING_SIZE / 2,
        backgroundColor: GREEN_OUTER,
    },
    ringMiddle: {
        position: 'absolute',
        width: RING_MID,
        height: RING_MID,
        borderRadius: RING_MID / 2,
        backgroundColor: GREEN_MID,
    },
    ringInner: {
        position: 'absolute',
        width: RING_INNER,
        height: RING_INNER,
        borderRadius: RING_INNER / 2,
        backgroundColor: GREEN_INNER,
        alignItems: 'center',
        justifyContent: 'center',
    },
    phaseText: {
        color: colors.white,
        fontSize: 19,
        fontFamily: 'Poppins-SemiBold',
    },
    title: {
        fontSize: 21,
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        marginBottom: 4,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 13.8,
        fontFamily: 'Poppins-Light',
        color: 'rgba(255,255,255,0.7)',
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    timer: {
        fontSize: 43.5,
        fontFamily: 'Poppins-Bold',
        color: GREEN_INNER,
        marginBottom: spacing.xl,
    },
    finishButton: {
        width: '100%',
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.purple,
        alignItems: 'center',
        justifyContent: 'center',
    },
    finishButtonText: {
        color: colors.white,
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
    },
});
