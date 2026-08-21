import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
  Vibration,
  AccessibilityInfo,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import AbandonTestModal from '../../components/AbandonTestModal';
import TimeUpModal from '../../components/TimeUpModal';
import ToastNotification from '../../components/ToastNotification';
import HintBottomSheet from '../../components/HintBottomSheet';
import LawReferenceBottomSheet from '../../components/LawReferenceBottomSheet';
import ReportQuestionModal from '../../components/ReportQuestionModal';
import PauseSessionModal from '../../components/PauseSessionModal';
import { trainingApi } from '../../api';

// Datos mock para desarrollo — se reemplazarán con route.params.questions
const MOCK_QUESTIONS = [
  {
    id: 'q1',
    difficulty: 2,
    law: 'Ley 39/2015',
    title: 'Según el artículo 159 de la Constitución Española, ¿cómo se compone el Tribunal Constitucional?',
    options: [
      { id: 'A', text: 'Se compone de 12 miembros nombrados por el Rey; de ellos, cuatro a propuesta del Congreso, cuatro a propuesta del Senado, dos a propuesta del Gobierno y dos a propuesta del Consejo General del Poder Judicial.', correct: true },
      { id: 'B', text: 'Se compone de 10 miembros nombrados por el Rey; cuatro a propuesta del Congreso, cuatro del Senado y dos del Gobierno.', correct: false },
      { id: 'C', text: 'Se compone de 12 miembros nombrados por el Presidente del Gobierno, a propuesta de las Cortes Generales y el Consejo General del Poder Judicial.', correct: false },
      { id: 'D', text: 'Se compone de 12 miembros; seis a propuesta del Congreso y seis a propuesta del Senado, por mayoría absoluta de sus miembros.', correct: false },
    ],
    explanation: 'El plazo general son 3 meses (art. 21). Solo se amplía si lo fija una norma con rango de ley.',
    explanationWrong: 'La correcta es la A. Confundiste el plazo general (3 meses) con el límite máximo que no se puede exceder (6 meses).',
    articleRef: {
      article: 'Artículo 21',
      title: 'Obligación de responder',
      text: '"El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor…"',
      boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565',
    },
  },
];

const TIMER_WARNING = 30;
const TIMER_DANGER = 10;
const MAX_HINTS = 3;

