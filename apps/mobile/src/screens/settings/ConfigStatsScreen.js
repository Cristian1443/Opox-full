import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// TODO: cargar desde GET /config/pro-stats (training_attempt_responses + training_error_patterns)
const MOCK_STATS = {
  probability: 78,
  trend: '+6%',
  trendLabel: 'este mes · vas por buen camino',
  softSkills: [
    { key: 'memoria', label: 'Memoria', value: 78 },
    { key: 'resistencia', label: 'Resistencia', value: 65 },
    { key: 'velocidad', label: 'Velocidad', value: 82 },
    { key: 'concentracion', label: 'Concentr.', value: 70 },
    { key: 'conocimiento', label: 'Conocim.', value: 85 },
  ],
  laws: [
    { name: 'Constitución', percent: 95 },
    { name: 'Ley 39/2015', percent: 88 },
    { name: 'Ley 40/2015', percent: 72 },
  ],
};

// Posiciones del pentágono para el radar (relativas a un contenedor 200×200)
// Ángulo inicial a las 12h (top center), sentido horario
const PENTAGON = [
  { dx: 0,    dy: -72 },  // top
  { dx: 68,   dy: -22 },  // upper-right
  { dx: 42,   dy: 58 },   // lower-right
  { dx: -42,  dy: 58 },   // lower-left
  { dx: -68,  dy: -22 },  // upper-left
];

// Escala el radio según el valor (0-100) sobre el radio máximo
function scaledPos(index, value) {
  const base = PENTAGON[index];
  const scale = value / 100;
  return { x: 100 + base.dx * scale, y: 100 + base.dy * scale };
}

// Barra de progreso por ley como sub-componente para evitar estilos función
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

// Cabecera de sección con icono (inválido poner Ionicons dentro de Text en RN)
function SectionHeader({ icon, iconColor, title }) {
  return (
    <View style={styles.sectionHeader}>
      <Ionicons name={icon} size={18} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

export default function ConfigStatsScreen({ navigation }) {
  const stats = MOCK_STATS;

  const handleExport = () => {
    navigation.navigate('ConfigExport');
  };

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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* PROBABILIDAD DE APROBADO */}
        <View style={styles.card}>
          <SectionHeader icon="trending-up-outline" iconColor={colors.success} title="Probabilidad de Aprobado" />
          <View style={styles.probCenter}>
            <Text style={styles.probValue}>{stats.probability}%</Text>
            <Text style={styles.probLabel}>NIVEL DE CONFIANZA</Text>
            <View style={styles.trendBadge}>
              <Ionicons name="arrow-up" size={13} color={colors.success} />
              <Text style={styles.trendText}>
                {stats.trend} {stats.trendLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* SOFT SKILLS — Radar visual aproximado */}
        <View style={styles.card}>
          <SectionHeader icon="stats-chart-outline" iconColor="#3B82F6" title="Soft Skills" />
          <View style={styles.radarContainer}>
            {/* Círculos de referencia */}
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

            {/* Labels de skills posicionadas en pentágono */}
            {stats.softSkills.map((skill, idx) => {
              const pos = scaledPos(idx, 100); // label siempre en borde exterior
              return (
                <View
                  key={skill.key}
                  style={[styles.radarLabel, { left: pos.x - 26, top: pos.y - 16 }]}
                >
                  <Text style={styles.radarLabelText}>{skill.label}</Text>
                  <Text style={styles.radarLabelValue}>{skill.value}</Text>
                </View>
              );
            })}

            {/* Polígono de datos aproximado — círculo interior coloreado escalado al promedio */}
            <View style={[styles.radarData, {
              width: 160 * (stats.softSkills.reduce((a, s) => a + s.value, 0) / stats.softSkills.length / 100),
              height: 160 * (stats.softSkills.reduce((a, s) => a + s.value, 0) / stats.softSkills.length / 100),
            }]} />
          </View>
          <Text style={styles.radarNote}>Evolución de tus habilidades blandas</Text>
        </View>

        {/* DOMINIO POR LEY */}
        <View style={styles.card}>
          <SectionHeader icon="book-outline" iconColor="#F59E0B" title="Dominio por Ley" />
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
        </View>

      </ScrollView>
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
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginTop: 12,
  },
  trendText: { fontSize: 12, fontWeight: '600', color: colors.success },

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
});
