import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import NudgeModal from '../../components/NudgeModal';
import { planningApi, trainingApi } from '../../api';

const localDate = () => new Date().toLocaleDateString('sv');

function tryParseTestParams(subtitle) {
    try {
        const p = JSON.parse(subtitle);
        return p && p.topicId ? p : null;
    } catch { return null; }
}

function IconCheck() {
    return (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12l4 4 10-10" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function IconPlus() {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke="#FF6B4A" strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

function TaskRow({ task, onToggle, onStart }) {
    const testParams = task.kind === 'test' ? tryParseTestParams(task.subtitle) : null;
    const subtitleText = testParams ? `${testParams.count} preguntas` : task.subtitle;

    return (
        <TouchableOpacity
            style={styles.task}
            onPress={() => (testParams && !task.done ? onStart(task) : onToggle(task))}
            activeOpacity={0.7}
        >
            <View style={[styles.chk, task.done && styles.chkOn]}>{task.done && <IconCheck />}</View>
            <View style={{ flex: 1 }}>
                <Text style={[styles.taskTitle, task.done && styles.taskTitleDone]}>{task.title}</Text>
                {subtitleText ? <Text style={styles.taskSubtitle}>{subtitleText}</Text> : null}
            </View>
            {testParams && !task.done && (
                <View style={styles.startBadge}>
                    <Text style={styles.startBadgeText}>Empezar</Text>
                </View>
            )}
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
    const [completedPopup, setCompletedPopup] = useState(null);

    const [addVisible, setAddVisible] = useState(false);
    const [taskType, setTaskType] = useState('test');
    const [topics, setTopics] = useState([]);
    const [selectedTopicId, setSelectedTopicId] = useState('');
    const [questionCount, setQuestionCount] = useState(20);
    const [freeTitle, setFreeTitle] = useState('');
    const [freeSubtitle, setFreeSubtitle] = useState('');

    const load = useCallback(() => {
        Promise.all([planningApi.listTasks(), planningApi.getPlan()]).then(([t, p]) => {
            if (t.data) setTasks(t.data);
            if (p.data) setGoalCount(p.data.testsPerDay);
        });
    }, []);

    useEffect(() => { load(); }, [load]);

    const openModal = useCallback(() => {
        setTaskType('test');
        setSelectedTopicId('');
        setQuestionCount(20);
        setFreeTitle('');
        setFreeSubtitle('');
        setAddVisible(true);
        if (topics.length === 0) {
            trainingApi.listTopics().then((res) => {
                if (res.data) setTopics(res.data);
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
            const topicName = topic?.name ?? 'Test';
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
    const percent = goalCount > 0 ? Math.min(Math.round((completedCount / goalCount) * 100), 100) : 0;
    const pending = tasks.find((t) => !t.done);

    const selectedTopic = topics.find((t) => t.topicId === selectedTopicId);

    const canAdd = taskType === 'test' ? !!selectedTopicId : !!freeTitle.trim();

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader
                title="Hoy"
                onBack={() => navigation.goBack()}
                right={<TouchableOpacity onPress={openModal}><IconPlus /></TouchableOpacity>}
            />

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
                    tasks.map((t) => (
                        <TaskRow key={t.id} task={t} onToggle={handleToggle} onStart={handleStartTask} />
                    ))
                )}

                {pending && (
                    <TouchableOpacity
                        style={styles.btn}
                        onPress={() => {
                            const params = tryParseTestParams(pending.subtitle);
                            if (pending.kind === 'test' && params?.topicId) {
                                navigation.navigate('GeneratorConfig', {
                                    topicId: params.topicId,
                                    questionCount: params.count,
                                });
                            } else {
                                handleToggle(pending);
                            }
                        }}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.btnText}>
                            {pending.kind === 'test' && tryParseTestParams(pending.subtitle)
                                ? 'Empezar test pendiente'
                                : 'Empezar tarea pendiente'}
                        </Text>
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

            {/* ── Modal de nueva tarea ── */}
            <Modal transparent visible={addVisible} animationType="fade" onRequestClose={() => setAddVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nueva tarea</Text>

                        {/* Selector de tipo */}
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
                                    {topics.length === 0 && (
                                        <Text style={styles.topicLoading}>Cargando temas…</Text>
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
                                                {topic.name}
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
                                        Se creará: «Test · {selectedTopic.name}» — {questionCount} preguntas
                                    </Text>
                                )}
                            </>
                        ) : (
                            <>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Título de la tarea"
                                    placeholderTextColor="#AEB5C2"
                                    value={freeTitle}
                                    onChangeText={setFreeTitle}
                                />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Detalle (opcional)"
                                    placeholderTextColor="#AEB5C2"
                                    value={freeSubtitle}
                                    onChangeText={setFreeSubtitle}
                                />
                            </>
                        )}

                        <TouchableOpacity
                            style={[styles.btn, !canAdd && styles.btnDisabled]}
                            onPress={handleAddTask}
                            activeOpacity={0.85}
                            disabled={!canAdd}
                        >
                            <Text style={styles.btnText}>Añadir tarea</Text>
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
    startBadge: { backgroundColor: '#FF6B4A1A', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
    startBadgeText: { fontSize: 10, fontWeight: '700', color: '#FF6B4A' },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginTop: 6 },
    btnDisabled: { backgroundColor: '#D4DAE6' },
    btnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%', maxHeight: '85%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
    typeTabs: { flexDirection: 'row', backgroundColor: '#F4F6FA', borderRadius: 10, padding: 3, marginBottom: 14 },
    typeTab: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
    typeTabActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 4, elevation: 2 },
    typeTabText: { fontSize: 12, fontWeight: '600', color: '#8A92A0' },
    typeTabTextActive: { color: '#1B2A4A' },
    fieldLabel: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.3, marginBottom: 6 },
    topicList: { maxHeight: 160, marginBottom: 12 },
    topicLoading: { fontSize: 12, color: '#AEB5C2', textAlign: 'center', paddingVertical: 10 },
    topicRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 8, marginBottom: 2 },
    topicRowSelected: { backgroundColor: '#FF6B4A0D' },
    topicRadio: { width: 16, height: 16, borderRadius: 8, borderWidth: 1.5, borderColor: '#D4DAE6' },
    topicRadioOn: { borderColor: '#FF6B4A', backgroundColor: '#FF6B4A' },
    topicName: { fontSize: 12, color: '#3A4560', flex: 1 },
    topicNameOn: { fontWeight: '700', color: '#1B2A4A' },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 10 },
    stepBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#F4F6FA', alignItems: 'center', justifyContent: 'center' },
    stepBtnText: { fontSize: 20, fontWeight: '700', color: '#1B2A4A', lineHeight: 24 },
    stepValue: { fontSize: 22, fontWeight: '800', color: '#1B2A4A', minWidth: 40, textAlign: 'center' },
    previewText: { fontSize: 10.5, color: '#8A92A0', textAlign: 'center', marginBottom: 8 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 10 },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
