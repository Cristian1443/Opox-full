import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Modal } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import ConfirmExitModal from '../../components/ConfirmExitModal';

// ─── Opciones de configuración ───────────────────────────────────────────────
// Dificultad y nº preguntas se ofrecen como presets porque el usuario opositor
// no piensa en escalas 1-10: piensa en "calentar" (10), "un test normal" (50),
// "un simulacro largo" (100). Ver nota UX del PR.
const DIFFICULTY_OPTIONS = [
    { id: 'easy', label: 'Fácil' },
    { id: 'medium', label: 'Media' },
    { id: 'hard', label: 'Difícil' },
];

const COUNT_OPTIONS = [10, 25, 50, 100];

// Temarios de ejemplo — el listado real llega desde el backend por oposición.
const TOPICS = [
    { id: 'all', label: 'Todo el temario' },
    { id: 'admin', label: 'Derecho Administrativo' },
    { id: 'const', label: 'Constitucional' },
    { id: 'penal', label: 'Penal' },
    { id: 'laboral', label: 'Laboral' },
];

const DEFAULTS = { difficulty: 'medium', count: 50, timed: false, topicId: 'all' };

// ─── Pantalla 6.2 · Generador Infinito · Configuración ───────────────────────
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

    // Ref para dejar pasar la salida cuando el usuario confirma en el modal,
    // sin que el listener de abajo la vuelva a interceptar.
    const allowExitRef = useRef(false);

    const handleBack = () => {
        if (hasChanges) setExitOpen(true);
        else navigation.goBack();
    };

    // Intercepta también hardware-back (Android) y swipe-back (iOS): si hay
    // cambios sin guardar, dispara el mismo modal en vez de salir directo.
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
        // Navegar al player de test (Bloque 7). Ruta placeholder hasta que exista.
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

            <ScreenHeader title="Generador Infinito" onBack={handleBack} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.subtitle}>Configura el tipo de test que quieres generar.</Text>

                {/* Dificultad */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Dificultad</Text>
                    <View style={styles.chipRow}>
                        {DIFFICULTY_OPTIONS.map((opt) => {
                            const active = difficulty === opt.id;
                            return (
                                <TouchableOpacity
                                    key={opt.id}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setDifficulty(opt.id)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

                {/* Nº de preguntas */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Nº de preguntas</Text>
                    <View style={styles.chipRow}>
                        {COUNT_OPTIONS.map((n) => {
                            const active = count === n;
                            return (
                                <TouchableOpacity
                                    key={n}
                                    style={[styles.chip, active && styles.chipActive]}
                                    onPress={() => setCount(n)}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{n}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>

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

            {/* Confirmación de salida sin generar */}
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
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 90 },
    subtitle: { fontSize: 12.5, color: '#5A6373', marginBottom: 12 },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8, marginTop: 4 },
    card: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 11 },
    cardTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    muted: { fontSize: 11, color: '#8A92A0', marginTop: 3 },

    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
    chip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 10,
        borderWidth: 1.5,
        borderColor: '#E4E8F0',
        backgroundColor: '#fff',
    },
    chipActive: { backgroundColor: '#FF6B4A', borderColor: '#FF6B4A' },
    chipText: { fontSize: 12, fontWeight: '700', color: '#5A6373' },
    chipTextActive: { color: '#fff' },

    toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    toggleTrack: {
        width: 46,
        height: 26,
        borderRadius: 13,
        backgroundColor: '#E4E8F0',
        padding: 2,
        justifyContent: 'center',
    },
    toggleTrackActive: { backgroundColor: '#FF6B4A' },
    toggleThumb: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#fff' },
    toggleThumbActive: { transform: [{ translateX: 20 }] },

    pickerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 13,
    },
    pickerLabel: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A' },
    chevron: { marginLeft: 'auto', color: '#C4CBD6', fontSize: 16 },

    btnRow: { position: 'absolute', bottom: 16, left: 18, right: 18 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 13, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },

    // Bottom sheet del picker de temario
    sheetOverlay: { flex: 1, backgroundColor: 'rgba(15, 27, 51, 0.5)', justifyContent: 'flex-end' },
    sheet: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
        paddingHorizontal: 18,
        paddingBottom: 22,
    },
    sheetGrip: { width: 38, height: 4, borderRadius: 3, backgroundColor: '#E4E8F0', alignSelf: 'center', marginBottom: 16 },
    sheetTitle: { fontSize: 14, fontWeight: '800', color: '#0F1B33', marginBottom: 8 },
    sheetItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 13,
        borderTopWidth: 1,
        borderTopColor: '#EEF1F7',
    },
    sheetItemLabel: { fontSize: 13, color: '#1B2A4A' },
    sheetItemLabelActive: { color: '#FF6B4A', fontWeight: '800' },
    checkmark: { marginLeft: 'auto', color: '#FF6B4A', fontSize: 16, fontWeight: '800' },
});
