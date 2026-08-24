// Bloque 3 · Salud — Pantalla 3.3 · Flujo de emparejamiento
import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Rect, Line, Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import ConnectionSuccessModal from '../../components/ConnectionSuccessModal';

// Colores confirmados contra Figma (frame EMPAREJANDO, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
};

// Pasos que se van chequeando. Cuando entre el backend, los ticks los
// dispara el pairing real. Figma solo muestra 2 filas de checklist.
const STEPS = [
    { id: 'searching', label: 'Dispositivo encontrado', duration: 3000 },
    { id: 'permissions', label: 'Concediendo permisos de salud.', duration: 2000 },
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

export default function PairingScreen({ navigation, route }) {
    const device = route?.params?.device;
    const deviceName = device?.name ?? 'dispositivo';

    const [stepIdx, setStepIdx] = useState(0);
    const [isComplete, setIsComplete] = useState(false);

    const spin = useRef(new Animated.Value(0)).current;

    // Spinner del paso "en progreso" — mejora funcional, no viene del diseño
    // (en Figma es una composición estática).
    useEffect(() => {
        if (isComplete) return;
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
    }, [isComplete, spin]);

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

    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
    const progress = isComplete ? 1 : (stepIdx + 0.5) / STEPS.length;

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
});
