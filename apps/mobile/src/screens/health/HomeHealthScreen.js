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

// Colores confirmados contra Figma (frame DASHBOARD SALUD, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    cardFill: 'rgba(255,255,255,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    ringTrack: 'rgba(65,41,80,0.15)',
    subtitleMuted: 'rgba(255,255,255,0.8)',
};

const FALLBACK = '—';

// Anillo circular de energía usado en la energyCard — pista + arco de
// progreso + círculo interior "hueco" del color de la tarjeta.
function EnergyRing({ percent = 0, size = 91, stroke = 10, holeColor }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (Math.max(0, Math.min(100, percent)) / 100) * circ;
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size}>
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={FIGMA.ringTrack}
                    strokeWidth={stroke}
                    fill="none"
                />
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={r}
                    stroke={colors.ctaGreen}
                    strokeWidth={stroke}
                    fill="none"
                    strokeDasharray={`${dash} ${circ}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${size / 2} ${size / 2})`}
                />
                <Circle cx={size / 2} cy={size / 2} r={r - stroke / 2 - 2} fill={holeColor} />
            </Svg>
            <Text style={styles.energyRingText}>{percent != null ? `${percent}%` : FALLBACK}</Text>
        </View>
    );
}

// Heurística de energía: combina HRV (principal), sueño y FC reposo — datos
// reales de HealthKit/Health Connect vía HealthService.
function calcEnergy(metrics) {
    if (!metrics) return null;
    const { hrv, sleepHours, restingHeartRate } = metrics;
    let score = 0;
    let parts = 0;
    if (hrv != null) { score += Math.min(1, hrv / 50) * 50; parts += 50; }
    if (sleepHours != null) { score += Math.min(1, sleepHours / 8) * 30; parts += 30; }
    if (restingHeartRate != null) { score += Math.max(0, 1 - (restingHeartRate - 40) / 60) * 20; parts += 20; }
    if (parts === 0) return null;
    return Math.round((score / parts) * 100);
}

function energyLabel(pct) {
    if (pct == null) return { title: 'Sin datos', subtitle: 'Conecta un wearable para ver tu energía.' };
    if (pct >= 75) return { title: 'Energía buena', subtitle: 'Estás listo para una sesión exigente.' };
    if (pct >= 50) return { title: 'Energía media', subtitle: 'Tómate descansos regulares hoy.' };
    return { title: 'Energía baja', subtitle: 'Descansa antes de una sesión larga.' };
}

