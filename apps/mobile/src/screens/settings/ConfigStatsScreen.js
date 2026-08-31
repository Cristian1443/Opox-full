import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Polygon, Line, G } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 12.6 · Estadísticas Pro ────────────────────────────────────────────────
// Fiel al Figma (EstadisticasProScreen.tsx) para el anillo de probabilidad y
// el radar de soft-skills — ambos son mejoras reales de precisión: el radar
// de Figma dibuja el polígono real por eje (el código real solo aproximaba un
// círculo al promedio, con un comentario propio admitiéndolo). "DOMINIO POR
// LEY" NO se reproduce como gráfico de líneas: el propio TSX de referencia
// documenta que 2 líneas no pueden representar sin ambigüedad 3 leyes, y el
// real ya resuelve el mismo dato (dominio por ley) sin esa ambigüedad con
// una barra de progreso exacta por ley — se conserva esa solución más precisa,
// solo reestilizada.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  ringTrack: '#E7E7EA',
  radarGuide: 'rgba(65, 41, 80, 0.15)',
  radarSpoke: 'rgba(65, 41, 80, 0.1)',
};

// TODO: cargar desde GET /config/pro-stats (training_attempt_responses + training_error_patterns)
const MOCK_STATS = {
  probability: 78,
  trend: '+6%',
  trendLabel: 'este mes · vas por buen camino',
  softSkills: {
    memoria: 78,
    conocimiento: 85,
    velocidad: 82,
    resistencia: 65,
    concentracion: 70,
  },
  laws: [
    { name: 'Constitución', percent: 95 },
    { name: 'Ley 39/2015', percent: 88 },
    { name: 'Ley 40/2015', percent: 72 },
  ],
};

// Orden de ejes confirmado en Figma
const RADAR_AXES = [
  { key: 'memoria', label: 'Memoria' },
  { key: 'conocimiento', label: 'Conoc.' },
  { key: 'velocidad', label: 'Velocidad' },
  { key: 'resistencia', label: 'Resistencia' },
  { key: 'concentracion', label: 'Concent.' },
];

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExportIcon({ size = 22, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 15V3M12 3L8 7M12 3L16 7" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M4 15V19C4 20.1 4.9 21 6 21H18C19.1 21 20 20.1 20 19V15" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
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

// Color por umbral de dominio — real, sin equivalente en Figma (no hay forma
// resoluble de derivarlo del gráfico de líneas ambiguo que reemplaza esto).
function lawColor(percent) {
  if (percent >= 85) return colors.ctaGreen;
  if (percent >= 65) return colors.accentOrange;
  return colors.statRed;
}

function LawBar({ name, percent, isLast }) {
  const barColor = lawColor(percent);
  return (
    <View style={[styles.lawItem, isLast && styles.lawItemLast]}>
      <View style={styles.lawHeader}>
        <Text style={styles.lawName}>{name}</Text>
        <Text style={[styles.lawPercent, { color: barColor }]}>{percent}%</Text>
      </View>
      <View style={styles.progressBg}>
        <View style={[styles.progressFill, { width: `${percent}%`, backgroundColor: barColor }]} />
      </View>
    </View>
  );
}

export default function ConfigStatsScreen({ navigation }) {
  const stats = MOCK_STATS;

  const handleExport = () => {
    navigation.navigate('ConfigExport');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas Pro</Text>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={handleExport}
          accessibilityLabel="Exportar informe PDF"
        >
          <ExportIcon />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Probabilidad de aprobado ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PROBABILIDAD DE APROBADO</Text>
        <View style={styles.ringWrap}>
          <ProgressRing percentage={stats.probability} />
          <View style={styles.ringCenterLabel}>
            <Text style={styles.ringPercentage}>{stats.probability}%</Text>
          </View>
        </View>
        <Text style={styles.monthDelta}>{stats.trend} {stats.trendLabel}</Text>

        {/* ── Soft skills ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>SOFT SKILLS</Text>
        <SoftSkillsRadar skills={stats.softSkills} />

        {/* ── Dominio por ley (ver nota arriba) ───────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>DOMINIO POR LEY</Text>
        <View style={styles.lawList}>
          {stats.laws.map((law, idx) => (
            <LawBar
              key={law.name}
              name={law.name}
              percent={law.percent}
              isLast={idx === stats.laws.length - 1}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },

  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
  },

  // ── Contenido ─────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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

  // ── Dominio por ley ───────────────────────────────────────────
  lawList: {
    gap: spacing.md,
  },
  lawItem: {
    paddingBottom: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(65, 41, 80, 0.12)',
  },
  lawItemLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  lawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  lawName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },
  lawPercent: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.ctaGreen,
  },
  progressBg: {
    height: 8,
    backgroundColor: 'rgba(65, 41, 80, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.ctaGreen,
  },
});
