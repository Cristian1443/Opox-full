import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import AppHeader from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Circle, Polygon, Line } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { settingsApi } from '../../api';

// ─── 12.6 · Estadísticas Pro ────────────────────────────────────────────────
// Anillo de probabilidad + radar de soft-skills como en Figma. El gráfico de
// líneas de Figma ("Dominio por ley") venía incompleto; se implementa como
// EVOLUCIÓN del acierto semanal (línea verde) frente a la referencia de
// aprobado al 50% (línea roja), con datos reales de GET /config/pro-stats
// (`weeklyAccuracy`). Sustituye a la lista de barras por tema, que QA veía
// repetitiva — el detalle por tema ya vive en el Laboratorio de errores.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  ringTrack: '#E7E7EA',
  radarGuide: 'rgba(65, 41, 80, 0.15)',
  radarSpoke: 'rgba(65, 41, 80, 0.1)',
};

// Orden de ejes confirmado en Figma
const RADAR_AXES = [
  { key: 'memoria', label: 'Memoria' },
  { key: 'conocimiento', label: 'Conoc.' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'resistencia', label: 'Resistencia' },
  { key: 'concentracion', label: 'Concent.' },
];

// Deriva heurísticas de soft-skills (0-100 por eje) a partir de las stats
// reales del backend — sin equivalente directo en Figma, que solo maqueta
// valores de ejemplo.
function deriveSoftSkills(stats) {
  const {
    accuracyPct = 0,
    studyStreakDays = 0,
    topicsStrong = 0,
    topicBreakdown = [],
    avgSecsPerQuestion = null,
  } = stats;

  const memoria = topicBreakdown.length > 0
    ? Math.round(topicBreakdown.reduce((acc, t) => acc + t.accuracyPct, 0) / topicBreakdown.length)
    : accuracyPct;

  const resistencia = Math.min(Math.round(studyStreakDays * 100 / 30), 100);

  const conocimiento = accuracyPct;

  const concentracion = topicBreakdown.length > 0
    ? Math.round((topicsStrong / topicBreakdown.length) * 100)
    : 0;

  const velocidad = avgSecsPerQuestion != null
    ? Math.max(0, Math.min(100, Math.round(100 - (avgSecsPerQuestion / 90) * 100)))
    : 0;

  return { memoria, conocimiento, velocidad, resistencia, concentracion };
}

// Ruta exacta exportada de Figma (icono "Exportar", 40×54 — flecha + subrayado).
function ExportIcon({ size = 16, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (54 / 40)} viewBox="0 0 40 54" fill="none">
      <Path d="M22.2216 0H17.7784V39.856H22.2216V0Z" fill={color} />
      <Path d="M4.24735 20.8038L20.0029 39.3472L35.7526 20.8038L39.122 23.7128L21.6877 44.2375L20.0029 46.2247L18.3182 44.2375L0.87793 23.7128L4.24735 20.8038Z" fill={color} />
      <Path d="M40 49.5107H0V53.994H40V49.5107Z" fill={color} />
    </Svg>
  );
}

/** Anillo de progreso circular (arco relleno + pista de fondo). */
function ProgressRing({ percentage, size = 180, strokeWidth = 16 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - percentage / 100);
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={radius} stroke={FIGMA.ringTrack} strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={colors.ctaGreen}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        rotation={-90}
        origin={`${size / 2}, ${size / 2}`}
      />
    </Svg>
  );
}

