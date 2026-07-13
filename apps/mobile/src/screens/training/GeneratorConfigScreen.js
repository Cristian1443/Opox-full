import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
    StatusBar, ScrollView, Modal, PanResponder,
} from 'react-native';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import ConfirmExitModal from '../../components/ConfirmExitModal';

// ─── Constantes de configuración ─────────────────────────────────────────────

const DIFF_STEPS = ['easy', 'medium', 'hard'];
const DIFF_LABELS = { easy: 'Fácil', medium: 'Media', hard: 'Difícil' };
const DIFF_COLORS = { easy: '#3A7BD5', medium: '#D97706', hard: '#DC2626' };

const COUNT_STEPS = [10, 25, 50, 100];

const THUMB = 22;
const TRACK_H = 6;

// Temarios de ejemplo — el listado real llega desde el backend por oposición.
const TOPICS = [
    { id: 'all', label: 'Todo el temario' },
    { id: 'admin', label: 'Derecho Administrativo' },
    { id: 'const', label: 'Constitucional' },
    { id: 'penal', label: 'Penal' },
    { id: 'laboral', label: 'Laboral' },
];

const DEFAULTS = { difficulty: 'medium', count: 50, timed: false, topicId: 'all' };

// ─── Slider de Dificultad (gradiente navy → rojo) ────────────────────────────

function DifficultySlider({ value, onChange }) {
    const [trackWidth, setTrackWidth] = useState(0);
    const tw = useRef(0);
    const valRef = useRef(value);
    const startLocX = useRef(0);

    useEffect(() => { valRef.current = value; }, [value]);

    const stepIdx = DIFF_STEPS.indexOf(value);
    const pct = stepIdx / (DIFF_STEPS.length - 1);
    const fillW = trackWidth * pct;
    const thumbX = (trackWidth - THUMB) * pct;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
            const lx = e.nativeEvent.locationX;
            const w = tw.current;
            if (!w) return;
            const ci = Math.max(0, Math.min(DIFF_STEPS.length - 1, Math.round((lx / w) * (DIFF_STEPS.length - 1))));
            startLocX.current = lx;
            valRef.current = DIFF_STEPS[ci];
            onChange(DIFF_STEPS[ci]);
        },
        onPanResponderMove: (_, gs) => {
            const w = tw.current;
            if (!w) return;
            const nx = Math.max(0, Math.min(w, startLocX.current + gs.dx));
            const ci = Math.max(0, Math.min(DIFF_STEPS.length - 1, Math.round((nx / w) * (DIFF_STEPS.length - 1))));
            if (DIFF_STEPS[ci] !== valRef.current) {
                valRef.current = DIFF_STEPS[ci];
                onChange(DIFF_STEPS[ci]);
            }
        },
    })).current;

    return (
        <View style={sStyles.card}>
            <View style={sStyles.headerRow}>
                <Text style={sStyles.cardTitle}>Dificultad</Text>
                <Text style={[sStyles.valueLabel, { color: DIFF_COLORS[value] }]}>
                    {DIFF_LABELS[value]}
                </Text>
            </View>
            <View
                onLayout={e => { const w = e.nativeEvent.layout.width; tw.current = w; setTrackWidth(w); }}
                style={sStyles.trackZone}
                {...panResponder.panHandlers}
            >
                {/* Pista de fondo */}
                <View style={sStyles.trackBg} />

                {/* Fill con gradiente navy → rojo */}
                {trackWidth > 0 && fillW > 1 && (
                    <Svg
                        width={fillW}
                        height={TRACK_H}
                        style={{ position: 'absolute', left: 0, top: (THUMB - TRACK_H) / 2 }}
                    >
                        <Defs>
                            <SvgGradient id="diffGrad" x1="0" y1="0" x2="1" y2="0">
                                <Stop offset="0" stopColor="#0F1B33" stopOpacity="1" />
                                <Stop offset="1" stopColor="#DC2626" stopOpacity="1" />
                            </SvgGradient>
                        </Defs>
                        <Rect x={0} y={0} width={fillW} height={TRACK_H} fill="url(#diffGrad)" rx={TRACK_H / 2} ry={TRACK_H / 2} />
                    </Svg>
                )}

                {/* Thumb */}
                {trackWidth > 0 && (
                    <View style={[sStyles.thumb, { left: thumbX, borderColor: DIFF_COLORS[value] }]} />
                )}
            </View>
        </View>
    );
}

