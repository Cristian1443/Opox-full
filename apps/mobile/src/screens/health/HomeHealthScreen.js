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

// Colores confirmados contra Figma (frame DASHBOARD SALUD, Bloque 3) sin
// equivalente exacto en theme.js.
const FIGMA = {
    cardFill: 'rgba(255,255,255,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    ringTrack: 'rgba(65,41,80,0.15)',
    subtitleMuted: 'rgba(255,255,255,0.8)',
};

// Anillo circular de energía usado en la energyCard — pista + arco de
// progreso + círculo interior "hueco" del color de la tarjeta.
function EnergyRing({ percent = 85, size = 91, stroke = 10, holeColor }) {
    const r = (size - stroke) / 2;
    const circ = 2 * Math.PI * r;
    const dash = (percent / 100) * circ;
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
            <Text style={styles.energyRingText}>{percent}%</Text>
        </View>
    );
}

export default function HomeHealthScreen({ navigation }) {
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

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tarjeta principal: energía (navy oscuro, tap → 3.4b Motor de fatiga) */}
                <TouchableOpacity
                    style={styles.energyCard}
                    onPress={() => navigation.navigate('FatigueEngine')}
                    activeOpacity={0.9}
                >
                    <EnergyRing percent={85} holeColor={colors.bannerPurple} />
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
                            <Ionicons name="pulse" size={16} color={colors.accentOrange} />
                            <Text style={styles.metricLabel}>Ritmo cardíaco</Text>
                        </View>
                        <Text style={styles.metricValue}>
                            68 <Text style={styles.unit}>ppm</Text>
                        </Text>
                        <Text style={[styles.metricCaption, { color: colors.ctaGreen }]}>
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
                            <Ionicons name="heart-outline" size={16} color={colors.accentOrange} />
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
                        <Text style={[styles.metricCaption, { color: colors.statRed }]}>
                            −8 vs tu base
                        </Text>
                    </TouchableOpacity>

                    <View style={styles.metricCard}>
                        <View style={styles.metricTop}>
                            <Text style={styles.metricLabel}>Nivel de estrés</Text>
                        </View>
                        <Text style={styles.metricValue}>Medio</Text>
                        <Text style={[styles.metricCaption, { color: colors.statRed }]}>
                            Subiendo
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

                    <View style={styles.breathColumn}>
                        <Text style={styles.metricLabelSmall}>Resp.</Text>
                        <Text style={styles.metricValueSmall}>
                            14<Text style={styles.unitSmall}>/m</Text>
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={styles.breathColumn}
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
    watchIconWrap: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
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
