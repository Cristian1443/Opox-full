import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
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

function IconGear({ size = 28, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 54 54" fill="none">
            <Path
                d="M51.4399 30.8795V23.7995L45.2299 23.2795C44.8079 21.0153 43.9778 18.8467 42.78 16.8795L46.9299 11.8795L41.9899 6.87945L37.2399 10.9495C35.3532 9.6517 33.2453 8.70957 31.02 8.16945L30.4899 1.68945H23.4899L22.97 7.96945C20.7427 8.41611 18.6148 9.26316 16.6899 10.4695L11.7899 6.26945L6.84991 11.2695L10.8499 16.0795C9.56076 17.9964 8.62909 20.1308 8.09991 22.3795L1.68994 22.8795V29.9495L7.89996 30.4695C8.32019 32.7389 9.14679 34.9138 10.34 36.8895L6.19995 41.8895L11.1299 46.8895L15.89 42.8195C17.7719 44.1193 19.8769 45.0616 22.0999 45.5995L22.6899 52.0795H29.6899L30.21 45.7994C32.4541 45.3678 34.5998 44.5272 36.5399 43.3195L41.4399 47.5195L46.3799 42.5195L42.3799 37.7095C43.6691 35.7925 44.6008 33.6581 45.1299 31.4095L51.4399 30.8795Z"
                stroke={color}
                strokeWidth={3.38}
            />
            <Path
                d="M34.3099 26.8793C34.2902 28.4077 33.819 29.8961 32.9555 31.1574C32.092 32.4186 30.8748 33.3964 29.4571 33.9677C28.0393 34.5389 26.4843 34.6782 24.9876 34.368C23.4909 34.0578 22.1193 33.3119 21.0455 32.2241C19.9716 31.1364 19.2433 29.7554 18.9523 28.2548C18.6613 26.7543 18.8205 25.2012 19.4099 23.7909C19.9993 22.3806 20.9926 21.176 22.2648 20.3288C23.537 19.4815 25.0314 19.0294 26.5599 19.0293C27.5842 19.0358 28.5972 19.2441 29.5411 19.6421C30.4849 20.0402 31.3411 20.6202 32.0608 21.3492C32.7804 22.0781 33.3494 22.9417 33.7353 23.8905C34.1212 24.8394 34.3165 25.855 34.3099 26.8793Z"
                stroke={color}
                strokeWidth={3.38}
            />
        </Svg>
    );
}

