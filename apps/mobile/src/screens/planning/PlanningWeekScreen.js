import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];

// Colores confirmados contra Figma (frame SEMANA, Bloque 4) sin
// equivalente exacto en theme.js.
const FIGMA = {
    dayOutline: '#D9D9D9',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
};

const DAY_COLORS = {
    completed: { bg: colors.ctaGreen, number: colors.white },
    partial: { bg: colors.white, number: colors.ctaGreen, border: colors.ctaGreen },
    today: { bg: colors.accentOrange, number: colors.white },
    upcoming: { bg: colors.white, number: colors.textDark, border: FIGMA.dayOutline },
};

function formatDayNumber(dateIso) {
    return String(Number(dateIso.slice(8, 10)));
}

function formatWeekLabel(days) {
    if (days.length === 0) return '';
    const first = days[0].date;
    const last = days[days.length - 1].date;
    return `${formatDayNumber(first)}-${formatDayNumber(last)} ${new Date(`${last}T00:00:00Z`).toLocaleDateString('es-ES', { month: 'short' })}`;
}

export default function PlanningWeekScreen({ navigation }) {
    const [week, setWeek] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);

    const load = useCallback((selected) => {
        planningApi.getWeek(selected ? { selectedDate: selected } : {}).then(({ data }) => {
            if (data) {
                setWeek(data);
                setSelectedDate(data.selectedDate);
            }
        });
    }, []);

    useEffect(() => { load(); }, [load]);

    const days = week?.days ?? [];
    const tasks = week?.selectedTasks ?? [];
    const ritmoPercent = week?.ritmoPercent ?? null;
    const selectedDay = days.find((d) => d.date === selectedDate);
    const planLabel = selectedDay
        ? `${WEEKDAY_NAMES[selectedDay.weekday - 1]} ${formatDayNumber(selectedDay.date)} - PLAN`
        : 'PLAN DEL DÍA';

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
                <Text style={styles.headerTitle}>Semana {formatWeekLabel(days)}</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.weekRow}>
                    {days.map((d) => {
                        const c = DAY_COLORS[d.status] || DAY_COLORS.upcoming;
                        const isToday = d.status === 'today';
                        return (
                            <TouchableOpacity key={d.date} style={styles.dayCol} onPress={() => load(d.date)} activeOpacity={0.7}>
                                <View style={[styles.dayCirc, { backgroundColor: c.bg, borderColor: c.border || 'transparent', borderWidth: c.border ? 0.44 : 0 }]}>
                                    <Text style={[styles.dayNumber, { color: c.number }]}>{formatDayNumber(d.date)}</Text>
                                </View>
                                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                                    {WEEKDAY_LABELS[d.weekday - 1]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.sectionLabel}>{planLabel}</Text>
                {tasks.length === 0 ? (
                    <Text style={styles.empty}>Sin tareas planificadas este día.</Text>
                ) : (
                    <View style={styles.planList}>
                        {tasks.map((t, index) => (
                            <View key={t.id} style={[styles.planRow, index < tasks.length - 1 && styles.planRowSeparator]}>
                                <View style={styles.bullet} />
                                <View style={styles.planTextWrap}>
                                    <Text style={styles.planTitle}>{t.title}</Text>
                                    {t.subtitle && <Text style={styles.planSubtitle}>{t.subtitle}</Text>}
                                </View>
                            </View>
                        ))}
                    </View>
                )}

                {ritmoPercent !== null && (
                    <Text style={styles.ritmo}>
                        Ritmo cumplido esta semana: <Text style={styles.ritmoValue}>{ritmoPercent}%</Text>
                    </Text>
                )}
            </ScrollView>
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
    iconBtn: { width: 32, padding: 4 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 24 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
    dayCol: { alignItems: 'center' },
    dayCirc: { width: 43, height: 43, borderRadius: 21.5, alignItems: 'center', justifyContent: 'center' },
    dayNumber: { fontFamily: 'Poppins-SemiBold', fontSize: 18.7 },
    dayLabel: { marginTop: 6, fontFamily: 'Poppins-Regular', fontSize: 9, color: colors.textDark },
    dayLabelToday: { color: colors.accentOrange },
    sectionLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark, marginBottom: 8 },
    empty: { textAlign: 'center', fontFamily: 'Poppins-Regular', color: FIGMA.textNote, fontSize: 12.5, marginTop: 20 },
    planList: { marginBottom: 16 },
    planRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 16 },
    planRowSeparator: { borderBottomWidth: 0.44, borderBottomColor: FIGMA.separator },
    bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accentOrange, marginTop: 8, marginRight: 10 },
    planTextWrap: { flex: 1 },
    planTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark },
    planSubtitle: { marginTop: 2, fontFamily: 'Poppins-Regular', fontSize: 9, color: FIGMA.textNote },
    ritmo: { textAlign: 'center', marginTop: 8, fontFamily: 'Poppins-Light', fontSize: 13.8, color: colors.textDark },
    ritmoValue: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark },
});
