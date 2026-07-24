import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Svg, Circle, Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';

const MOCK_DATA = {
  answers: [
    { questionId: 'q1', selected: 'A', isCorrect: true },
    { questionId: 'q2', selected: 'C', isCorrect: false },
  ],
  questions: [{ id: 'q1' }, { id: 'q2' }],
  source: 'generator',
  elapsedSeconds: 142,
};

// ── Gráfico donut ─────────────────────────────────────────────
const DONUT_SIZE = 140;
const STROKE_WIDTH = 12;

function DonutChart({ percentage }) {
  const radius = (DONUT_SIZE - STROKE_WIDTH) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const fillColor =
    percentage >= 75 ? colors.success :
    percentage >= 50 ? colors.warning :
    colors.error;

  return (
    <View style={donut.root}>
      <Svg width={DONUT_SIZE} height={DONUT_SIZE}>
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          stroke={colors.separator}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          stroke={fillColor}
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${DONUT_SIZE / 2} ${DONUT_SIZE / 2})`}
        />
      </Svg>
      <View style={donut.label}>
        <Text style={[donut.percentage, { color: fillColor }]}>{percentage}%</Text>
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
    fontSize: 30,
    fontWeight: '800',
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
  const isHighScore = percentage >= 80;
  const needsLab = incorrect > 0;

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  // ── Pantalla de felicitación (≥80%) ──
  if (isHighScore) {
    return (
      <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
        <ScreenHeader title="Test completado" onBack={() => navigation.goBack()} />

        <ScrollView contentContainerStyle={styles.celebrationBody} showsVerticalScrollIndicator={false}>
          {/* Trofeo */}
          <View style={styles.trophyCircle}>
            <Ionicons name="trophy" size={52} color={colors.success} />
          </View>

          <Text style={styles.congrats}>¡FELICIDADES!</Text>
          <Text style={styles.congratsSub}>
            Estás de racha, has superado este test con un{' '}
            <Text style={{ fontWeight: '800', color: colors.success }}>{percentage}%</Text>
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

  // ── Pantalla de resultados con estadísticas (<80%) ──
  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <ScreenHeader title="Test completado" onBack={() => navigation.goBack()} />

      <ScrollView
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
      >
        {/* Donut centrado */}
        <View style={styles.donutRow}>
          <DonutChart percentage={percentage} />
          <Text style={styles.correctCount}>{correct} de {total} correctas</Text>
        </View>

        {/* Stats: 3 columnas */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.success }]}>{correct}</Text>
            <Text style={styles.statLabel}>Aciertos</Text>
          </View>
          <View style={[styles.statBox, styles.statBoxMid]}>
            <Text style={[styles.statValue, { color: colors.error }]}>{incorrect}</Text>
            <Text style={styles.statLabel}>Fallos</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: colors.dark }]}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
        </View>

        {/* Banner morado de fallos */}
        {needsLab && (
          <View style={styles.errorBanner}>
            <Text style={styles.bannerTitle}>{incorrect} fallos detectados</Text>
            <Text style={styles.bannerSub}>Refuérzalos con un test quirúrgico</Text>
          </View>
        )}

        <Text style={styles.whatNow}>¿Qué quieres hacer ahora?</Text>

        {/* CTAs */}
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
            accessibilityLabel={`Ir al Laboratorio de Errores — ${incorrect} fallos`}
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
    backgroundColor: colors.background,
  },

  // ── Celebración ──────────────────────────
  celebrationBody: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  trophyCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
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
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  ghostLink: {
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  ghostLinkText: {
    fontSize: 14,
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
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
    marginTop: spacing.sm,
  },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  statBoxMid: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.separator,
  },
  statValue: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },

  // Banner morado de lab
  errorBanner: {
    backgroundColor: colors.purple,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.lg,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.white,
  },
  bannerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },

  whatNow: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: '500',
  },

  // Botón verde compartido
  primaryBtn: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
