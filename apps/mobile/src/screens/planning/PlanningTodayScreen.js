import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import PlanningPopupModal, { CheckBadgeIcon } from '../../components/PlanningPopupModal';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

// Colores confirmados contra Figma (frame HOY, Bloque 4) sin equivalente
// exacto en theme.js.
const FIGMA = {
    ringTrack: 'rgba(65,41,80,0.15)',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    checkboxBorder: '#D9D9D9',
};

function IconCheck() {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 13l4.5 4.5L19 7" stroke={colors.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function TaskRow({ task, isLast, onToggle }) {
    return (
        <TouchableOpacity style={[styles.task, !isLast && styles.taskSeparator]} onPress={() => onToggle(task)} activeOpacity={0.7}>
            <View style={[styles.chk, task.done && styles.chkOn]}>{task.done && <IconCheck />}</View>
            <View style={{ flex: 1 }}>
                <Text style={styles.taskTitle}>{task.title}</Text>
                {task.subtitle && <Text style={styles.taskSubtitle}>{task.subtitle}</Text>}
            </View>
        </TouchableOpacity>
    );
}

function ProgressRing({ percent, size = 150 }) {
    const strokeWidth = size * 0.13;
    const radius = (size - strokeWidth) / 2;
    const c = size / 2;
    const circumference = 2 * Math.PI * radius;
    const dash = (Math.min(percent, 100) / 100) * circumference;
    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Circle cx={c} cy={c} r={radius} fill="none" stroke={FIGMA.ringTrack} strokeWidth={strokeWidth} />
                <Circle
                    cx={c} cy={c} r={radius} fill="none" stroke={colors.ctaGreen} strokeWidth={strokeWidth}
                    strokeDasharray={`${dash} ${circumference}`} strokeLinecap="round" transform={`rotate(-90 ${c} ${c})`}
                />
            </Svg>
            {/* Única fuente no-Poppins confirmada en todo el sistema — ver nota de Figma. */}
            <Text style={styles.ringLabel}>{Math.round(percent)}%</Text>
        </View>
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
    const percent = goalCount > 0 ? Math.min((completedCount / goalCount) * 100, 100) : 0;
    const remaining = goalCount - completedCount;
    const pending = tasks.find((t) => !t.done);

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
                <Text style={styles.headerTitle}>Hoy</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.goalBlock}>
                    <ProgressRing percent={percent} />
                    <Text style={styles.goalLabel}>Objetivo diario: {goalCount} tests</Text>
                    <Text style={styles.goalNote}>
                        {remaining <= 0
                            ? '¡Objetivo cumplido!'
                            : `Te falta${remaining === 1 ? '' : 'n'} ${remaining} test${remaining === 1 ? '' : 's'} para completar tu objetivo diario recomendado.`}
                    </Text>
                </View>

                <Text style={styles.sectionLabel}>TAREAS DE HOY</Text>
                {tasks.length === 0 ? (
                    <Text style={styles.empty}>No tienes tareas planificadas hoy.</Text>
                ) : (
                    <View style={styles.tasksList}>
                        {tasks.map((t, index) => (
                            <TaskRow key={t.id} task={t} isLast={index === tasks.length - 1} onToggle={handleToggle} />
                        ))}
                    </View>
                )}
            </ScrollView>

            {pending && (
                <TouchableOpacity style={styles.ctaButton} onPress={() => handleToggle(pending)} activeOpacity={0.85}>
                    <Text style={styles.ctaButtonText}>Empezar tarea pendiente</Text>
                </TouchableOpacity>
            )}

            {completedPopup && (
                <PlanningPopupModal
                    visible
                    icon={<CheckBadgeIcon />}
                    title="¡Objetivo cumplido!"
                    description={`${goalCount} de ${goalCount} tests hoy. Tu racha sube a ${completedPopup.streak} días y ganas ${completedPopup.points} Opopoints.`}
                    primaryLabel="¡Genial!"
                    onPrimaryPress={() => setCompletedPopup(null)}
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
    goalBlock: {
        alignItems: 'center',
        marginBottom: 32,
    },
    ringLabel: {
        position: 'absolute',
        fontFamily: 'Arial',
        fontWeight: '700',
        fontSize: 41.8,
        color: colors.textDark,
    },
    goalLabel: {
        marginTop: 20,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        textAlign: 'center',
    },
    goalNote: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 10.5,
        lineHeight: 13.9,
        color: colors.textDark,
        textAlign: 'center',
        maxWidth: 260,
    },
    sectionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 8,
    },
    empty: { textAlign: 'center', fontFamily: 'Poppins-Regular', color: FIGMA.textNote, fontSize: 12.5, marginTop: 20 },
    tasksList: { marginBottom: 8 },
    task: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 16 },
    taskSeparator: { borderBottomWidth: 0.44, borderBottomColor: FIGMA.separator },
    chk: { width: 29, height: 29, borderRadius: 2.7, borderWidth: 0.44, borderColor: FIGMA.checkboxBorder, alignItems: 'center', justifyContent: 'center' },
    chkOn: { backgroundColor: colors.ctaGreen, borderWidth: 0 },
    taskTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark },
    taskSubtitle: { marginTop: 2, fontFamily: 'Poppins-Regular', fontSize: 9, color: FIGMA.textNote },
    ctaButton: {
        marginHorizontal: 40,
        marginBottom: spacing.md,
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaButtonText: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.white },
});