export default function HomeHealthScreen({ navigation }) {
    const [metrics, setMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    // Recargar datos cada vez que la pantalla recibe foco
    const loadMetrics = useCallback(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            const data = await getHealthMetrics();
            if (!cancelled) {
                setMetrics(data);
                setLoading(false);
            }
        })();
        return () => { cancelled = true; };
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
            style={styles.watchIconWrap}
            onPress={() => navigation.navigate('ConnectDevice')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
            <Ionicons name="watch-outline" size={24} color={colors.accentOrange} />
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
                    <ActivityIndicator size="large" color={colors.ctaGreen} />
                </View>
            ) : (
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Tarjeta principal: energía (tap → 3.4b Motor de fatiga) */}
                    <TouchableOpacity
                        style={styles.energyCard}
                        onPress={() => navigation.navigate('FatigueEngine', { metrics })}
                        activeOpacity={0.9}
                    >
                        <EnergyRing percent={energyPct ?? 0} holeColor={colors.bannerPurple} />
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
                            <Ionicons name="watch-outline" size={20} color={colors.accentOrange} />
                            <Text style={styles.connectCtaText}>
                                Conecta tu wearable para ver datos reales
                            </Text>
                            <Ionicons name="chevron-forward" size={16} color={colors.accentOrange} />
                        </TouchableOpacity>
                    )}

                    {/* CARDIOVASCULAR (2 columnas) */}
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
                                <Ionicons name="pulse" size={16} color={colors.accentOrange} />
                                <Text style={styles.metricLabel}>Ritmo cardíaco</Text>
                            </View>
                            <Text style={styles.metricValue}>
                                {hr != null ? hr : FALLBACK} {hr != null && <Text style={styles.unit}>ppm</Text>}
                            </Text>
                            <Text style={[styles.metricCaption, { color: colors.ctaGreen }]}>
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
                                description: 'Una FC en reposo baja respecto a tu media suele reflejar buena recuperación cardiovascular. Cambios bruscos merecen atención.',
                                trend: restHr != null && restHr < 61 ? 'down' : 'stable',
                                lowerIsBetter: true,
                            })}
                        >
                            <View style={styles.metricTop}>
                                <Ionicons name="heart-outline" size={16} color={colors.accentOrange} />
                                <Text style={styles.metricLabel}>FC reposo</Text>
                            </View>
                            <Text style={styles.metricValue}>
                                {restHr != null ? restHr : FALLBACK} {restHr != null && <Text style={styles.unit}>ppm</Text>}
                            </Text>
                            <Text style={styles.metricCaption}>
                                {restHr != null ? 'Tu media: 61' : 'Sin datos'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* ESTRÉS Y RECUPERACIÓN (2 columnas) */}
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
                                {hrv != null ? hrv : FALLBACK} {hrv != null && <Text style={styles.unit}>ms</Text>}
                            </Text>
                            <Text style={[styles.metricCaption, { color: hrv != null && hrv < 50 ? colors.statRed : colors.ctaGreen }]}>
                                {hrv != null ? (hrv < 50 ? `−${50 - hrv} vs tu base` : 'Dentro de rango') : 'Sin datos'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.metricCard}>
                            <View style={styles.metricTop}>
                                <Text style={styles.metricLabel}>Nivel de estrés</Text>
                            </View>
                            <Text style={styles.metricValue}>
                                {hrv != null ? (hrv < 40 ? 'Alto' : hrv < 55 ? 'Medio' : 'Bajo') : FALLBACK}
                            </Text>
                            <Text style={[styles.metricCaption, { color: hrv != null && hrv < 40 ? colors.statRed : colors.textDark }]}>
                                {hrv != null ? 'Basado en HRV' : 'Sin datos'}
                            </Text>
                        </View>
                    </View>

                    {/* RESPIRACIÓN Y SUEÑO (3 columnas, sin tarjetas — solo texto) */}
                    <Text style={styles.sectionTitle}>RESPIRACIÓN Y SUEÑO</Text>
                    <View style={styles.rowThree}>
                        <TouchableOpacity
                            style={styles.breathColumn}
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
                                {spo2 != null ? spo2 : FALLBACK}{spo2 != null && <Text style={styles.unitSmall}>%</Text>}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.breathColumn}>
                            <Text style={styles.metricLabelSmall}>Resp.</Text>
                            <Text style={styles.metricValueSmall}>{FALLBACK}</Text>
                        </View>

                        <TouchableOpacity
                            style={styles.breathColumn}
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
                                {sleep != null ? sleep : FALLBACK}{sleep != null && <Text style={styles.unitSmall}>h</Text>}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Card Consejos (entry point a 3.6 AdviceHome) */}
                    <TouchableOpacity
                        style={styles.tipsCard}
                        onPress={() => navigation.navigate('AdviceHome')}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.tipsIcon, { backgroundColor: colors.accentOrange + '15' }]}>
                            <Ionicons name="bulb-outline" size={24} color={colors.accentOrange} />
                        </View>
                        <View style={styles.tipsText}>
                            <Text style={styles.tipsTitle}>Consejos</Text>
                            <Text style={styles.tipsSubtitle}>Estudio, alimentación, meditación</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={colors.textDark} />
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
        backgroundColor: colors.white,
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
    watchIconWrap: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    connectCta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: FIGMA.cardFill,
        borderRadius: 14,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
    },
    connectCtaText: {
        flex: 1,
        fontFamily: 'Poppins-Medium',
        fontSize: 12.5,
        color: colors.textDark,
    },
    energyCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.bannerPurple,
        borderRadius: 24,
        padding: spacing.md,
        marginBottom: spacing.lg,
        gap: spacing.md,
    },
    energyRingText: {
        position: 'absolute',
        color: colors.white,
        fontSize: 15,
        fontFamily: 'Poppins-Bold',
    },
    energyTextBlock: {
        flex: 1,
    },
    energyTitle: {
        fontSize: 19,
        fontFamily: 'Poppins-SemiBold',
        color: colors.white,
        marginBottom: 4,
    },
    energySubtitle: {
        fontSize: 11.5,
        lineHeight: 14.7,
        fontFamily: 'Poppins-Light',
        color: FIGMA.subtitleMuted,
    },
    sectionTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: spacing.sm,
        marginTop: spacing.md,
    },
    rowTwo: {
        flexDirection: 'row',
        gap: spacing.sm,
    },
    rowThree: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    metricCard: {
        flex: 1,
        backgroundColor: FIGMA.cardFill,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
    },
    metricTop: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 6,
    },
    metricLabel: {
        fontSize: 10.5,
        letterSpacing: 0.4,
        fontFamily: 'Poppins-Light',
        color: colors.textDark,
    },
    metricValue: {
        fontSize: 31,
        fontFamily: 'Poppins-Bold',
        color: colors.textDark,
        marginBottom: 4,
    },
    unit: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
    metricCaption: {
        fontSize: 10.5,
        fontFamily: 'Poppins-Medium',
        color: colors.textDark,
    },
    breathColumn: {
        alignItems: 'flex-start',
    },
    metricLabelSmall: {
        fontSize: 10.5,
        letterSpacing: 0.4,
        fontFamily: 'Poppins-Light',
        color: colors.textDark,
        marginBottom: 4,
    },
    metricValueSmall: {
        fontSize: 31,
        fontFamily: 'Poppins-Bold',
        color: colors.textDark,
    },
    unitSmall: {
        fontSize: 14,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
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
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: 2,
    },
    tipsSubtitle: {
        fontSize: 13,
        fontFamily: 'Poppins-Regular',
        color: colors.textDark,
    },
});
