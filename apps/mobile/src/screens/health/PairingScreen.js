// Bloque 3 · Salud — Pantalla 3.3 · Flujo de emparejamiento
// Solicita permisos de salud reales al SO (HealthKit iOS / Health Connect
// Android). No-op en Expo Go — muestra aviso informativo.
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Line, Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import ConnectionSuccessModal from '../../components/ConnectionSuccessModal';
import ConnectionErrorModal from '../../components/ConnectionErrorModal';
import { requestHealthPermissions, isHealthAvailable } from '../../services/HealthService';
import { healthApi } from '../../api';

// Colores confirmados contra Figma (frame EMPAREJANDO, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
};

// Pasos del checklist — Figma solo muestra 2 filas. El paso 2 ("permisos")
// ahora corresponde al tiempo real que tarda el diálogo del SO, no a un
// temporizador fijo.
const STEPS = [
    { id: 'searching', label: 'Dispositivo encontrado' },
    { id: 'permissions', label: 'Concediendo permisos de salud.' },
];

const RING_SIZE = 199;
const RING_STROKE = 15;

// ─── Iconos aproximados (ver nota: no son el asset exportado) ───────────────
function WatchIcon({ size = 41, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size * 1.71} viewBox="0 0 24 28">
            <Rect x="4" y="1" width="10" height="4" rx="1.5" stroke={color} strokeWidth={1.6} fill="none" />
            <Rect x="4" y="23" width="10" height="4" rx="1.5" stroke={color} strokeWidth={1.6} fill="none" />
            <Rect x="2.5" y="6" width="13" height="16" rx="4" stroke={color} strokeWidth={1.8} fill="none" />
            <Line x1="18" y1="11" x2="20.5" y2="11" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
            <Line x1="18" y1="17" x2="20.5" y2="17" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
        </Svg>
    );
}

function CheckCircleIcon({ size = 20, color = colors.ctaGreen }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 13l5 5L20 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SpinnerIcon({ size = 20, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M20 12a8 8 0 1 1-2.34-5.66" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" />
            <Path d="M20 3v5h-5" stroke={color} strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function PendingCircleIcon({ size = 20, color = FIGMA.subtitleMuted }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Circle cx="12" cy="12" r="8.5" stroke={color} strokeWidth={1.8} fill="none" />
        </Svg>
    );
}

// Anillo de progreso — mismo patrón que EnergyRing de Dashboard Salud, con
// los colores invertidos: pista morada sólida + arco naranja.
function PairingRing({ size = RING_SIZE, strokeWidth = RING_STROKE, progress = 0 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - progress);

    return (
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.textDark} strokeWidth={strokeWidth} fill="none" />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.accentOrange}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={dashOffset}
                rotation={-90}
                origin={`${size / 2}, ${size / 2}`}
            />
        </Svg>
    );
}

