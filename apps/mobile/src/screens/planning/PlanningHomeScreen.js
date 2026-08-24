import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import PlanningPopupModal, { WarningIcon, CalendarCheckIcon } from '../../components/PlanningPopupModal';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const MESES_ABBR = ['ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN', 'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'];

// Colores confirmados contra Figma (frame HOME PLANIFICACION, Bloque 4)
// sin equivalente exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(65,41,80,0.15)',
    ringTrack: 'rgba(65,41,80,0.15)',
    sliderTrack: 'rgba(246,150,36,0.2)',
    dayUpcomingBorder: 'rgba(65,41,80,0.3)',
};

// Variable de módulo: las alertas de planificación se muestran solo una vez
// por sesión de app, sin importar cuántas veces el usuario entre/salga del hub.
let _alertsShownThisSession = false;

function IconGear({ size = 20, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.7} />
            <Path
                d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"
                stroke={color}
                strokeWidth={1.3}
            />
        </Svg>
    );
}

function CalendarIcon({ size = 26, color = colors.accentOrange }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Rect x={3.5} y={5} width={17} height={15} rx={2.5} stroke={color} strokeWidth={1.7} />
            <Line x1={3.5} y1={9.5} x2={20.5} y2={9.5} stroke={color} strokeWidth={1.7} />
            <Line x1={8} y1={3} x2={8} y2={6.5} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
            <Line x1={16} y1={3} x2={16} y2={6.5} stroke={color} strokeWidth={1.7} strokeLinecap="round" />
            <Circle cx={12} cy={14.5} r={3.6} stroke={color} strokeWidth={1.5} />
            <Path d="M12 12.8v1.7l1.3.8" stroke={color} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function Rosco({ percent, size = 104 }) {
    const stroke = 11;
    const r = (size - stroke) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * r;
    const dash = (Math.min(percent, 100) / 100) * circumference;
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle cx={c} cy={c} r={r} fill="none" stroke={FIGMA.ringTrack} strokeWidth={stroke} />
                <Circle
                    cx={c} cy={c} r={r} fill="none" stroke={colors.ctaGreen} strokeWidth={stroke}
                    strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round"
                    transform={`rotate(-90 ${c} ${c})`}
                />
            </Svg>
            <Text style={styles.roscoText}>{Math.round(percent)}%</Text>
        </View>
    );
}

const DAY_COLORS = {
    completed: { bg: colors.ctaGreen, color: colors.white, border: 'transparent' },
    partial: { bg: colors.white, color: colors.ctaGreen, border: colors.ctaGreen },
    today: { bg: colors.accentOrange, color: colors.white, border: 'transparent' },
    upcoming: { bg: colors.white, color: colors.textDark, border: FIGMA.dayUpcomingBorder },
};

function DayCircle({ weekday, status }) {
    const c = DAY_COLORS[status] || DAY_COLORS.upcoming;
    return (
        <View style={[styles.dayCirc, { backgroundColor: c.bg, borderColor: c.border, borderWidth: c.border === 'transparent' ? 0 : 1.3 }]}>
            <Text style={[styles.dayCircText, { color: c.color }]}>{WEEKDAY_LABELS[weekday - 1]}</Text>
        </View>
    );
}

