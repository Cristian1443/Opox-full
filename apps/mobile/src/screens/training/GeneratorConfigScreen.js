import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    StatusBar, ScrollView, PanResponder, ActivityIndicator, Alert,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import TrainingHeader from '../../components/TrainingHeader';
import ConfirmExitModal from '../../components/ConfirmExitModal';
import { colors, spacing } from '../../theme';
import { api, trainingApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// ─── Constantes de configuración ─────────────────────────────────────────────

const DIFF_STEPS = ['easy', 'medium', 'hard'];
const DIFF_LABELS = ['Fácil', 'Medio', 'Difícil'];

const COUNT_MIN = 10;
const COUNT_MAX = 100;
const COUNT_STEP = 5;

const THUMB = 22;
const TRACK_H = 8;

// Temarios de ejemplo — el listado real llega desde el backend por oposición.
const TOPICS = [
    { id: 't1', label: 'Tema 1' },
    { id: 't2', label: 'Tema 2' },
    { id: 't3', label: 'Tema 3' },
    { id: 't4', label: 'Tema 4' },
    { id: 't5', label: 'Tema 5' },
];

const DEFAULTS = { difficulty: 'medium', count: 30, timed: false, topicId: 't1' };

// ─── Slider genérico naranja (usa índices) ───────────────────────────────────
function OrangeSlider({ steps, valueIdx, onChange }) {
    const [trackWidth, setTrackWidth] = useState(0);
    const tw = useRef(0);
    const valRef = useRef(valueIdx);
    const startLocX = useRef(0);

    useEffect(() => { valRef.current = valueIdx; }, [valueIdx]);

    const pct = steps <= 1 ? 0 : valueIdx / (steps - 1);
    const fillW = trackWidth * pct;
    const thumbX = (trackWidth - THUMB) * pct;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
            const lx = e.nativeEvent.locationX;
            const w = tw.current;
            if (!w) return;
            const ci = Math.max(0, Math.min(steps - 1, Math.round((lx / w) * (steps - 1))));
            startLocX.current = lx;
            if (ci !== valRef.current) { valRef.current = ci; onChange(ci); }
        },
        onPanResponderMove: (_, gs) => {
            const w = tw.current;
            if (!w) return;
            const nx = Math.max(0, Math.min(w, startLocX.current + gs.dx));
            const ci = Math.max(0, Math.min(steps - 1, Math.round((nx / w) * (steps - 1))));
            if (ci !== valRef.current) { valRef.current = ci; onChange(ci); }
        },
    })).current;

    return (
        <View
            onLayout={e => { const w = e.nativeEvent.layout.width; tw.current = w; setTrackWidth(w); }}
            style={s.trackZone}
            {...panResponder.panHandlers}
        >
            <View style={s.trackBg} />
            {fillW > 1 && (
                <View style={[s.fill, { width: fillW, top: (THUMB - TRACK_H) / 2 }]} />
            )}
            {trackWidth > 0 && (
                <View style={[s.thumb, { left: thumbX }]} />
            )}
        </View>
    );
}

const s = StyleSheet.create({
    trackZone: { height: THUMB, justifyContent: 'center' },
    trackBg: { height: TRACK_H, backgroundColor: '#FDE7D8', borderRadius: TRACK_H / 2 },
    fill: {
        position: 'absolute',
        left: 0,
        height: TRACK_H,
        backgroundColor: colors.primary,
        borderRadius: TRACK_H / 2,
    },
    thumb: {
        position: 'absolute',
        top: 0,
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: '#FFFFFF',
        borderWidth: 3,
        borderColor: colors.textDark,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
    },
});

