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
import { Svg, Circle } from 'react-native-svg';
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

// Color propio del lab — elemento único en la app
const LAB_COLOR = '#6C47FF';

// ── DonutChart ──────────────────────────────────────────────
const DONUT_SIZE = 160;
const STROKE_WIDTH = 14;

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
        {/* Track semitransparente sobre fondo navy */}
        <Circle
          cx={DONUT_SIZE / 2}
          cy={DONUT_SIZE / 2}
          r={radius}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={STROKE_WIDTH}
          fill="transparent"
        />
        {/* Arco de progreso */}
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
    fontSize: 34,
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
  const needsLab = incorrect > 0;

  const heroLabel =
    percentage >= 80 ? 'Test superado' :
    percentage >= 60 ? 'Test completado' :
    'Necesitas reforzar';

  const formatTime = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>

      {/* ── HERO OSCURO — % + gráfico ── */}
      <View style={styles.hero}>
        <Text style={styles.heroLabel}>{heroLabel}</Text>
        <DonutChart percentage={percentage} />
        <Text style={styles.correctCount}>{correct} de {total} correctas</Text>
      </View>

      {/* ── CONTENIDO CLARO ── */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentPad}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >

        {/* Estadísticas: 3 columnas separadas por línea */}
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

        {/* Banner de fallos si los hay */}
        {needsLab && (
          <View style={styles.errorBanner}>
            <Ionicons name="radio-button-on-outline" size={20} color={LAB_COLOR} />
            <View style={styles.bannerText}>
              <Text style={styles.bannerTitle}>{incorrect} fallos detectados</Text>
              <Text style={styles.bannerSub}>Refuérzalos con un test quirúrgico</Text>
            </View>
          </View>
        )}

        {/* CTA principal */}
        {needsLab ? (
          <TouchableOpacity
            style={styles.labBtn}
            onPress={() => {
              const incorrectQuestions = questions.filter((_, i) =>
                answers[i] && !answers[i].isCorrect
              );
              // mock — reemplazar con navegación real al Lab
              navigation.navigate('ErrorLab', { incorrectQuestions });
            }}
            activeOpacity={0.85}
            accessibilityLabel={`Ir al Laboratorio de Errores — ${incorrect} fallos`}
          >
            <Text style={styles.labBtnText}>Ir al Laboratorio de Errores</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
            accessibilityLabel="Repetir test"
          >
            <Text style={styles.retryBtnText}>¡Repetir test!</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.homeBtn}
          onPress={() => navigation.navigate('Dashboard')}
          activeOpacity={0.75}
          accessibilityLabel="Volver al inicio"
        >
          <Text style={styles.homeBtnText}>Volver al inicio</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.dark,
  },

  // Sección hero (navy)
  hero: {
    backgroundColor: colors.dark,
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl + 10,
    gap: spacing.sm,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.50)',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  correctCount: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.60)',
    fontWeight: '500',
    marginTop: 2,
  },

  // Sección clara (blanca/bg) con esquinas redondeadas arriba
  content: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    marginTop: -26,
  },
  contentPad: {
    padding: spacing.lg,
    paddingTop: spacing.xl,
  },

  // Stats: 3 columnas
  statsRow: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
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
    fontSize: 28,
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

  // Banner de fallos
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(108,71,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(108,71,255,0.18)',
    marginBottom: spacing.lg,
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.dark,
  },
  bannerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Botones CTA
  labBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 5,
  },
  labBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  retryBtn: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  retryBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  homeBtn: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.separator,
  },
  homeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
