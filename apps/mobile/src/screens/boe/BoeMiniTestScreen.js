import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

// ─── Tokens de color — alineados con QuestionActiveScreen (Bloque 7) ─────────
const QUIZ_ACCENT = colors.purple ?? '#7B4BC4';
const CORRECT_BG = '#DCFCE7';
const CORRECT_BORDER = colors.success;
const INCORRECT_BG = '#FCA5A5';
const INCORRECT_BORDER = colors.error;

// ─── Mock de preguntas — Paso 2: boeApi.getMiniTest(itemId) ──────────────────
const MOCK_QUESTIONS_BY_ITEM = {
    '1': [
        {
            id: 'q1',
            context: 'Art. 14 modificado',
            question: 'Tras la modificación, ¿quién está ahora obligado a relacionarse electrónicamente con la Administración?',
            options: [
                { id: 'A', text: 'Solo las personas jurídicas.', isCorrect: false },
                { id: 'B', text: 'También los empleados públicos en el ejercicio de sus funciones.', isCorrect: true },
                { id: 'C', text: 'Únicamente las grandes empresas.', isCorrect: false },
            ],
            explanation: 'La nueva redacción amplía la obligación a los empleados públicos en el ejercicio de sus funciones.',
            explanationWrong: 'Incorrecto. La respuesta correcta es la B. La modificación añade expresamente a los empleados públicos.',
        },
        {
            id: 'q2',
            context: 'Art. 14 modificado',
            question: '¿Qué colectivo profesional se añade expresamente en la nueva redacción?',
            options: [
                { id: 'A', text: 'Los autónomos sin colegiación.', isCorrect: false },
                { id: 'B', text: 'Quienes ejerzan actividad profesional colegiada.', isCorrect: true },
                { id: 'C', text: 'Los trabajadores por cuenta ajena.', isCorrect: false },
            ],
            explanation: 'La nueva redacción añade expresamente a quienes ejerzan cualquier actividad profesional colegiada.',
            explanationWrong: 'Incorrecto. La respuesta correcta es la B. Los profesionales con colegiación obligatoria son el colectivo añadido.',
        },
        {
            id: 'q3',
            context: 'Art. 14 modificado',
            question: '¿Qué ocurre con la obligación electrónica de las personas físicas no profesionales?',
            options: [
                { id: 'A', text: 'Pasan a ser obligatorias para todas.', isCorrect: false },
                { id: 'B', text: 'Se mantiene voluntaria, salvo los supuestos del art. 14.2.', isCorrect: true },
                { id: 'C', text: 'Queda derogada por el nuevo reglamento.', isCorrect: false },
            ],
            explanation: 'Las personas físicas no profesionales siguen con la relación electrónica voluntaria, salvo excepciones del art. 14.2.',
            explanationWrong: 'Incorrecto. La respuesta correcta es la B. La obligación no se extiende a todas las personas físicas.',
        },
    ],
    default: [
        {
            id: 'q1',
            context: 'Cambio legislativo',
            question: '¿Cuál es el efecto principal del cambio publicado en el BOE?',
            options: [
                { id: 'A', text: 'Deroga la norma anterior en su totalidad.', isCorrect: false },
                { id: 'B', text: 'Modifica parcialmente la redacción vigente.', isCorrect: true },
                { id: 'C', text: 'Aplaza la entrada en vigor de la ley base.', isCorrect: false },
            ],
            explanation: 'La publicación en el BOE modifica parcialmente la redacción anterior, manteniéndose el resto del articulado vigente.',
            explanationWrong: 'Incorrecto. La respuesta correcta es la B. Solo se modifica parcialmente la redacción.',
        },
    ],
};