// ─── Slider de Nº de preguntas (fill naranja) ─────────────────────────────────

function CountSlider({ value, onChange }) {
    const [trackWidth, setTrackWidth] = useState(0);
    const tw = useRef(0);
    const valRef = useRef(value);
    const startLocX = useRef(0);

    useEffect(() => { valRef.current = value; }, [value]);

    const stepIdx = COUNT_STEPS.indexOf(value);
    const pct = stepIdx / (COUNT_STEPS.length - 1);
    const fillW = trackWidth * pct;
    const thumbX = (trackWidth - THUMB) * pct;

    const panResponder = useRef(PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => {
            const lx = e.nativeEvent.locationX;
            const w = tw.current;
            if (!w) return;
            const ci = Math.max(0, Math.min(COUNT_STEPS.length - 1, Math.round((lx / w) * (COUNT_STEPS.length - 1))));
            startLocX.current = lx;
            valRef.current = COUNT_STEPS[ci];
            onChange(COUNT_STEPS[ci]);
        },
        onPanResponderMove: (_, gs) => {
            const w = tw.current;
            if (!w) return;
            const nx = Math.max(0, Math.min(w, startLocX.current + gs.dx));
            const ci = Math.max(0, Math.min(COUNT_STEPS.length - 1, Math.round((nx / w) * (COUNT_STEPS.length - 1))));
            if (COUNT_STEPS[ci] !== valRef.current) {
                valRef.current = COUNT_STEPS[ci];
                onChange(COUNT_STEPS[ci]);
            }
        },
    })).current;

    return (
        <View style={sStyles.card}>
            <View style={sStyles.headerRow}>
                <Text style={sStyles.cardTitle}>Nº de preguntas</Text>
                <Text style={[sStyles.valueLabel, { color: '#FF6B4A' }]}>{value}</Text>
            </View>
            <View
                onLayout={e => { const w = e.nativeEvent.layout.width; tw.current = w; setTrackWidth(w); }}
                style={sStyles.trackZone}
                {...panResponder.panHandlers}
            >
                <View style={sStyles.trackBg} />

                {fillW > 1 && (
                    <View style={[sStyles.fillOrange, { width: fillW, top: (THUMB - TRACK_H) / 2 }]} />
                )}

                {trackWidth > 0 && (
                    <View style={[sStyles.thumb, { left: thumbX, borderColor: '#FF6B4A' }]} />
                )}
            </View>
        </View>
    );
}

const sStyles = StyleSheet.create({
    card: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 13,
        marginBottom: 11,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 14,
    },
    cardTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    valueLabel: { fontSize: 12, fontWeight: '700' },
    trackZone: { height: THUMB, justifyContent: 'center' },
    trackBg: { height: TRACK_H, backgroundColor: '#E4E8F0', borderRadius: TRACK_H / 2 },
    fillOrange: {
        position: 'absolute',
        left: 0,
        height: TRACK_H,
        backgroundColor: '#FF6B4A',
        borderRadius: TRACK_H / 2,
    },
    thumb: {
        position: 'absolute',
        top: 0,
        width: THUMB,
        height: THUMB,
        borderRadius: THUMB / 2,
        backgroundColor: '#fff',
        borderWidth: 2,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
    },
});

// ─── Pantalla 6.2 · Generador · Configuración ────────────────────────────────

