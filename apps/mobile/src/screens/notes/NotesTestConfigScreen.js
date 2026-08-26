import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Switch,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import AccentSlider from '../../components/AccentSlider';
import { notesApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

const NOTES_ACCENT = '#2563EB';
const NOTES_ACCENT_BG = '#EFF6FF';

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

function TopicItem({ label, checked, onPress, disabled }) {
    return (
        <TouchableOpacity
            style={[
                styles.topicItem,
                checked && styles.topicItemSelected,
                disabled && styles.topicItemDisabled,
            ]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.75}
            accessibilityLabel={label}
            accessibilityRole="checkbox"
            accessibilityState={{ checked }}
        >
            <View style={[styles.checkbox, checked && styles.checkboxChecked]}>
                {checked ? (
                    <Ionicons name="checkmark" size={16} color={colors.white} />
                ) : null}
            </View>
            <Text style={[styles.topicText, checked && styles.topicTextSelected]}>
                {label}
            </Text>
        </TouchableOpacity>
    );
}

export default function NotesTestConfigScreen({ navigation, route }) {
    const { noteId, noteData } = route?.params ?? {};

    // Si no llega noteData, aquí iría notesApi.get(noteId). De momento, mock.
    const note = useMemo(() => noteData ?? { ...MOCK_NOTE, id: noteId ?? MOCK_NOTE.id }, [noteId, noteData]);

    const [stepIdx, setStepIdx] = useState(DEFAULT_STEP_IDX);
    // "Solo temas etiquetados" es un shortcut: si está activo, se usan todos los tags.
    // Si el usuario toca una etiqueta individual, se desactiva y pasa a selección manual.
    const [allTagsMode, setAllTagsMode] = useState(true);
    const [selectedTopics, setSelectedTopics] = useState(new Set(note.tags));
    // Consistente con el Generador Infinito del Bloque 6 (aunque no está en el mockup).
    const [timed, setTimed] = useState(false);
    const [starting, setStarting] = useState(false);

    // Cap del número de preguntas al techo real del documento.
    const questionCount = useMemo(() => {
        const raw = QUESTION_STEPS[stepIdx];
        return Math.min(raw, note.questionsCount);
    }, [stepIdx, note.questionsCount]);

    const toggleAllTags = () => {
        if (allTagsMode) {
            // Al desactivar, dejamos todos marcados; el usuario pasa a modo manual con todos ON.
            setAllTagsMode(false);
        } else {
            // Al activar, seleccionamos todos.
            setAllTagsMode(true);
            setSelectedTopics(new Set(note.tags));
        }
    };

    const toggleTopic = (tag) => {
        // Al tocar una etiqueta individual, salimos de allTagsMode.
        setAllTagsMode(false);
        setSelectedTopics((prev) => {
            const next = new Set(prev);
            if (next.has(tag)) next.delete(tag);
            else next.add(tag);
            return next;
        });
    };

    const canStart = selectedTopics.size > 0 && questionCount > 0;

    const startTest = async () => {
        if (!canStart || starting) return;
        setStarting(true);
        try {
            const res = await notesApi.generateTest(note.id, {
                questionCount,
                topics: Array.from(selectedTopics),
                timed,
            });
            const questions = adaptGeneratedQuestions(res?.data?.questions ?? []);
            navigation.replace('TrainingSession', {
                source: 'notes',
                noteId: note.id,
                questions,
                questionCount,
                topics: Array.from(selectedTopics),
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
                topics: Array.from(selectedTopics),
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityLabel="Volver"
                >
                    <Text style={styles.backChevron}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Generar test</Text>
                <View style={styles.headerRightPlaceholder} />
            </View>

            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Contexto del documento */}
                <View style={styles.docContext}>
                    <Text style={styles.docContextTitle}>BASADO EN</Text>
                    <Text style={styles.docContextName}>
                        {note.title} ({note.pages} {note.pages === 1 ? 'pág' : 'págs'})
                    </Text>
                </View>

                {/* Nº de preguntas */}
                <View style={styles.section}>
                    <View style={styles.sectionLabelRow}>
                        <Text style={styles.sectionLabel}>Nº de preguntas</Text>
                        <Text style={styles.sectionValue}>{questionCount}</Text>
                    </View>
                    <AccentSlider
                        steps={QUESTION_STEPS.length}
                        valueIdx={stepIdx}
                        onChange={setStepIdx}
                        accentColor={NOTES_ACCENT}
                    />
                    <Text style={styles.sectionHint}>
                        {questionCount < QUESTION_STEPS[stepIdx]
                            ? `Este apunte solo tiene ${note.questionsCount} preguntas generadas.`
                            : 'Selecciona cuántas preguntas quieres generar de tus apuntes.'}
                    </Text>
                </View>

                {/* Contrarreloj */}
                <View style={styles.timedRow}>
                    <View style={styles.timedLabelCol}>
                        <Text style={styles.sectionLabel}>Modo contrarreloj</Text>
                        <Text style={styles.sectionHint}>
                            30 segundos por pregunta. Sin pausa.
                        </Text>
                    </View>
                    <Switch
                        value={timed}
                        onValueChange={setTimed}
                        trackColor={{ false: '#E5E7EB', true: NOTES_ACCENT }}
                        thumbColor={colors.white}
                        ios_backgroundColor="#E5E7EB"
                    />
                </View>

                {/* Temas */}
                <View style={styles.section}>
                    <Text style={styles.sectionLabel}>Temas</Text>

                    <View style={styles.topicList}>
                        <TopicItem
                            label="Solo temas etiquetados"
                            checked={allTagsMode}
                            onPress={toggleAllTags}
                        />
                        {note.tags.map((tag) => (
                            <TopicItem
                                key={tag}
                                label={tag}
                                checked={selectedTopics.has(tag)}
                                onPress={() => toggleTopic(tag)}
                            />
                        ))}
                    </View>
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
                        : <Ionicons name="sparkles" size={20} color={colors.white} />}
                    <Text style={styles.btnPrimaryText}>
                        {starting ? 'Generando…' : 'Generar y empezar'}
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.card },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: colors.separator,
    },
    backBtn: { paddingRight: spacing.xs, width: 30 },
    backChevron: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
        lineHeight: 32,
    },
    headerTitle: {
        flex: 1,
        fontSize: 18,
        fontWeight: '700',
        color: colors.dark,
    },
    headerRightPlaceholder: { width: 30 },

    // Scroll
    scroll: { flex: 1 },
    content: {
        padding: spacing.md,
        paddingTop: spacing.lg,
        gap: spacing.lg,
    },

    // Contexto doc
    docContext: {
        backgroundColor: '#F9FAFB',
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: 12,
        padding: spacing.md,
    },
    docContextTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        color: colors.textSecondary,
        marginBottom: 6,
    },
    docContextName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.dark,
    },

    // Section (label + control)
    section: {
        gap: spacing.sm + 4,
    },
    sectionLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    sectionLabel: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.dark,
    },
    sectionValue: {
        fontSize: 15,
        fontWeight: '800',
        color: NOTES_ACCENT,
    },
    sectionHint: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 18,
    },

    // Contrarreloj
    timedRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.md,
    },
    timedLabelCol: {
        flex: 1,
        gap: 4,
    },

    // Topics
    topicList: {
        gap: spacing.sm + 4,
    },
    topicItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm + 4,
        padding: spacing.sm + 4,
        borderWidth: 1,
        borderColor: colors.separator,
        borderRadius: 10,
    },
    topicItemSelected: {
        backgroundColor: NOTES_ACCENT_BG,
        borderColor: NOTES_ACCENT,
    },
    topicItemDisabled: {
        opacity: 0.5,
    },
    checkbox: {
        width: 22,
        height: 22,
        borderWidth: 2,
        borderColor: colors.textSecondary,
        borderRadius: 6,
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxChecked: {
        backgroundColor: NOTES_ACCENT,
        borderColor: NOTES_ACCENT,
    },
    topicText: {
        fontSize: 14,
        color: colors.dark,
        fontWeight: '500',
    },
    topicTextSelected: {
        color: NOTES_ACCENT,
        fontWeight: '700',
    },

    // CTA
    actionSection: {
        padding: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.separator,
    },
    btnPrimary: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm + 4,
        backgroundColor: NOTES_ACCENT,
        borderRadius: 12,
        paddingVertical: 17,
        shadowColor: NOTES_ACCENT,
        shadowOpacity: 0.25,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 3,
    },
    btnPrimaryDisabled: {
        backgroundColor: colors.grayMid,
        shadowOpacity: 0,
    },
    btnPrimaryText: {
        color: colors.white,
        fontSize: 17,
        fontWeight: '800',
    },
});