export default function PlanningHomeScreen({ navigation }) {
    const [summary, setSummary] = useState(null);
    const [alert, setAlert] = useState(null); // 'skipped' | 'examSoon' | null

    const load = useCallback(() => {
        let cancelled = false;
        planningApi.getSummary().then(({ data }) => {
            if (cancelled || !data) return;
            setSummary(data);
            if (!_alertsShownThisSession) {
                _alertsShownThisSession = true;
                if (data.alerts.examSoonDays !== null) setAlert('examSoon');
                else if (data.alerts.daysSinceLastActivity !== null && data.alerts.daysSinceLastActivity >= 3) setAlert('skipped');
            }
        });
        return () => { cancelled = true; };
    }, []);

    useFocusEffect(load);

    const today = summary?.today ?? { completedCount: 0, goalCount: 3, percent: 0 };
    const days = summary?.week.days ?? [];
    const macro = summary?.macro ?? null;
    const progressFraction = macro && macro.phases.length > 0
        ? macro.phases.filter((p) => p.status === 'done').length / macro.phases.length
        : 0;
    const examMonthLabel = macro ? MESES_ABBR[new Date(macro.examDate).getMonth()] : '';

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Planificación</Text>
                <TouchableOpacity
                    onPress={() => navigation.navigate('PlanningEdit')}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <IconGear />
                </TouchableOpacity>
            </View>
            <Text style={styles.subtitle}>Dividimos el esfuerzo en tres horizontes para no saturarte.</Text>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.sectionLabel}>CONTINÚA DONDE LO DEJASTE</Text>

                <View style={styles.planForTodayRow}>
                    <CalendarIcon />
                    <Text style={styles.planForTodayText}>Plan para hoy</Text>
                </View>

                <TouchableOpacity
                    style={styles.objectiveCard}
                    onPress={() => navigation.navigate('PlanningToday')}
                    activeOpacity={0.85}
                >
                    <Rosco percent={today.percent} />
                    <View style={styles.objectiveTextWrap}>
                        <Text style={styles.objectiveCaption}>{today.completedCount} de {today.goalCount} tests</Text>
                        <Text style={styles.objectiveTitle}>Objetivo diario</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color={colors.textDark} />
                </TouchableOpacity>

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>ESTA SEMANA</Text>
                    <TouchableOpacity
                        style={styles.sectionLink}
                        onPress={() => navigation.navigate('PlanningWeek')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionLinkText}>Ver plan semanal</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textDark} />
                    </TouchableOpacity>
                </View>
                <View style={styles.weekRow}>
                    {days.map((d) => <DayCircle key={d.date} weekday={d.weekday} status={d.status} />)}
                </View>

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionLabel}>OPOSICIÓN</Text>
                    <TouchableOpacity
                        style={styles.sectionLink}
                        onPress={() => navigation.navigate('PlanningMacro')}
                        activeOpacity={0.7}
                    >
                        <Text style={styles.sectionLinkText}>Plan a largo plazo</Text>
                        <Ionicons name="chevron-forward" size={16} color={colors.textDark} />
                    </TouchableOpacity>
                </View>

                {macro ? (
                    <>
                        <Text style={styles.macroTitle}>{macro.monthsLeft} meses para el examen</Text>
                        <View style={styles.sliderTrack}>
                            <View style={[styles.sliderFill, { width: `${Math.round(progressFraction * 100)}%` }]} />
                            <View style={[styles.sliderThumb, { left: `${Math.round(progressFraction * 100)}%` }]} />
                        </View>
                        <View style={styles.sliderLabelsRow}>
                            <Text style={[styles.sliderLabel, { left: `${Math.round(progressFraction * 100)}%` }]}>HOY</Text>
                            <View style={styles.sliderEndLabel}>
                                <Text style={styles.sliderLabel}>{examMonthLabel}</Text>
                                <Text style={styles.sliderEndCaption}>examen</Text>
                            </View>
                        </View>
                    </>
                ) : (
                    <Text style={styles.macroEmpty}>Añade tu fecha de examen para ver la cuenta atrás ›</Text>
                )}

                <View style={{ height: spacing.xl }} />
            </ScrollView>

            {alert === 'skipped' && (
                <PlanningPopupModal
                    visible
                    icon={<WarningIcon />}
                    title={`Llevas ${summary.alerts.daysSinceLastActivity} días sin estudiar`}
                    description="Sin problema. ¿Reajustamos el plan para recuperar el ritmo sin agobios?"
                    primaryLabel="Reajustar plan"
                    secondaryLabel="Mantener como está"
                    onPrimaryPress={() => { setAlert(null); navigation.navigate('PlanningEdit'); }}
                    onSecondaryPress={() => setAlert(null)}
                />
            )}
            {alert === 'examSoon' && (
                <PlanningPopupModal
                    visible
                    icon={<CalendarCheckIcon />}
                    title={`Tu examen es en ${summary.alerts.examSoonDays} días`}
                    description="Entras en la recta final. Al activar, tu objetivo diario sube al 125% para simular el ritmo real del examen."
                    primaryLabel="Activar recta final"
                    secondaryLabel="Ahora no"
                    onPrimaryPress={async () => {
                        await planningApi.updatePlan({ intensity: 'high' });
                        setAlert(null);
                        navigation.navigate('PlanningToday');
                    }}
                    onSecondaryPress={() => setAlert(null)}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
    },
    iconBtn: { padding: 4 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.5,
        color: 'rgba(65,41,80,0.5)',
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: 24 },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 12,
    },
    planForTodayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 12,
    },
    planForTodayText: {
        fontFamily: 'Poppins-Light',
        fontSize: 12.9,
        color: colors.textDark,
    },
    objectiveCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 0.6,
        borderColor: FIGMA.cardBorder,
        padding: 16,
        marginBottom: 28,
    },
    roscoText: {
        position: 'absolute',
        fontWeight: 'bold',
        fontSize: 20,
        color: colors.textDark,
    },
    objectiveTextWrap: { flex: 1 },
    objectiveCaption: {
        fontFamily: 'Poppins-Regular',
        fontSize: 8.9,
        color: colors.accentOrange,
    },
    objectiveTitle: {
        marginTop: 2,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    sectionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    sectionLinkText: {
        fontFamily: 'Poppins-Light',
        fontSize: 12.9,
        color: colors.textDark,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    dayCirc: {
        width: 43,
        height: 43,
        borderRadius: 21.5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18.6,
    },
    macroTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 20,
    },
    sliderTrack: {
        height: 7,
        borderRadius: 3.5,
        backgroundColor: FIGMA.sliderTrack,
    },
    sliderFill: {
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.accentOrange,
    },
    sliderThumb: {
        position: 'absolute',
        width: 18,
        height: 18,
        borderRadius: 9,
        backgroundColor: colors.accentOrange,
        top: -5.5,
        marginLeft: -9,
    },
    sliderLabelsRow: {
        marginTop: 10,
        height: 34,
    },
    sliderLabel: {
        position: 'absolute',
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
        transform: [{ translateX: -14 }],
    },
    sliderEndLabel: {
        position: 'absolute',
        right: 0,
        alignItems: 'flex-end',
    },
    sliderEndCaption: {
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: 'rgba(65,41,80,0.5)',
    },
    macroEmpty: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: 'rgba(65,41,80,0.5)',
        textAlign: 'center',
    },
});