export default function GeneratorConfigScreen({ navigation }) {
    const [difficulty, setDifficulty] = useState(DEFAULTS.difficulty);
    const [count, setCount] = useState(DEFAULTS.count);
    const [timedMode, setTimedMode] = useState(DEFAULTS.timed);
    const [topicId, setTopicId] = useState(DEFAULTS.topicId);
    const [topicPickerOpen, setTopicPickerOpen] = useState(false);
    const [exitOpen, setExitOpen] = useState(false);

    const topic = TOPICS.find((t) => t.id === topicId) ?? TOPICS[0];
    const hasChanges =
        difficulty !== DEFAULTS.difficulty ||
        count !== DEFAULTS.count ||
        timedMode !== DEFAULTS.timed ||
        topicId !== DEFAULTS.topicId;

    const allowExitRef = useRef(false);

    const handleBack = () => {
        if (hasChanges) setExitOpen(true);
        else navigation.goBack();
    };

    // Intercepta hardware-back (Android) y swipe-back (iOS)
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

    const generate = () => {
        navigation.navigate('TrainingSession', {
            source: 'generator',
            difficulty,
            questionCount: count,
            timedMode,
            topicId,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader title="Generador" onBack={handleBack} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

                <DifficultySlider value={difficulty} onChange={setDifficulty} />

                <CountSlider value={count} onChange={setCount} />

                {/* Modo contrarreloj */}
                <View style={styles.card}>
                    <View style={styles.toggleRow}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cardTitle}>Modo contrarreloj</Text>
                            <Text style={styles.muted}>Simula la presión del examen real</Text>
                        </View>
                        <TouchableOpacity
                            style={[styles.toggleTrack, timedMode && styles.toggleTrackActive]}
                            onPress={() => setTimedMode((v) => !v)}
                            activeOpacity={0.8}
                        >
                            <View style={[styles.toggleThumb, timedMode && styles.toggleThumbActive]} />
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Selección de temario */}
                <Text style={styles.groupTitle}>SELECCIÓN DE TEMARIO</Text>
                <TouchableOpacity
                    style={styles.pickerRow}
                    onPress={() => setTopicPickerOpen(true)}
                    activeOpacity={0.7}
                >
                    <Text style={styles.pickerLabel}>{topic.label}</Text>
                    <Text style={styles.chevron}>›</Text>
                </TouchableOpacity>
            </ScrollView>

            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btn} onPress={generate} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Generar test</Text>
                </TouchableOpacity>
            </View>

            {/* Bottom-sheet picker de temario */}
            <Modal
                transparent
                visible={topicPickerOpen}
                animationType="slide"
                statusBarTranslucent
                onRequestClose={() => setTopicPickerOpen(false)}
            >
                <TouchableOpacity
                    style={styles.sheetOverlay}
                    activeOpacity={1}
                    onPress={() => setTopicPickerOpen(false)}
                >
                    <View style={styles.sheet}>
                        <View style={styles.sheetGrip} />
                        <Text style={styles.sheetTitle}>Elige un temario</Text>
                        {TOPICS.map((t, i) => {
                            const active = t.id === topicId;
                            return (
                                <TouchableOpacity
                                    key={t.id}
                                    style={[styles.sheetItem, i === 0 && { borderTopWidth: 0 }]}
                                    onPress={() => { setTopicId(t.id); setTopicPickerOpen(false); }}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.sheetItemLabel, active && styles.sheetItemLabelActive]}>
                                        {t.label}
                                    </Text>
                                    {active && <Text style={styles.checkmark}>✓</Text>}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            <ConfirmExitModal
                visible={exitOpen}
                onStay={() => setExitOpen(false)}
                onLeave={confirmLeave}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 90 },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },

    card: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 11 },
    cardTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    muted: { fontSize: 11, color: '#8A92A0', marginTop: 3 },

    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleTrack: { width: 46, height: 26, borderRadius: 13, backgroundColor: '#E4E8F0', padding: 2, justifyContent: 'center' },
    toggleTrackActive: { backgroundColor: '#FF6B4A' },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
    toggleThumbActive: { transform: [{ translateX: 20 }] },

    pickerRow: {
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7',
        borderRadius: 14, padding: 13,
    },
    pickerLabel: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A' },
    chevron: { marginLeft: 'auto', color: '#C4CBD6', fontSize: 16 },

    btnRow: { position: 'absolute', bottom: 16, left: 18, right: 18 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },

    sheetOverlay: { flex: 1, backgroundColor: 'rgba(15, 27, 51, 0.5)', justifyContent: 'flex-end' },
    sheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 20, paddingHorizontal: 18, paddingBottom: 22 },
    sheetGrip: { width: 38, height: 4, borderRadius: 3, backgroundColor: '#E4E8F0', alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 14, fontWeight: '800', color: '#0F1B33', marginBottom: 8 },
    sheetItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13, borderTopWidth: 1, borderTopColor: '#EEF1F7' },
    sheetItemLabel: { fontSize: 13, color: '#1B2A4A' },
    sheetItemLabelActive: { color: '#FF6B4A', fontWeight: '800' },
    checkmark: { marginLeft: 'auto', color: '#FF6B4A', fontSize: 16, fontWeight: '800' },
});
