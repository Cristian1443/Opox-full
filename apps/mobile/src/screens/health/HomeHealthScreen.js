// Bloque 3 · Salud — Pantalla 3.1 · Home de Salud
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Anillo circular de energía usado en la energyCard.
function EnergyRing({ percent = 84 }) {
    const size = 64;
    const stroke = 6;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (percent / 100) * circ;
    return (
        <Svg width={size} height={size}>
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke="rgba(255,255,255,0.15)"
                strokeWidth={stroke}
                fill="none"
            />
            <Circle
                cx={size / 2}
                cy={size / 2}
                r={r}
                stroke={colors.success}
                strokeWidth={stroke}
                fill="none"
                strokeDasharray={`${dash} ${circ}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
        </Svg>
    );
}

export default function HomeHealthScreen({ navigation }) {
    const wearableIndicator = (
        <TouchableOpacity
            style={styles.wearableChip}
            onPress={() => navigation.navigate('ConnectDevice')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <View style={styles.dotOnline} />
            <Text style={styles.wearableName}>Apple Watch</Text>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" />

            <HealthScreenHeader
                title="Salud"
                onBack={() => navigation.goBack()}
                right={wearableIndicator}
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta principal: energía (navy oscuro, tap → 3.4b Motor de fatiga) */}
                <TouchableOpacity
                    style={styles.energyCard}
                    onPress={() => navigation.navigate('FatigueEngine')}
                    activeOpacity={0.9}
                >
                    <View style={styles.energyRing}>
                        <EnergyRing percent={84} />
                        <Text style={styles.energyRingText}>84%</Text>
                    </View>
                    <View style={styles.energyTextBlock}>
                        <Text style={styles.energyTitle}>Energía buena</Text>
                        <Text style={styles.energySubtitle}>Estás listo para una sesión exigente.</Text>
                    </View>
                </TouchableOpacity>

                {/* CARDIOVASCULAR (2 columnas) */}
                <Text style={styles.sectionTitle}>CARDIOVASCULAR</Text>
                <View style={styles.rowTwo}>
                    <TouchableOpacity
                        style={styles.metricCard}
                        onPress={() => navigation.navigate('MetricDetail', {
                            title: 'Ritmo cardíaco',
                            currentValue: 68,
                            unit: 'ppm',
                            baseValue: 65,
                            description: 'El ritmo cardíaco en reposo refleja tu carga cardiovascular en el momento. Valores dentro de tu rango habitual indican estado normal.',
                            trend: 'stable',
                        })}
                    >
                        <View style={styles.metricTop}>
                            <Ionicons name="pulse" size={16} color={colors.primary} />
                            <Text style={styles.metricLabel}>Ritmo cardíaco</Text>
                        </View>
                        <Text style={styles.metricValue}>
                            68 <Text style={styles.unit}>ppm</Text>
                        </Text>
                        <Text style={[styles.metricCaption, { color: colors.success }]}>
                            En reposo · normal
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.metricCard}
                        onPress={() => navigation.navigate('MetricDetail', {
                            title: 'FC reposo',
                            currentValue: 59,
                            unit: 'ppm',
                            baseValue: 61,
                            description: 'Una FC en reposo baja respecto a tu media suele reflejar buena recuperación cardiovascular. Cambios bruscos merecen atención.',
                            trend: 'down',
                            lowerIsBetter: true,
                        })}
                    >
                        <View style={styles.metricTop}>
                            <Ionicons name="heart-outline" size={16} color={colors.primary} />
                            <Text style={styles.metricLabel}>FC reposo</Text>
                        </View>
                        <Text style={styles.metricValue}>
                            59 <Text style={styles.unit}>ppm</Text>
                        </Text>
                        <Text style={styles.metricCaption}>Tu media: 61</Text>
                    </TouchableOpacity>
                </View>

                {/* ESTRÉS Y RECUPERACIÓN (2 columnas) */}
                <Text style={styles.sectionTitle}>ESTRÉS Y RECUPERACIÓN</Text>
                <View style={styles.rowTwo}>
                    <TouchableOpacity
                        style={styles.metricCard}
                        onPress={() => navigation.navigate('MetricDetail', {
                            title: 'HRV',
                            currentValue: 42,
                            unit: 'ms',
                            baseValue: 50,
                            description: 'Una HRV baja respecto a tu media suele indicar fatiga o estrés acumulado. Es la señal principal del motor de fatiga.',
                            trend: 'down',
                        })}
                    >
                        <View style={styles.metricTop}>
                            <Text style={styles.metricLabel}>HRV</Text>
                        </View>
                        <Text style={styles.metricValue}>
                            42 <Text style={styles.unit}>ms</Text>
                        </Text>
                        <Text style={[styles.metricCaption, { color: colors.warning }]}>
                            −8 vs tu base
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.metricCard}>
                        <View style={styles.metricTop}>
                            <Text style={styles.metricLabel}>Nivel de estrés</Text>
                        </View>
                        <Text style={styles.metricValue}>Medio</Text>
                        <Text style={[styles.metricCaption, { color: colors.warning }]}>
                            Subiendo
                        </Text>
                    </View>
                </View>

                {/* RESPIRACIÓN Y SUEÑO (3 columnas) */}
                <Text style={styles.sectionTitle}>RESPIRACIÓN Y SUEÑO</Text>
                <View style={styles.rowThree}>
                    <TouchableOpacity
                        style={styles.metricCardSmall}
                        onPress={() => navigation.navigate('MetricDetail', {
                            title: 'SpO₂',
                            currentValue: 97,
                            unit: '%',
                            baseValue: 98,
                            description: 'La saturación de oxígeno mide el % de hemoglobina que transporta oxígeno. Valores estables por encima de 95% son normales.',
                            trend: 'stable',
                        })}
                    >
                        <Text style={styles.metricLabelSmall}>SpO₂</Text>
                        <Text style={styles.metricValueSmall}>
                            97<Text style={styles.unitSmall}>%</Text>
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.metricCardSmall}>
                        <Text style={styles.metricLabelSmall}>Resp.</Text>
                        <Text style={styles.metricValueSmall}>
                            14<Text style={styles.unitSmall}>/m</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.metricCardSmall}
                        onPress={() => navigation.navigate('MetricDetail', {
                            title: 'Sueño',
                            currentValue: 7,
                            unit: 'h',
                            baseValue: 8,
                            description: 'Dormir por debajo de tu base habitual reduce la capacidad de recuperación y afecta al rendimiento cognitivo del día siguiente.',
                            trend: 'down',
                        })}
                    >
                        <Text style={styles.metricLabelSmall}>Sueño</Text>
                        <Text style={styles.metricValueSmall}>
                            7<Text style={styles.unitSmall}>h</Text>
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Card Consejos (entry point a 3.6 AdviceHome) */}
                <TouchableOpacity
                    style={styles.tipsCard}
                    onPress={() => navigation.navigate('AdviceHome')}
                    activeOpacity={0.85}
                >
                    <View style={[styles.tipsIcon, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="bulb-outline" size={24} color={colors.primary} />
                    </View>
                    <View style={styles.tipsText}>
                        <Text style={styles.tipsTitle}>Consejos</Text>
                        <Text style={styles.tipsSubtitle}>Estudio, alimentación, meditación</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
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
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    wearableChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    dotOnline: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success,
    },
    wearableName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.success,
    },
    energyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.dark,
        borderRadius: 20,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    energyRing: {
        width: 64,
        height: 64,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    energyRingText: {
        position: 'absolute',
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
    },
    energyTextBlock: {
        flex: 1,
    },
    energyTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 2,
    },
    energySubtitle: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.7)',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        marginBottom: spacing.sm,
        marginTop: spacing.md,
        letterSpacing: 0.5,
    },
    rowTwo: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rowThree: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    metricCard: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    metricTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    metricLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    metricValue: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 4,
    },
    unit: {
        fontSize: 13,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    metricCaption: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '600',
    },
    metricCardSmall: {
        flex: 1,
        backgroundColor: colors.card,
        borderRadius: 14,
        padding: spacing.sm + 2,
        borderWidth: 1,
        borderColor: colors.separator,
        alignItems: 'flex-start',
    },
    metricLabelSmall: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 4,
    },
    metricValueSmall: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
    },
    unitSmall: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    tipsCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginTop: spacing.lg,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    tipsIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    tipsText: {
        flex: 1,
    },
    tipsTitle: {
        fontSize: 17,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    tipsSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
    },
});
