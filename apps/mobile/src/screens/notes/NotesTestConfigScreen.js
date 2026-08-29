import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import AccentSlider from '../../components/AccentSlider';
import { notesApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// Colores confirmados contra Figma (frame GENERAR TEST, Bloque 9) sin
// equivalente exacto en theme.js.
const FIGMA = {
    badgeBg: 'rgba(159,110,228,0.75)', // colors.selectionBorder @75%
    textMuted: 'rgba(52,58,61,0.5)',
    cardBorder: 'rgba(65,41,80,0.3)',
    accentOrangeTrack: 'rgba(246,150,36,0.15)',
    toggleTrackBg: 'rgba(235,235,235,0.5)',
    toggleBorder: 'rgba(65,41,80,0.5)',
    // El valor numérico usa negro puro en Figma, distinto de colors.textDark
    // usado en el resto de la pantalla — documentado tal cual (hallazgo 4).
    valueBoxText: '#000000',
};

const DIFFICULTY_LABELS = ['Fácil', 'Medio', 'Difícil'];

// Steps discretos del slider. El máximo real está capado por questionsAvailable
// (ver clampCount abajo): si el documento tiene menos preguntas de las que pide
// el usuario, cae al máximo disponible.
const QUESTION_STEPS = [5, 10, 15, 20, 25, 30, 40, 50];
const DEFAULT_STEP_IDX = 3; // 20 preguntas

// Mock del apunte que llega por navegación. Cuando exista backend, `note` viene
// como param completo desde 9.3·ok / 9.4, con id, title, pages, tags[], questionsCount.
const MOCK_NOTE = {
    id: 'mock-note-id',
    title: 'Esquema Constitución',
    pages: 8,
    tags: ['Constitución', 'Derechos fundamentales', 'Título I'],
    questionsCount: 24, // techo real de preguntas generadas por la IA
};

// Mismo interruptor visual para "Modo contrarreloj" (real, sin dato de
// Figma) y "Solo temas etiquetados" (confirmado). El track no cambia de
// color entre on/off en Figma — solo se mueve la perilla.
function ToggleSwitch({ value, onValueChange }) {
    return (
        <TouchableOpacity
            activeOpacity={0.8}
            style={styles.toggleTrack}
            onPress={() => onValueChange(!value)}
        >
            <View style={[styles.toggleKnob, value ? styles.toggleKnobOn : styles.toggleKnobOff]} />
        </TouchableOpacity>
    );
}

export default function NotesTestConfigScreen({ navigation, route }) {
    const { noteId, noteData } = route?.params ?? {};

    // Si no llega noteData, aquí iría notesApi.get(noteId). De momento, mock.
    const note = useMemo(() => noteData ?? { ...MOCK_NOTE, id: noteId ?? MOCK_NOTE.id }, [noteId, noteData]);

    const [dificultadIdx, setDificultadIdx] = useState(1); // 0=Fácil, 1=Medio, 2=Difícil
    const [stepIdx, setStepIdx] = useState(DEFAULT_STEP_IDX);
    // Consistente con el Generador Infinito del Bloque 6 (aunque no está en el mockup).
    const [timed, setTimed] = useState(false);
    const [starting, setStarting] = useState(false);
    const [onlyTaggedTopics, setOnlyTaggedTopics] = useState(true);

    // Cap del número de preguntas al techo real del documento.
    const questionCount = useMemo(() => {
        const raw = QUESTION_STEPS[stepIdx];
        return Math.min(raw, note.questionsCount);
    }, [stepIdx, note.questionsCount]);

    const canStart = questionCount > 0;

    const startTest = async () => {
        if (!canStart || starting) return;
        setStarting(true);
        const topics = onlyTaggedTopics ? note.tags : [];
        const difficulty = ['low', 'medium', 'high'][dificultadIdx];
        try {
            const res = await notesApi.generateTest(note.id, { questionCount, topics, difficulty, timed });
            const questions = adaptGeneratedQuestions(res?.data?.questions ?? []);
            navigation.replace('TrainingSession', {
                source: 'notes',
                noteId: note.id,
                questions,
                questionCount,
                topics,
                examTitle: `Apuntes: ${note.title}`,
                timedMode: timed,
                secondsPerQuestion: 30,
            });
        } catch {
            navigation.replace('TrainingSession', {
                source: 'notes',
                noteId: note.id,
                questions: [],
                questionCount,
                topics,
                examTitle: `Apuntes: ${note.title}`,
                timedMode: timed,
                secondsPerQuestion: 30,
            });
        } finally {
            setStarting(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Test de mis apuntes</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.badge}>
                    <Text style={styles.badgeLine1}>Basado en:</Text>
                    <Text style={styles.badgeLine2}>
                        {note.title} ({note.pages} {note.pages === 1 ? 'pág' : 'págs'}.)
                    </Text>
                </View>

                <Text style={styles.sectionTitle}>Nivel de dificultad</Text>
                <Text style={styles.sectionSubtitle}>Selecciona el nivel de dificultad de tus pruebas</Text>
                <AccentSlider
                    steps={3}
                    valueIdx={dificultadIdx}
                    onChange={setDificultadIdx}
                    accentColor={colors.accentOrange}
                    trackColor={FIGMA.accentOrangeTrack}
                />
                <View style={styles.sliderLabelsRow}>
                    {DIFFICULTY_LABELS.map((label) => (
                        <Text key={label} style={styles.sliderLabel}>{label}</Text>
                    ))}
                </View>

                <Text style={[styles.sectionTitle, styles.sectionSpacing]}>Número de preguntas</Text>
                <Text style={styles.sectionSubtitle}>Selecciona el número de preguntas por test</Text>
                <View style={styles.sliderRow}>
                    <View style={styles.sliderTrackFlex}>
                        <AccentSlider
                            steps={QUESTION_STEPS.length}
                            valueIdx={stepIdx}
                            onChange={setStepIdx}
                            accentColor={colors.accentOrange}
                            trackColor={FIGMA.accentOrangeTrack}
                        />
                    </View>
                    <View style={styles.valueBox}>
                        <Text style={styles.valueBoxText}>{questionCount}</Text>
                    </View>
                </View>
                <Text style={styles.sectionHint}>
                    {questionCount < QUESTION_STEPS[stepIdx]
                        ? `Este apunte solo tiene ${note.questionsCount} preguntas generadas.`
                        : 'Selecciona cuántas preguntas quieres generar de tus apuntes.'}
                </Text>

                {/* Modo contrarreloj — real, sin dato de Figma; reutiliza el mismo
                    interruptor visual confirmado para "Solo temas etiquetados". */}
                <View style={[styles.toggleRow, styles.sectionSpacing]}>
                    <View style={styles.toggleTextWrap}>
                        <Text style={styles.toggleTitle}>Modo contrarreloj</Text>
                        <Text style={styles.toggleSubtitle}>30 segundos por pregunta. Sin pausa.</Text>
                    </View>
                    <ToggleSwitch value={timed} onValueChange={setTimed} />
                </View>

                <View style={styles.separator} />

                <View style={styles.toggleRow}>
                    <View style={styles.toggleTextWrap}>
                        <Text style={styles.toggleTitle}>Solo temas etiquetados</Text>
                        <Text style={styles.toggleSubtitle}>{note.tags.join(' · ')}</Text>
                    </View>
                    <ToggleSwitch value={onlyTaggedTopics} onValueChange={setOnlyTaggedTopics} />
                </View>
            </ScrollView>

            <View style={styles.actionSection}>
                <TouchableOpacity
                    style={[styles.btnPrimary, (!canStart || starting) && styles.btnPrimaryDisabled]}
                    onPress={startTest}
                    disabled={!canStart || starting}
                    activeOpacity={0.85}
                    accessibilityLabel="Generar y empezar"
                    accessibilityRole="button"
                >
                    {starting
                        ? <ActivityIndicator size="small" color={colors.white} />
                        : <Text style={styles.btnPrimaryText}>Generar y empezar</Text>}
                </TouchableOpacity>
            </View>
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
        paddingBottom: spacing.md,
    },
    iconBtn: { width: 32, alignItems: 'center' },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },

    scroll: { flex: 1 },
    content: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },

    badge: {
        backgroundColor: FIGMA.badgeBg,
        borderRadius: 12,
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
    },
    badgeLine1: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 11.6,
        color: colors.white,
    },
    badgeLine2: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: colors.white,
    },

    sectionTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    sectionSpacing: { marginTop: 28 },
    sectionSubtitle: {
        marginTop: 4,
        marginBottom: 20,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.textMuted,
        textAlign: 'center',
    },
    sectionHint: {
        marginTop: 8,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.textMuted,
        textAlign: 'center',
    },

    sliderLabelsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 6,
    },
    sliderLabel: {
        fontFamily: 'Poppins-Regular',
        fontSize: 9.8,
        color: FIGMA.textMuted,
    },

    sliderRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sliderTrackFlex: { flex: 1 },
    valueBox: {
        width: 56.7,
        height: 32.7,
        borderRadius: 8,
        borderWidth: 0.32,
        borderColor: FIGMA.cardBorder,
        backgroundColor: 'rgba(255,255,255,0.5)',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    valueBoxText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 16,
        color: FIGMA.valueBoxText,
    },

    separator: {
        height: 0.44,
        backgroundColor: FIGMA.cardBorder,
        marginVertical: spacing.lg,
    },

    toggleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    toggleTextWrap: { flex: 1, marginRight: spacing.md },
    toggleTitle: {
        fontFamily: 'Poppins-Bold',
        fontSize: 17.8,
        color: colors.textDark,
    },
    toggleSubtitle: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.textMuted,
    },
    toggleTrack: {
        width: 62.4,
        height: 31.6,
        borderRadius: 15.8,
        borderWidth: 0.32,
        borderColor: FIGMA.toggleBorder,
        backgroundColor: FIGMA.toggleTrackBg,
        justifyContent: 'center',
        paddingHorizontal: 3.5,
    },
    toggleKnob: {
        width: 28.9,
        height: 28.9,
        borderRadius: 14.45,
        backgroundColor: colors.textDark,
    },
    toggleKnobOff: { alignSelf: 'flex-start' },
    toggleKnobOn: { alignSelf: 'flex-end' },

    actionSection: {
        padding: spacing.md,
    },
    btnPrimary: {
        alignItems: 'center',
        justifyContent: 'center',
        height: 61.3,
        backgroundColor: colors.ctaGreen,
        borderRadius: 14.2,
    },
    btnPrimaryDisabled: {
        backgroundColor: colors.gray,
    },
    btnPrimaryText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
});