function IconChevronDown({ color = colors.grayText }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Path d="M6 9l6 6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Pantalla 6.2 · Generador infinito ───────────────────────────────────────
export default function GeneratorConfigScreen({ navigation }) {
    const [difficulty, setDifficulty] = useState(DEFAULTS.difficulty);
    const [count, setCount] = useState(DEFAULTS.count);
    const [fatigueMode, setFatigueMode] = useState(DEFAULTS.timed);
    const [topicId, setTopicId] = useState(DEFAULTS.topicId);
    const [topicOpen, setTopicOpen] = useState(true);
    const [exitOpen, setExitOpen] = useState(false);
    const [generating, setGenerating] = useState(false);

    const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];
    const hasChanges =
        difficulty !== DEFAULTS.difficulty ||
        count !== DEFAULTS.count ||
        fatigueMode !== DEFAULTS.timed ||
        topicId !== DEFAULTS.topicId;

    const allowExitRef = useRef(false);

    const handleBack = () => {
        if (hasChanges) setExitOpen(true);
        else navigation.goBack();
    };

    useEffect(() => {
        const unsubscribe = navigation.addListener('beforeRemove', (e) => {
            if (!hasChanges || allowExitRef.current) return;
            e.preventDefault();
            setExitOpen(true);
        });
        return unsubscribe;
    }, [navigation, hasChanges]);

    const confirmLeave = () => {
        allowExitRef.current = true;
        setExitOpen(false);
        navigation.goBack();
    };

    const generate = async () => {
        if (generating) return;
        setGenerating(true);
        const session = await api.loadSession();
        const oposicion =
            session?.user?.oposicion ??
            session?.user?.user_metadata?.oposicion ??
            'justicia-tramitacion';
        // Mapeamos topicId del picker local (t1, t2...) al del backend.
        // Los temas reales llegarán del backend en una iteración posterior;
        // por ahora 'all' permite que la IA cubra todo el temario.
        const backendTopicId = 'all';
        const { data, error } = await trainingApi.generateQuestions({
            oposicion,
            topicId: backendTopicId,
            difficulty,
            count,
        });
        setGenerating(false);
        if (error || !Array.isArray(data) || data.length === 0) {
            Alert.alert(
                'No se pudo generar el test',
                'La IA no devolvió preguntas. Inténtalo de nuevo en un momento.',
            );
            return;
        }
        // Marcamos allowExit para que el guard beforeRemove no abra ConfirmExit
        // durante la navegación forward al TrainingSession.
        allowExitRef.current = true;
        navigation.navigate('TrainingSession', {
            source: 'generator',
            questions: adaptGeneratedQuestions(data),
            examTitle: 'Generador infinito',
            timedMode: fatigueMode,
            oposicion,
        });
    };

    // Índices para los sliders
    const diffIdx = DIFF_STEPS.indexOf(difficulty);
    const countSteps = Math.floor((COUNT_MAX - COUNT_MIN) / COUNT_STEP) + 1;
    const countIdx = Math.round((count - COUNT_MIN) / COUNT_STEP);

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <TrainingHeader
                eyebrow="Zona de entrenamiento"
                title="Generador infinito"
                onBack={handleBack}
                onSettings={() => navigation.navigate('Settings')}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

                {/* Nivel de dificultad */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Nivel de dificultad</Text>
                    <Text style={styles.sectionSubtitle}>
                        Selecciona el nivel de dificultad de tus pruebas
                    </Text>
                    <View style={styles.sliderWrap}>
                        <OrangeSlider
                            steps={DIFF_STEPS.length}
                            valueIdx={diffIdx}
                            onChange={(i) => setDifficulty(DIFF_STEPS[i])}
                        />
                    </View>
                    <View style={styles.stepLabels}>
                        {DIFF_LABELS.map((label, i) => (
                            <Text
                                key={label}
                                style={[styles.stepLabel, i === diffIdx && styles.stepLabelActive]}
                            >
                                {label}
                            </Text>
                        ))}
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Número de preguntas */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Número de preguntas</Text>
                    <Text style={styles.sectionSubtitle}>
                        Selecciona el número de preguntas por test
                    </Text>
                    <View style={styles.countRow}>
                        <View style={{ flex: 1 }}>
                            <OrangeSlider
                                steps={countSteps}
                                valueIdx={countIdx}
                                onChange={(i) => setCount(COUNT_MIN + i * COUNT_STEP)}
                            />
                        </View>
                        <View style={styles.countChip}>
                            <Text style={styles.countChipText}>{count}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.divider} />

                {/* Control de fatiga */}
                <View style={styles.toggleRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.toggleTitle}>Control de fatiga</Text>
                        <Text style={styles.toggleSub}>
                            Monitoreo continuo de tus constantes vitales
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.toggleTrack, fatigueMode && styles.toggleTrackActive]}
                        onPress={() => setFatigueMode((v) => !v)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.toggleThumb, fatigueMode && styles.toggleThumbActive]} />
                    </TouchableOpacity>
                </View>

                {/* Temario (dropdown expandible) */}
                <TouchableOpacity
                    style={styles.topicHeader}
                    onPress={() => setTopicOpen((v) => !v)}
                    activeOpacity={0.75}
                >
                    <Text style={styles.topicHeaderLabel}>Temario</Text>
                    <IconChevronDown />
                </TouchableOpacity>

                {topicOpen && (
                    <View style={styles.topicList}>
                        {TOPICS.map((t) => {
                            const active = t.id === topicId;
                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.topicItem, active && styles.topicItemActive]}
                                    onPress={() => setTopicId(t.id)}
                                    activeOpacity={0.75}
                                >
                                    <Text style={[styles.topicItemText, active && styles.topicItemTextActive]}>
                                        {t.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                )}

                <View style={{ height: 24 }} />

                <TouchableOpacity
                    style={[styles.btn, generating && { opacity: 0.7 }]}
                    onPress={generate}
                    activeOpacity={0.85}
                    disabled={generating}
                >
                    {generating ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.btnText}>Generando preguntas…</Text>
                        </View>
                    ) : (
                        <Text style={styles.btnText}>Generar test</Text>
                    )}
                </TouchableOpacity>

                <View style={{ height: 30 }} />
            </ScrollView>

            <ConfirmExitModal
                visible={exitOpen}
                onStay={() => setExitOpen(false)}
                onLeave={confirmLeave}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },

    section: { paddingVertical: spacing.md, alignItems: 'stretch' },
    sectionTitle: {
        fontSize: 20,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 4,
    },
    sectionSubtitle: {
        fontSize: 12,
        fontFamily: 'Poppins-Regular',
        color: colors.textMuted,
        opacity: 0.6,
        textAlign: 'center',
        marginBottom: 16,
    },
    sliderWrap: { paddingHorizontal: 20 },
    stepLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 12,
        marginTop: 8,
    },
    stepLabel: { fontSize: 12, color: colors.textMuted, opacity: 0.6, fontFamily: 'Poppins-Regular' },
    stepLabelActive: { color: colors.textDark, opacity: 1, fontFamily: 'Poppins-SemiBold' },

    countRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        paddingHorizontal: 20,
    },
    countChip: {
        minWidth: 44,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
    },
    countChipText: { fontSize: 15, fontFamily: 'Poppins-SemiBold', color: colors.textDark },

    divider: {
        height: 1,
        backgroundColor: '#EEF1F7',
        marginHorizontal: 4,
    },

    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingVertical: spacing.md,
    },
    toggleTitle: { fontSize: 17, fontFamily: 'Poppins-Bold', color: colors.textDark, marginBottom: 3 },
    toggleSub: { fontSize: 12, fontFamily: 'Poppins-Regular', color: colors.textMuted, opacity: 0.6 },
    toggleTrack: {
        width: 46,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#E4E8F0',
        padding: 2,
        justifyContent: 'center',
    },
    toggleTrackActive: { backgroundColor: colors.textDark },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
    toggleThumbActive: { transform: [{ translateX: 20 }] },

    topicHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F1F3F7',
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        marginTop: 8,
        marginBottom: 8,
    },
    topicHeaderLabel: { flex: 1, fontSize: 20, fontFamily: 'Poppins-Medium', color: colors.textDark },

    topicList: {
        borderWidth: 1,
        borderColor: '#EEF1F7',
        borderRadius: 12,
        overflow: 'hidden',
    },
    topicItem: {
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: '#EEF1F7',
        backgroundColor: '#FFFFFF',
    },
    topicItemActive: { backgroundColor: '#FDE7D8' },
    topicItemText: { fontSize: 14, color: colors.textDark, fontFamily: 'Poppins-Regular' },
    topicItemTextActive: { color: colors.textDark, fontFamily: 'Poppins-SemiBold' },

    btn: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 14,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 12,
    },
    btnText: { color: '#fff', fontSize: 15, fontFamily: 'Poppins-SemiBold' },
});
