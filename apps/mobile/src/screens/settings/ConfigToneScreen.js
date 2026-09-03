import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import AccentSlider from '../../components/AccentSlider';
import { colors, spacing } from '../../theme';
import { settingsApi } from '../../api';

// ─── 12.4 · Tono de la IA — alineado con Motor /tone ───────────────────────
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  segmentBorder: 'rgba(65, 41, 80, 0.2)',
  sliderTrack: '#F3E1CC',
};

const TONE_KEY = 'opox.ai.tone';

const DEFAULT_TONE = {
  personality: 'cercano',
  detailLevel: 1,       // 0=Breve · 1=Medio · 2=Profundo
  hintStyle: 'directas',
  reinforcementLevel: 'normal',
};

// 4 opciones del Motor: Cercano / Formal / Directo / Motivador
const PERSONALITY_OPTIONS = [
  { key: 'cercano',   label: 'Cercano' },
  { key: 'formal',    label: 'Formal' },
  { key: 'directo',   label: 'Directo' },
  { key: 'motivador', label: 'Motivador' },
];

const DETAIL_LABELS = ['Breve', 'Medio', 'Profundo'];

// Estilo de pistas: 2 opciones del Motor
const HINT_OPTIONS = [
  { key: 'socraticas', label: 'Socráticas' },
  { key: 'directas',   label: 'Directas' },
];

// Refuerzo: 3 opciones del Motor
const REINFORCE_OPTIONS = [
  { key: 'alto',    label: 'Alto' },
  { key: 'normal',  label: 'Normal' },
  { key: 'ninguno', label: 'Ninguno' },
];

const PREVIEW_TEXTS = {
  cercano:   '"¡Buena esa, Juan! El art. 14 lo tienes dominado. Vamos con el siguiente."',
  formal:    '"Correcto. Artículo 14. Continúe con la siguiente cuestión."',
  directo:   '"Correcto. Siguiente."',
  motivador: '"¡Perfecto! Vas a reventar ese examen. Siguiente pregunta."',
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

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SegmentControl({ options, value, onChange }) {
  return (
    <View style={styles.segmentedRow}>
      {options.map(({ key, label }) => {
        const isSelected = value === key;
        return (
          <TouchableOpacity
            key={key}
            style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
            onPress={() => onChange(key)}
            activeOpacity={0.7}
            accessibilityLabel={label}
          >
            <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function ConfigToneScreen({ navigation }) {
  const [tone, setTone] = useState(DEFAULT_TONE);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const local = await loadToneLocal();
      if (!cancelled && local) setTone(local);

      const res = await settingsApi.getPreferences();
      if (!cancelled && !res?.error && res?.data) {
        const { personality, detailLevel, hintStyle, reinforcementLevel } = res.data;
        const fromBackend = {
          personality:        personality        ?? DEFAULT_TONE.personality,
          detailLevel:        detailLevel        ?? DEFAULT_TONE.detailLevel,
          hintStyle:          hintStyle          ?? DEFAULT_TONE.hintStyle,
          reinforcementLevel: reinforcementLevel ?? DEFAULT_TONE.reinforcementLevel,
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
      saveToneLocal(next);
      settingsApi.updatePreferences({
        personality:        next.personality,
        detailLevel:        next.detailLevel,
        hintStyle:          next.hintStyle,
        reinforcementLevel: next.reinforcementLevel,
      }).catch(() => {});
      return next;
    });
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

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
          <Text style={styles.headerTitle}>Tono de la IA</Text>
          <Text style={styles.headerSubtitle}>Cómo quieres que te hable tu Tutor IA.</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Personalidad ─────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PERSONALIDAD</Text>
        <SegmentControl
          options={PERSONALITY_OPTIONS}
          value={tone.personality}
          onChange={(key) => update({ personality: key })}
        />

        {/* ── Nivel de detalle ────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>NIVEL DE DETALLE</Text>
        <AccentSlider
          steps={3}
          valueIdx={tone.detailLevel ?? 1}
          onChange={(idx) => update({ detailLevel: idx })}
          accentColor={colors.accentOrange}
          trackColor={FIGMA.sliderTrack}
        />
        <View style={styles.sliderLabelsRow}>
          {DETAIL_LABELS.map((label, idx) => (
            <TouchableOpacity key={label} onPress={() => update({ detailLevel: idx })}>
              <Text style={styles.sliderLabelText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Estilo de pistas ─────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>ESTILO DE PISTAS</Text>
        <SegmentControl
          options={HINT_OPTIONS}
          value={tone.hintStyle}
          onChange={(key) => update({ hintStyle: key })}
        />

        {/* ── Refuerzo ─────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>REFUERZO</Text>
        <SegmentControl
          options={REINFORCE_OPTIONS}
          value={tone.reinforcementLevel}
          onChange={(key) => update({ reinforcementLevel: key })}
        />

        {/* ── Vista previa ─────────────────────────────────────────── */}
        <View style={styles.previewBubble}>
          <Text style={styles.previewText}>
            {PREVIEW_TEXTS[tone.personality] ?? PREVIEW_TEXTS.cercano}
          </Text>
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

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 10,
  },
  sectionSpacing: {
    marginTop: 20,
  },

  segmentedRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: FIGMA.segmentBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  segmentButtonActive: {
    borderColor: colors.purple,
  },
  segmentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: FIGMA.textMuted,
  },
  segmentTextActive: {
    color: colors.purple,
  },

  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: spacing.lg,
  },
  sliderLabelText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
  },

  previewBubble: {
    backgroundColor: colors.purple,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  previewText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },
});
