import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';
import { trainingApi } from '../../api';

const OPTION_ID_TO_INDEX = { A: 0, B: 1, C: 2, D: 3 };

// Mapea el shape del móvil a SaveAttemptResponseInput del backend.
// La UI trabaja con { questionId, selected: 'A'|'B'|'C'|'D'|null, isCorrect }
// pero el backend necesita el snapshot completo de la pregunta.
function buildResponses(questions, answers) {
  return questions
    .map((q, i) => {
      const answer = answers[i] ?? { selected: null };
      // Sólo aceptamos questionId si es UUID; los MOCK_QUESTIONS tienen "q1"
      // que rompería la validación Zod uuid() del backend.
      const uuidLike = typeof q.id === 'string' && /^[0-9a-f-]{36}$/i.test(q.id);
      return {
        questionId: uuidLike ? q.id : undefined,
        topicId: q.topicId ?? 'all',
        topic: q.law ?? 'General',
        questionText: q.title ?? q.text ?? '',
        optionsSnapshot: (q.options ?? []).map((o) => o.text),
        correctIndex: (q.options ?? []).findIndex((o) => o.correct),
        userAnswerIndex: answer.selected != null ? OPTION_ID_TO_INDEX[answer.selected] : null,
      };
    })
    .filter((r) => r.optionsSnapshot.length === 4 && r.correctIndex >= 0);
}

const MOCK_DATA = {
  answers: [
    { questionId: 'q1', selected: 'A', isCorrect: true },
    { questionId: 'q2', selected: 'C', isCorrect: false },
  ],
  questions: [{ id: 'q1' }, { id: 'q2' }],
  source: 'generator',
  elapsedSeconds: 142,
};

// ── Ilustración trofeo con hojas verdes y cinta (mockup LOGRO) ────────────
function TrophyIllustration() {
  return (
    <Svg width={180} height={160} viewBox="0 0 180 160" fill="none">
      {/* Chispas moradas */}
      <Path d="M30 30 l0 8 M26 34 l8 0" stroke={colors.purple} strokeWidth={2} strokeLinecap="round" />
      <Path d="M150 34 l0 6 M147 37 l6 0" stroke={colors.purple} strokeWidth={2} strokeLinecap="round" />
      <Circle cx={155} cy={80} r={2.5} fill={colors.purple} />
      <Circle cx={25} cy={80} r={2} fill={colors.purple} />

      {/* Hojas verdes atrás */}
      <Path
        d="M50 90 Q30 60 55 45 Q60 65 70 80"
        fill="#86EFAC"
        stroke={colors.success}
        strokeWidth={1.5}
      />
      <Path
        d="M130 90 Q150 60 125 45 Q120 65 110 80"
        fill="#86EFAC"
        stroke={colors.success}
        strokeWidth={1.5}
      />

      {/* Copa del trofeo */}
      <Path
        d="M65 40 Q65 90 90 100 Q115 90 115 40 Z"
        fill="#F5F7FA"
        stroke={colors.dark}
        strokeWidth={2}
      />
      {/* Asas laterales */}
      <Path d="M65 50 Q50 55 55 75" stroke={colors.dark} strokeWidth={2} fill="none" />
      <Path d="M115 50 Q130 55 125 75" stroke={colors.dark} strokeWidth={2} fill="none" />

      {/* Base */}
      <Rect x={80} y={100} width={20} height={14} fill="#F5F7FA" stroke={colors.dark} strokeWidth={2} />
      <Rect x={70} y={114} width={40} height={8} rx={2} fill="#F5F7FA" stroke={colors.dark} strokeWidth={2} />

      {/* Check verde central */}
      <Circle cx={90} cy={65} r={16} fill={colors.success} />
      <Path d="M83 65 l5 5 l10 -10" stroke="#FFFFFF" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />

      {/* Cinta */}
      <Path d="M50 122 h80 v14 h-80 z" fill="#86EFAC" stroke={colors.success} strokeWidth={1.5} />
      <Path d="M50 122 l-8 8 l8 6 z" fill="#22C55E" />
      <Path d="M130 122 l8 8 l-8 6 z" fill="#22C55E" />

      {/* Engranaje pequeño */}
      <Circle cx={105} cy={98} r={5} stroke={colors.textSecondary} strokeWidth={1.3} fill="#FFFFFF" />
    </Svg>
  );
}

// ── Donut morado/verde (mockup LOGRO2) ────────────────────────────────────
const DONUT_SIZE = 160;
const STROKE_WIDTH = 14;

