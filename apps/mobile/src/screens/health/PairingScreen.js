// Bloque 3 · Salud — Pantalla 3.3 · Flujo de emparejamiento
// Solicita permisos de salud reales al SO (HealthKit iOS / Health Connect Android).
// No-op en Expo Go — muestra aviso informativo.
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Linking,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { requestHealthPermissions, isHealthAvailable } from '../../services/HealthService';

// Pasos del flujo — ahora mapean a etapas reales del proceso de permisos
const STEPS = [
    { id: 'searching', label: 'Buscando fuentes de datos…' },
    { id: 'pairing',   label: 'Solicitando permisos de salud…' },
    { id: 'sync',      label: 'Primera sincronización…' },
];

const RING_SIZE = 180;
const RING_STROKE = 6;

export default function PairingScreen({ navigation, route }) {
    const device = route?.params?.device;
    const deviceName = device?.name ?? 'dispositivo';

    // 'loading' | 'complete' | 'denied' | 'unavailable'
    const [phase, setPhase] = useState('loading');
    const [stepIdx, setStepIdx] = useState(0);

    const rotateAnim = React.useRef(new Animated.Value(0)).current;

    // Anillo giratorio durante la carga
    useEffect(() => {
        if (phase !== 'loading') return;
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
    }, [phase, rotateAnim]);

    // Flujo de permisos real al montar la pantalla
    useEffect(() => {
        let cancelled = false;

        async function run() {
            // Si no hay módulos nativos (Expo Go) informar y terminar
            if (!isHealthAvailable()) {
                if (!cancelled) setPhase('unavailable');
                return;
            }

            // Paso 1: "buscando"
            if (!cancelled) setStepIdx(0);
            await _wait(1200);

            // Paso 2: solicitar permisos al SO
            if (!cancelled) setStepIdx(1);
            const granted = await requestHealthPermissions();

            if (cancelled) return;

            if (!granted) {
                setPhase('denied');
                return;
            }

            // Paso 3: primera lectura / sincronización visual
            setStepIdx(2);
            await _wait(1000);

            if (!cancelled) setPhase('complete');
        }

        run();
        return () => { cancelled = true; };
    }, []);

    const rotate = rotateAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // ── Estado: permisos denegados ───────────────────────────────────────────
    if (phase === 'denied') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <HealthScreenHeader title="Sin acceso" onBack={() => navigation.goBack()} />
                <View style={styles.centeredContent}>
                    <Ionicons name="alert-circle" size={64} color={colors.error} />
                    <Text style={styles.deniedTitle}>Permiso denegado</Text>
                    <Text style={styles.deniedSubtitle}>
                        Sin datos de salud no podremos calcular tu nivel de fatiga.{'\n'}
                        Puedes activarlo más tarde en Ajustes del dispositivo.
                    </Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => Linking.openSettings()}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.settingsButtonText}>Ir a Ajustes</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.skipButton}
                        onPress={() => navigation.navigate('HomeHealth')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.skipButtonText}>Continuar igualmente</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Estado: Expo Go — módulos no disponibles ──────────────────────────────
    if (phase === 'unavailable') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <HealthScreenHeader title="No disponible" onBack={() => navigation.goBack()} />
                <View style={styles.centeredContent}>
                    <Ionicons name="information-circle" size={64} color={colors.primary} />
                    <Text style={styles.deniedTitle}>Requiere EAS build</Text>
                    <Text style={styles.deniedSubtitle}>
                        La integración con HealthKit y Health Connect no está disponible en Expo Go.{'\n\n'}
                        Instala la app con un EAS development build para acceder a los datos de tu wearable.
                    </Text>
                    <TouchableOpacity
                        style={styles.settingsButton}
                        onPress={() => navigation.navigate('HomeHealth')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.settingsButtonText}>Volver al inicio</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ── Estado: completado ───────────────────────────────────────────────────
    const isComplete = phase === 'complete';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader
                title={isComplete ? 'Listo' : 'Conectando'}
                onBack={() => navigation.goBack()}
            />

            <View style={styles.content}>
                <View style={styles.ringWrapper}>
                    {!isComplete ? (
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
                    ) : (
                        <Svg width={RING_SIZE} height={RING_SIZE}>
                            <Circle
                                cx={RING_SIZE / 2}
                                cy={RING_SIZE / 2}
                                r={(RING_SIZE - RING_STROKE) / 2}
                                stroke={colors.success}
                                strokeWidth={RING_STROKE}
                                fill="none"
                            />
                        </Svg>
                    )}
                    <View style={styles.deviceIconBox}>
                        <Ionicons
                            name={isComplete ? 'checkmark' : 'watch-outline'}
                            size={40}
                            color={isComplete ? colors.success : colors.primary}
                        />
                    </View>
                </View>

                <Text style={styles.title}>
                    {isComplete ? `${deviceName} conectado` : `Conectando ${deviceName}…`}
                </Text>
                <Text style={styles.subtitle}>
                    {isComplete
                        ? 'Ya recibimos tus datos en tiempo real.'
                        : 'El SO te pedirá permiso para leer tus datos de salud.'}
                </Text>

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

function _wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
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
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
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
    deniedTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
    },
    deniedSubtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: spacing.xl,
    },
    settingsButton: {
        backgroundColor: colors.primary,
        paddingVertical: 14,
        paddingHorizontal: spacing.xl,
        borderRadius: 999,
        alignSelf: 'stretch',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    settingsButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    skipButton: {
        paddingVertical: 12,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
});
