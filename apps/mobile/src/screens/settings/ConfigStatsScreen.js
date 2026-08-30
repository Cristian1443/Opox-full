import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme';
import { settingsApi } from '../../api';

// Posiciones del pentágono para el radar (relativas a un contenedor 200×200)
// Ángulo inicial a las 12h (top center), sentido horario
const PENTAGON = [
  { dx: 0,    dy: -72 },  // top
  { dx: 68,   dy: -22 },  // upper-right
  { dx: 42,   dy: 58 },   // lower-right
  { dx: -42,  dy: 58 },   // lower-left
  { dx: -68,  dy: -22 },  // upper-left
];

function scaledPos(index, value) {
  const base = PENTAGON[index];
  const scale = value / 100;
  return { x: 100 + base.dx * scale, y: 100 + base.dy * scale };
}

// Deriva heurísticas de soft-skills a partir de las stats reales disponibles
function deriveSoftSkills(stats) {
  const {
    accuracyPct = 0,
    studyStreakDays = 0,
    topicsAttempted = 0,
    topicsStrong = 0,
    topicBreakdown = [],
  } = stats;

  // Consistencia de memoria: promedio ponderado de accuracy por tema
  const memoriaScore = topicBreakdown.length > 0
    ? Math.round(topicBreakdown.reduce((acc, t) => acc + t.accuracyPct, 0) / topicBreakdown.length)
    : accuracyPct;

  // Resistencia: streak (30 días → 100%)
  const resistenciaScore = Math.min(Math.round(studyStreakDays * 100 / 30), 100);

  // Conocimientos: accuracy global
  const conocimientoScore = accuracyPct;

  // Concentración: % de temas fuertes sobre temas intentados
  const concentracionScore = topicsAttempted > 0
    ? Math.round((topicsStrong / topicsAttempted) * 100)
    : 0;

  // Velocidad: tiempo medio por pregunta (≤30 s → 100%, 90 s → 0%)
  const velocidadScore = stats.avgSecsPerQuestion != null
    ? Math.max(0, Math.min(100, Math.round(100 - (stats.avgSecsPerQuestion / 90) * 100)))
    : 0;

  return [
    { key: 'memoria',       label: 'Memoria',    value: memoriaScore },
    { key: 'resistencia',   label: 'Resistencia', value: resistenciaScore },
    { key: 'conocimiento',  label: 'Conocim.',   value: conocimientoScore },
    { key: 'concentracion', label: 'Concentr.',  value: concentracionScore },
    { key: 'velocidad',     label: 'Velocidad',  value: velocidadScore },
  ];
}