export default function BoeMiniTestScreen({ route, navigation }) {
    const { itemId = '1', title } = route.params ?? {};
    const mockQuestions = MOCK_QUESTIONS_BY_ITEM[itemId] ?? MOCK_QUESTIONS_BY_ITEM.default;
    const insets = useSafeAreaInsets();

    const [apiQuestions, setApiQuestions] = useState(null);

    useEffect(() => {
        boeApi.getMiniTest(itemId).then(res => {
            if (res?.data?.questions?.length > 0) {
                const qs = res.data.questions.map((q, i) => ({
                    id: q.id,
                    context: q.context,
                    question: q.question,
                    options: q.options.map((text, idx) => ({
                        id: String.fromCharCode(65 + idx), // 'A', 'B', 'C'
                        text,
                        isCorrect: idx === q.correctIndex,
                    })),
                    explanation: q.explanation,
                    explanationWrong: `Incorrecto. La respuesta correcta es la ${String.fromCharCode(65 + q.correctIndex)}. ${q.explanation}`,
                }));
                setApiQuestions(qs);
            }
        }).catch(() => {});
    }, [itemId]);

    const questions = apiQuestions ?? mockQuestions;
    const total = questions.length;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState(null);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const scoreRef = useRef(0);

    const currentQ = questions[currentIndex];
    const progress = (currentIndex + (isSubmitted ? 1 : 0)) / total;
    const isLastQuestion = currentIndex === total - 1;

    // Solo mostrar: correcta + elegida incorrecta (igual que QuestionActiveScreen)
    const visibleOptions = currentQ.options.filter(opt => {
        if (!isSubmitted) return true;
        if (opt.isCorrect) return true;
        if (opt.id === selectedOption) return true;
        return false;
    });

    const isCorrectAnswer =
        isSubmitted && currentQ.options.find(o => o.id === selectedOption)?.isCorrect === true;

    function handleSelect(id) {
        if (isSubmitted) return;
        setSelectedOption(id);
    }

    function handleConfirm() {
        if (!selectedOption) return;
        const correct = currentQ.options.find(o => o.id === selectedOption)?.isCorrect ?? false;
        if (correct) {
            scoreRef.current += 1;
            setScore(scoreRef.current);
        }
        setIsSubmitted(true);
    }

    function handleNext() {
        if (isLastQuestion) {
            boeApi.completeMiniTest(itemId, scoreRef.current, total).catch(() => {});
            navigation.navigate('BoeUpdateSuccess', {
                articleRef: title ?? currentQ.context,
            });
        } else {
            setCurrentIndex(i => i + 1);
            setSelectedOption(null);
            setIsSubmitted(false);
        }
    }

    function handleClose() {
        if (currentIndex === 0 && !isSubmitted) {
            navigation.goBack();
            return;
        }
        Alert.alert(
            'Salir del test',
            'Si sales ahora perderás tu progreso en este mini-test.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
            ]
        );
    }

    return (
        <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            {/* ── Header blanco (estilo QuestionActiveScreen) ────────────────── */}
            <View style={styles.topHeader}>
                <TouchableOpacity
                    style={styles.circleBtn}
                    onPress={handleClose}
                    accessibilityLabel="Cerrar test"
                >
                    <Ionicons name="close" size={20} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.topHeaderTexts}>
                    <Text style={styles.topHeaderTitle}>Mini-test BOE</Text>
                    {title ? (
                        <Text style={styles.topHeaderSub} numberOfLines={1}>{title}</Text>
                    ) : null}
                </View>

                {/* Espaciador para centrar el título */}
                <View style={styles.circleBtn} />
            </View>

            {/* ── Barra navy de progreso (estilo QuestionActiveScreen) ───────── */}
            <View style={styles.progressBar}>
                <View style={styles.progressRow}>
                    <Text style={styles.progressLabel}>
                        Pregunta {currentIndex + 1} de {total}
                    </Text>
                </View>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
            </View>

            {/* ── Contenido ─────────────────────────────────────────────────── */}
            <View style={styles.content}>
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Banner de contexto del cambio */}
                    <View style={styles.contextBanner}>
                        <Ionicons name="document-text-outline" size={16} color="#007AFF" />
                        <Text style={styles.contextText}>{currentQ.context}</Text>
                    </View>

                    {/* Pregunta */}
                    <Text style={styles.questionText}>{currentQ.question}</Text>

                    {/* Opciones */}
                    <View style={styles.optionsList}>
                        {visibleOptions.map(option => {
                            const isSelected = selectedOption === option.id;
                            let bg = colors.card;
                            let border = '#E4E8F0';
                            let borderW = 1.5;
                            let textColor = colors.text;

                            if (!isSubmitted) {
                                if (isSelected) {
                                    border = QUIZ_ACCENT;
                                    borderW = 2;
                                }
                            } else if (option.isCorrect) {
                                bg = CORRECT_BG;
                                border = CORRECT_BORDER;
                                borderW = 1.5;
                            } else if (isSelected) {
                                bg = INCORRECT_BG;
                                border = INCORRECT_BORDER;
                                borderW = 1.5;
                            }

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[
                                        styles.optionCard,
                                        { backgroundColor: bg, borderColor: border, borderWidth: borderW },
                                    ]}
                                    onPress={() => handleSelect(option.id)}
                                    disabled={isSubmitted}
                                    activeOpacity={0.75}
                                    accessibilityLabel={`Opción ${option.id}: ${option.text}`}
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <Text style={[styles.optionLetter, { color: textColor }]}>
                                        {option.id}.
                                    </Text>
                                    <Text style={[styles.optionText, { color: textColor }]}>
                                        {option.text}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Feedback card (como QuestionActiveScreen) */}
                    {isSubmitted && (
                        <View style={[
                            styles.feedbackCard,
                            isCorrectAnswer ? styles.feedbackOk : styles.feedbackErr,
                        ]}>
                            <View style={styles.feedbackHeader}>
                                <Ionicons
                                    name={isCorrectAnswer ? 'checkmark-circle' : 'close-circle'}
                                    size={22}
                                    color={isCorrectAnswer ? colors.success : colors.error}
                                />
                                <Text style={[
                                    styles.feedbackTitle,
                                    { color: isCorrectAnswer ? colors.success : colors.error },
                                ]}>
                                    {isCorrectAnswer ? '¡Correcto!' : 'Incorrecto'}
                                </Text>
                            </View>
                            <Text style={styles.feedbackBody}>
                                {isCorrectAnswer ? currentQ.explanation : currentQ.explanationWrong}
                            </Text>
                        </View>
                    )}
                </ScrollView>

                {/* Botón de acción fijo al fondo */}
                <View style={[styles.actionArea, { paddingBottom: spacing.md + 4 + insets.bottom }]}>
                    {!isSubmitted ? (
                        <TouchableOpacity
                            style={[styles.confirmBtn, !selectedOption && styles.confirmBtnDisabled]}
                            onPress={handleConfirm}
                            disabled={!selectedOption}
                            accessibilityLabel="Confirmar respuesta"
                        >
                            <Text style={styles.confirmBtnText}>Confirmar</Text>
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity
                            style={styles.nextBtn}
                            onPress={handleNext}
                            accessibilityLabel={isLastQuestion ? 'Finalizar test' : 'Siguiente pregunta'}
                        >
                            <Text style={styles.nextBtnText}>
                                {isLastQuestion ? 'Finalizar test' : 'Siguiente pregunta'}
                            </Text>
                            <Ionicons
                                name={isLastQuestion ? 'checkmark-circle' : 'arrow-forward'}
                                size={20}
                                color={colors.white}
                            />
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: colors.background,
    },

    // ── Header blanco ─────────────────────────────────────────────
    topHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingHorizontal: spacing.md,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
    },
    circleBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.grayLight ?? '#F2F3F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    topHeaderTexts: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: spacing.sm,
    },
    topHeaderTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    topHeaderSub: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 1,
    },

    // ── Barra navy de progreso ────────────────────────────────────
    progressBar: {
        backgroundColor: colors.dark ?? '#0d1b2a',
        paddingHorizontal: spacing.md,
        paddingTop: 10,
        paddingBottom: 12,
    },
    progressRow: {
        marginBottom: 8,
    },
    progressLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: 'rgba(255,255,255,0.75)',
    },
    progressTrack: {
        height: 5,
        backgroundColor: 'rgba(255,255,255,0.18)',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: QUIZ_ACCENT,
        borderRadius: 3,
    },

    // ── Contenido ─────────────────────────────────────────────────
    content: {
        flex: 1,
    },
    scroll: {
        flex: 1,
    },
    scrollContent: {
        padding: spacing.md + 4,
        paddingBottom: spacing.md,
    },

    // ── Contexto ──────────────────────────────────────────────────
    contextBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: '#007AFF12',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderRadius: 8,
        marginBottom: spacing.lg,
    },
    contextText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#007AFF',
    },

    // ── Pregunta ──────────────────────────────────────────────────
    questionText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        lineHeight: 26,
        marginBottom: spacing.lg,
    },

    // ── Opciones (alineadas con QuestionActiveScreen) ─────────────
    optionsList: {
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    optionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        padding: spacing.md,
        gap: spacing.sm,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 3,
        elevation: 1,
    },
    optionLetter: {
        fontSize: 15,
        fontWeight: '800',
        width: 20,
        flexShrink: 0,
    },
    optionText: {
        flex: 1,
        fontSize: 15,
        lineHeight: 21,
    },

    // ── Feedback card (alineado con QuestionActiveScreen) ─────────
    feedbackCard: {
        borderRadius: 14,
        padding: spacing.md,
        marginTop: spacing.sm,
        borderWidth: 1,
    },
    feedbackOk: {
        backgroundColor: '#F0FFF4',
        borderColor: `${CORRECT_BORDER}50`,
    },
    feedbackErr: {
        backgroundColor: '#FFF5F5',
        borderColor: `${INCORRECT_BORDER}50`,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    feedbackTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    feedbackBody: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 21,
    },

    // ── Acción fija al fondo ──────────────────────────────────────
    actionArea: {
        paddingHorizontal: spacing.md + 4,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md + 4,
        backgroundColor: colors.background,
        borderTopWidth: 1,
        borderTopColor: colors.separator,
    },
    confirmBtn: {
        backgroundColor: QUIZ_ACCENT,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: QUIZ_ACCENT,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
    },
    confirmBtnDisabled: {
        opacity: 0.4,
        shadowOpacity: 0,
        elevation: 0,
    },
    confirmBtnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
    nextBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.success,
        paddingVertical: 16,
        borderRadius: 12,
        shadowColor: colors.success,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 8,
        elevation: 4,
    },
    nextBtnText: {
        color: colors.white,
        fontSize: 16,
        fontWeight: '700',
    },
});
