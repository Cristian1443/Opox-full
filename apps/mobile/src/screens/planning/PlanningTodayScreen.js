import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import NudgeModal from '../../components/NudgeModal';
import { planningApi } from '../../api';

function IconCheck() {
    return (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function TaskRow({ task, onToggle }) {
    return (
        <TouchableOpacity style={styles.task} onPress={() => onToggle(task)} activeOpacity={0.7}>
            <View style={[styles.chk, task.done && styles.chkOn]}>{task.done && <IconCheck />}</View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                {task.subtitle && <Text style={styles.taskSubtitle}>{task.subtitle}</Text>}
            </View>
        </TouchableOpacity>
    );
}

function BigDonut({ percent }) {
    const dash = (Math.min(percent, 100) / 100) * 176;
    return (
        <Svg width={70} height={70} viewBox="0 0 70 70">
            <Circle cx={35} cy={35} r={28} fill="none" stroke="#33405E" strokeWidth={7} />
            <Circle
                cx={35} cy={35} r={28} fill="none" stroke="#FF6B4A" strokeWidth={7}
                strokeDasharray={`${dash} 200`} strokeLinecap="round" transform="rotate(-90 35 35)"
            />
        </Svg>
    );
}

export default function PlanningTodayScreen({ navigation }) {
    const [tasks, setTasks] = useState([]);
    const [goalCount, setGoalCount] = useState(3);
    const [completedPopup, setCompletedPopup] = useState(null); // { streak, points } | null

    const load = useCallback(() => {
        Promise.all([planningApi.listTasks(), planningApi.getPlan()]).then(([t, p]) => {
            if (t.data) setTasks(t.data);
            if (p.data) setGoalCount(p.data.testsPerDay);
        });
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleToggle = async (task) => {
        const nextDone = !task.done;
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t)));
        const { data } = await planningApi.toggleTask(task.id, nextDone);
        if (data?.goalCompleted && data.gamification) {
            setCompletedPopup({ streak: data.gamification.currentStreak, points: 40 });
        }
    };

    const completedCount = tasks.filter((t) => t.done).length;
    const percent = goalCount > 0 ? Math.min(Math.round((completedCount / goalCount) * 100), 100) : 0;
    const pending = tasks.find((t) => !t.done);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Hoy" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <BigDonut percent={percent} />
                    <Text style={styles.cardTitle}>Objetivo diario: {goalCount} tests</Text>
                    <Text style={styles.cardCaption}>
                        {completedCount >= goalCount
                            ? '¡Objetivo cumplido!'
                            : `Te queda${goalCount - completedCount === 1 ? '' : 'n'} ${goalCount - completedCount} para completarlo`}
                    </Text>
                </View>

                <Text style={styles.groupTitle}>TAREAS DE HOY</Text>
                {tasks.length === 0 ? (
                    <Text style={styles.empty}>No tienes tareas planificadas hoy.</Text>
                ) : (
                    tasks.map((t) => <TaskRow key={t.id} task={t} onToggle={handleToggle} />)
                )}

                {pending && (
                    <TouchableOpacity style={styles.btn} onPress={() => handleToggle(pending)} activeOpacity={0.85}>
                        <Text style={styles.btnText}>Empezar tarea pendiente</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            {completedPopup && (
                <NudgeModal
                    visible
                    iconBg="#E3F6EE"
                    icon={<Svg width={26} height={26} viewBox="0 0 24 24" fill="none"><Circle cx={12} cy={12} r={10} stroke="#2BB673" strokeWidth={1.8} /><Path d="M7.5 12.5l3 3 6-6.5" stroke="#2BB673" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" /></Svg>}
                    title="¡Objetivo cumplido!"
                    description={`${goalCount} de ${goalCount} tests hoy. Tu racha sube a ${completedPopup.streak} días y ganas ${completedPopup.points} Opopoints.`}
                    primaryLabel="¡Genial!"
                    secondaryLabel="Cerrar"
                    onPrimaryPress={() => setCompletedPopup(null)}
                    onSecondaryPress={() => setCompletedPopup(null)}
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
    card: { backgroundColor: '#1B2A4A', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 11 },
    cardTitle: { color: '#fff', fontSize: 13, fontWeight: '700', marginTop: 6 },
    cardCaption: { color: '#9AA7C2', fontSize: 11 },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginVertical: 8 },
    empty: { textAlign: 'center', color: '#8A92A0', fontSize: 12.5, marginTop: 20 },
    task: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 12, marginBottom: 8 },
    chk: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: '#D4DAE6', alignItems: 'center', justifyContent: 'center' },
    chkOn: { backgroundColor: '#2BB673', borderColor: '#2BB673' },
    taskTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    taskTitleDone: { textDecorationLine: 'line-through', color: '#9AA2B1' },
    taskSubtitle: { fontSize: 10, color: '#8A92A0' },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
    btnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
});
