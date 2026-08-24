// Bloque 3 · Salud — Pantalla 3.1 · Home de Salud
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { getHealthMetrics, isHealthAvailable } from '../../services/HealthService';

// Anillo circular de energía — porcentaje calculado desde HRV + sueño
function EnergyRing({ percent = 0 }) {
    const size = 64;
    const stroke = 6;
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (Math.max(0, Math.min(100, percent)) / 100) * circ;
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

// Heurística de energía: combina HRV (principal), sueño y FC reposo
function calcEnergy(metrics) {
    if (!metrics) return null;
    const { hrv, sleepHours, restingHeartRate } = metrics;
    let score = 0;
    let parts = 0;
    // HRV: referencia ~50 ms para adulto activo
    if (hrv != null) { score += Math.min(1, hrv / 50) * 50; parts += 50; }
    // Sueño: referencia 8 h
    if (sleepHours != null) { score += Math.min(1, sleepHours / 8) * 30; parts += 30; }
    // FC reposo: cuanto más baja mejor (referencia 60 ppm), invertido
    if (restingHeartRate != null) { score += Math.max(0, 1 - (restingHeartRate - 40) / 60) * 20; parts += 20; }
    if (parts === 0) return null;
    return Math.round((score / parts) * 100);
}

function energyLabel(pct) {
    if (pct == null) return { title: '—', subtitle: 'Conecta un wearable para ver tu energía' };
    if (pct >= 75) return { title: 'Energía buena', subtitle: 'Estás listo para una sesión exigente.' };
    if (pct >= 50) return { title: 'Energía media', subtitle: 'Tómate descansos regulares hoy.' };
    return { title: 'Energía baja', subtitle: 'Descansa antes de una sesión larga.' };
}

const FALLBACK = '—';

export default function HomeHealthScreen({ navigation }) {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Recargar datos cada vez que la pantalla recibe foco
    const loadMetrics = useCallback(async () => {
        setLoading(true);
        const data = await getHealthMetrics();
        setMetrics(data);
        setLoading(false);
    }, []);

    useFocusEffect(loadMetrics);

    const energyPct = calcEnergy(metrics);
    const { title: energyTitle, subtitle: energySubtitle } = energyLabel(energyPct);

    const hasData = !!metrics && isHealthAvailable();
    const hr = metrics?.heartRate ?? null;
    const restHr = metrics?.restingHeartRate ?? null;
    const hrv = metrics?.hrv ?? null;
    const spo2 = metrics?.spo2 ?? null;
    const sleep = metrics?.sleepHours ?? null;

    const wearableIndicator = (
        <TouchableOpacity
            style={styles.wearableChip}
            onPress={() => navigation.navigate('ConnectDevice')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <View style={hasData ? styles.dotOnline : styles.dotOffline} />
            <Text style={hasData ? styles.wearableNameConnected : styles.wearableNameDisconnected}>
                {hasData ? 'Conectado' : 'Conectar'}
            </Text>
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

            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Tarjeta principal: energía */}
                    <TouchableOpacity
                        style={styles.energyCard}
                        onPress={() => navigation.navigate('FatigueEngine', { metrics })}
                        activeOpacity={0.9}
                    >
                        <View style={styles.energyRing}>
                            <EnergyRing percent={energyPct ?? 0} />
                            <Text style={styles.energyRingText}>
                                {energyPct != null ? `${energyPct}%` : '—'}
                            </Text>
                        </View>
                        <View style={styles.energyTextBlock}>
                            <Text style={styles.energyTitle}>{energyTitle}</Text>
                            <Text style={styles.energySubtitle}>{energySubtitle}</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Si no hay datos: CTA para conectar */}
                    {!hasData && (
                        <TouchableOpacity
                            style={styles.connectCta}
                            onPress={() => navigation.navigate('ConnectDevice')}
                            activeOpacity={0.85}
                        >
                            <Ionicons name="watch-outline" size={20} color={colors.primary} />
                            <Text style={styles.connectCtaText}>
                                Conecta tu wearable para ver datos reales
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.primary} />
                        </TouchableOpacity>
                    )}

                    {/* CARDIOVASCULAR */}
                    <Text style={styles.sectionTitle}>CARDIOVASCULAR</Text>
                    <View style={styles.rowTwo}>
                        <TouchableOpacity
                            style={styles.metricCard}
                            onPress={() => navigation.navigate('MetricDetail', {
                                title: 'Ritmo cardíaco',
                                currentValue: hr ?? 0,
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
                                {hr != null ? hr : FALLBACK}{' '}
                                {hr != null && <Text style={styles.unit}>ppm</Text>}
                            </Text>
                            <Text style={[styles.metricCaption, { color: colors.success }]}>
                                {hr != null ? 'En reposo · normal' : 'Sin datos'}
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.metricCard}
                            onPress={() => navigation.navigate('MetricDetail', {
                                title: 'FC reposo',
                                currentValue: restHr ?? 0,
                                unit: 'ppm',
                                baseValue: 61,
                                description: 'Una FC en reposo baja respecto a tu media suele reflejar buena recuperación cardiovascular.',
                                trend: restHr != null && restHr < 61 ? 'down' : 'stable',
                                lowerIsBetter: true,
                            })}
                        >
                            <View style={styles.metricTop}>
                                <Ionicons name="heart-outline" size={16} color={colors.primary} />
                                <Text style={styles.metricLabel}>FC reposo</Text>
                            </View>
                            <Text style={styles.metricValue}>
                                {restHr != null ? restHr : FALLBACK}{' '}
                                {restHr != null && <Text style={styles.unit}>ppm</Text>}
                            </Text>
                            <Text style={styles.metricCaption}>
                                {restHr != null ? `Base: ~61 ppm` : 'Sin datos'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ESTRÉS Y RECUPERACIÓN */}
                    <Text style={styles.sectionTitle}>ESTRÉS Y RECUPERACIÓN</Text>
                    <View style={styles.rowTwo}>
                        <TouchableOpacity
                            style={styles.metricCard}
                            onPress={() => navigation.navigate('MetricDetail', {
                                title: 'HRV',
                                currentValue: hrv ?? 0,
                                unit: 'ms',
                                baseValue: 50,
                                description: 'Una HRV baja respecto a tu media suele indicar fatiga o estrés acumulado. Es la señal principal del motor de fatiga.',
                                trend: hrv != null && hrv < 50 ? 'down' : 'stable',
                            })}
                        >
                            <View style={styles.metricTop}>
                                <Text style={styles.metricLabel}>HRV</Text>
                            </View>
                            <Text style={styles.metricValue}>
                                {hrv != null ? hrv : FALLBACK}{' '}
                                {hrv != null && <Text style={styles.unit}>ms</Text>}
                            </Text>
                            <Text style={[
                                styles.metricCaption,
                                { color: hrv != null && hrv < 50 ? colors.warning : colors.success }
                            ]}>
                                {hrv != null
                                    ? (hrv < 50 ? `−${50 - hrv} vs tu base` : 'Dentro de rango')
                                    : 'Sin datos'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.metricCard}>
                            <View style={styles.metricTop}>
                                <Text style={styles.metricLabel}>Nivel de estrés</Text>
                            </View>
                            <Text style={styles.metricValue}>
                                {hrv != null ? (hrv < 40 ? 'Alto' : hrv < 55 ? 'Medio' : 'Bajo') : FALLBACK}
                            </Text>
                            <Text style={[styles.metricCaption, {
                                color: hrv != null && hrv < 40 ? colors.error : colors.textSecondary
                            }]}>
                                {hrv != null ? 'Basado en HRV' : 'Sin datos'}
                            </Text>
                        </View>
                    </View>

                    {/* RESPIRACIÓN Y SUEÑO */}
                    <Text style={styles.sectionTitle}>RESPIRACIÓN Y SUEÑO</Text>
                    <View style={styles.rowThree}>
                        <TouchableOpacity
                            style={styles.metricCardSmall}
                            onPress={() => navigation.navigate('MetricDetail', {
                                title: 'SpO₂',
                                currentValue: spo2 ?? 0,
                                unit: '%',
                                baseValue: 98,
                                description: 'La saturación de oxígeno mide el % de hemoglobina que transporta oxígeno. Valores estables por encima de 95% son normales.',
                                trend: 'stable',
                            })}
                        >
                            <Text style={styles.metricLabelSmall}>SpO₂</Text>
                            <Text style={styles.metricValueSmall}>
                                {spo2 != null ? spo2 : FALLBACK}
                                {spo2 != null && <Text style={styles.unitSmall}>%</Text>}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.metricCardSmall}>
                            <Text style={styles.metricLabelSmall}>Resp.</Text>
                            <Text style={styles.metricValueSmall}>
                                {FALLBACK}
                            </Text>
                        </View>

                        <TouchableOpacity
                            style={styles.metricCardSmall}
                            onPress={() => navigation.navigate('MetricDetail', {
                                title: 'Sueño',
                                currentValue: sleep ?? 0,
                                unit: 'h',
                                baseValue: 8,
                                description: 'Dormir por debajo de tu base habitual reduce la capacidad de recuperación y afecta al rendimiento cognitivo del día siguiente.',
                                trend: sleep != null && sleep < 7 ? 'down' : 'stable',
                            })}
                        >
                            <Text style={styles.metricLabelSmall}>Sueño</Text>
                            <Text style={styles.metricValueSmall}>
                                {sleep != null ? sleep : FALLBACK}
                                {sleep != null && <Text style={styles.unitSmall}>h</Text>}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Card Consejos */}
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
            )}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    dotOffline: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.textSecondary,
    },
    wearableNameConnected: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.success,
    },
    wearableNameDisconnected: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    connectCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.primary + '10',
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.primary + '30',
    },
    connectCtaText: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
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
