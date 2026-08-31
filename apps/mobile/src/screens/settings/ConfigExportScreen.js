import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Switch, Alert, ActivityIndicator, Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import ReportSuccessModal from './ReportSuccessModal';
import { settingsApi } from '../../api';

// TODO: implementar generación real → POST /config/pro-stats/export
// Body: { period, includeProbability, includeSoftSkills, includeHistory, includeEvolution }
// Response: { url: string } → abrir con Linking.openURL o expo-sharing

const PERIOD_OPTIONS = [
  { key: 'mes', label: 'Mes' },
  { key: 'trimestre', label: 'Trimestre' },
  { key: 'todo', label: 'Todo' },
];

const INCLUDE_OPTIONS = [
  { key: 'probability', label: 'Probabilidad de aprobado', icon: 'trending-up-outline' },
  { key: 'softSkills', label: 'Radar de soft-skills', icon: 'stats-chart-outline' },
  { key: 'history', label: 'Historial de tests', icon: 'document-text-outline' },
  { key: 'evolution', label: 'Evolución por temas', icon: 'bar-chart-outline' },
];

function PeriodOption({ label, isSelected, onPress }) {
  return (
    <TouchableOpacity
      style={[styles.periodOption, isSelected && styles.periodOptionSelected]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityLabel={`Periodo ${label}`}
    >
      <Text style={[styles.periodText, isSelected && styles.periodTextSelected]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function ToggleOption({ label, icon, value, onValueChange, isLast }) {
  return (
    <TouchableOpacity
      style={[styles.optionRow, isLast && styles.optionRowLast]}
      onPress={() => onValueChange(!value)}
      activeOpacity={0.7}
      accessibilityLabel={`${label} ${value ? 'activado' : 'desactivado'}`}
    >
      <View style={styles.optionLeft}>
        <View style={styles.iconBox}>
          <Ionicons name={icon} size={14} color="#3B82F6" />
        </View>
        <Text style={styles.optionLabel}>{label}</Text>
      </View>
      <Switch
        trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
        thumbColor={value ? '#FFFFFF' : '#F4F4F4'}
        onValueChange={onValueChange}
        value={value}
        accessibilityLabel={label}
      />
    </TouchableOpacity>
  );
}

export default function ConfigExportScreen({ navigation }) {
  const [period, setPeriod] = useState('trimestre');
  const [includes, setIncludes] = useState({
    probability: true,
    softSkills: true,
    history: false,
    evolution: true,
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
        <Text style={styles.headerTitle}>Exportar informe</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.description}>
          Genera un PDF de tu rendimiento para tu tutor o academia.
        </Text>

        {/* PERIODO */}
        <Text style={styles.sectionTitle}>PERIODO</Text>
        <View style={styles.card}>
          <View style={styles.periodRow}>
            {PERIOD_OPTIONS.map(({ key, label }) => (
              <PeriodOption
                key={key}
                label={label}
                isSelected={period === key}
                onPress={() => setPeriod(key)}
              />
            ))}
          </View>
        </View>

        {/* INCLUIR */}
        <Text style={styles.sectionTitle}>INCLUIR</Text>
        <View style={styles.card}>
          {INCLUDE_OPTIONS.map(({ key, label, icon }, idx) => (
            <ToggleOption
              key={key}
              label={label}
              icon={icon}
              value={includes[key]}
              onValueChange={() => toggleInclude(key)}
              isLast={idx === INCLUDE_OPTIONS.length - 1}
            />
          ))}
        </View>

        {/* BOTÓN GENERAR */}
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          activeOpacity={0.85}
          disabled={isGenerating}
          accessibilityLabel="Generar informe PDF"
        >
          {isGenerating ? (
            <>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.generateBtnText}>Generando…</Text>
            </>
          ) : (
            <>
              <Ionicons name="download-outline" size={20} color="#FFFFFF" />
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
  headerRight: { width: 40 },

  // Scroll
  scroll: { paddingBottom: 40 },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    lineHeight: 20,
  },

  // Secciones
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    padding: 12,
  },

  // Periodo
  periodRow: { flexDirection: 'row', gap: 8 },
  periodOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  periodOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  periodText: { fontSize: 14, fontWeight: '500', color: '#64748B' },
  periodTextSelected: { fontWeight: '700', color: '#3B82F6' },

  // Opciones de inclusión
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionRowLast: { borderBottomWidth: 0 },
  optionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  iconBox: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionLabel: { fontSize: 14, fontWeight: '500', color: '#1E293B', flex: 1 },

  // Botón generar
  generateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    marginHorizontal: 16,
    marginTop: 24,
    paddingVertical: 15,
    borderRadius: 12,
  },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },
});
