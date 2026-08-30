import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';
import { settingsApi } from '../../api';

const TONE_KEY = 'opox.ai.tone';

const DEFAULT_TONE = {
  personality: 'equilibrado',
  detailLevel: 1,      // 0=Conciso · 1=Medio · 2=Extenso
  directHints: false,
  motivational: true,
};

const PERSONALITY_OPTIONS = [
  { key: 'cercano',     label: 'Cercano' },
  { key: 'equilibrado', label: 'Equilibrado' },
  { key: 'exigente',   label: 'Exigente' },
];

const DETAIL_LABELS = ['Conciso', 'Medio', 'Extenso'];

const PREVIEW_TEXTS = {
  cercano:     '"¡Buena esa, Juan! El art. 14 lo tienes dominado. Vamos con el siguiente."',
  equilibrado: '"Has acertado el artículo 14. Sigue así con el siguiente."',
  exigente:   '"Artículo 14 correcto. No bajes el ritmo. Siguiente."',
};

async function loadToneLocal() {
  try {
    const raw = await AsyncStorage.getItem(TONE_KEY);
    return raw ? { ...DEFAULT_TONE, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

async function saveToneLocal(tone) {
  try {
    await AsyncStorage.setItem(TONE_KEY, JSON.stringify(tone));
  } catch { /* fallo silencioso */ }
}

export default function ConfigToneScreen({ navigation }) {
  const [tone, setTone] = useState(DEFAULT_TONE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // 1. Cargar inmediatamente desde AsyncStorage para respuesta instantánea
      const local = await loadToneLocal();
      if (!cancelled && local) setTone(local);

      // 2. Preferir datos del backend (source of truth multi-dispositivo)
      const res = await settingsApi.getPreferences();
      if (!cancelled && !res?.error && res?.data) {
        const { personality, detailLevel, directHints, motivational } = res.data;
        const fromBackend = {
          personality:  personality  ?? DEFAULT_TONE.personality,
          detailLevel:  detailLevel  ?? DEFAULT_TONE.detailLevel,
          directHints:  directHints  ?? DEFAULT_TONE.directHints,
          motivational: motivational ?? DEFAULT_TONE.motivational,
        };
        setTone(fromBackend);
        saveToneLocal(fromBackend);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const update = useCallback((patch) => {
    setTone((prev) => {
      const next = { ...prev, ...patch };
      // Persistir localmente de forma síncrona para UX instantánea
      saveToneLocal(next);
      // Sincronizar con backend en background
      settingsApi.updatePreferences({
        personality:  next.personality,
        detailLevel:  next.detailLevel,
        directHints:  next.directHints,
        motivational: next.motivational,
      }).catch(() => { /* error silencioso — ya está en AsyncStorage */ });
      return next;
    });
  }, []);

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
        <Text style={styles.headerTitle}>Tono de la IA</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.description}>
          Cómo quieres que te hable tu{' '}
          <Text style={{ color: colors.primary }}>Tutor IA</Text>.
        </Text>

        {/* PERSONALIDAD */}
        <Text style={styles.sectionTitle}>PERSONALIDAD</Text>
        <View style={styles.card}>
          <View style={styles.personalityRow}>
            {PERSONALITY_OPTIONS.map(({ key, label }) => {
              const isSelected = tone.personality === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.personalityTab, isSelected && styles.personalityTabSelected]}
                  onPress={() => update({ personality: key })}
                  activeOpacity={0.7}
                  accessibilityLabel={`Personalidad ${label}`}
                >
                  <Text style={[styles.personalityTabText, isSelected && styles.personalityTabTextSelected]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* NIVEL DE DETALLE */}
        <View style={styles.detailCard}>
          <View style={styles.detailHeader}>
            <Text style={styles.detailTitle}>Nivel de detalle</Text>
            <Text style={styles.detailValue}>{DETAIL_LABELS[tone.detailLevel ?? 1]}</Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={2}
            step={1}
            value={tone.detailLevel ?? 1}
            onValueChange={(v) => update({ detailLevel: v })}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor="#E2E8F0"
            thumbTintColor={colors.primary}
          />
          <View style={styles.detailLabelRow}>
            <Text style={styles.detailLabelText}>Conciso</Text>
            <Text style={styles.detailLabelText}>Extenso</Text>
          </View>
        </View>

        {/* TOGGLES */}
        <View style={styles.card}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleTexts}>
              <Text style={styles.toggleTitle}>Pistas más directas</Text>
              <Text style={styles.toggleSub}>Acércate más a la respuesta</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: colors.primary }}
              thumbColor={tone.directHints ? '#FFFFFF' : '#F4F4F4'}
              onValueChange={(v) => update({ directHints: v })}
              value={tone.directHints}
              accessibilityLabel={`Pistas directas ${tone.directHints ? 'activadas' : 'desactivadas'}`}
            />
          </View>

          <View style={[styles.toggleRow, styles.toggleRowLast]}>
            <View style={styles.toggleTexts}>
              <Text style={styles.toggleTitle}>Motivación en los avisos</Text>
              <Text style={styles.toggleSub}>Mensajes de ánimo</Text>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: colors.primary }}
              thumbColor={tone.motivational ? '#FFFFFF' : '#F4F4F4'}
              onValueChange={(v) => update({ motivational: v })}
              value={tone.motivational}
              accessibilityLabel={`Mensajes motivacionales ${tone.motivational ? 'activados' : 'desactivados'}`}
            />
          </View>
        </View>

        {/* VISTA PREVIA */}
        <View style={styles.previewCard}>
          <Text style={styles.previewText}>{PREVIEW_TEXTS[tone.personality]}</Text>
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
  headerRight: { width: 40 },

  // Scroll
  scroll: { paddingBottom: 40 },
  description: {
    fontSize: 14,
    color: '#64748B',
    marginHorizontal: 16,
    marginTop: 20,
    lineHeight: 20,
  },

  // Sección
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

  // Card base
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  // Personalidad — tabs
  personalityRow: { flexDirection: 'row' },
  personalityTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 10,
    margin: 4,
  },
  personalityTabSelected: {
    borderColor: '#1E293B',
  },
  personalityTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
  },
  personalityTabTextSelected: {
    fontWeight: '700',
    color: '#1E293B',
  },

  // Nivel de detalle — Slider
  detailCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  detailValue: { fontSize: 15, fontWeight: '700', color: colors.primary },
  slider: { width: '100%', height: 40 },
  detailLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -4 },
  detailLabelText: { fontSize: 12, color: '#94A3B8' },

  // Toggles
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  toggleRowLast: { borderBottomWidth: 0 },
  toggleTexts: { flex: 1, marginRight: 12 },
  toggleTitle: { fontSize: 14, fontWeight: '600', color: '#1E293B' },
  toggleSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Vista previa
  previewCard: {
    backgroundColor: '#EDE9FE',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
  },
  previewText: {
    fontSize: 14,
    color: '#1E293B',
    lineHeight: 21,
    fontStyle: 'italic',
  },
});
