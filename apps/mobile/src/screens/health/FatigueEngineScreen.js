// Bloque 3 · Salud — Pantalla 3.4b · Motor de fatiga
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Colores confirmados contra Figma (frame MOTOR DE FATIGA, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    textNote: '#343A3D',
    separator: 'rgba(65,41,80,0.5)',
    featuredBgHigh: 'rgba(255,38,56,0.5)',
    featuredBgLow: 'rgba(36,189,144,0.5)',
    unknownBadge: '#A7ADB8',
};

// Construye las señales del motor con las métricas reales (HealthKit/Health
// Connect) recibidas por params desde HomeHealthScreen. Sin dato disponible
// se marca 'unknown' — un tercer estado real que Figma no contempla (solo
// documenta activada/roja o resuelta/verde), así que se muestra en gris
// neutro en vez de fingir que la señal está resuelta.
function buildSignals(metrics) {
    const hrv = metrics?.hrv;
    const restHr = metrics?.restingHeartRate;
    const spo2 = metrics?.spo2;
    const sleep = metrics?.sleepHours;

    const HRV_BASE = 50;
    const HR_BASE = 61;

    return [
        {
            id: 1,
            label: 'HRV por debajo de tu base',
            note: 'Señal principal',
            value: hrv != null ? `${hrv}/${HRV_BASE}` : 'Sin datos',
            status: hrv == null ? 'unknown' : hrv < HRV_BASE ? 'alert' : 'ok',
            severity: hrv == null ? 'unknown' : hrv < HRV_BASE * 0.8 ? 'critical' : hrv < HRV_BASE ? 'warning' : 'ok',
        },
        {
            id: 2,
            label: 'FC reposo elevada',
            note: 'Cuerpo no recuperado',
            value: restHr != null ? `${restHr > HR_BASE ? '+' : ''}${restHr - HR_BASE}` : 'Sin datos',
            status: restHr == null ? 'unknown' : restHr > HR_BASE ? 'alert' : 'ok',
            severity: restHr == null ? 'unknown' : restHr > HR_BASE + 6 ? 'critical' : restHr > HR_BASE ? 'warning' : 'ok',
        },
        {
            id: 3,
            label: 'Estrés sostenido en la sesión',
            value: hrv == null ? 'Sin datos' : hrv < 40 ? 'Alto' : hrv < 55 ? 'Medio' : 'Bajo',
            status: hrv == null ? 'unknown' : hrv < 55 ? 'alert' : 'ok',
            severity: hrv == null ? 'unknown' : hrv < 40 ? 'critical' : hrv < 55 ? 'warning' : 'ok',
        },
        {
            id: 4,
            label: 'Saturación de oxígeno',
            note: 'Rendimiento aeróbico',
            value: spo2 != null ? `${spo2}%` : 'Sin datos',
            status: spo2 == null ? 'unknown' : spo2 >= 95 ? 'ok' : 'alert',
            severity: spo2 == null ? 'unknown' : spo2 >= 95 ? 'ok' : 'warning',
        },
        {
            id: 5,
            label: 'Sueño noche anterior',
            value: sleep != null ? `${sleep}h` : 'Sin datos',
            status: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : 'alert',
            severity: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : sleep >= 5.5 ? 'warning' : 'critical',
        },
    ];
}

function XMarkIcon({ size = 14, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M6 6L18 18" stroke={color} strokeWidth={3} strokeLinecap="round" />
            <Path d="M18 6L6 18" stroke={color} strokeWidth={3} strokeLinecap="round" />
        </Svg>
    );
}

function CheckMarkIcon({ size = 14, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 13l5 5L20 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function SignalRow({ signal, isFirst }) {
    const badgeColor = signal.status === 'alert' ? colors.statRed : signal.status === 'unknown' ? FIGMA.unknownBadge : colors.ctaGreen;

    return (
        <View style={[styles.signalRow, !isFirst && styles.signalRowSeparator]}>
            <View style={[styles.badge, { backgroundColor: badgeColor }]}>
                {signal.status === 'alert' ? <XMarkIcon /> : signal.status === 'ok' ? <CheckMarkIcon /> : null}
            </View>
            <View style={styles.signalTextWrap}>
                <Text style={styles.signalLabel}>{signal.label}</Text>
                {signal.note ? <Text style={styles.signalNote}>{signal.note}</Text> : null}
            </View>
            <Text style={[styles.signalValue, { color: badgeColor }]}>{signal.value}</Text>
        </View>
    );
}

export default function FatigueEngineScreen({ navigation, route }) {
    // HomeHealthScreen pasa las métricas reales como parámetro de navegación.
    const metrics = route?.params?.metrics ?? null;
    const SIGNALS = buildSignals(metrics);

    const criticalCount = SIGNALS.filter((s) => s.severity === 'critical').length;
    const warningCount = SIGNALS.filter((s) => s.severity === 'warning').length;
    const activeSignalsCount = SIGNALS.filter((s) => s.status === 'alert').length;
    const fatigueLevel = criticalCount >= 2 ? 'high' : criticalCount === 1 || warningCount >= 2 ? 'medium' : 'low';
    const isHigh = fatigueLevel !== 'low';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Estado de fatiga" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Tarjeta destacada */}
                <View style={[styles.featuredCard, { backgroundColor: isHigh ? FIGMA.featuredBgHigh : FIGMA.featuredBgLow }]}>
                    <Text style={styles.featuredTitle}>
                        {isHigh ? 'Fatiga alta detectada' : 'Fatiga baja'}
                    </Text>
                    <Text style={styles.featuredSubtitle}>
                        {metrics
                            ? `${activeSignalsCount} de ${SIGNALS.length} señales activadas`
                            : 'Conecta un wearable para datos reales'}
                    </Text>
                </View>

                {/* Lista de señales */}
                <Text style={styles.sectionHeader}>SEÑALES QUE LO DISPARAN</Text>
                <View style={styles.signalsList}>
                    {SIGNALS.map((signal, index) => (
                        <SignalRow key={signal.id} signal={signal} isFirst={index === 0} />
                    ))}
                </View>

                {/* CTA */}
                <TouchableOpacity
                    style={styles.ctaButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('BreathingExercise')}
                >
                    <Text style={styles.ctaButtonText}>Hacer pausa guiada</Text>
                </TouchableOpacity>

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    featuredCard: {
        borderRadius: 24,
        paddingVertical: 24,
        paddingHorizontal: 20,
        alignItems: 'center',
        marginBottom: 24,
    },
    featuredTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 19,
        color: colors.white,
    },
    featuredSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Light',
        fontSize: 11.5,
        color: colors.white,
    },
    sectionHeader: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 4,
    },
    signalsList: {
        marginBottom: 28,
    },
    signalRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    signalRowSeparator: {
        borderTopWidth: 0.5,
        borderTopColor: FIGMA.separator,
    },
    badge: {
        width: 29,
        height: 29,
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    signalTextWrap: {
        flex: 1,
    },
    signalLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    signalNote: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: FIGMA.textNote,
    },
    signalValue: {
        fontFamily: 'Poppins-Bold',
        fontSize: 10.5,
    },
    ctaButton: {
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.accentOrange,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
});
