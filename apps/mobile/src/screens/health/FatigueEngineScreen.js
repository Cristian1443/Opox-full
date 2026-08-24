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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Construye las señales del motor según las métricas reales recibidas por params.
// Cuando no hay datos usa valores de referencia y marca status 'unknown'.
function buildSignals(metrics) {
    const hrv = metrics?.hrv;
    const restHr = metrics?.restingHeartRate;
    const sleep = metrics?.sleepHours;

    const HRV_BASE = 50;
    const HR_BASE = 61;

    return [
        {
            id: 1,
            title: 'HRV por debajo de tu base',
            subtitle: 'Señal principal',
            value: hrv != null ? `${hrv} / ${HRV_BASE} ms` : 'Sin datos',
            status: hrv == null ? 'unknown' : hrv < HRV_BASE * 0.8 ? 'critical' : hrv < HRV_BASE ? 'warning' : 'ok',
            icon: 'pulse',
            description: 'Tu variabilidad cardíaca está muy por debajo de tu media habitual.',
        },
        {
            id: 2,
            title: 'Frecuencia cardíaca en reposo',
            subtitle: 'Recuperación cardiovascular',
            value: restHr != null ? `${restHr > HR_BASE ? '+' : ''}${restHr - HR_BASE} ppm` : 'Sin datos',
            status: restHr == null ? 'unknown' : restHr > HR_BASE + 6 ? 'critical' : restHr > HR_BASE ? 'warning' : 'ok',
            icon: 'heart',
            description: 'Tu corazón late más rápido de lo normal en reposo. Señal de que el cuerpo aún no se recuperó.',
        },
        {
            id: 3,
            title: 'Nivel de estrés estimado',
            subtitle: 'Basado en HRV',
            value: hrv == null ? 'Sin datos' : hrv < 40 ? 'Alto' : hrv < 55 ? 'Medio' : 'Bajo',
            status: hrv == null ? 'unknown' : hrv < 40 ? 'critical' : hrv < 55 ? 'warning' : 'ok',
            icon: 'flame',
            description: 'El estrés estimado se calcula a partir de la variabilidad cardíaca. HRV baja = estrés alto.',
        },
        {
            id: 4,
            title: 'Saturación de oxígeno',
            subtitle: 'Rendimiento aeróbico',
            value: metrics?.spo2 != null ? `${metrics.spo2}%` : 'Sin datos',
            status: metrics?.spo2 == null ? 'unknown' : metrics.spo2 >= 95 ? 'ok' : 'warning',
            icon: 'water',
            description: 'Un SpO₂ ≥95% indica que tu sangre transporta suficiente oxígeno para el rendimiento cognitivo.',
        },
        {
            id: 5,
            title: 'Sueño la noche anterior',
            subtitle: 'Recuperación',
            value: sleep != null ? `${sleep}h` : 'Sin datos',
            status: sleep == null ? 'unknown' : sleep >= 7 ? 'ok' : sleep >= 5.5 ? 'warning' : 'critical',
            icon: 'moon',
            description: 'Dormir menos de 7 h reduce la capacidad de recuperación y el rendimiento cognitivo del día siguiente.',
        },
    ];
}

const getStatusColor = (status) => {
    switch (status) {
        case 'critical': return colors.error;
        case 'warning': return colors.warning;
        case 'ok': return colors.success;
        default: return colors.textSecondary;
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'critical': return 'alert-circle';
        case 'warning': return 'alert';
        case 'ok': return 'checkmark-circle';
        default: return 'help-circle-outline';
    }
};

