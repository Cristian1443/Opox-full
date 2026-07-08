// Bloque 3 · Salud — Pantalla 3.4 · Detalle de métrica (genérica)
import React, { useState } from 'react';
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

// Puntos simulados. Cuando entre el backend, sustituir por serie temporal real.
const mockChartPoints = [10, 25, 15, 30, 20, 40, 35, 50, 45, 60, 55, 40, 65];

export default function MetricDetailScreen({ navigation, route }) {
    const {
        title = 'HRV',
        currentValue = 42,
        unit = 'ms',
        baseValue = 50,
        description = 'Una HRV baja respecto a tu media suele indicar fatiga o estrés acumulado. Es la señal principal del motor de fatiga.',
        trend = 'down',
        lowerIsBetter = false, // Para métricas donde bajar de la base es mejor (ej. FC reposo).
    } = route?.params || {};

    const [timeRange, setTimeRange] = useState('Semana');
    const ranges = ['Día', 'Semana', 'Mes'];

    // Delta signed (positivo = subió respecto a base).
    const deltaRaw = currentValue - baseValue;
    const isStable = trend === 'stable';
    // "Bueno" si es estable o si el cambio va en la dirección correcta según la métrica.
    const isBetter = isStable || (lowerIsBetter ? deltaRaw < 0 : deltaRaw > 0);
    const trendColor = isBetter ? colors.success : colors.warning;
    const trendIcon = deltaRaw === 0 ? 'remove' : (deltaRaw < 0 ? 'arrow-down' : 'arrow-up');
    const delta = Math.abs(deltaRaw);
    const deltaSign = deltaRaw < 0 ? '−' : (deltaRaw > 0 ? '+' : '');

    // Escala del gráfico basada en el max de la serie mock + valores reales para posicionar
    // los puntos y la línea base proporcionalmente en vez de hardcodear.
    const CHART_HEIGHT = 150;
    const chartMax = Math.max(...mockChartPoints, currentValue, baseValue) || 1;
    const baseLineBottom = (baseValue / chartMax) * CHART_HEIGHT;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title={title} onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Valor principal + base */}
                <View style={styles.valueContainer}>
                    <Text style={styles.valueLabel}>{title}</Text>
                    <View style={styles.valueRow}>
                        <Text style={styles.currentValue}>
                            {currentValue} <Text style={styles.unit}>{unit}</Text>
                        </Text>
                        <Text style={[styles.trendText, { color: trendColor }]}>
                            <Ionicons name={trendIcon} size={16} />
                            <Text>{` ${deltaSign}${delta} vs tu base`}</Text>
                        </Text>
                    </View>

                    <View style={styles.baseInfo}>
                        <Text style={styles.baseLabel}>Base personal: </Text>
                        <Text style={styles.baseValue}>{baseValue} {unit}</Text>
                    </View>
                </View>

                {/* Gráfico placeholder — reemplazar por react-native-svg-charts en producción */}
                <View style={styles.chartContainer}>
                    <View style={styles.chartPlaceholder}>
                        <View style={styles.chartLines}>
                            {mockChartPoints.map((point, index) => {
                                const height = (point / chartMax) * CHART_HEIGHT;
                                const left = (index / (mockChartPoints.length - 1)) * 100;
                                return (
                                    <View
                                        key={index}
                                        style={{
                                            position: 'absolute',
                                            left: `${left}%`,
                                            bottom: height,
                                            width: 4,
                                            height: 4,
                                            borderRadius: 2,
                                            backgroundColor: isBetter ? colors.success : colors.warning,
                                        }}
                                    />
                                );
                            })}
                            <View style={[styles.baseLine, { bottom: baseLineBottom }]} />
                        </View>
                    </View>

                    <View style={styles.chartLabels}>
                        <Text style={styles.label}>Lun</Text>
                        <Text style={styles.label}>Mar</Text>
                        <Text style={styles.label}>Mié</Text>
                        <Text style={styles.label}>Jue</Text>
                        <Text style={styles.label}>Vie</Text>
                        <Text style={styles.label}>Sáb</Text>
                        <Text style={styles.label}>Dom</Text>
                    </View>
                </View>

                {/* Selector de rango temporal */}
                <View style={styles.timeSelector}>
                    {ranges.map((range) => (
                        <TouchableOpacity
                            key={range}
                            style={[styles.timeButton, timeRange === range && styles.timeButtonActive]}
                            onPress={() => setTimeRange(range)}
                        >
                            <Text style={[styles.timeText, timeRange === range && styles.timeTextActive]}>
                                {range}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Sección educativa */}
                <View style={styles.infoCard}>
                    <View style={styles.infoHeader}>
                        <Ionicons name="information-circle" size={20} color={colors.primary} />
                        <Text style={styles.infoTitle}>¿Qué significa?</Text>
                    </View>
                    <Text style={styles.infoText}>{description}</Text>
                    <TouchableOpacity style={styles.learnMoreBtn}>
                        <Text style={styles.learnMoreText}>Leer más sobre {title}</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>

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
    valueContainer: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.md,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    valueLabel: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.xs,
    },
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: spacing.sm,
    },
    currentValue: {
        fontSize: 48,
        fontWeight: '700',
        color: colors.text,
        marginRight: 4,
    },
    unit: {
        fontSize: 20,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    trendText: {
        fontSize: 16,
        fontWeight: '600',
    },
    baseInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: spacing.sm,
        paddingTop: spacing.sm,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
    },
    baseLabel: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    baseValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    chartContainer: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        height: 220,
        justifyContent: 'flex-end',
    },
    chartPlaceholder: {
        flex: 1,
        position: 'relative',
        justifyContent: 'flex-end',
    },
    chartLines: {
        flex: 1,
        width: '100%',
        position: 'relative',
    },
    baseLine: {
        position: 'absolute',
        left: 0,
        right: 0,
        height: 1,
        borderStyle: 'dashed',
        borderBottomWidth: 1,
        borderBottomColor: colors.textSecondary,
        opacity: 0.5,
    },
    chartLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: spacing.sm,
    },
    label: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    timeSelector: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.md,
    },
    timeButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    timeButtonActive: {
        backgroundColor: colors.background,
    },
    timeText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    timeTextActive: {
        color: colors.text,
    },
    infoCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
    },
    infoHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginLeft: spacing.sm,
    },
    infoText: {
        fontSize: 15,
        color: colors.textSecondary,
        lineHeight: 22,
        marginBottom: spacing.md,
    },
    learnMoreBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    learnMoreText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.primary,
        marginRight: spacing.xs,
    },
});
