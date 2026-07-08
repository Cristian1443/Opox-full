import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import NudgeModal from '../../components/NudgeModal';
import { planningApi } from '../../api';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

function IconGear() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={3} stroke="#FF6B4A" strokeWidth={1.7} />
            <Path
                d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1l-.3-2.6h-4l-.3 2.6a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.6h4l.3-2.6a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1z"
                stroke="#FF6B4A"
                strokeWidth={1.3}
            />
        </Svg>
    );
}

function MicroDonut({ percent }) {
    const dash = (Math.min(percent, 100) / 100) * 138;
    return (
        <Svg width={56} height={56} viewBox="0 0 56 56">
            <Circle cx={28} cy={28} r={22} fill="none" stroke="#FAD9CD" strokeWidth={6} />
            <Circle
                cx={28} cy={28} r={22} fill="none" stroke="#FF6B4A" strokeWidth={6}
                strokeDasharray={`${dash} 200`} strokeLinecap="round" transform="rotate(-90 28 28)"
            />
        </Svg>
    );
}

const DAY_COLORS = {
    completed: { bg: '#1f9d6b', color: '#fff', border: 'transparent' },
    partial: { bg: '#fff', color: '#1f9d6b', border: '#C7E6D6' },
    today: { bg: '#FF6B4A', color: '#fff', border: 'transparent' },
    upcoming: { bg: '#fff', color: '#9AA2B1', border: '#E4E8F0' },
};

function DayCircle({ weekday, status }) {
    const c = DAY_COLORS[status] || DAY_COLORS.upcoming;
    return (
        <View style={[styles.dayCirc, { backgroundColor: c.bg, borderColor: c.border, borderWidth: c.border === 'transparent' ? 0 : 1.5 }]}>
            <Text style={{ color: c.color, fontSize: 11, fontWeight: '700' }}>{WEEKDAY_LABELS[weekday - 1]}</Text>
        </View>
    );
}

export default function PlanningHomeScreen({ navigation }) {
    const [summary, setSummary] = useState(null);
    const [alert, setAlert] = useState(null); // 'skipped' | 'examSoon' | null

    useEffect(() => {
        let cancelled = false;
        planningApi.getSummary().then(({ data }) => {
            if (cancelled || !data) return;
            setSummary(data);
            if (data.alerts.examSoonDays !== null) setAlert('examSoon');
            else if (data.alerts.daysSinceLastActivity !== null && data.alerts.daysSinceLastActivity >= 3) setAlert('skipped');
        });
        return () => { cancelled = true; };
    }, []);

    const today = summary?.today ?? { completedCount: 0, goalCount: 3, percent: 0 };
    const days = summary?.week.days ?? [];
    const macro = summary?.macro ?? null;

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader
                title="Planificación"
                onBack={() => navigation.goBack()}
                right={<TouchableOpacity onPress={() => navigation.navigate('PlanningEdit')}><IconGear /></TouchableOpacity>}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Dividimos el esfuerzo en tres horizontes para no saturarte.</Text>

                <TouchableOpacity
                    style={[styles.horizon, { backgroundColor: '#FFF1EC' }]}
                    onPress={() => navigation.navigate('PlanningToday')}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.horizonLabel, { color: '#E0552F' }]}>HOY · MICRO</Text>
                    <View style={styles.microRow}>
                        <MicroDonut percent={today.percent} />
                        <View>
                            <Text style={styles.microTitle}>{today.completedCount} de {today.goalCount} tests</Text>
                            <Text style={styles.microCaption}>Objetivo diario</Text>
                        </View>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.horizon, { backgroundColor: '#EAF7F1' }]}
                    onPress={() => navigation.navigate('PlanningWeek')}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.horizonLabel, { color: '#1f9d6b' }]}>ESTA SEMANA</Text>
                    <View style={styles.weekRow}>
                        {days.map((d) => <DayCircle key={d.date} weekday={d.weekday} status={d.status} />)}
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.horizon, { backgroundColor: '#1B2A4A' }]}
                    onPress={() => navigation.navigate('PlanningMacro')}
                    activeOpacity={0.85}
                >
                    <Text style={[styles.horizonLabel, { color: '#9AA7C2' }]}>OPOSICIÓN · MACRO</Text>
                    {macro ? (
                        <>
                            <Text style={styles.macroTitle}>{macro.monthsLeft} meses para el examen</Text>
                            <Svg width="100%" height={30} viewBox="0 0 240 30" style={{ marginTop: 8 }}>
                                <Line x1={5} y1={15} x2={235} y2={15} stroke="#33405E" strokeWidth={3} strokeLinecap="round" />
                                <Line
                                    x1={5} y1={15}
                                    x2={5 + Math.min(230, (macro.phases.filter((p) => p.status === 'done').length / 4) * 230 + 20)}
                                    y2={15} stroke="#FF6B4A" strokeWidth={3} strokeLinecap="round"
                                />
                                <Circle cx={235} cy={15} r={5} fill="#fff" />
                            </Svg>
                        </>
                    ) : (
                        <Text style={styles.macroEmpty}>Añade tu fecha de examen para ver la cuenta atrás ›</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>

            {alert === 'skipped' && (
                <NudgeModal
                    visible
                    iconBg="#FFF4E5"
                    icon={<Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M12 3l9 16H3z" stroke="#E89B2C" strokeWidth={1.7} strokeLinejoin="round" /><Path d="M12 9v4M12 16v.3" stroke="#E89B2C" strokeWidth={1.9} strokeLinecap="round" /></Svg>}
                    title={`Llevas ${summary.alerts.daysSinceLastActivity} días sin estudiar`}
                    description="Sin problema. ¿Reajustamos el plan para recuperar el ritmo sin agobios?"
                    primaryLabel="Reajustar plan"
                    secondaryLabel="Mantener como está"
                    onPrimaryPress={() => { setAlert(null); navigation.navigate('PlanningEdit'); }}
                    onSecondaryPress={() => setAlert(null)}
                />
            )}
            {alert === 'examSoon' && (
                <NudgeModal
                    visible
                    iconBg="#FDEBE9"
                    icon={<Svg width={24} height={24} viewBox="0 0 24 24" fill="none"><Path d="M3 5h18v16H3z" stroke="#E2483D" strokeWidth={1.6} /><Path d="M3 9h18M8 3v4M16 3v4" stroke="#E2483D" strokeWidth={1.6} /></Svg>}
                    title={`Tu examen es en ${summary.alerts.examSoonDays} días`}
                    description="Entras en la recta final. La IA puede activar el modo simulacros intensivos."
                    primaryLabel="Activar recta final"
                    secondaryLabel="Ahora no"
                    onPrimaryPress={() => setAlert(null)}
                    onSecondaryPress={() => setAlert(null)}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    subtitle: { fontSize: 12.5, color: '#5A6373', marginBottom: 12 },
    horizon: { borderRadius: 15, padding: 14, marginBottom: 11 },
    horizonLabel: { fontSize: 10, fontWeight: '700', marginBottom: 8 },
    microRow: { flexDirection: 'row', alignItems: 'center', gap: 13 },
    microTitle: { fontSize: 13, fontWeight: '700', color: '#0F1B33' },
    microCaption: { fontSize: 11, color: '#7A8290' },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between' },
    dayCirc: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    macroTitle: { color: '#fff', fontSize: 13, fontWeight: '700' },
    macroEmpty: { color: '#9AA7C2', fontSize: 11.5 },
});