function DonutChart({ percentage }) {
  const radius = (DONUT_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <View style={donut.root}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        {/* Fondo morado (resto que falta) */}
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          stroke={colors.purple}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        {/* Aciertos verdes */}
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          stroke={colors.success}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
        />
      </Svg>
      <View style={donut.label}>
        <Text style={donut.percentage}>{percentage}%</Text>
      </View>
    </View>
  );
}

const donut = StyleSheet.create({
  root: {
    width: DONUT_SIZE,
    height: DONUT_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
  },
  percentage: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -1,
  },
});

// ── Screen ───────────────────────────────────────────────────
export default function TrainingResultScreen({ navigation, route }) {
  const {
    answers = MOCK_DATA.answers,
    questions = MOCK_DATA.questions,
    source = MOCK_DATA.source,
    elapsedSeconds = MOCK_DATA.elapsedSeconds,
  } = route?.params ?? {};

  const total = questions.length;
  const correct = answers.filter(a => a.isCorrect).length;
  const incorrect = total - correct;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
  const isHighScore = percentage >= 90;
  const needsLab = incorrect > 0;

  // Persiste el intento en el backend UNA SOLA VEZ al montar. Sin esto el
  // Laboratorio de Errores no tiene con qué calcular los patrones de fallo.
  const savedRef = useRef(false);
  useEffect(() => {
    if (savedRef.current) return;
    savedRef.current = true;
    const responses = buildResponses(questions, answers);
    if (responses.length === 0) return; // MOCK data, no persistimos
    // 'photo' no es un enum válido del backend — se guarda como 'generator'.
    const backendSource = source === 'photo' ? 'generator' : source;
    trainingApi
      .saveAttempt({
        source: backendSource,
        durationSecs: elapsedSeconds,
        responses,
      })
      .catch((_err) => {
        // No bloqueamos la UI si Supabase falla — el usuario ya ve su resultado.
      });
  }, []);

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Pantalla de felicitación (≥90%) — mockup LOGRO ──
  if (isHighScore) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScreenHeader title="Test completado" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.celebrationBody} showsVerticalScrollIndicator={false}>
          <View style={styles.trophyWrap}>
            <TrophyIllustration />
          </View>

          <Text style={styles.congrats}>¡FELICIDADES!</Text>
          <Text style={styles.congratsSub}>
            Estás de racha, has superado este test con un{' '}
            <Text style={{ fontWeight: '800', color: colors.dark }}>{percentage}%</Text>
            {' '}de aciertos. ¿Qué quieres hacer ahora?
          </Text>

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>¿Vamos a por otro test?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostLink}
            onPress={() => navigation.navigate('Dashboard')}
            activeOpacity={0.7}
          >
            <Text style={styles.ghostLinkText}>Por hoy es suficiente, gracias</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Pantalla de resultados con donut y estadísticas — mockup LOGRO2 ──
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Test completado" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.donutRow}>
          <DonutChart percentage={percentage} />
          <Text style={styles.correctCount}>{correct} de {total} correctas</Text>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>{correct}</Text>
            <Text style={styles.statLabel}>Aciertos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.error }]}>{incorrect}</Text>
            <Text style={styles.statLabel}>Fallos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.dark }]}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        {needsLab && (
          <View style={styles.errorChip}>
            <Text style={styles.chipTitle}>{incorrect} fallos detectados</Text>
            <Text style={styles.chipSub}>¡Refuérzalos con un test quirúrgico!</Text>
          </View>
        )}

        <Text style={styles.whatNow}>¿Qué quieres hacer ahora?</Text>

        {needsLab && (
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => {
              const incorrectQuestions = questions.filter((_, i) =>
                answers[i] && !answers[i].isCorrect
              );
              navigation.navigate('ErrorLab', { incorrectQuestions });
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Ir al laboratorio de errores</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Dashboard')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.card,
  },

  // ── Celebración ──────────────────────────
  celebrationBody: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  trophyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  congrats: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  congratsSub: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  ghostLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ghostLinkText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Resultados ───────────────────────────
  contentPad: {
    padding: spacing.lg,
  },
  donutRow: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  correctCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginTop: spacing.sm,
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  statBox: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    fontWeight: '600',
  },

  errorChip: {
    backgroundColor: colors.purple,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  chipTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.white,
  },
  chipSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },

  whatNow: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: '500',
  },

  primaryBtn: {
    backgroundColor: colors.success,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
