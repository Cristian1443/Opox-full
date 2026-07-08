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

// Las 5 señales del motor de fatiga (mock — cuando entre la IA, esto viene del backend)
const SIGNALS = [
    {
        id: 1,
        title: 'HRV por debajo de tu base',
        subtitle: 'Señal principal',
        value: '42 / 50',
        status: 'critical',
        icon: 'pulse',
        description: 'Tu variabilidad cardíaca está muy por debajo de tu media habitual.',
    },
    {
        id: 2,
        title: 'Frecuencia cardíaca en reposo elevada',
        subtitle: 'Cuerpo no recuperado',
        value: '+6 ppm',
        status: 'warning',
        icon: 'heart',
        description: 'Tu corazón late más rápido de lo normal en reposo.',
    },
    {
        id: 3,
        title: 'Estrés sostenido en la sesión',
        subtitle: 'Alto',
        value: 'Nivel 4/5',
        status: 'critical',
        icon: 'flame',
        description: 'Has mantenido un nivel de actividad mental alta por mucho tiempo.',
    },
    {
        id: 4,
        title: 'Energía corporal',
        subtitle: 'Batería disponible',
        value: 'OK',
        status: 'ok',
        icon: 'battery-full',
        description: 'Tu nivel de energía física sigue siendo alto.',
    },
    {
        id: 5,
        title: 'Sueño la noche anterior',
        subtitle: 'Recuperación',
        value: '7h',
        status: 'ok',
        icon: 'moon',
        description: 'Dormiste la cantidad recomendada.',
    },
];

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
        default: return 'help-circle';
    }
};

export default function FatigueEngineScreen({ navigation }) {
    const fatigueLevel = 'high'; // mock: 'low' | 'medium' | 'high'
    const activeSignalsCount = 3;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Estado de fatiga" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta principal: estado de fatiga */}
                <View style={[styles.fatigueCard, fatigueLevel === 'high' && styles.fatigueCardHigh]}>
                    <View style={styles.fatigueHeader}>
                        <Ionicons
                            name={fatigueLevel === 'high' ? 'alert-circle' : 'checkmark-circle'}
                            size={40}
                            color={fatigueLevel === 'high' ? colors.error : colors.success}
                        />
                        <Text
                            style={[
                                styles.fatigueTitle,
                                fatigueLevel === 'high' && { color: colors.error },
                            ]}
                        >
                            {fatigueLevel === 'high' ? 'Fatiga alta detectada' : 'Fatiga baja'}
                        </Text>
                    </View>

                    <Text style={styles.fatigueSubtitle}>
                        {activeSignalsCount} de 5 señales activadas
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
