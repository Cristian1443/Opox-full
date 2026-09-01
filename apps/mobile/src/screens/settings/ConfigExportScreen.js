import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Switch, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import ReportSuccessModal from './ReportSuccessModal';
import { settingsApi } from '../../api';

// ─── 12.7 · Exportar informe ────────────────────────────────────────────────
// Fiel al Figma (ExportarInformeScreen.tsx). El flujo real de generación
// (validación de selección vacía, spinner "Generando…", modal de éxito con
// compartir/guardar) es funcionalidad real que Figma no modela — se
// conserva íntegro, solo se reestiliza. ReportSuccessModal aún no tiene
// referencia de Figma propia, se deja sin tocar por ahora.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  segmentBorder: 'rgba(65, 41, 80, 0.3)',
  toggleBorder: 'rgba(65, 41, 80, 0.12)',
};

// TODO: implementar generación real → POST /config/pro-stats/export
// Body: { period, includeProbability, includeSoftSkills, includeHistory, includeEvolution }
// Response: { url: string } → abrir con Linking.openURL o expo-sharing

const PERIOD_OPTIONS = [
  { key: 'mes', label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'todo', label: 'Todo' },
];

const INCLUDE_OPTIONS = [
  { key: 'probability', label: 'Probabilidad de aprobado' },
  { key: 'softSkills', label: 'Radar de soft-skills' },
  { key: 'history', label: 'Historial de tests' },
  { key: 'evolution', label: 'Evolución por temas' },
];

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DownloadIcon({ size = 18, color = colors.white }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3V15M12 15L7 10M12 15L17 10" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M5 19H19" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export default function ConfigExportScreen({ navigation }) {
  const [period, setPeriod] = useState('trimestre');
  const [includes, setIncludes] = useState({
    probability: true,
    softSkills: false,
    history: true,
    evolution: false,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState(null);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.key === period)?.label || period;

  const toggleInclude = (key) => {
    setIncludes((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleGenerate = async () => {
    const anySelected = Object.values(includes).some(Boolean);
    if (!anySelected) {
      Alert.alert('Sin contenido', 'Selecciona al menos una sección para incluir en el informe.');
      return;
    }

    setIsGenerating(true);
    try {
      const periodMap = { mes: 'month', trimestre: 'all', todo: 'all' };
      const res = await settingsApi.exportProStats(periodMap[period] ?? 'month');
      if (res?.error || !res?.data?.downloadUrl) {
        Alert.alert('Error', 'No se pudo generar el informe. Inténtalo de nuevo.');
        return;
      }
      setDownloadUrl(res.data.downloadUrl);
      setShowModal(true);
    } finally {
      setIsGenerating(false);
    }
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
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Exportar informe</Text>
          <Text style={styles.headerSubtitle}>Genera un PDF de tu rendimiento para tu tutor o academia.</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Periodo ───────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PERIODO</Text>
        <View style={styles.segmentedRow}>
          {PERIOD_OPTIONS.map(({ key, label }) => {
            const isActive = period === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.segmentButton, isActive && styles.segmentButtonActive]}
                onPress={() => setPeriod(key)}
                activeOpacity={0.7}
                accessibilityLabel={`Periodo ${label}`}
              >
                <Text style={[styles.segmentText, isActive && styles.segmentTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Incluir ───────────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>INCLUIR</Text>
        {INCLUDE_OPTIONS.map(({ key, label }, idx) => (
          <View key={key} style={[styles.toggleRow, idx > 0 && styles.toggleRowBorder]}>
            <Text style={styles.toggleLabel}>{label}</Text>
            <Switch
              value={includes[key]}
              onValueChange={() => toggleInclude(key)}
              trackColor={{ false: '#E2E2E6', true: colors.purple }}
              thumbColor={colors.white}
              accessibilityLabel={`${label} ${includes[key] ? 'activado' : 'desactivado'}`}
            />
          </View>
        ))}

        {/* ── Botón generar ─────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={isGenerating}
          accessibilityLabel="Generar informe PDF"
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color={colors.white} />
              <Text style={styles.generateBtnText}>Generando…</Text>
            </>
          ) : (
            <>
              <DownloadIcon />
              <Text style={styles.generateBtnText}>Generar PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ReportSuccessModal
        visible={showModal}
        periodLabel={periodLabel}
        downloadUrl={downloadUrl}
        onClose={() => { setShowModal(false); setDownloadUrl(null); }}
      />
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
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
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
    marginTop: spacing.lg,
  },

  // ── Periodo ───────────────────────────────────────────────────
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  segmentButtonActive: {
    borderColor: FIGMA.segmentBorder,
  },
  segmentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: FIGMA.textMuted,
  },
  segmentTextActive: {
    color: colors.textDark,
  },

  // ── Incluir ───────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
  },
  toggleRowBorder: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.toggleBorder,
  },
  toggleLabel: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },

  // ── Botón generar ─────────────────────────────────────────────
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.purple,
    marginTop: spacing.xl,
  },
  generateBtnDisabled: {
    opacity: 0.7,
  },
  generateBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
