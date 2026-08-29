import React, { useState, useEffect } from 'react';
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
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

// ─── 10.4 · Mini-test BOE · pregunta activa con tiempo ────────────────────────
// Fiel al Figma (PreguntaActivaConTiempoScreen.tsx). El diseño solo captura el
// estado previo a responder; el flujo real de envío/feedback (correcto,
// incorrecto, explicación, avance a la siguiente pregunta) no tiene equivalente
// en Figma y se conserva porque es imprescindible para que el mini-test
// funcione — solo se reestiliza con la paleta confirmada.
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    optionBorder: 'rgba(65, 41, 80, 0.3)',
    optionSelectedBg: 'rgba(114, 65, 184, 0.08)',
};

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

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Flechas de la píldora de progreso — decorativas: el avance real está
// gobernado por Confirmar/Siguiente pregunta para no romper el registro de
// aciertos (score) del flujo de envío, que Figma no modela.
function ChevronMiniIcon({ direction = 'left', size = 14, color = colors.white }) {
    const d = direction === 'left' ? 'M9 3L4 8L9 13' : 'M5 3L10 8L5 13';
    return (
        <Svg width={size} height={size} viewBox="0 0 14 16">
            <Path d={d} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function BoeMiniTestScreen({ route, navigation }) {
    const { itemId = '1', title } = route.params ?? {};
    const mockQuestions = MOCK_QUESTIONS_BY_ITEM[itemId] ?? MOCK_QUESTIONS_BY_ITEM.default;
    const insets = useSafeAreaInsets();

    const [apiQuestions, setApiQuestions] = useState(null);

    useEffect(() => {
        boeApi.getMiniTest(itemId).then(res => {
            if (res?.data?.questions?.length > 0) {
                const qs = res.data.questions.map((q) => ({
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
        if (correct) setScore(s => s + 1);
        setIsSubmitted(true);
    }

    function handleNext() {
        if (isLastQuestion) {
            boeApi.completeMiniTest(itemId, score, total).catch(() => {});
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
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.screen}>
                {/* ── Header ──────────────────────────────────────────────────── */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={handleClose}
                        accessibilityLabel="Cerrar test"
                    >
                        <ChevronLeftIcon />
                    </TouchableOpacity>
                    <View style={styles.headerTitles}>
                        <Text style={styles.headerTitle}>Actualización BOE</Text>
                        <Text style={styles.headerSubtitle} numberOfLines={1}>
                            {title ?? currentQ.context}
                        </Text>
                    </View>
                    <View style={styles.iconButton} />
                </View>

                {/* ── Píldora de progreso ─────────────────────────────────────── */}
                <View style={styles.progressPill}>
                    <ChevronMiniIcon direction="left" />
                    <View style={styles.progressTrack}>
                        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                        <Text style={styles.progressText}>
                            Pregunta {currentIndex + 1} de {total}
                        </Text>
                    </View>
                    <ChevronMiniIcon direction="right" />
                </View>

                {/* ── Contenido ─────────────────────────────────────────────────── */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.questionText}>{currentQ.question}</Text>

                    <View style={styles.optionsList}>
                        {visibleOptions.map(option => {
                            const isSelected = selectedOption === option.id;
                            let borderColor = FIGMA.optionBorder;
                            let bg = 'transparent';
                            let textColor = colors.textDark;

                            if (!isSubmitted) {
                                if (isSelected) {
                                    borderColor = colors.purple;
                                    bg = FIGMA.optionSelectedBg;
                                    textColor = colors.purple;
                                }
                            } else if (option.isCorrect) {
                                borderColor = colors.ctaGreen;
                                bg = `${colors.ctaGreen}1A`;
                            } else if (isSelected) {
                                borderColor = colors.statRed;
                                bg = `${colors.statRed}1A`;
                            }

                            return (
                                <TouchableOpacity
                                    key={option.id}
                                    style={[styles.optionRow, { borderColor, backgroundColor: bg }]}
                                    onPress={() => handleSelect(option.id)}
                                    disabled={isSubmitted}
                                    activeOpacity={0.8}
                                    accessibilityLabel={`Opción ${option.id}: ${option.text}`}
                                    accessibilityState={{ selected: isSelected }}
                                >
                                    <Text style={[styles.optionLabel, { color: textColor }]}>{option.id}.</Text>
                                    <Text style={[styles.optionText, { color: textColor }]}>{option.text}</Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Feedback tras enviar respuesta */}
                    {isSubmitted && (
                        <View style={[
                            styles.feedbackCard,
                            isCorrectAnswer ? styles.feedbackOk : styles.feedbackErr,
                        ]}>
                            <View style={styles.feedbackHeader}>
                                <Ionicons
                                    name={isCorrectAnswer ? 'checkmark-circle' : 'close-circle'}
                                    size={22}
                                    color={isCorrectAnswer ? colors.ctaGreen : colors.statRed}
                                />
                                <Text style={[
                                    styles.feedbackTitle,
                                    { color: isCorrectAnswer ? colors.ctaGreen : colors.statRed },
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

                {/* ── Botón fijo al fondo ───────────────────────────────────────── */}
                <View style={[styles.actionArea, { paddingBottom: spacing.sm + insets.bottom }]}>
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
                            style={styles.confirmBtn}
                            onPress={handleNext}
                            accessibilityLabel={isLastQuestion ? 'Finalizar test' : 'Siguiente pregunta'}
                        >
                            <Text style={styles.confirmBtnText}>
                                {isLastQuestion ? 'Finalizar test' : 'Siguiente pregunta'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.white,
    },
    screen: {
        flex: 1,
        backgroundColor: colors.white,
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.lg,
    },

    // ── Header ────────────────────────────────────────────────────
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md + 4,
    },
    iconButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitles: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
    },
    headerSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 11.6,
        color: FIGMA.subtitleMuted,
        marginTop: 2,
    },

    // ── Píldora de progreso ────────────────────────────────────────
    progressPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.textDark,
        borderRadius: 24,
        paddingVertical: 10,
        paddingHorizontal: 14,
        marginBottom: spacing.lg,
    },
    progressTrack: {
        flex: 1,
        height: 24,
        marginHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 24,
        overflow: 'hidden',
    },
    progressFill: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        borderRadius: 24,
        backgroundColor: colors.accentOrange,
    },
    progressText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 12.5,
        color: colors.white,
    },

    // ── Contenido ─────────────────────────────────────────────────
    scroll: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: spacing.md,
    },

    // ── Pregunta ──────────────────────────────────────────────────
    questionText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        lineHeight: 25,
        marginBottom: spacing.lg,
    },

    // ── Opciones ──────────────────────────────────────────────────
    optionsList: {
        gap: spacing.sm + 4,
    },
    optionRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        borderWidth: 1,
        borderRadius: 10.7,
        padding: 14,
    },
    optionLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
    },
    optionText: {
        flex: 1,
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        lineHeight: 19,
    },

    // ── Feedback card ─────────────────────────────────────────────
    feedbackCard: {
        borderRadius: 14,
        padding: spacing.md,
        marginTop: spacing.md,
        borderWidth: 1,
    },
    feedbackOk: {
        backgroundColor: `${colors.ctaGreen}0F`,
        borderColor: `${colors.ctaGreen}50`,
    },
    feedbackErr: {
        backgroundColor: `${colors.statRed}0F`,
        borderColor: `${colors.statRed}50`,
    },
    feedbackHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    feedbackTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
    },
    feedbackBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: colors.textDark,
        lineHeight: 21,
    },

    // ── Botón fijo al fondo ────────────────────────────────────────
    actionArea: {
        paddingTop: spacing.sm,
    },
    confirmBtn: {
        height: 61.3,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDisabled: {
        opacity: 0.4,
    },
    confirmBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
});