function _wait(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

const PAIRING_TIMEOUT_MS = 15000;
const TIMED_OUT = Symbol('timed-out');

function _timeoutAfter(ms) {
    return new Promise((resolve) => setTimeout(() => resolve(TIMED_OUT), ms));
}

export default function PairingScreen({ navigation, route }) {
    const device = route?.params?.device;
    const deviceName = device?.name ?? 'dispositivo';

    // 'loading' | 'complete' | 'denied' | 'unavailable' | 'error'
    const [phase, setPhase] = useState('loading');
    const [stepIdx, setStepIdx] = useState(0);
    const [retryKey, setRetryKey] = useState(0);

    const spin = useRef(new Animated.Value(0)).current;

    // Spinner del paso "en progreso" — mejora funcional, no viene del diseño
    // (en Figma es una composición estática).
    useEffect(() => {
        if (phase !== 'loading') return;
        const loop = Animated.loop(
            Animated.timing(spin, {
                toValue: 1,
                duration: 1200,
                easing: Easing.linear,
                useNativeDriver: true,
            })
        );
        loop.start();
        return () => loop.stop();
    }, [phase, spin]);

    // Flujo de permisos real al montar la pantalla
    useEffect(() => {
        let cancelled = false;

        async function run() {
            // Si no hay módulos nativos (Expo Go) informar y terminar
            if (!isHealthAvailable()) {
                if (!cancelled) setPhase('unavailable');
                return;
            }

            if (!cancelled) setStepIdx(0);
            await _wait(1200);

            if (!cancelled) setStepIdx(1);
            const result = await Promise.race([
                requestHealthPermissions(),
                _timeoutAfter(PAIRING_TIMEOUT_MS),
            ]);
            if (cancelled) return;

            if (result === TIMED_OUT) {
                setPhase('error');
                return;
            }

            const granted = result;
            if (!granted) {
                setPhase('denied');
                return;
            }

            // Registra el dispositivo en el backend (fire-and-forget)
            healthApi.registerDevice(
                deviceName,
                device?.platform ?? (deviceName.toLowerCase().includes('apple') ? 'ios_healthkit' : 'health_connect'),
                device?.icon ?? 'watch-outline',
            ).catch(() => {});

            setPhase('complete');
        }

        run();
        return () => { cancelled = true; };
    }, [retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

    const handleRetry = () => {
        setStepIdx(0);
        setPhase('loading');
        setRetryKey((k) => k + 1);
    };

    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const isComplete = phase === 'complete';
    const progress = isComplete ? 1 : (stepIdx + 0.5) / STEPS.length;

    // ── Estado: permisos denegados ───────────────────────────────────────────
    if (phase === 'denied') {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <HealthScreenHeader title="Sin acceso" onBack={() => navigation.goBack()} />
                <View style={styles.centeredContent}>
                    <Ionicons name="alert-circle" size={64} color={colors.statRed} />
                    <Text style={styles.stateTitle}>Permiso denegado</Text>
                    <Text style={styles.stateSubtitle}>
                        Sin datos de salud no podremos calcular tu nivel de fatiga.{'\n'}
                        Puedes activarlo más tarde en Ajustes del dispositivo.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => Linking.openSettings()}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>Ir a Ajustes</Text>
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
                    <Ionicons name="information-circle" size={64} color={colors.accentOrange} />
                    <Text style={styles.stateTitle}>Requiere EAS build</Text>
                    <Text style={styles.stateSubtitle}>
                        La integración con HealthKit y Health Connect no está disponible en Expo Go.{'\n\n'}
                        Instala la app con un EAS development build para acceder a los datos de tu wearable.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => navigation.navigate('HomeHealth')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>Volver al inicio</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Emparejando" onBack={() => navigation.goBack()} />

            <View style={styles.content}>
                <View style={styles.ringWrap}>
                    <PairingRing progress={progress} />
                    <View style={styles.ringIconOverlay}>
                        <WatchIcon />
                    </View>
                </View>

                <Text style={styles.title}>Buscando tu {deviceName}...</Text>
                <Text style={styles.subtitle}>Acerca el reloj y mantenlo desbloqueado.</Text>

                {/* Checklist de estado */}
                <View style={styles.checklist}>
                    {STEPS.map((step, i) => {
                        const done = isComplete || i < stepIdx;
                        const active = !isComplete && i === stepIdx;
                        return (
                            <View key={step.id} style={styles.checklistRow}>
                                {done ? (
                                    <CheckCircleIcon />
                                ) : active ? (
                                    <Animated.View style={{ transform: [{ rotate }] }}>
                                        <SpinnerIcon />
                                    </Animated.View>
                                ) : (
                                    <PendingCircleIcon />
                                )}
                                <Text
                                    style={[
                                        styles.checklistText,
                                        done && { color: colors.ctaGreen },
                                        active && { color: colors.accentOrange },
                                        !done && !active && { color: FIGMA.subtitleMuted },
                                    ]}
                                >
                                    {step.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            <ConnectionSuccessModal
                visible={isComplete}
                deviceName={deviceName}
                onClose={() => navigation.navigate('HomeHealth')}
            />

            <ConnectionErrorModal
                visible={phase === 'error'}
                deviceName={deviceName}
                onRetry={handleRetry}
                onCancel={() => navigation.goBack()}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
        paddingTop: 56,
    },
    centeredContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: spacing.xl,
    },
    ringWrap: {
        width: RING_SIZE,
        height: RING_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.xl,
    },
    ringIconOverlay: {
        position: 'absolute',
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        marginTop: 6,
        fontFamily: 'Poppins-Regular',
        fontSize: 10.5,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
    },
    checklist: {
        marginTop: 28,
        alignSelf: 'stretch',
        gap: 10,
    },
    checklistRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    checklistText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 9.8,
    },
    stateTitle: {
        marginTop: spacing.lg,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: spacing.sm,
    },
    stateSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        lineHeight: 19,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
        marginBottom: spacing.xl,
    },
    primaryButton: {
        alignSelf: 'stretch',
        height: 56,
        borderRadius: 14,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
    },
    skipButton: {
        paddingVertical: 12,
        alignSelf: 'stretch',
        alignItems: 'center',
    },
    skipButtonText: {
        fontFamily: 'Poppins-Medium',
        fontSize: 13,
        color: FIGMA.subtitleMuted,
    },
});