export default function QuestionActiveScreen({ navigation, route }) {
  const {
    questions = MOCK_QUESTIONS,
    startIndex = 0,
    // Sources soportados: 'generator' | 'official' | 'surgical' | 'notes' (Bloque 9).
    // El runner es agnóstico al source; solo lo propaga a TrainingResult y usa
    // examTitle para el subtítulo del header.
    source = 'generator',
    timedMode = true,
    secondsPerQuestion = 60,
    examTitle = 'Examen oficial 2021',
    challengeId = null,
    clanId = null,
  } = route?.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [answers, setAnswers] = useState([]);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [toast, setToast] = useState(null);
  const [showHintSheet, setShowHintSheet] = useState(false);
  const [showLawSheet, setShowLawSheet] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [isReported, setIsReported] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [hintText, setHintText] = useState('');
  const [isHintLoading, setIsHintLoading] = useState(false);

  const timerRef = useRef(null);
  const feedbackAnim = useRef(new Animated.Value(0)).current;
  const timerPulseAnim = useRef(new Animated.Value(1)).current;
  const pulseRef = useRef(null);

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  useEffect(() => {
    setTimeLeft(secondsPerQuestion);
  }, [currentIndex, secondsPerQuestion]);

  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  useEffect(() => {
    if (!timedMode || isSubmitted || isPaused) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [currentIndex, isSubmitted, timedMode, isPaused]);

  useEffect(() => {
    const shouldPulse = timedMode && !isSubmitted && timeLeft <= TIMER_DANGER && timeLeft > 0;
    if (shouldPulse) {
      if (!pulseRef.current) {
        pulseRef.current = Animated.loop(
          Animated.sequence([
            Animated.timing(timerPulseAnim, { toValue: 1.06, duration: 450, useNativeDriver: true }),
            Animated.timing(timerPulseAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
          ])
        );
        pulseRef.current.start();
      }
    } else {
      if (pulseRef.current) {
        pulseRef.current.stop();
        pulseRef.current = null;
      }
      timerPulseAnim.setValue(1);
    }
  }, [timeLeft, isSubmitted, timedMode]);

  useEffect(() => {
    if (!timedMode) return;
    if (timeLeft === TIMER_WARNING) {
      AccessibilityInfo.announceForAccessibility(`Atención: quedan ${TIMER_WARNING} segundos.`);
    } else if (timeLeft === TIMER_DANGER) {
      AccessibilityInfo.announceForAccessibility(`¡Urgente! Quedan ${TIMER_DANGER} segundos.`);
    }
  }, [timeLeft, timedMode]);

  const animateFeedback = useCallback(() => {
    feedbackAnim.setValue(0);
    Animated.spring(feedbackAnim, {
      toValue: 1,
      tension: 80,
      friction: 8,
      useNativeDriver: true,
    }).start();
  }, [feedbackAnim]);

  const handleTimeout = useCallback(() => {
    setAnswers(prev => [...prev, { questionId: question?.id, selected: null, isCorrect: false }]);
    setShowTimeUpModal(true);
  }, [question]);

  const handleSelectOption = (id) => {
    if (isSubmitted) return;
    Vibration.vibrate(10);
    setSelectedOption(id);
  };

  const handleConfirm = () => {
    if (!selectedOption) return;
    clearInterval(timerRef.current);
    const selected = question.options.find(o => o.id === selectedOption);
    const isCorrect = selected?.correct ?? false;
    if (!isCorrect) Vibration.vibrate(80);
    setIsSubmitted(true);
    setAnswers(prev => [...prev, { questionId: question.id, selected: selectedOption, isCorrect }]);
    animateFeedback();
  };

  const handleNext = () => {
    const isLast = currentIndex + 1 >= total;
    if (isLast) {
      navigation.replace('TrainingResult', { source, answers, questions, elapsedSeconds, challengeId, clanId });
      return;
    }
    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsBookmarked(false);
    setIsReported(false);
    feedbackAnim.setValue(0);
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  if (!question) return null;

  const isCorrectAnswer =
    isSubmitted && question.options.find(o => o.id === selectedOption)?.correct === true;
  const isTimeOut = isSubmitted && selectedOption === null;
  const isLastQuestion = currentIndex + 1 >= total;
  const hintsRemaining = MAX_HINTS - hintsUsed;
  const isHintDisabled = isSubmitted || hintsRemaining <= 0;

  // Cuando el usuario ha respondido, se ocultan las opciones incorrectas no elegidas.
  // Correcta se muestra en verde, elegida (si fue mal) en rojo — mockup.
  const visibleOptions = question.options.filter((opt) => {
    if (!isSubmitted) return true;
    if (opt.correct) return true;
    if (opt.id === selectedOption) return true;
    return false;
  });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* ── HEADER BLANCO ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => setShowAbandonModal(true)}
          accessibilityLabel="Salir de la sesión"
        >
          <Ionicons name="chevron-back" size={20} color={colors.dark} />
        </TouchableOpacity>

        <View style={styles.topHeaderTexts}>
          <Text style={styles.topHeaderTitle}>Zona de entrenamiento</Text>
          {examTitle ? (
            <Text style={styles.topHeaderSub}>{examTitle}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={styles.circleBtn}
          onPress={() => { setIsPaused(true); setShowPauseModal(true); }}
          accessibilityLabel="Pausar sesión"
        >
          <Ionicons name="pause" size={18} color={colors.dark} />
        </TouchableOpacity>
      </View>

      {/* ── BARRA NAVY DE PROGRESO ── */}
      <View style={styles.progressBar}>
        <View style={styles.progressRow}>
          <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            disabled={currentIndex === 0}
            onPress={() => {
              if (currentIndex > 0) {
                setCurrentIndex(prev => prev - 1);
                setSelectedOption(null);
                setIsSubmitted(false);
                feedbackAnim.setValue(0);
              }
            }}
          >
            <Ionicons
              name="chevron-back"
              size={18}
              color={currentIndex === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.85)'}
            />
          </TouchableOpacity>

          <Text style={styles.progressLabel}>Pregunta {currentIndex + 1} de {total}</Text>

          <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.25)" />
        </View>

        <View style={styles.progressTrackRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          {timedMode && (
            <TouchableOpacity
              activeOpacity={0.7}
              onLongPress={() => {
                // Dev: long-press en el timer fuerza el "tiempo agotado" para poder
                // ver el TimeUpModal sin tener que esperar los 60 s reales.
                setTimeLeft(0);
                clearInterval(timerRef.current);
                handleTimeout();
              }}
              delayLongPress={600}
            >
              <Animated.View
                style={[styles.timerArea, { transform: [{ scale: timerPulseAnim }] }]}
              >
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={timeLeft <= TIMER_DANGER ? colors.error : '#FFFFFF'}
                />
                <Text style={[
                  styles.timerText,
                  timeLeft <= TIMER_DANGER && { color: colors.error },
                ]}>
                  {formatTime(timeLeft)}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── CONTENIDO ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.questionText}>{question.title}</Text>

        <View style={styles.optionsList}>
          {visibleOptions.map(option => {
            const isSelected = selectedOption === option.id;
            let bg = colors.card;
            let border = '#E4E8F0';
            let borderW = 1.5;
            let textColor = colors.dark;

            if (!isSubmitted) {
              if (isSelected) {
                border = colors.purple;
                borderW = 2;
              }
            } else if (option.correct) {
              bg = '#DCFCE7';
              border = colors.success;
              borderW = 1.5;
            } else if (isSelected) {
              bg = '#FCA5A5';
              border = colors.error;
              borderW = 1.5;
            }

            return (
              <TouchableOpacity
                key={option.id}
                onPress={() => handleSelectOption(option.id)}
                disabled={isSubmitted}
                activeOpacity={0.75}
                style={[
                  styles.optionCard,
                  { backgroundColor: bg, borderColor: border, borderWidth: borderW },
                ]}
                accessibilityLabel={`Opción ${option.id}: ${option.text}`}
              >
                <Text style={[styles.optionLetter, { color: textColor }]}>{option.id}.</Text>
                <Text style={[styles.optionText, { color: textColor }]}>{option.text}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── FEEDBACK ── */}
        {isSubmitted && (
          <Animated.View
            style={[
              styles.feedbackCard,
              isCorrectAnswer ? styles.feedbackCardOk : styles.feedbackCardErr,
              {
                opacity: feedbackAnim,
                transform: [{
                  translateY: feedbackAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                }],
              },
            ]}
          >
            <View style={styles.feedbackHeader}>
              {isCorrectAnswer ? (
                <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              ) : (
                <Ionicons name="close-circle" size={22} color={colors.error} />
              )}
              <Text style={[
                styles.feedbackTitle,
                { color: isCorrectAnswer ? colors.success : colors.error },
              ]}>
                {isTimeOut ? 'Tiempo agotado' : isCorrectAnswer ? '¡Correcto!' : 'Incorrecto'}
              </Text>
            </View>

            <Text style={styles.feedbackBody}>
              {isCorrectAnswer ? question.explanation : question.explanationWrong}
            </Text>

            {!isCorrectAnswer && !isTimeOut && (
              <Text style={styles.errorLabLink}>
                + Esta pregunta irá a tu Laboratorio de Errores
              </Text>
            )}
          </Animated.View>
        )}

        <View style={{ height: spacing.md }} />

        {/* ── CTA PRINCIPAL ── */}
        {!isSubmitted ? (
          <TouchableOpacity
            style={[styles.mainBtn, !selectedOption && styles.mainBtnDisabled]}
            onPress={handleConfirm}
            disabled={!selectedOption}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>Confirmar respuesta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleNext}
            activeOpacity={0.85}
          >
            <Text style={styles.mainBtnText}>
              {isLastQuestion ? 'Ver resultados' : 'Siguiente pregunta'}
            </Text>
          </TouchableOpacity>
        )}

        {/* ── TOOLBAR INFERIOR ── */}
        <View style={styles.toolbar}>
          <View style={styles.difficultyBlock}>
            {[1, 2, 3, 4, 5].map(i => (
              <Ionicons
                key={i}
                name={i <= (question.difficulty ?? 3) ? 'star' : 'star-outline'}
                size={13}
                color={i <= (question.difficulty ?? 3) ? colors.primary : '#D4DAE6'}
              />
            ))}
            <Text style={styles.difficultyLabel}>Evalúa esta pregunta</Text>
          </View>

          <View style={styles.toolsRow}>
            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => setShowReportModal(true)}
              accessibilityLabel="Reportar pregunta"
            >
              <Ionicons name="warning-outline" size={22} color={isReported ? colors.error : colors.dark} />
              <Text style={[styles.toolLabel, isReported && { color: colors.error }]}>
                {isReported ? 'Reportado' : 'Reportar'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => {
                const next = !isBookmarked;
                setIsBookmarked(next);
                setToast({
                  message: next ? 'Pregunta guardada' : 'Guardado eliminado',
                  type: 'success',
                });
              }}
              accessibilityLabel={isBookmarked ? 'Quitar de guardados' : 'Guardar pregunta'}
            >
              <Ionicons
                name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isBookmarked ? colors.primary : colors.dark}
              />
              <Text style={[styles.toolLabel, isBookmarked && { color: colors.primary }]}>
                Guardar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.toolItem, isHintDisabled && styles.toolItemDisabled]}
              onPress={async () => {
                if (isHintDisabled) return;
                setHintsUsed(prev => prev + 1);
                setHintText('');
                setIsHintLoading(true);
                setShowHintSheet(true);
                try {
                  const res = await trainingApi.generateHint({
                    questionId: question.id,
                    questionText: question.title,
                    options: question.options.map(o => o.text),
                    topicId: question.topicId ?? 'all',
                    topic: question.law ?? 'Derecho Administrativo',
                    oposicion: route?.params?.oposicion ?? 'justicia-tramitacion',
                  });
                  setHintText(res?.data?.hint ?? '');
                } catch (_err) {
                  setHintText('No se pudo obtener la pista. Inténtalo de nuevo.');
                } finally {
                  setIsHintLoading(false);
                }
              }}
              accessibilityLabel={
                isSubmitted ? 'Pista no disponible tras responder' :
                hintsRemaining <= 0 ? 'Has agotado las pistas' :
                `Pedir pista a la IA — ${hintsRemaining} restantes`
              }
            >
              <Ionicons
                name="bulb-outline"
                size={22}
                color={isHintDisabled ? '#D4DAE6' : colors.primary}
              />
              <Text style={[
                styles.toolLabel,
                { color: isHintDisabled ? '#D4DAE6' : colors.primary, fontWeight: '700' },
              ]}>
                Pista IA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.toolItem}
              onPress={() => setShowLawSheet(true)}
              accessibilityLabel="Ver ley relacionada"
            >
              <Ionicons name="library-outline" size={22} color={colors.dark} />
              <Text style={styles.toolLabel}>Ley</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* ── MODALES ── */}
      <AbandonTestModal
        visible={showAbandonModal}
        currentIndex={currentIndex}
        total={total}
        onStay={() => setShowAbandonModal(false)}
        onConfirmExit={() => {
          setShowAbandonModal(false);
          navigation.goBack();
        }}
      />

      <TimeUpModal
        visible={showTimeUpModal}
        onContinue={() => {
          setShowTimeUpModal(false);
          navigation.replace('TrainingResult', { source, answers, questions, elapsedSeconds, challengeId, clanId });
        }}
      />

      <ReportQuestionModal
        visible={showReportModal}
        questionId={question?.id}
        onClose={() => setShowReportModal(false)}
        onSendReport={() => {
          setIsReported(true);
          setToast({ message: 'Enviado. Gracias por reportarlo.', type: 'info' });
        }}
      />

      <LawReferenceBottomSheet
        visible={showLawSheet}
        law={question?.law}
        article={question?.articleRef?.article}
        articleTitle={question?.articleRef?.title}
        articleText={question?.articleRef?.text}
        boeUrl={question?.articleRef?.boeUrl}
        onClose={() => setShowLawSheet(false)}
      />

      <HintBottomSheet
        visible={showHintSheet}
        questionSummary={question?.title}
        hint={hintText}
        isLoading={isHintLoading}
        onClose={() => setShowHintSheet(false)}
      />

      <PauseSessionModal
        visible={showPauseModal}
        currentIndex={currentIndex}
        total={total}
        correctAnswers={answers.filter(a => a.isCorrect).length}
        elapsedSeconds={elapsedSeconds}
        onResume={() => {
          setShowPauseModal(false);
          setIsPaused(false);
        }}
        onExitAndSave={() => {
          setShowPauseModal(false);
          setIsPaused(false);
          navigation.goBack();
        }}
      />

      <ToastNotification
        visible={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.card,
  },

  // ── Header blanco superior ─────────────
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
  },
  circleBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F3F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleBtnRight: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topHeaderTexts: {
    flex: 1,
    alignItems: 'center',
  },
  topHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  topHeaderSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // ── Barra navy de progreso ─────────────
  progressBar: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: colors.white,
    fontWeight: '700',
  },
  progressTrackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressTrack: {
    flex: 1,
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  timerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },

  // ── Scroll ─────────────────────────────
  scroll: { flex: 1, backgroundColor: colors.card },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },

  // ── Enunciado ──────────────────────────
  questionText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
    color: colors.dark,
    marginBottom: spacing.md,
    marginTop: 4,
  },

  // ── Opciones ───────────────────────────
  optionsList: {
    gap: 8,
    marginBottom: spacing.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  optionLetter: {
    fontSize: 13,
    fontWeight: '800',
    width: 18,
    lineHeight: 18,
  },
  optionText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },

  // ── Feedback card ──────────────────────
  feedbackCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  feedbackCardOk: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.success,
  },
  feedbackCardErr: {
    backgroundColor: '#FEF2F2',
    borderColor: colors.error,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  feedbackTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  feedbackBody: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.dark,
  },
  errorLabLink: {
    fontSize: 12,
    color: colors.error,
    fontWeight: '600',
    marginTop: 8,
  },

  // ── Botón principal ────────────────────
  mainBtn: {
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  mainBtnDisabled: {
    backgroundColor: '#A7A9AD',
  },
  mainBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // ── Toolbar inferior ───────────────────
  toolbar: {
    marginTop: spacing.md,
  },
  difficultyBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 6,
  },
  difficultyLabel: {
    fontSize: 10,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  toolsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 6,
  },
  toolItem: {
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 4,
    paddingVertical: 6,
    minWidth: 60,
  },
  toolItemDisabled: {
    opacity: 0.4,
  },
  toolLabel: {
    fontSize: 10,
    color: colors.dark,
    fontWeight: '600',
  },
});
