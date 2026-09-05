import React, { useState, useEffect, useRef } from 'react';
import {
    StyleSheet,
    View,
    Text,
    TouchableOpacity,
    StatusBar,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { boeApi } from '../../api';

// ─── 10.4 · Mini-test BOE ─────────────────────────────────────────────────────
// Flujo con Motor activo:
//   1. GET /boe/changes/:id/mini-test → SesionOut (preguntas sin respuesta correcta)
//   2. POST /boe/changes/:id/mini-test/answer por pregunta → correcta + explicación + evidencia
//   3. POST /boe/changes/:id/mini-test/complete al finalizar → Opopoints
// Flujo sin Motor (stub / fallback):
//   sesionId === null → correctIndex viene en la pregunta → resolución local
const FIGMA = {
    subtitleMuted: 'rgba(52, 58, 61, 0.5)',
    optionBorder: 'rgba(65, 41, 80, 0.3)',
    optionSelectedBg: 'rgba(114, 65, 184, 0.08)',
    evidenciaBg: 'rgba(65, 41, 80, 0.06)',
    evidenciaBorder: 'rgba(65, 41, 80, 0.2)',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ChevronMiniIcon({ direction = 'left', size = 14, color = colors.white }) {
    const d = direction === 'left' ? 'M9 3L4 8L9 13' : 'M5 3L10 8L5 13';
    return (
        <Svg width={size} height={size} viewBox="0 0 14 16">
            <Path d={d} stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Estados de la pantalla ───────────────────────────────────────────────────
const STATE = {
    LOADING: 'loading',
    NOT_AVAILABLE: 'not_available',
    ERROR: 'error',
    ACTIVE: 'active',
};

export default function BoeMiniTestScreen({ route, navigation }) {
    const { itemId, title } = route.params ?? {};
    const insets = useSafeAreaInsets();

    const [screenState, setScreenState] = useState(STATE.LOADING);
    const [questions, setQuestions] = useState([]);
    const sesionIdRef = useRef(null); // null = stub, string = Motor
    const isStubRef = useRef(false);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState(null); // { correcta, correctaIdx, explicacion, justificaciones, evidencia }
    const scoreRef = useRef(0);
    const startTimeRef = useRef(Date.now());

    // ── Cargar sesión al montar ───────────────────────────────────────────────
    useEffect(() => {
        boeApi.getMiniTest(itemId).then((res) => {
            if (res?.error) {
                if (res.error.code === 'boe/mini-test-not-available') {
                    setScreenState(STATE.NOT_AVAILABLE);
                } else {
                    setScreenState(STATE.ERROR);
                }
                return;
            }
            const { sesionId, questions: qs } = res?.data ?? {};
            if (!qs?.length) {
                setScreenState(STATE.ERROR);
                return;
            }
            sesionIdRef.current = sesionId ?? null;
            isStubRef.current = sesionId === null;
            setQuestions(qs);
            startTimeRef.current = Date.now();
            setScreenState(STATE.ACTIVE);
        }).catch(() => setScreenState(STATE.ERROR));
    }, [itemId]);

    const currentQ = questions[currentIndex];
    const total = questions.length;
    const progress = total > 0 ? (currentIndex + (feedback ? 1 : 0)) / total : 0;
    const isLastQuestion = currentIndex === total - 1;

    // ── Confirmar respuesta ───────────────────────────────────────────────────
    async function handleConfirm() {
        if (selectedOptionIdx === null || isSubmitting) return;
        setIsSubmitting(true);

        const tiempoMs = Date.now() - startTimeRef.current;
        startTimeRef.current = Date.now();

        if (isStubRef.current) {
            // Fallback local: correctIndex viene en la pregunta del stub
            const correctaIdx = currentQ.correctIndex ?? 0;
            const correcta = selectedOptionIdx === correctaIdx;
            if (correcta) scoreRef.current += 1;
            setFeedback({
                correcta,
                correctaIdx,
                explicacion: currentQ.explanation ?? '',
                justificaciones: [],
                evidencia: null,
            });
        } else {
            const res = await boeApi.answerMiniTest(itemId, {
                sesionId: sesionIdRef.current,
                preguntaId: currentQ.id,
                elegidaIdx: selectedOptionIdx,
                tiempoMs,
            }).catch(() => null);

            if (!res?.data) {
                Alert.alert('Error', 'No se pudo registrar tu respuesta. Inténtalo de nuevo.');
                setIsSubmitting(false);
                return;
            }
            const { correcta, correctaIdx, explicacion, justificaciones, evidencia } = res.data;
            if (correcta) scoreRef.current += 1;
            setFeedback({ correcta, correctaIdx, explicacion, justificaciones, evidencia });
        }

        setIsSubmitting(false);
    }

    // ── Avanzar a la siguiente pregunta o finalizar ───────────────────────────
    function handleNext() {
        if (isLastQuestion) {
            boeApi.completeMiniTest(itemId, scoreRef.current, total).catch(() => {});
            navigation.navigate('BoeUpdateSuccess', {
                articleRef: title ?? currentQ?.context ?? 'Actualización BOE',
            });
        } else {
            setCurrentIndex((i) => i + 1);
            setSelectedOptionIdx(null);
            setFeedback(null);
        }
    }

    function handleClose() {
        if (currentIndex === 0 && !feedback) {
            navigation.goBack();
            return;
        }
        Alert.alert(
            'Salir del test',
            'Si sales ahora perderás tu progreso en este mini-test.',
            [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Salir', style: 'destructive', onPress: () => navigation.goBack() },
            ],
        );
    }

    // ─── Estado: cargando ─────────────────────────────────────────────────────
    if (screenState === STATE.LOADING) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.centeredState}>
                    <ActivityIndicator size="large" color={colors.purple} />
                    <Text style={styles.stateText}>Preparando mini-test…</Text>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Estado: preguntas aún no disponibles (409) ───────────────────────────
    if (screenState === STATE.NOT_AVAILABLE) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.centeredState}>
                    <Ionicons name="time-outline" size={52} color={colors.purple} style={{ marginBottom: 20 }} />
                    <Text style={styles.stateTitle}>Preguntas en preparación</Text>
                    <Text style={styles.stateBody}>
                        El Motor IA está regenerando las preguntas afectadas por este cambio. Vuelve en unos minutos.
                    </Text>
                    <TouchableOpacity style={styles.stateBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.stateBtnText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Estado: error genérico ───────────────────────────────────────────────
    if (screenState === STATE.ERROR) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
                <View style={styles.centeredState}>
                    <Ionicons name="alert-circle-outline" size={52} color={colors.statRed} style={{ marginBottom: 20 }} />
                    <Text style={styles.stateTitle}>No se pudo cargar</Text>
                    <Text style={styles.stateBody}>Comprueba tu conexión e inténtalo de nuevo.</Text>
                    <TouchableOpacity style={styles.stateBtn} onPress={() => navigation.goBack()}>
                        <Text style={styles.stateBtnText}>Volver</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // ─── Estado: test activo ──────────────────────────────────────────────────
    const isCorrectAnswer = feedback?.correcta === true;

    // Las opciones tras confirmar: solo mostrar la correcta y la elegida (si incorrecta)
    const displayOptions = currentQ.options.map((text, idx) => ({ text, idx })).filter(({ idx }) => {
        if (!feedback) return true;
        if (idx === feedback.correctaIdx) return true;
        if (idx === selectedOptionIdx) return true;
        return false;
    });

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <View style={styles.screen}>
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity style={styles.iconButton} activeOpacity={0.7} onPress={handleClose}>
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

                {/* Píldora de progreso */}
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

                {/* Contenido */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <Text style={styles.questionText}>{currentQ.question}</Text>

                    <View style={styles.optionsList}>
                        {displayOptions.map(({ text, idx }) => {
                            const isSelected = selectedOptionIdx === idx;
                            let borderColor = FIGMA.optionBorder;
                            let bg = 'transparent';
                            let textColor = colors.textDark;
                            let labelColor = colors.textDark;

                            if (!feedback) {
                                if (isSelected) {
                                    borderColor = colors.purple;
                                    bg = FIGMA.optionSelectedBg;
                                    textColor = colors.purple;
                                    labelColor = colors.purple;
                                }
                            } else if (idx === feedback.correctaIdx) {
                                borderColor = colors.ctaGreen;
                                bg = `${colors.ctaGreen}1A`;
                                textColor = colors.textDark;
                            } else if (isSelected) {
                                borderColor = colors.statRed;
                                bg = `${colors.statRed}1A`;
                                textColor = colors.textDark;
                            }

                            const label = String.fromCharCode(65 + idx); // A, B, C…

                            return (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.optionRow, { borderColor, backgroundColor: bg }]}
                                    onPress={() => !feedback && setSelectedOptionIdx(idx)}
                                    disabled={!!feedback}
                                    activeOpacity={0.8}
                                >
                                    <Text style={[styles.optionLabel, { color: labelColor }]}>{label}.</Text>
                                    <Text style={[styles.optionText, { color: textColor }]}>{text}</Text>
                                    {feedback && idx === feedback.correctaIdx && (
                                        <Ionicons name="checkmark-circle" size={18} color={colors.ctaGreen} />
                                    )}
                                    {feedback && idx === selectedOptionIdx && idx !== feedback.correctaIdx && (
                                        <Ionicons name="close-circle" size={18} color={colors.statRed} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Feedback tras confirmar */}
                    {feedback && (
                        <View style={[styles.feedbackCard, isCorrectAnswer ? styles.feedbackOk : styles.feedbackErr]}>
                            <View style={styles.feedbackHeader}>
                                <Ionicons
                                    name={isCorrectAnswer ? 'checkmark-circle' : 'close-circle'}
                                    size={22}
                                    color={isCorrectAnswer ? colors.ctaGreen : colors.statRed}
                                />
                                <Text style={[styles.feedbackTitle, { color: isCorrectAnswer ? colors.ctaGreen : colors.statRed }]}>
                                    {isCorrectAnswer ? '¡Correcto!' : 'Incorrecto'}
                                </Text>
                            </View>
                            {!!feedback.explicacion && (
                                <Text style={styles.feedbackBody}>{feedback.explicacion}</Text>
                            )}
                            {/* Evidencia verbatim del temario — solo con Motor activo */}
                            {feedback.evidencia?.cita ? (
                                <View style={styles.evidenciaBox}>
                                    <Text style={styles.evidenciaLabel}>
                                        Fuente — pág. {feedback.evidencia.pagina}
                                    </Text>
                                    <Text style={styles.evidenciaText}>"{feedback.evidencia.cita}"</Text>
                                </View>
                            ) : null}
                        </View>
                    )}
                </ScrollView>

                {/* Botón fijo al fondo */}
                <View style={[styles.actionArea, { paddingBottom: spacing.sm + insets.bottom }]}>
                    {!feedback ? (
                        <TouchableOpacity
                            style={[styles.confirmBtn, (selectedOptionIdx === null || isSubmitting) && styles.confirmBtnDisabled]}
                            onPress={handleConfirm}
                            disabled={selectedOptionIdx === null || isSubmitting}
                        >
                            {isSubmitting
                                ? <ActivityIndicator size="small" color={colors.white} />
                                : <Text style={styles.confirmBtnText}>Confirmar</Text>
                            }
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity style={styles.confirmBtn} onPress={handleNext}>
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

    // ── Estados de carga / error / no disponible ───────────────────────────────
    centeredState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    stateText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15,
        color: colors.textDark,
        marginTop: 16,
        textAlign: 'center',
    },
    stateTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 20,
        color: colors.textDark,
        textAlign: 'center',
        marginBottom: 10,
    },
    stateBody: {
        fontFamily: 'Poppins-Regular',
        fontSize: 14,
        color: colors.textDark,
        opacity: 0.7,
        textAlign: 'center',
        lineHeight: 21,
        marginBottom: 28,
    },
    stateBtn: {
        backgroundColor: colors.purple,
        paddingVertical: 14,
        paddingHorizontal: 40,
        borderRadius: 14,
    },
    stateBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15,
        color: colors.white,
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

    // ── Progreso ──────────────────────────────────────────────────
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
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: spacing.md },

    questionText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
        lineHeight: 25,
        marginBottom: spacing.lg,
    },

    // ── Opciones ──────────────────────────────────────────────────
    optionsList: { gap: spacing.sm + 4 },
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

    // ── Feedback ──────────────────────────────────────────────────
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

    // ── Evidencia verbatim ─────────────────────────────────────────
    evidenciaBox: {
        marginTop: 12,
        backgroundColor: FIGMA.evidenciaBg,
        borderWidth: 1,
        borderColor: FIGMA.evidenciaBorder,
        borderRadius: 10,
        padding: 12,
    },
    evidenciaLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 11,
        color: colors.purple,
        marginBottom: 4,
        textTransform: 'uppercase',
        letterSpacing: 0.4,
    },
    evidenciaText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: colors.textDark,
        lineHeight: 19,
        fontStyle: 'italic',
    },

    // ── Botón fijo ─────────────────────────────────────────────────
    actionArea: { paddingTop: spacing.sm },
    confirmBtn: {
        height: 61.3,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmBtnDisabled: { opacity: 0.4 },
    confirmBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
});
