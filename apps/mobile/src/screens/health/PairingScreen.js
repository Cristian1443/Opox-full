// Bloque 3 · Salud — Pantalla 3.3 · Flujo de emparejamiento
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Pasos que se van chequeando. Cuando entre el backend, los ticks los dispara el pairing real.
const STEPS = [
    { id: 'searching', label: 'Dispositivo encontrado', duration: 3000 },
    { id: 'pairing', label: 'Emparejando…', duration: 2000 },
    { id: 'permissions', label: 'Concediendo permisos de salud…', duration: 2000 },
];

const RING_SIZE = 180;
const RING_STROKE = 6;

export default function PairingScreen({ navigation, route }) {
    const device = route?.params?.device;
    const deviceName = device?.name ?? 'dispositivo';

    const [stepIdx, setStepIdx] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    // Animación de giro del anillo mientras se empareja.
    useEffect(() => {
        if (isComplete) return;
        const loop = Animated.loop(
            Animated.timing(rotateAnim, {
                toValue: 1,
                duration: 1400,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [isComplete, rotateAnim]);

    useEffect(() => {
        if (isComplete) return;
        const timer = setTimeout(() => {
            if (stepIdx < STEPS.length - 1) {
                setStepIdx((i) => i + 1);
            } else {
                setIsComplete(true);
            }
        }, STEPS[stepIdx].duration);
        return () => clearTimeout(timer);
    }, [stepIdx, isComplete]);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const currentStep = STEPS[stepIdx];

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader
                title={isComplete ? 'Listo' : 'Emparejando'}
                onBack={() => navigation.goBack()}
            />

            <View style={styles.content}>
                <View style={styles.ringWrapper}>
                    <Animated.View style={{ transform: [{ rotate }] }}>
                        <Svg width={RING_SIZE} height={RING_SIZE}>
                            <Circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={(RING_SIZE - RING_STROKE) / 2}
                                stroke={colors.grayLight}
                                strokeWidth={RING_STROKE}
                                fill="none"
                            />
                            <Circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={(RING_SIZE - RING_STROKE) / 2}
                                stroke={colors.primary}
                                strokeWidth={RING_STROKE}
                                fill="none"
                                strokeDasharray={`${Math.PI * (RING_SIZE - RING_STROKE) * 0.28} ${Math.PI * (RING_SIZE - RING_STROKE)}`}
                                strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                    <View style={styles.deviceIconBox}>
                        <Ionicons name="watch-outline" size={40} color={colors.primary} />
                    </View>
                </View>

                <Text style={styles.title}>
                    {isComplete ? `${deviceName} conectado` : `Buscando tu ${deviceName}…`}
                </Text>
                <Text style={styles.subtitle}>
                    {isComplete
                        ? 'Ya recibimos tus datos en tiempo real.'
                        : 'Acerca el reloj y mantenlo desbloqueado.'}
                </Text>

                {/* Lista de pasos con check dinámico */}
                <View style={styles.stepsList}>
                    {STEPS.map((step, i) => {
                        const done = isComplete || i < stepIdx;
                        const active = !isComplete && i === stepIdx;
                        return (
                            <View key={step.id} style={styles.stepRow}>
                                {done ? (
                                    <Ionicons name="checkmark" size={18} color={colors.success} />
                                ) : active ? (
                                    <Ionicons name="ellipsis-horizontal" size={18} color={colors.primary} />
                                ) : (
                                    <Ionicons name="ellipse-outline" size={18} color={colors.grayMid} />
                                )}
                                <Text
                                    style={[
                                        styles.stepLabel,
                                        done && { color: colors.success },
                                        active && { color: colors.primary },
                                    ]}
                                >
                                    {step.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {isComplete && (
                    <TouchableOpacity
                        style={styles.finishButton}
                        onPress={() => navigation.navigate('HomeHealth')}
                    >
                        <Text style={styles.finishButtonText}>Comenzar a usar</Text>
                    </TouchableOpacity>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
    },
    ringWrapper: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    deviceIconBox: {
        position: 'absolute',
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: colors.primary + '12',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    stepsList: {
        alignSelf: 'stretch',
        gap: spacing.sm,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
    },
    stepLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.grayText,
    },
    finishButton: {
        marginTop: spacing.xl,
        alignSelf: 'stretch',
        backgroundColor: colors.primary,
        paddingVertical: 14,
        borderRadius: 999,
        alignItems: 'center',
    },
    finishButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