/** Radar/pentágono de soft-skills con los valores reales por eje (0-100). */
function SoftSkillsRadar({ skills, size = 220 }) {
  const center = size / 2;
  const maxRadius = size / 2 - 28;
  const angleStep = (Math.PI * 2) / RADAR_AXES.length;

  const pointAt = (index, fraction) => {
    const angle = -Math.PI / 2 + angleStep * index;
    return {
      x: center + Math.cos(angle) * maxRadius * fraction,
      y: center + Math.sin(angle) * maxRadius * fraction,
    };
  };

  const outline = RADAR_AXES.map((_, index) => pointAt(index, 1));
  const filled = RADAR_AXES.map((axis, index) => pointAt(index, skills[axis.key] / 100));

  return (
    <View style={styles.radarWrap}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {RADAR_AXES.map((_, index) => (
          <Line
            key={index}
            x1={center}
            y1={center}
            x2={pointAt(index, 1).x}
            y2={pointAt(index, 1).y}
            stroke={FIGMA.radarSpoke}
            strokeWidth={1}
          />
        ))}
        <Polygon points={outline.map((p) => `${p.x},${p.y}`).join(' ')} stroke={FIGMA.radarGuide} strokeWidth={1} fill="none" />
        <Polygon points={filled.map((p) => `${p.x},${p.y}`).join(' ')} stroke={colors.ctaGreen} strokeWidth={1.6} fill={`${colors.ctaGreen}26`} />
      </Svg>
      {RADAR_AXES.map((axis, index) => {
        const p = pointAt(index, 1.22);
        return (
          <View key={axis.key} style={[styles.radarAxisLabel, { left: p.x - 30, top: p.y - 10 }]}>
            <Text style={styles.axisText}>{axis.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const PASS_THRESHOLD = 50;
const CHART_HEIGHT = 170;
const CHART_PAD = { left: 30, right: 10, top: 10, bottom: 22 };

function formatWeekLabel(isoDate) {
  const [, m, d] = isoDate.split('-');
  return `${Number(d)}/${Number(m)}`;
}

/** Evolución semanal del acierto vs. referencia de aprobado (50%). */
function EvolutionChart({ points }) {
  const [width, setWidth] = useState(0);
  const plotW = Math.max(0, width - CHART_PAD.left - CHART_PAD.right);
  const plotH = CHART_HEIGHT - CHART_PAD.top - CHART_PAD.bottom;
  const xAt = (i) => CHART_PAD.left + (points.length > 1 ? (i / (points.length - 1)) * plotW : plotW / 2);
  const yAt = (pct) => CHART_PAD.top + (1 - pct / 100) * plotH;

  const withData = points
    .map((p, i) => ({ ...p, i }))
    .filter((p) => p.accuracyPct != null);
  const linePath = withData
    .map((p, k) => `${k === 0 ? 'M' : 'L'}${xAt(p.i)},${yAt(p.accuracyPct)}`)
    .join(' ');

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={CHART_HEIGHT}>
          {[0, 50, 100].map((v) => (
            <Line
              key={v}
              x1={CHART_PAD.left}
              x2={width - CHART_PAD.right}
              y1={yAt(v)}
              y2={yAt(v)}
              stroke={FIGMA.radarSpoke}
              strokeWidth={1}
            />
          ))}
          {/* Referencia de aprobado */}
          <Line
            x1={CHART_PAD.left}
            x2={width - CHART_PAD.right}
            y1={yAt(PASS_THRESHOLD)}
            y2={yAt(PASS_THRESHOLD)}
            stroke={colors.statRed}
            strokeWidth={2}
            strokeDasharray="6 4"
          />
          {/* Acierto semanal */}
          {withData.length > 1 && (
            <Path d={linePath} stroke={colors.ctaGreen} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          )}
          {withData.map((p) => (
            <Circle key={p.weekStart} cx={xAt(p.i)} cy={yAt(p.accuracyPct)} r={4} fill={colors.ctaGreen} />
          ))}
        </Svg>
      )}
      {/* Etiquetas del eje Y */}
      {[100, 50, 0].map((v) => (
        <Text key={v} style={[styles.axisYLabel, { top: yAt(v) - 7 }]}>{v}%</Text>
      ))}
      {/* Etiquetas del eje X — una de cada dos semanas para no amontonar */}
      <View style={[styles.axisXRow, { paddingLeft: CHART_PAD.left, paddingRight: CHART_PAD.right }]}>
        {points.map((p, i) => (
          <Text key={p.weekStart} style={styles.axisXLabel}>
            {(points.length - 1 - i) % 2 === 0 ? formatWeekLabel(p.weekStart) : ''}
          </Text>
        ))}
      </View>
      <View style={styles.legendRow}>
        <View style={[styles.legendSwatch, { backgroundColor: colors.ctaGreen }]} />
        <Text style={styles.legendText}>Tu acierto semanal</Text>
        <View style={[styles.legendSwatch, { backgroundColor: colors.statRed, marginLeft: 16 }]} />
        <Text style={styles.legendText}>Aprobado ({PASS_THRESHOLD}%)</Text>
      </View>
    </View>
  );
}

// Frase bajo el anillo: tendencia real del mes (como en Figma) o, si aún no
// hay datos para comparar, el acierto global.
function trendLine(stats) {
  const d = stats.accuracyDeltaMonth;
  if (d == null) return { text: `${stats.accuracyPct}% de acierto global`, color: FIGMA.textMuted };
  if (d > 0) return { text: `+${d}% este mes · vas por buen camino`, color: colors.ctaGreen };
  if (d < 0) return { text: `${d}% este mes · toca reforzar`, color: colors.statRed };
  return { text: 'Igual que el mes pasado · mantén el ritmo', color: FIGMA.textMuted };
}

export default function ConfigStatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setAuthError(false);
      const res = await settingsApi.getProStats();
      if (!cancelled) {
        if (!res?.error && res?.data) {
          setStats(res.data);
        } else if (res?.error?.status === 401 || res?.error?.status === 403) {
          setAuthError(true);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []));

  const handleExport = () => navigation.navigate('ConfigExport');

  const softSkills = stats ? deriveSoftSkills(stats) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <AppHeader
        title="Estadísticas Pro"
        onBack={() => navigation.goBack()}
        right={(
          <TouchableOpacity
            style={styles.headerAction}
            activeOpacity={0.7}
            onPress={handleExport}
            accessibilityLabel="Exportar informe PDF"
          >
            <ExportIcon />
          </TouchableOpacity>
        )}
      />

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.ctaGreen} />
          <Text style={styles.loadingText}>Calculando estadísticas…</Text>
        </View>
      ) : authError ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={FIGMA.ringTrack} />
          <Text style={styles.loadingText}>Inicia sesión de nuevo para ver tus estadísticas.</Text>
        </View>
      ) : !stats ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="bar-chart-outline" size={48} color={FIGMA.ringTrack} />
          <Text style={styles.loadingText}>Completa algunos tests para ver tus estadísticas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Probabilidad de aprobado ─────────────────────────────────── */}
          <Text style={styles.sectionLabel}>PROBABILIDAD DE APROBADO</Text>
          <View style={styles.ringWrap}>
            <ProgressRing percentage={stats.passedProbabilityPct} />
            <View style={styles.ringCenterLabel}>
              <Text style={styles.ringPercentage}>{stats.passedProbabilityPct}%</Text>
            </View>
          </View>
          <Text style={[styles.monthDelta, { color: trendLine(stats).color }]}>
            {trendLine(stats).text}
          </Text>

          {/* ── Soft skills ───────────────────────────────────────────────── */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>SOFT SKILLS</Text>
          <SoftSkillsRadar skills={softSkills} />
          {stats.avgSecsPerQuestion == null && (
            <Text style={styles.radarNote}>
              Completa tests para ver tu velocidad media por pregunta.
            </Text>
          )}

          {/* ── Evolución (gráfico de líneas de Figma, hecho con datos reales) ── */}
          <Text style={[styles.sectionLabel, styles.sectionSpacing]}>EVOLUCIÓN</Text>
          {(stats.weeklyAccuracy ?? []).some((w) => w.accuracyPct != null) ? (
            <EvolutionChart points={stats.weeklyAccuracy} />
          ) : (
            <Text style={styles.radarNote}>
              Completa tests durante varias semanas para ver tu evolución.
            </Text>
          )}

          {/* ── Resumen — temas fuertes / débiles ───────────────────────────── */}
          <View style={[styles.summaryRow, styles.sectionSpacing]}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.ctaGreen }]}>{stats.topicsStrong}</Text>
              <Text style={styles.summaryLabel}>Temas dominados</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: colors.statRed }]}>{stats.topicsWeak}</Text>
              <Text style={styles.summaryLabel}>Temas a reforzar</Text>
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  // Acción del header: ocupa el hueco lateral de 44 de AppHeader.
  headerAction: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Loading / vacío ───────────────────────────────────────────
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: FIGMA.textMuted,
    textAlign: 'center',
  },

  // ── Contenido ─────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: spacing.sm + 4,
  },
  sectionSpacing: {
    marginTop: spacing.xl,
  },

  // ── Probabilidad ──────────────────────────────────────────────
  ringWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringCenterLabel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPercentage: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: colors.textDark,
  },
  monthDelta: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.ctaGreen,
    textAlign: 'center',
    marginTop: 10,
  },

  // ── Soft skills ───────────────────────────────────────────────
  radarWrap: {
    alignSelf: 'center',
    width: 220,
    height: 220,
  },
  radarAxisLabel: {
    position: 'absolute',
    width: 60,
    alignItems: 'center',
  },
  axisText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9.5,
    color: FIGMA.textMuted,
    textAlign: 'center',
  },
  radarNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },

  // ── Evolución ─────────────────────────────────────────────────
  axisYLabel: {
    position: 'absolute',
    left: 0,
    width: 26,
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: FIGMA.textMuted,
    textAlign: 'right',
  },
  axisXRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -CHART_PAD.bottom + 4,
  },
  axisXLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: FIGMA.textMuted,
    minWidth: 24,
    textAlign: 'center',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm + 4,
  },
  legendSwatch: {
    width: 14,
    height: 3,
    borderRadius: 2,
    marginRight: 6,
  },
  legendText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
  },

  // ── Resumen ───────────────────────────────────────────────────
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(65, 41, 80, 0.05)',
  },
  summaryValue: {
    fontFamily: 'Poppins-Bold',
    fontSize: 20,
  },
  summaryLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
});