function CalendarIcon({ size = 34, color = colors.accentOrange }) {
    return (
        <Svg width={(size * 61) / 65} height={size} viewBox="0 0 61 65" fill="none">
            <Path d="M45.6819 5.21484H14.5278V7.17855H45.6819V5.21484Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M60.1401 19.8556H0.209961V5.21484H9.34076V7.17026H2.17366V17.9002H58.1764V7.17026H50.3879V5.21484H60.1401V19.8556Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M12.3651 25.4473H9.09229V27.411H12.3651V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M18.8529 25.4473H15.5801V27.411H18.8529V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M25.3324 25.4473H22.0596V27.411H25.3324V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M31.8114 25.4473H28.5386V27.411H31.8114V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M38.2909 25.4473H35.0181V27.411H38.2909V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M44.7704 25.4473H41.4976V27.411H44.7704V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M51.2499 25.4473H47.9771V27.411H51.2499V25.4473Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M12.3651 31.6875H9.09229V33.6512H12.3651V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M18.8529 31.6875H15.5801V33.6512H18.8529V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M25.3324 31.6875H22.0596V33.6512H25.3324V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M31.8114 31.6875H28.5386V33.6512H31.8114V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M38.2909 31.6875H35.0181V33.6512H38.2909V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M44.7704 31.6875H41.4976V33.6512H44.7704V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M51.2499 31.6875H47.9771V33.6512H51.2499V31.6875Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M12.3651 37.9277H9.09229V39.8914H12.3651V37.9277Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M18.8529 37.9277H15.5801V39.8914H18.8529V37.9277Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M25.3324 37.9277H22.0596V39.8914H25.3324V37.9277Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M31.8114 37.9277H28.5386V39.8914H31.8114V37.9277Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M12.3651 44.166H9.09229V46.1297H12.3651V44.166Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M18.8529 44.166H15.5801V46.1297H18.8529V44.166Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M25.3324 44.166H22.0596V46.1297H25.3324V44.166Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M58.9637 18.9531H57V36.5353H58.9637V18.9531Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M28.4726 55.8575H1.39502V18.9531H3.35044V53.8938H28.4726V55.8575Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M51.8214 13.2443H45.9717V11.2806H49.8659V2.17464H45.9717V0.210938H51.8214V13.2443Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M15.3565 13.2443H9.50684V11.2806H13.3928V2.17464H9.50684V0.210938H15.3565V13.2443Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M37.1644 11.2402H23.1782V13.2039H37.1644V11.2402Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M45.1517 63.9536C42.3594 63.9848 39.6208 63.1853 37.2838 61.6566C34.9468 60.128 33.1169 57.9392 32.0266 55.3683C30.9363 52.7974 30.6348 49.9604 31.1604 47.2178C31.686 44.4751 33.015 41.9506 34.9785 39.9649C36.942 37.9792 39.4514 36.622 42.1879 36.0656C44.9245 35.5092 47.7647 35.7788 50.3477 36.8402C52.9307 37.9015 55.1399 39.7066 56.6947 42.0263C58.2495 44.3459 59.0798 47.0754 59.0799 49.8679C59.0954 53.5812 57.6379 57.149 55.0271 59.7894C52.4162 62.4298 48.8649 63.9273 45.1517 63.9536ZM45.1517 37.7212C42.7442 37.6883 40.3813 38.3722 38.3634 39.6858C36.3456 40.9995 34.764 42.8836 33.8198 45.0985C32.8756 47.3134 32.6114 49.7591 33.0609 52.1245C33.5104 54.49 34.6532 56.6683 36.344 58.3826C38.0348 60.0968 40.1973 61.2694 42.5563 61.7514C44.9154 62.2333 47.3645 62.0028 49.5921 61.0891C51.8198 60.1755 53.7255 58.6199 55.0667 56.6204C56.408 54.6208 57.1243 52.2674 57.1245 49.8597C57.1444 46.6622 55.8949 43.5874 53.6502 41.3101C51.4056 39.0329 48.3492 37.7392 45.1517 37.7129V37.7212Z" fill={color} stroke={color} strokeWidth={0.42} />
            <Path d="M42.2513 54.8221L38.1333 50.6544L39.5336 49.2707L42.2513 52.0299L50.6695 43.5039L52.0698 44.8793L42.2513 54.8221Z" fill={color} stroke={color} strokeWidth={0.42} />
        </Svg>
    );
}

function Rosco({ percent, size = 104 }) {
    const stroke = Math.round(size * 0.106);
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
                    style={styles.backBtn}
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
                    <IconGear size={32} />
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
                    <Rosco percent={today.percent} size={132} />
                    <View style={styles.objectiveTextWrap}>
                        <Text style={styles.objectiveCaption}>{today.completedCount} de {today.goalCount} tests</Text>
                        <Text style={styles.objectiveTitle}>Objetivo diario</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textDark} />
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
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F0F0F2',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: 'rgba(65,41,80,0.5)',
        textAlign: 'center',
        paddingHorizontal: spacing.xl,
        marginBottom: spacing.md,
    },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: 24 },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
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
        fontSize: 14.5,
        color: colors.textDark,
    },
    objectiveCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        backgroundColor: colors.white,
        borderRadius: 20,
        borderWidth: 0.6,
        borderColor: FIGMA.cardBorder,
        padding: 20,
        marginBottom: 28,
    },
    roscoText: {
        position: 'absolute',
        fontWeight: 'bold',
        fontSize: 30,
        color: colors.textDark,
    },
    objectiveTextWrap: { flex: 1 },
    objectiveCaption: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        color: colors.accentOrange,
    },
    objectiveTitle: {
        marginTop: 3,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 19,
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
        fontSize: 14.5,
        color: colors.textDark,
    },
    weekRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 28,
    },
    dayCirc: {
        width: 48,
        height: 48,
        borderRadius: 24,
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
