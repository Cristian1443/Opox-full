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
import * as Haptics from 'expo-haptics';
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
    difficulty: 3,
    law: 'Ley 39/2015',
    title: 'Según la Ley 39/2015, ¿cuál es el plazo máximo para resolver y notificar en los procedimientos administrativos?',
    options: [
      { id: 'A', text: 'Tres meses, salvo norma con rango de ley.', correct: true },
      { id: 'B', text: 'Seis meses, en todo caso.', correct: false },
      { id: 'C', text: 'Un mes, si no se requiere prueba.', correct: false },
      { id: 'D', text: 'Un año, para procedimientos complejos.', correct: false },
    ],
    explanation:
      'El plazo general son 3 meses (art. 21.2). Solo se amplía si una norma con rango de ley fija otro distinto.',
    explanationWrong:
      'La correcta es la A. El plazo general (3 meses) no debe confundirse con el límite máximo ni con plazos especiales.',
    articleRef: {
      article: 'Artículo 21',
      title: 'Obligación de resolver',
      text: '"La Administración está obligada a dictar resolución expresa y a notificarla en todos los procedimientos cualquiera que sea su forma de iniciación. El plazo máximo en el que debe notificarse la resolución expresa será el fijado por la norma reguladora del correspondiente procedimiento. Este plazo no podrá exceder de seis meses salvo que una norma con rango de Ley establezca uno mayor…"',
      boeUrl: 'https://www.boe.es/buscar/act.php?id=BOE-A-2015-10565',
    },
  },
  {
    id: 'q2',
    difficulty: 4,
    law: 'Ley 40/2015',
    title: '¿Cuál de los siguientes principios NO recoge expresamente la Ley 40/2015 de Régimen Jurídico del Sector Público?',
    options: [
      { id: 'A', text: 'Principio de eficacia.', correct: false },
      { id: 'B', text: 'Principio de transparencia.', correct: false },
      { id: 'C', text: 'Principio de proporcionalidad.', correct: false },
      { id: 'D', text: 'Principio de beneficio máximo.', correct: true },
    ],
    explanation:
      '"Beneficio máximo" no es un principio recogido en la Ley 40/2015. Los demás sí figuran en su artículo 3.',
    explanationWrong:
      'La correcta es la D. "Beneficio máximo" no existe en la Ley 40/2015. Eficacia, transparencia y proporcionalidad sí están en el art. 3.',
  },
];

// Umbrales de tiempo (segundos)
const TIMER_WARNING = 30;
const TIMER_DANGER = 10;
const MAX_HINTS = 3;