function LawBar({ name, percent, isLast }) {
  const barColor = percent >= 85 ? colors.success : percent >= 65 ? '#3B82F6' : colors.error;
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

function SectionHeader({ icon, iconColor, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function StatPill({ label, value, color }) {
  return (
    <View style={[styles.statPill, { borderColor: color }]}>
      <Text style={[styles.statPillValue, { color }]}>{value}</Text>
      <Text style={styles.statPillLabel}>{label}</Text>
    </View>
  );
}

export default function ConfigStatsScreen({ navigation }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await settingsApi.getProStats();
      if (!cancelled) {
        if (!res?.error && res?.data) {
          setStats(res.data);
        }
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []));

  const handleExport = () => navigation.navigate('ConfigExport');

  const softSkills = stats ? deriveSoftSkills(stats) : [];
  const avgSkill = softSkills.length > 0
    ? softSkills.reduce((a, s) => a + s.value, 0) / softSkills.length
    : 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Estadísticas Pro</Text>
        <TouchableOpacity
          onPress={handleExport}
          activeOpacity={0.7}
          accessibilityLabel="Exportar informe PDF"
          style={styles.exportBtn}
        >
          <Ionicons name="document-text-outline" size={20} color="#3B82F6" />
          <Text style={styles.exportText}>PDF</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Calculando estadísticas…</Text>
        </View>
      ) : !stats ? (
        <View style={styles.loadingContainer}>
          <Ionicons name="bar-chart-outline" size={48} color="#CBD5E1" />
          <Text style={styles.emptyText}>Completa algunos tests para ver tus estadísticas.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* PROBABILIDAD DE APROBADO */}
          <View style={styles.card}>
            <SectionHeader icon="trending-up-outline" iconColor={colors.success} title="Probabilidad de Aprobado" />
            <View style={styles.probCenter}>
              <Text style={styles.probValue}>{stats.passedProbabilityPct}%</Text>
              <Text style={styles.probLabel}>NIVEL DE CONFIANZA</Text>
              <View style={styles.pillRow}>
                <StatPill label="Preguntas" value={stats.totalQuestions} color="#3B82F6" />
                <StatPill label="Acierto" value={`${stats.accuracyPct}%`} color={colors.success} />
                <StatPill label="Racha" value={`${stats.studyStreakDays}d`} color="#F59E0B" />
              </View>
            </View>
          </View>

          {/* SOFT SKILLS — Radar visual */}
          <View style={styles.card}>
            <SectionHeader icon="stats-chart-outline" iconColor="#3B82F6" title="Soft Skills" />
            <View style={styles.radarContainer}>
              {[1, 0.66, 0.33].map((scale) => (
                <View
                  key={scale}
                  style={[styles.radarRing, {
                    width: 160 * scale,
                    height: 160 * scale,
                    borderRadius: 80 * scale,
                    marginLeft: -(160 * scale) / 2,
                    marginTop: -(160 * scale) / 2,
                  }]}
                />
              ))}

              {softSkills.map((skill, idx) => {
                const pos = scaledPos(idx, 100);
                return (
                  <View
                    key={skill.key}
                    style={[styles.radarLabel, { left: pos.x - 26, top: pos.y - 16 }]}
                  >
                    <Text style={styles.radarLabelText}>{skill.label}</Text>
                    <Text style={[
                      styles.radarLabelValue,
                      skill.value === 0 && { color: '#CBD5E1' },
                    ]}>
                      {skill.value > 0 ? skill.value : '—'}
                    </Text>
                  </View>
                );
              })}

              <View style={[styles.radarData, {
                width: 160 * (avgSkill / 100),
                height: 160 * (avgSkill / 100),
              }]} />
            </View>
            {stats.avgSecsPerQuestion == null && (
              <Text style={styles.radarNote}>
                Completa tests para ver tu velocidad media por pregunta
              </Text>
            )}
          </View>

          {/* DOMINIO POR LEY — datos reales del backend */}
          {stats.topicBreakdown.length > 0 && (
            <View style={styles.card}>
              <SectionHeader icon="book-outline" iconColor="#F59E0B" title="Dominio por Ley" />
              <View style={styles.lawList}>
                {stats.topicBreakdown.map((t, idx) => (
                  <LawBar
                    key={t.topicId}
                    name={t.topic || t.topicId}
                    percent={t.accuracyPct}
                    isLast={idx === stats.topicBreakdown.length - 1}
                  />
                ))}
              </View>
            </View>
          )}

          {/* RESUMEN — temas fuertes / débiles */}
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={styles.summaryLabel}>Temas dominados</Text>
              <Text style={[styles.summaryValue, { color: colors.success }]}>{stats.topicsStrong}</Text>
            </View>
            <View style={[styles.summaryItem, styles.summaryItemLast]}>
              <Ionicons name="alert-circle" size={20} color={colors.error} />
              <Text style={styles.summaryLabel}>Temas a reforzar</Text>
              <Text style={[styles.summaryValue, { color: colors.error }]}>{stats.topicsWeak}</Text>
            </View>
          </View>

        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  exportText: { fontSize: 14, fontWeight: '700', color: '#3B82F6' },

  // Loading / empty
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  loadingText: { fontSize: 14, color: '#64748B' },
  emptyText: { fontSize: 15, color: '#64748B', textAlign: 'center', lineHeight: 22 },

  // Scroll
  scroll: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 16 },

  // Cards
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },

  // Cabecera de sección
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#1E293B' },

  // Probabilidad
  probCenter: { alignItems: 'center', paddingVertical: 8 },
  probValue: { fontSize: 52, fontWeight: '800', color: colors.success, lineHeight: 58 },
  probLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 1,
    marginTop: 4,
  },

  // Pills de stats
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  statPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    backgroundColor: '#F8FAFC',
  },
  statPillValue: { fontSize: 16, fontWeight: '800' },
  statPillLabel: { fontSize: 10, fontWeight: '600', color: '#64748B', marginTop: 2 },

  // Radar
  radarContainer: {
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarRing: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  radarData: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderRadius: 80,
    backgroundColor: 'rgba(59,130,246,0.15)',
    marginLeft: -40,
    marginTop: -40,
  },
  radarLabel: { position: 'absolute', alignItems: 'center', width: 52 },
  radarLabelText: { fontSize: 10, fontWeight: '600', color: '#64748B', textAlign: 'center' },
  radarLabelValue: { fontSize: 11, fontWeight: '800', color: '#3B82F6', textAlign: 'center' },
  radarNote: { fontSize: 11, color: '#94A3B8', textAlign: 'center', marginTop: 8 },

  // Leyes
  lawList: { gap: 12 },
  lawItem: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lawItemLast: { borderBottomWidth: 0, paddingBottom: 0 },
  lawHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  lawName: { fontSize: 13, fontWeight: '600', color: '#1E293B' },
  lawPercent: { fontSize: 13, fontWeight: '700' },
  progressBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: '100%', borderRadius: 4 },

  // Resumen
  summaryCard: { padding: 0, overflow: 'hidden' },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  summaryItemLast: { borderBottomWidth: 0 },
  summaryLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: '#1E293B' },
  summaryValue: { fontSize: 18, fontWeight: '800' },
});
