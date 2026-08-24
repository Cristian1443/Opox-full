import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import PlanningPopupModal, { CheckBadgeIcon } from '../../components/PlanningPopupModal';
import { planningApi, boeApi } from '../../api';
import { colors, spacing } from '../../theme';

// Colores confirmados contra Figma (frame HOY, Bloque 4) sin equivalente
// exacto en theme.js.
const FIGMA = {
    ringTrack: 'rgba(65,41,80,0.15)',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    checkboxBorder: '#D9D9D9',
    startBadgeBg: 'rgba(246,150,36,0.15)',
};

// Zona horaria: fecha local del dispositivo, no UTC (ver CLAUDE.md § Planificación).
const localDate = () => new Date().toLocaleDateString('sv');

function tryParseTestParams(subtitle) {
    try {
        const p = JSON.parse(subtitle);
        return p && p.topicId ? p : null;
    } catch { return null; }
}

function IconCheck() {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 13l4.5 4.5L19 7" stroke={colors.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function TaskRow({ task, isLast, onToggle, onStart }) {
    const testParams = task.kind === 'test' ? tryParseTestParams(task.subtitle) : null;
    const subtitleText = testParams ? `${testParams.count} preguntas` : task.subtitle;
    const canStart = testParams && !task.done;

    return (
        <TouchableOpacity
            style={[styles.task, !isLast && styles.taskSeparator]}
            onPress={() => (canStart ? onStart(task) : onToggle(task))}
            activeOpacity={0.7}
        >
            <View style={[styles.chk, task.done && styles.chkOn]}>{task.done && <IconCheck />}</View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                {subtitleText ? <Text style={styles.taskSubtitle}>{subtitleText}</Text> : null}
            </View>
            {canStart && (
                <View style={styles.startBadge}>
                    <Text style={styles.startBadgeText}>Empezar</Text>
                </View>
            )}
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

    const [addVisible, setAddVisible] = useState(false);
    const [taskType, setTaskType] = useState('test');
    const [topics, setTopics] = useState([]);
    const [topicsError, setTopicsError] = useState(false);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [questionCount, setQuestionCount] = useState(20);
    const [freeTitle, setFreeTitle] = useState('');
    const [freeSubtitle, setFreeSubtitle] = useState('');

    const load = useCallback(() => {
        let cancelled = false;
        Promise.all([planningApi.listTasks(), planningApi.getSummary()]).then(([t, s]) => {
            if (cancelled) return;
            if (t.data) setTasks(t.data);
            // getSummary aplica applyIntensity, igual que el hub y el ToggleTaskUseCase
            if (s.data) setGoalCount(s.data.today.goalCount);
        });
        return () => { cancelled = true; };
    }, []);

    useFocusEffect(load);

    const openModal = useCallback(() => {
        setTaskType('test');
        setSelectedTopicId('');
        setQuestionCount(20);
        setFreeTitle('');
        setFreeSubtitle('');
        setAddVisible(true);
        if (topics.length === 0) {
            setTopicsError(false);
            boeApi.listTopics('justicia-tramitacion').then((res) => {
                if (res.data && res.data.length > 0) {
                    setTopics(res.data);
                } else {
                    setTopicsError(true);
                }
            });
        }
    }, [topics.length]);

    const handleToggle = async (task) => {
        const nextDone = !task.done;
        setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, done: nextDone } : t)));
        const { data } = await planningApi.toggleTask(task.id, nextDone);
        if (data?.goalCompleted && data.gamification) {
            setCompletedPopup({ streak: data.gamification.currentStreak, points: 40 });
        }
    };

    const handleStartTask = (task) => {
        const params = tryParseTestParams(task.subtitle);
        if (params?.topicId) {
            navigation.navigate('GeneratorConfig', {
                topicId: params.topicId,
                questionCount: params.count,
            });
        }
    };

    const handleAddTask = async () => {
        const today = localDate();
        let payload;

        if (taskType === 'test') {
            if (!selectedTopicId) return;
            const topic = topics.find((t) => t.topicId === selectedTopicId);
            const topicName = topic?.label ?? 'Test';
            payload = {
                taskDate: today,
                title: `Test · ${topicName}`,
                subtitle: JSON.stringify({ topicId: selectedTopicId, count: questionCount }),
                kind: 'test',
            };
        } else {
            if (!freeTitle.trim()) return;
            payload = {
                taskDate: today,
                title: freeTitle.trim(),
                subtitle: freeSubtitle.trim() || undefined,
                kind: 'other',
            };
        }

        const { data } = await planningApi.createTask(payload);
        if (data) {
            setTasks((prev) => [...prev, data]);
            setAddVisible(false);
        }
    };

    const completedCount = tasks.filter((t) => t.done).length;
    const percent = goalCount > 0 ? Math.min((completedCount / goalCount) * 100, 100) : 0;
    const remaining = goalCount - completedCount;
    const pending = tasks.find((t) => !t.done);
    const pendingTestParams = pending && pending.kind === 'test' ? tryParseTestParams(pending.subtitle) : null;

    const selectedTopic = topics.find((t) => t.topicId === selectedTopicId);
    const canAdd = taskType === 'test' ? !!selectedTopicId : !!freeTitle.trim();

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
                <TouchableOpacity
                    onPress={openModal}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="add" size={24} color={colors.textDark} />
                </TouchableOpacity>
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
                            <TaskRow
                                key={t.id}
                                task={t}
                                isLast={index === tasks.length - 1}
                                onToggle={handleToggle}
                                onStart={handleStartTask}
                            />
                        ))}
                    </View>
                )}
            </ScrollView>

            {pending && (
                <TouchableOpacity
                    style={styles.ctaButton}
                    onPress={() => (pendingTestParams ? handleStartTask(pending) : handleToggle(pending))}
                    activeOpacity={0.85}
                >
                    <Text style={styles.ctaButtonText}>
                        {pendingTestParams ? 'Empezar test pendiente' : 'Empezar tarea pendiente'}
                    </Text>
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

            {/* Modal de nueva tarea — sin datos de Figma para este flujo, estilo
                mínimo reutilizando los tokens del sistema. */}
            <Modal transparent visible={addVisible} animationType="fade" onRequestClose={() => setAddVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nueva tarea</Text>

                        <View style={styles.typeTabs}>
                            <TouchableOpacity
                                style={[styles.typeTab, taskType === 'test' && styles.typeTabActive]}
                                onPress={() => setTaskType('test')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.typeTabText, taskType === 'test' && styles.typeTabTextActive]}>
                                    Test de práctica
                                </Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.typeTab, taskType === 'libre' && styles.typeTabActive]}
                                onPress={() => setTaskType('libre')}
                                activeOpacity={0.8}
                            >
                                <Text style={[styles.typeTabText, taskType === 'libre' && styles.typeTabTextActive]}>
                                    Tarea libre
                                </Text>
                            </TouchableOpacity>
                        </View>

                        {taskType === 'test' ? (
                            <>
                                <Text style={styles.fieldLabel}>Tema</Text>
                                <ScrollView style={styles.topicList} showsVerticalScrollIndicator={false}>
                                    {topics.length === 0 && !topicsError && (
                                        <Text style={styles.topicLoading}>Cargando temas…</Text>
                                    )}
                                    {topicsError && (
                                        <Text style={styles.topicLoading}>No se pudieron cargar los temas. Verifica tu conexión.</Text>
                                    )}
                                    {topics.map((topic) => (
                                        <TouchableOpacity
                                            key={topic.topicId}
                                            style={[styles.topicRow, selectedTopicId === topic.topicId && styles.topicRowSelected]}
                                            onPress={() => setSelectedTopicId(topic.topicId)}
                                            activeOpacity={0.75}
                                        >
                                            <View style={[styles.topicRadio, selectedTopicId === topic.topicId && styles.topicRadioOn]} />
                                            <Text style={[styles.topicName, selectedTopicId === topic.topicId && styles.topicNameOn]}>
                                                {topic.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>

                                <Text style={styles.fieldLabel}>Preguntas</Text>
                                <View style={styles.stepper}>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => setQuestionCount((c) => Math.max(5, c - 5))}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.stepBtnText}>−</Text>
                                    </TouchableOpacity>
                                    <Text style={styles.stepValue}>{questionCount}</Text>
                                    <TouchableOpacity
                                        style={styles.stepBtn}
                                        onPress={() => setQuestionCount((c) => Math.min(50, c + 5))}
                                        activeOpacity={0.7}
                                    >
                                        <Text style={styles.stepBtnText}>+</Text>
                                    </TouchableOpacity>
                                </View>

                                {selectedTopic && (
                                    <Text style={styles.previewText}>
                                        Se creará: «Test · {selectedTopic.label}» — {questionCount} preguntas
                                    </Text>
                                )}
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Título de la tarea"
                                    placeholderTextColor={FIGMA.textNote}
                                    value={freeTitle}
                                    onChangeText={setFreeTitle}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Detalle (opcional)"
                                    placeholderTextColor={FIGMA.textNote}
                                    value={freeSubtitle}
                                    onChangeText={setFreeSubtitle}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.modalBtn, !canAdd && styles.modalBtnDisabled]}
                            onPress={handleAddTask}
                            activeOpacity={0.85}
                            disabled={!canAdd}
                        >
                            <Text style={styles.modalBtnText}>Añadir tarea</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setAddVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
    taskTitleDone: { textDecorationLine: 'line-through', color: FIGMA.textNote },
    taskSubtitle: { marginTop: 2, fontFamily: 'Poppins-Regular', fontSize: 9, color: FIGMA.textNote },
    startBadge: { backgroundColor: FIGMA.startBadgeBg, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    startBadgeText: { fontFamily: 'Poppins-SemiBold', fontSize: 9.5, color: colors.accentOrange },
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
    overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18, width: '100%', maxHeight: '85%' },
    modalTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 15, color: colors.textDark, marginBottom: 12 },
    typeTabs: { flexDirection: 'row', backgroundColor: FIGMA.ringTrack, borderRadius: 10, padding: 3, marginBottom: 14 },
    typeTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
    typeTabActive: { backgroundColor: colors.white, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
    typeTabText: { fontFamily: 'Poppins-Medium', fontSize: 12, color: FIGMA.textNote },
    typeTabTextActive: { color: colors.textDark },
    fieldLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 10.5, color: FIGMA.textNote, letterSpacing: 0.3, marginBottom: 6 },
    topicList: { maxHeight: 160, marginBottom: 12 },
    topicLoading: { fontFamily: 'Poppins-Regular', fontSize: 12, color: FIGMA.textNote, textAlign: 'center', paddingVertical: 10 },
    topicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 2 },
    topicRowSelected: { backgroundColor: FIGMA.startBadgeBg },
    topicRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: FIGMA.checkboxBorder },
    topicRadioOn: { borderColor: colors.accentOrange, backgroundColor: colors.accentOrange },
    topicName: { fontFamily: 'Poppins-Regular', fontSize: 12, color: colors.textDark, flex: 1 },
    topicNameOn: { fontFamily: 'Poppins-SemiBold' },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 },
    stepBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: FIGMA.ringTrack, alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { fontSize: 20, fontFamily: 'Poppins-SemiBold', color: colors.textDark, lineHeight: 24 },
    stepValue: { fontSize: 22, fontFamily: 'Poppins-Bold', color: colors.textDark, minWidth: 40, textAlign: 'center' },
    previewText: { fontFamily: 'Poppins-Regular', fontSize: 10.5, color: FIGMA.textNote, textAlign: 'center', marginBottom: 8 },
    input: { borderWidth: 0.44, borderColor: FIGMA.checkboxBorder, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontFamily: 'Poppins-Regular', fontSize: 13, color: colors.textDark, marginBottom: 10 },
    modalBtn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
    modalBtnDisabled: { backgroundColor: FIGMA.checkboxBorder },
    modalBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13.5, color: colors.white },
    cancel: { textAlign: 'center', fontFamily: 'Poppins-SemiBold', color: FIGMA.textNote, fontSize: 12 },
});
