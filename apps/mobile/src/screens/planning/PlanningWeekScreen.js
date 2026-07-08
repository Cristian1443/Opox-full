import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { planningApi } from '../../api';

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const KIND_COLORS = { test: '#2D6FB0', tutor: '#7B4BC4', simulacro: '#1f9d6b', other: '#9AA2B1' };

const DAY_COLORS = {
    completed: { bg: '#1f9d6b', color: '#fff', border: 'transparent' },
    partial: { bg: '#fff', color: '#1f9d6b', border: '#C7E6D6' },
    today: { bg: '#FF6B4A', color: '#fff', border: 'transparent' },
    upcoming: { bg: '#fff', color: '#9AA2B1', border: '#E4E8F0' },
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

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader
                title="Semana"
                onBack={() => navigation.goBack()}
                right={<Text style={styles.weekLabel}>{formatWeekLabel(days)}</Text>}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.weekRow}>
                    {days.map((d) => {
                        const c = DAY_COLORS[d.status] || DAY_COLORS.upcoming;
                        return (
                            <TouchableOpacity key={d.date} style={styles.dayCol} onPress={() => load(d.date)}>
                                <View style={[styles.dayCirc, { backgroundColor: c.bg, borderColor: c.border, borderWidth: c.border === 'transparent' ? 0 : 1.5 }]}>
                                    <Text style={{ color: c.color, fontSize: 12, fontWeight: '700' }}>{formatDayNumber(d.date)}</Text>
                                </View>
                                <Text style={[styles.dayLabel, d.date === selectedDate && styles.dayLabelActive]}>
                                    {WEEKDAY_LABELS[d.weekday - 1]}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <Text style={styles.groupTitle}>PLAN DEL DÍA</Text>
                {tasks.length === 0 ? (
                    <Text style={styles.empty}>Sin tareas planificadas este día.</Text>
                ) : (
                    tasks.map((t) => (
                        <View key={t.id} style={styles.task}>
                            <View style={[styles.taskBar, { backgroundColor: KIND_COLORS[t.kind] || KIND_COLORS.other }]} />
                            <View>
                                <Text style={styles.taskTitle}>{t.title}</Text>
                                {t.subtitle && <Text style={styles.taskSubtitle}>{t.subtitle}</Text>}
                            </View>
                        </View>
                    ))
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
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    weekLabel: { fontSize: 11, color: '#7A8290' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    weekRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
    dayCol: { alignItems: 'center', gap: 4 },
    dayCirc: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
    dayLabel: { fontSize: 8, color: '#8A92A0' },
    dayLabelActive: { color: '#FF6B4A', fontWeight: '700' },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8 },
    empty: { textAlign: 'center', color: '#8A92A0', fontSize: 12.5, marginTop: 20 },
    task: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 10 },
    taskBar: { width: 4, height: 30, borderRadius: 3 },
    taskTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    taskSubtitle: { fontSize: 10, color: '#8A92A0' },
    ritmo: { textAlign: 'center', marginTop: 6, fontSize: 11, color: '#8A92A0' },
    ritmoValue: { color: '#1f9d6b', fontWeight: '700' },
});