export default function QuestionActiveScreen({ navigation, route }) {
  const {
    questions = MOCK_QUESTIONS,
    startIndex = 0,
    source = 'generator',
    timedMode = false,
    secondsPerQuestion = 60,
    examTitle = null,
  } = route?.params ?? {};

  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(secondsPerQuestion);
  const [answers, setAnswers] = useState([]);
  const [showAbandonModal, setShowAbandonModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [toast, setToast] = useState(null); // { message, type } | null
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
  const selectAnim = useRef(new Animated.Value(1)).current;

  const question = questions[currentIndex];
  const total = questions.length;
  const progress = total > 0 ? (currentIndex + 1) / total : 0;

  // Reinicia el timer cada vez que cambia la pregunta
  useEffect(() => {
    setTimeLeft(secondsPerQuestion);
  }, [currentIndex, secondsPerQuestion]);

  // Contador ascendente de tiempo de sesión — se pausa con isPaused
  useEffect(() => {
    if (isPaused) return;
    const id = setInterval(() => setElapsedSeconds(prev => prev + 1), 1000);
    return () => clearInterval(id);
  }, [isPaused]);

  // Countdown
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

  // Pulso del timerPill en los últimos TIMER_DANGER segundos
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

  // Anuncia al lector de pantalla en umbrales críticos del timer
  useEffect(() => {
    if (!timedMode) return;
    if (timeLeft === TIMER_WARNING) {
      AccessibilityInfo.announceForAccessibility(`Atención: quedan ${TIMER_WARNING} segundos.`);
    } else if (timeLeft === TIMER_DANGER) {
      AccessibilityInfo.announceForAccessibility(`¡Urgente! Quedan ${TIMER_DANGER} segundos.`);
    }
  }, [timeLeft, timedMode]);

  // Micro-animación de escala al seleccionar opción (0.97 → 1.0)
  useEffect(() => {
    if (!selectedOption) return;
    selectAnim.setValue(0.97);
    Animated.spring(selectAnim, {
      toValue: 1,
      tension: 200,
      friction: 10,
      useNativeDriver: true,
    }).start();
  }, [selectedOption]);

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
    // En timedMode el tiempo agotado cierra toda la sesión — registra la pregunta
    // actual como no respondida y muestra el modal de tiempo agotado.
    setAnswers(prev => [...prev, { questionId: question?.id, selected: null, isCorrect: false }]);
    setShowTimeUpModal(true);
  }, [question]);

  const handleSelectOption = (id) => {
    if (isSubmitted) return;
    Haptics.selectionAsync();
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
      navigation.replace('TrainingResult', { source, answers, questions, elapsedSeconds });
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setIsSubmitted(false);
    setIsBookmarked(false);
    setIsReported(false);
    feedbackAnim.setValue(0);
  };

  // --- Helpers de estilo ---

  const getTimerColor = () => {
    if (timeLeft <= TIMER_DANGER) return colors.error;
    if (timeLeft <= TIMER_WARNING) return colors.warning;
    return colors.primary;  // naranja visible sobre fondo navy
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  const getOptionStyle = (option) => {
    if (!isSubmitted) {
      if (selectedOption === option.id) {
        return { bg: colors.purpleBg, border: colors.purple, bw: 2, textColor: colors.dark };
      }
      return { bg: colors.card, border: colors.separator, bw: 1, textColor: colors.text };
    }
    if (option.correct) {
      return { bg: colors.successBg, border: colors.success, bw: 2, textColor: colors.success };
    }
    if (selectedOption === option.id) {
      return { bg: colors.errorBg, border: colors.error, bw: 2, textColor: colors.error };
    }
    return { bg: colors.card, border: colors.separator, bw: 1, textColor: colors.grayText };
  };

  const getOptionIcon = (option) => {
    if (!isSubmitted) return null;
    if (option.correct) {
      return <Ionicons name="checkmark-circle" size={20} color={colors.success} />;
    }
    if (selectedOption === option.id) {
      return <Ionicons name="close-circle" size={20} color={colors.error} />;
    }
    return null;
  };

  if (!question) return null;

  const isCorrectAnswer =
    isSubmitted && question.options.find(o => o.id === selectedOption)?.correct === true;
  const isTimeOut = isSubmitted && selectedOption === null;
  const isLastQuestion = currentIndex + 1 >= total;
  const hintsRemaining = MAX_HINTS - hintsUsed;
  const isHintDisabled = isSubmitted || hintsRemaining <= 0;

  return (
    <SafeAreaView style={styles.root} edges={['top', 'left', 'right']}>

      {/* ── HEADER ── */}
      <View style={styles.header}>
        {/* Fila 0: título de sesión centrado */}
        <View style={styles.headerRow0}>
          <Text style={styles.headerSessionTitle}>Zona de entrenamiento</Text>
          {examTitle && <Text style={styles.headerSessionSub}>{examTitle}</Text>}
        </View>

        {/* Fila 1: back · barra de progreso · pausa · timer */}
        <View style={styles.headerRow1}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => setShowAbandonModal(true)}
            accessibilityLabel="Salir de la sesión"
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="chevron-back" size={22} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>

          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>

          <View style={styles.headerControls}>
            <TouchableOpacity
              style={styles.pauseBtn}
              onPress={() => { setIsPaused(true); setShowPauseModal(true); }}
              accessibilityLabel="Pausar sesión"
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pause" size={15} color="rgba(255,255,255,0.75)" />
            </TouchableOpacity>

            {timedMode && (
              <Animated.View
                style={[styles.timerArea, { transform: [{ scale: timerPulseAnim }] }]}
                accessible
                accessibilityLabel={`Tiempo restante: ${formatTime(timeLeft)}`}
                accessibilityLiveRegion="polite"
              >
                <Ionicons name="time-outline" size={13} color={getTimerColor()} />
                <Text style={[styles.timerText, { color: getTimerColor() }]}>
                  {formatTime(timeLeft)}
                </Text>
              </Animated.View>
            )}
          </View>
        </View>

        {/* Fila 2: número de pregunta con navegación */}
        <View style={styles.headerRow2}>
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
            <Ionicons name="chevron-back" size={16} color={currentIndex === 0 ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.70)'} />
          </TouchableOpacity>
          <Text style={styles.questionCounter}>Pregunta {currentIndex + 1} de {total}</Text>
          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.25)" />
        </View>
      </View>

      {/* ── CONTENIDO SCROLLABLE ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Enunciado */}
        <Text style={styles.questionText}>{question.title}</Text>

        {/* Opciones A–D */}
        <View style={styles.optionsList}>
          {question.options.map(option => {
            const s = getOptionStyle(option);
            const icon = getOptionIcon(option);
            const isSelected = selectedOption === option.id;
            return (
              <Animated.View
                key={option.id}
                style={isSelected && !isSubmitted ? { transform: [{ scale: selectAnim }] } : undefined}
              >
                <TouchableOpacity
                  onPress={() => handleSelectOption(option.id)}
                  disabled={isSubmitted}
                  activeOpacity={0.75}
                  accessibilityLabel={`Opción ${option.id}: ${option.text}`}
                  style={[
                    styles.optionCard,
                    { backgroundColor: s.bg, borderColor: s.border, borderWidth: s.bw },
                  ]}
                >
                  <View style={styles.optionRow}>
                    <Text style={[styles.optionLetter, { color: s.border }]}>{option.id}</Text>
                    <Text style={[styles.optionText, { color: s.textColor }]}>{option.text}</Text>
                    {icon && <View style={styles.optionIcon}>{icon}</View>}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* ── FEEDBACK (7.4a acierto / 7.4b fallo) ── */}
        {isSubmitted && (
          <Animated.View
            style={[
              styles.feedback,
              {
                borderLeftColor: isCorrectAnswer ? colors.success : colors.error,
                backgroundColor: isCorrectAnswer ? colors.successBg : colors.errorBg,
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
            {/* Encabezado: icono contextual + título (7.4a trofeo / 7.4b error / timeout reloj) */}
            <View style={styles.feedbackHeader}>
              <Ionicons
                name={
                  isTimeOut
                    ? 'time-outline'
                    : isCorrectAnswer
                    ? 'trophy'
                    : 'close-circle'
                }
                size={26}
                color={isCorrectAnswer ? colors.success : colors.error}
              />
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
              <View style={styles.errorLabCard}>
                <Ionicons name="flask" size={16} color={colors.error} />
                <View style={styles.errorLabCardContent}>
                  <Text style={styles.errorLabCardTitle}>
                    Laboratorio de Errores
                  </Text>
                  <Text style={styles.errorLabCardBody}>
                    Esta pregunta se añadirá para que la trabajes después.
                  </Text>
                </View>
              </View>
            )}
          </Animated.View>
        )}

        <View style={{ height: spacing.xl }} />
      </ScrollView>

      {/* ── TOOLBAR INFERIOR ── */}
      <View style={styles.toolbar}>
        {/* Estrellas de dificultad — mock, reemplazar con question.difficulty real */}
        <View style={styles.difficultyBlock}>
          {[1, 2, 3, 4, 5].map(i => (
            <Ionicons
              key={i}
              name={i <= (question.difficulty ?? 3) ? 'star' : 'star-outline'}
              size={15}
              color={i <= (question.difficulty ?? 3) ? '#FFB800' : colors.separator}
            />
          ))}
        </View>

        <View style={styles.toolbarSep} />

        {/* Pista IA — desactivada tras responder o al agotar el límite de pistas */}
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
            hintsRemaining <= 0 ? 'Has agotado las pistas de esta sesión' :
            `Pedir pista a la IA — ${hintsRemaining} restantes`
          }
          accessibilityState={{ disabled: isHintDisabled }}
        >
          <Ionicons
            name="bulb-outline"
            size={22}
            color={isHintDisabled ? colors.separator : colors.warning}
          />
          <Text style={[styles.toolLabel, isHintDisabled && styles.toolLabelDisabled]}>
            Pista IA
          </Text>
          <Text style={[
            styles.toolLabelTiny,
            hintsRemaining === 0 && { color: colors.error },
          ]}>
            {hintsRemaining}/{MAX_HINTS}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => setShowLawSheet(true)}
          accessibilityLabel="Ver artículo de ley relacionado"
        >
          <Ionicons name="library-outline" size={22} color={colors.dark} />
          <Text style={styles.toolLabel}>Ley</Text>
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
            color={isBookmarked ? colors.primary : colors.grayText}
          />
          <Text style={[styles.toolLabel, isBookmarked && styles.toolLabelActive]}>
            Guardar
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toolItem}
          onPress={() => setShowReportModal(true)}
          accessibilityLabel={isReported ? 'Pregunta ya reportada' : 'Reportar un error en esta pregunta'}
        >
          <Ionicons
            name={isReported ? 'flag' : 'flag-outline'}
            size={22}
            color={isReported ? colors.error : colors.grayText}
          />
          <Text style={[styles.toolLabel, isReported && { color: colors.error }]}>
            {isReported ? 'Reportado' : 'Reportar'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── MODAL: ABANDONAR TEST (7.1 alerta) ── */}
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

      {/* ── MODAL: TIEMPO AGOTADO (7.1 alerta) ── */}
      <TimeUpModal
        visible={showTimeUpModal}
        onContinue={() => {
          setShowTimeUpModal(false);
          navigation.replace('TrainingResult', { source, answers, questions, elapsedSeconds });
        }}
      />

      {/* ── MODAL: REPORTAR ERROR (7.5) ── */}
      <ReportQuestionModal
        visible={showReportModal}
        questionId={question?.id}
        onClose={() => setShowReportModal(false)}
        onSendReport={() => {
          setIsReported(true);
          setToast({ message: 'Enviado. Gracias por reportarlo.', type: 'info' });
        }}
      />

      {/* ── BOTTOM SHEET: REFERENCIA LEGISLATIVA (7.3) ── */}
      <LawReferenceBottomSheet
        visible={showLawSheet}
        law={question?.law}
        article={question?.articleRef?.article}
        articleTitle={question?.articleRef?.title}
        articleText={question?.articleRef?.text}
        boeUrl={question?.articleRef?.boeUrl}
        onClose={() => setShowLawSheet(false)}
      />

      {/* ── BOTTOM SHEET: PISTA IA (7.2) ── */}
      <HintBottomSheet
        visible={showHintSheet}
        questionSummary={question?.title}
        hint={hintText}
        isLoading={isHintLoading}
        onClose={() => setShowHintSheet(false)}
      />

      {/* ── MODAL: PAUSA (7.6) ── */}
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
          // mock — reemplazar con saveAttempt() antes de salir
          setShowPauseModal(false);
          setIsPaused(false);
          navigation.goBack();
        }}
      />

      {/* ── TOAST: GUARDADO / REPORTADO (7.1 ok) ── */}
      <ToastNotification
        visible={!!toast}
        message={toast?.message ?? ''}
        type={toast?.type ?? 'success'}
        onClose={() => setToast(null)}
      />

      {/* ── BOTÓN DE ACCIÓN PRINCIPAL ── */}
      <View style={styles.actionArea}>
        {!isSubmitted ? (
          <TouchableOpacity
            style={[styles.mainBtn, !selectedOption && styles.mainBtnDisabled]}
            onPress={handleConfirm}
            disabled={!selectedOption}
            activeOpacity={0.85}
            accessibilityLabel="Confirmar la respuesta seleccionada"
          >
            <Text style={styles.mainBtnText}>Confirmar respuesta</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.mainBtn}
            onPress={handleNext}
            activeOpacity={0.85}
            accessibilityLabel={isLastQuestion ? 'Ver resultados de la sesión' : 'Pasar a la siguiente pregunta'}
          >
            <Text style={styles.mainBtnText}>
              {isLastQuestion ? 'Ver resultados' : 'Siguiente pregunta'}
            </Text>
            <Ionicons
              name={isLastQuestion ? 'trophy-outline' : 'arrow-forward'}
              size={18}
              color={colors.white}
              style={{ marginLeft: spacing.sm }}
            />
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // ── Header (navy oscuro, 3 filas) ──
  header: {
    backgroundColor: colors.dark,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: 10,
  },
  headerRow0: {
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSessionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
  headerSessionSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.55)',
    marginTop: 1,
  },
  headerRow1: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 7,
  },
  backBtn: {
    padding: spacing.xs,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.success,
    borderRadius: 2,
  },
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pauseBtn: {
    padding: spacing.xs,
  },
  timerArea: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timerText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerRow2: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  questionCounter: {
    fontSize: 13,
    color: colors.white,
    fontWeight: '700',
  },

  // ── Scroll ──
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },

  // ── Enunciado ──
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 27,
    color: colors.text,
    marginBottom: spacing.lg,
  },

  // ── Opciones ──
  optionsList: {
    gap: spacing.sm,
  },
  optionCard: {
    borderRadius: 10,
    padding: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionLetter: {
    fontSize: 14,
    fontWeight: '800',
    width: 18,
    flexShrink: 0,
  },
  optionText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
  },
  optionIcon: {
    marginLeft: spacing.xs,
    flexShrink: 0,
  },

  // ── Feedback ──
  feedback: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 10,
    borderLeftWidth: 4,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  feedbackBody: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.text,
  },
  // Tarjeta de Lab de Errores (7.4b) — contrasta con el fondo errorBg del feedback
  errorLabCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.error,
    backgroundColor: colors.card,  // blanco sobre el fondo rojo claro del feedback
  },
  errorLabCardContent: {
    flex: 1,
    gap: 2,
  },
  errorLabCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.error,
  },
  errorLabCardBody: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.textSecondary,
  },

  // ── Toolbar ──
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  difficultyBlock: {
    flexDirection: 'row',
    gap: 2,
    paddingHorizontal: spacing.xs,
  },
  toolbarSep: {
    width: 1,
    height: 22,
    backgroundColor: colors.separator,
    marginHorizontal: spacing.xs,
  },
  toolItem: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  toolLabel: {
    fontSize: 10,
    color: colors.grayText,
  },
  toolLabelActive: {
    color: colors.primary,
  },
  toolLabelTiny: {
    fontSize: 9,
    color: colors.grayText,
    letterSpacing: 0.2,
    fontWeight: '600',
  },
  toolItemDisabled: {
    opacity: 0.38,
  },
  toolLabelDisabled: {
    color: colors.separator,
  },

  // ── Botón principal ──
  actionArea: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    backgroundColor: colors.card,
  },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  mainBtnDisabled: {
    backgroundColor: colors.grayMid,
  },
  mainBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
