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
import Svg, { Circle, Path } from 'react-native-svg';
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

// Iconos exactos de Figma (frame DASHBOARD SALUD, Bloque 3).
function IconWatch({ size = 30, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 55) / 93} height={size} viewBox="0 0 55 93" fill="none">
            <Path
                d="M54.0031 53.0332C54.0128 52.0398 53.4726 51.5322 52.4958 51.5617C51.8987 51.5794 51.6325 51.4142 51.6403 50.7572C51.6697 48.0031 51.6619 45.249 51.654 42.4851C51.654 41.4799 51.6345 41.4622 52.6093 41.4661C53.1966 41.4661 53.5881 41.232 53.7251 40.6694C53.8512 40.2612 53.9275 39.8391 53.9522 39.4124C53.9678 36.9416 53.9522 34.4708 53.9522 32C53.9522 30.9299 53.4471 30.4125 52.3861 30.4165C51.7793 30.4165 51.5268 30.1824 51.5346 29.5627C51.5562 27.9319 51.5209 26.3011 51.5503 24.6703C51.5989 23.5466 51.4018 22.4259 50.9728 21.3871C50.5708 20.4099 49.9511 19.5385 49.1614 18.8397C48.3717 18.1409 47.4331 17.6335 46.4176 17.3563C45.5759 17.1104 45.2059 16.7662 45.0728 15.9793C45.0161 15.6527 44.8888 15.338 44.8164 15.0114C44.1058 11.8325 43.4951 8.62596 42.6631 5.47846C41.9897 2.86407 39.3392 1.07 36.4871 1.04049C30.1702 0.975576 23.8356 0.999182 17.5109 1.03853C16.3258 1.02195 15.1443 1.17294 14.001 1.48704C12.2393 2.01818 10.7848 3.10014 10.1662 4.92962C9.68273 6.3637 9.36756 7.85679 9.02696 9.33611C8.51408 11.563 8.04819 13.8016 7.55294 16.0344C7.40025 16.7327 7.13794 17.3189 6.27076 17.313C6.08175 17.3395 5.89925 17.4009 5.73244 17.494C2.79615 18.6842 1.03438 21.2907 1.02263 24.5169C1.01089 31.861 1.01089 39.2006 1.02263 46.5356H1.00306C1.00306 53.4443 1.00306 60.3524 1.00306 67.2599C0.987798 68.0978 1.02966 68.9358 1.12834 69.768C1.32002 71.1488 1.91133 72.4425 2.82876 73.4883C3.74619 74.534 4.94925 75.2857 6.28838 75.6499C7.12424 75.8801 7.41591 76.307 7.57056 77.0269C8.29484 80.3712 9.00738 83.7291 9.76103 87.0714C9.89161 87.6529 10.12 88.2077 10.4364 88.712C11.8262 90.8995 13.9227 91.9441 16.4401 91.9657C23.0272 92.0189 29.6162 91.9953 36.2111 91.9775C39.2942 91.9775 42.3969 89.855 42.9313 86.6878C43.2836 84.6026 43.8102 82.5567 44.2781 80.4853C44.5795 79.1594 44.881 77.8315 45.2568 76.5293C45.3201 76.3507 45.4219 76.1885 45.5549 76.0541C45.6879 75.9198 45.8488 75.8167 46.0261 75.7522C49.0701 75.1011 51.5287 72.1483 51.5424 69.0284C51.5424 67.1576 51.5522 65.2907 51.5327 63.416C51.5327 62.8475 51.7284 62.5799 52.3157 62.576C53.4628 62.576 53.9776 62.0488 53.96 60.9137C53.9443 59.8869 53.8406 58.86 53.8523 57.8331C53.8719 56.2338 53.9874 54.6345 54.0031 53.0332ZM10.0077 16.3078C10.4383 14.3328 10.8794 12.3603 11.331 10.3905C11.5933 9.26136 11.9652 8.13416 12.112 6.98533C12.39 4.88241 14.3142 3.5821 16.1739 3.57029C22.9724 3.53292 29.7728 3.56046 36.5713 3.57029C38.1373 3.57029 40.1262 5.03978 40.4257 6.6332C40.9973 9.66857 41.7509 12.6705 42.3988 15.6921C42.6846 17.0239 42.6494 17.0121 41.2341 17.0081C36.2463 17.0003 31.2599 17.0003 26.2747 17.0081V17.0258C21.0736 17.0258 15.8724 17.0258 10.6713 17.0258C10.1212 17.0317 9.90001 16.8252 10.0077 16.3078ZM42.5594 76.8715C42.2285 78.1364 41.9721 79.4289 41.6844 80.6977C41.2752 82.5331 40.8465 84.3626 40.4746 86.2058C40.0459 88.3225 38.0003 89.4379 36.2385 89.4359C33.0882 89.4359 29.9392 89.4359 26.7915 89.4359C23.3306 89.4359 19.8723 89.4359 16.4166 89.4359C14.5217 89.4359 12.758 88.2812 12.2588 86.6366C11.9691 85.6826 11.8145 84.6891 11.5972 83.7154C11.1861 81.8584 10.7744 80.0007 10.362 78.1423C10.27 77.7253 10.1819 77.3063 10.086 76.8892C9.91371 76.1358 10.0351 75.9745 10.7809 75.9745H26.3843V75.9568H41.9153C42.6631 75.9607 42.7512 76.1456 42.5594 76.8715ZM49.1034 68.8061C49.0721 71.3359 46.9149 73.4427 44.3348 73.4447C32.6132 73.4617 20.8922 73.4657 9.17181 73.4565C8.57742 73.4752 7.98257 73.4403 7.39438 73.3522C5.06688 72.9214 3.49499 70.6375 3.51456 68.3713C3.57525 61.0554 3.5361 53.7374 3.5361 46.4215C3.5361 39.2019 3.55567 31.9804 3.52435 24.7608C3.51456 22.6677 4.33085 21.0763 6.14156 20.1064C6.86197 19.752 7.65525 19.5727 8.45732 19.5832C20.3695 19.5517 32.2817 19.5438 44.1939 19.5596C45.1227 19.5331 46.0387 19.7829 46.8268 20.2776C48.3654 21.2612 49.0662 22.6835 49.074 24.4834C49.0858 26.9523 49.0897 29.423 49.0995 31.8938C49.1308 40.2406 49.1778 48.5854 49.1915 56.9321C49.1973 60.8882 49.1582 64.8442 49.1034 68.8002V68.8061Z"
                fill={color}
                stroke={color}
                strokeWidth={2}
            />
            <Path
                d="M13.7587 47.0418C13.9429 47.2676 14.1383 47.4839 14.3441 47.6899L15.2384 48.6039L27.1406 60.77L39.0428 48.6039L39.9371 47.6899C41.5006 46.0828 42.3764 43.9221 42.3764 41.6717C42.3764 39.4213 41.5006 37.2606 39.9371 35.6534L39.8149 35.527C39.0475 34.7375 38.1314 34.1102 37.1202 33.682C36.1091 33.2538 35.0233 33.0332 33.9265 33.0332C32.8297 33.0332 31.7439 33.2538 30.7327 33.682C29.7216 34.1102 28.8055 34.7375 28.0381 35.527L27.1438 36.4409L26.2431 35.54C25.4757 34.7504 24.5596 34.1232 23.5485 33.695C22.5374 33.2667 21.4516 33.0462 20.3548 33.0462C19.2579 33.0462 18.1721 33.2667 17.161 33.695C16.1499 34.1232 15.2338 34.7504 14.4664 35.54L14.3441 35.6663C12.776 37.2704 11.8997 39.4332 11.9058 41.6846"
                stroke={color}
                strokeWidth={3}
                strokeLinecap="round"
            />
            <Path
                d="M32.5823 43.8546H26.9856H23.6595L21.8846 47.1746L19.5787 39.5605L17.5383 44.2461H8.64111"
                stroke={color}
                strokeWidth={2}
                strokeLinecap="round"
            />
        </Svg>
    );
}

function IconPulse({ size = 16, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={(size * 57) / 68} viewBox="0 0 68 57" fill="none">
            <Path
                d="M47.0103 22.5869H36.7244H30.6116L27.3496 28.6914L23.1118 14.6914L19.3618 23.3068H3.01025"
                stroke={color}
                strokeWidth={3.25}
                strokeLinecap="round"
            />
        </Svg>
    );
}

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
            <IconWatch size={30} />
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
                                <IconPulse size={24} />
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
                                <IconPulse size={24} />
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