export default function FatigueEngineScreen({ navigation, route }) {
    // HomeHealthScreen pasa las métricas reales como parámetro de navegación
    const metrics = route?.params?.metrics ?? null;
    const SIGNALS = buildSignals(metrics);

    const criticalCount = SIGNALS.filter((s) => s.status === 'critical').length;
    const warningCount = SIGNALS.filter((s) => s.status === 'warning').length;
    const activeSignalsCount = criticalCount + warningCount;
    const fatigueLevel = criticalCount >= 2 ? 'high' : criticalCount === 1 || warningCount >= 2 ? 'medium' : 'low';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Estado de fatiga" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta principal: estado de fatiga */}
                <View style={[
                    styles.fatigueCard,
                    fatigueLevel === 'high' && styles.fatigueCardHigh,
                    fatigueLevel === 'medium' && styles.fatigueCardMedium,
                ]}>
                    <View style={styles.fatigueHeader}>
                        <Ionicons
                            name={fatigueLevel === 'high' ? 'alert-circle' : fatigueLevel === 'medium' ? 'alert' : 'checkmark-circle'}
                            size={40}
                            color={fatigueLevel === 'high' ? colors.error : fatigueLevel === 'medium' ? colors.warning : colors.success}
                        />
                        <Text
                            style={[
                                styles.fatigueTitle,
                                fatigueLevel === 'high' && { color: colors.error },
                                fatigueLevel === 'medium' && { color: colors.warning },
                            ]}
                        >
                            {fatigueLevel === 'high' ? 'Fatiga alta detectada' : fatigueLevel === 'medium' ? 'Fatiga moderada' : 'Fatiga baja'}
                        </Text>
                    </View>

                    <Text style={styles.fatigueSubtitle}>
                        {metrics
                            ? `${activeSignalsCount} de 5 señales activadas`
                            : 'Conecta un wearable para datos reales'}
                    </Text>

                    <Text style={styles.explanation}>
                        Ningún reloj mide "fatiga" directa. Cruzamos estas 5 señales para calcular tu estado.
                    </Text>
                </View>

                {/* Lista de señales */}
                <Text style={styles.sectionTitle}>SEÑALES QUE LO DISPARAN</Text>

                {SIGNALS.map((signal) => (
                    <View key={signal.id} style={styles.signalCard}>
                        <View style={styles.signalHeader}>
                            <View style={styles.signalIconContainer}>
                                <Ionicons
                                    name={signal.icon}
                                    size={24}
                                    color={getStatusColor(signal.status)}
                                />
                            </View>

                            <View style={styles.signalInfo}>
                                <Text style={styles.signalTitle}>{signal.title}</Text>
                                <Text style={styles.signalSubtitle}>{signal.subtitle}</Text>
                            </View>

                            <View style={styles.signalValueContainer}>
                                <Text style={[styles.signalValue, { color: getStatusColor(signal.status) }]}>
                                    {signal.value}
                                </Text>
                                <Ionicons
                                    name={getStatusIcon(signal.status)}
                                    size={20}
                                    color={getStatusColor(signal.status)}
                                />
                            </View>
                        </View>

                        <Text style={styles.signalDescription}>{signal.description}</Text>
                    </View>
                ))}

                {/* CTA principal — navega a 3.5 (aún no creada) */}
                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('BreathingExercise')}
                >
                    <Ionicons name="leaf" size={24} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Hacer pausa guiada</Text>
                </TouchableOpacity>

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.md,
    },
    fatigueCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.separator,
    },
    fatigueCardHigh: {
        borderColor: colors.error,
        backgroundColor: colors.errorBg,
    },
    fatigueCardMedium: {
        borderColor: colors.warning,
        backgroundColor: colors.warning + '12',
    },
    fatigueHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    fatigueTitle: {
        fontSize: 24,
        fontWeight: '800',
        marginLeft: spacing.sm,
        color: colors.text,
    },
    fatigueSubtitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: spacing.md,
    },
    explanation: {
        fontSize: 14,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
        letterSpacing: 0.5,
    },
    signalCard: {
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    signalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    signalIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 8,
        backgroundColor: 'rgba(0,0,0,0.03)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    signalInfo: {
        flex: 1,
    },
    signalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    signalSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    signalValueContainer: {
        alignItems: 'flex-end',
    },
    signalValue: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 2,
    },
    signalDescription: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
        marginLeft: 48,
    },
    actionButton: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 16,
        marginTop: spacing.md,
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '700',
    },
});
