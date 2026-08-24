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
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Colores confirmados contra Figma (frame METRICA GENERICA, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    tabInactive: 'rgba(65,41,80,0.5)',
    infoCardBg: 'rgba(159,110,228,0.75)',
};

// Puntos simulados. Cuando entre el backend, sustituir por serie temporal real.
const mockChartPoints = [10, 25, 15, 30, 20, 40, 35, 50, 45, 60, 55, 40, 65];

const CHART_WIDTH = 331;
const CHART_HEIGHT = 60;

// Construye un trazo suave (curvas cuadráticas punto a punto) a partir de la
// serie mock — mismo espíritu que el "Vector 9" de Figma, pero data-driven
// en vez de un decorativo fijo, para que se vea distinto según la métrica.
function buildTrendPath(points, max) {
    const stepX = CHART_WIDTH / (points.length - 1);
    const coords = points.map((p, i) => ({
        x: i * stepX,
        y: CHART_HEIGHT - (p / max) * CHART_HEIGHT,
    }));
    return coords.reduce((d, point, i) => {
        if (i === 0) return `M ${point.x} ${point.y}`;
        const prev = coords[i - 1];
        const midX = (prev.x + point.x) / 2;
        return `${d} Q ${prev.x} ${prev.y} ${midX} ${(prev.y + point.y) / 2} T ${point.x} ${point.y}`;
    }, '');
}

function TrendLineChart({ points, max, color }) {
    const path = buildTrendPath(points, max);
    return (
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
            <Path d={path} stroke={color} strokeWidth={3.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

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

    const [timeRange, setTimeRange] = useState('Día');
    const ranges = ['Día', 'Semana', 'Mes'];

    // Delta signed (positivo = subió respecto a base).
    const deltaRaw = currentValue - baseValue;
    const isStable = trend === 'stable';
    // "Bueno" si es estable o si el cambio va en la dirección correcta según la métrica.
    const isBetter = isStable || (lowerIsBetter ? deltaRaw < 0 : deltaRaw > 0);
    const trendColor = isBetter ? colors.ctaGreen : colors.statRed;
    const delta = Math.abs(deltaRaw);
    const deltaWord = deltaRaw < 0 ? 'por debajo' : deltaRaw > 0 ? 'por encima' : 'igual a';
    const deltaText = isStable
        ? `Estable respecto a tu línea base (${baseValue} ${unit})`
        : `${delta} ${unit} ${deltaWord} de tu línea base (${baseValue} ${unit})`;

    const chartMax = Math.max(...mockChartPoints, currentValue, baseValue) || 1;

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title={title} onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Valor grande */}
                <View style={styles.valueRow}>
                    <Text style={styles.valueNumber}>{currentValue}</Text>
                    <Text style={styles.valueUnit}> {unit}</Text>
                </View>
                <Text style={[styles.deltaText, { color: trendColor }]}>{deltaText}</Text>

                {/* Gráfico */}
                <View style={styles.chartWrap}>
                    <Text style={styles.baseLabel}>base {baseValue}{unit}</Text>
                    <TrendLineChart points={mockChartPoints} max={chartMax} color={trendColor} />
                </View>

                {/* Selector de rango temporal */}
                <View style={styles.tabsRow}>
                    {ranges.map((range) => {
                        const active = range === timeRange;
                        return (
                            <TouchableOpacity
                                key={range}
                                activeOpacity={0.7}
                                onPress={() => setTimeRange(range)}
                                style={active ? styles.tabActive : styles.tabInactive}
                            >
                                <Text style={active ? styles.tabActiveText : styles.tabInactiveText}>{range}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Tarjeta explicativa */}
                <View style={styles.infoCard}>
                    <Text style={styles.infoCardText}>
                        <Text style={styles.infoCardTitle}>¿Qué significa? </Text>
                        {description}
                    </Text>
                </View>

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
    valueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    valueNumber: {
        fontFamily: 'Poppins-Bold',
        fontSize: 31,
        color: colors.textDark,
    },
    valueUnit: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: colors.textDark,
    },
    deltaText: {
        marginTop: 2,
        fontFamily: 'Poppins-Medium',
        fontSize: 10.5,
    },
    chartWrap: {
        marginTop: 24,
    },
    baseLabel: {
        fontFamily: 'Poppins-Light',
        fontSize: 10.5,
        letterSpacing: 0.4,
        color: colors.textDark,
        marginBottom: 6,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 28,
    },
    tabActive: {
        borderWidth: 1.3,
        borderColor: colors.textDark,
        borderRadius: 10,
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    tabActiveText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15.5,
        color: colors.textDark,
    },
    tabInactive: {
        paddingHorizontal: 18,
        paddingVertical: 8,
    },
    tabInactiveText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15.5,
        color: FIGMA.tabInactive,
    },
    infoCard: {
        marginTop: 20,
        backgroundColor: FIGMA.infoCardBg,
        borderRadius: 16,
        padding: 16,
    },
    infoCardText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        lineHeight: 16,
        color: colors.white,
        textAlign: 'center',
    },
    infoCardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 11.5,
        color: colors.white,
    },
});
