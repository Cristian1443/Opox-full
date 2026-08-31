import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import AccentSlider from '../../components/AccentSlider';
import { colors, spacing } from '../../theme';

// ─── 12.4 · Tono de la IA ───────────────────────────────────────────────────
// Fiel al Figma (TonoDeLaIAScreen.tsx). El slider de nivel de detalle
// reutiliza AccentSlider (componente compartido de Bloque 9) — su pulgar
// blanco con borde oscuro ya coincide exactamente con lo que confirma Figma
// aquí. La persistencia real en AsyncStorage y el texto de vista previa
// dinámico por personalidad (Figma solo muestra el ejemplo "cercano") se
// conservan.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  segmentBorder: 'rgba(65, 41, 80, 0.2)',
  sliderTrack: '#F3E1CC',
};

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

async function loadTone() {
  try {
    const raw = await AsyncStorage.getItem(TONE_KEY);
    return raw ? { ...DEFAULT_TONE, ...JSON.parse(raw) } : DEFAULT_TONE;
  } catch {
    return DEFAULT_TONE;
  }
}

async function saveTone(tone) {
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

export default function ConfigToneScreen({ navigation }) {
  const [tone, setTone] = useState(DEFAULT_TONE);

  useEffect(() => {
    loadTone().then(setTone);
  }, []);

  const update = useCallback((patch) => {
    setTone((prev) => {
      const next = { ...prev, ...patch };
      saveTone(next);
      return next;
    });
  }, []);

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
          <Text style={styles.headerTitle}>Tono de la IA</Text>
          <Text style={styles.headerSubtitle}>Cómo quieres que te hable tu Tutor IA.</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Personalidad ────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PERSONALIDAD</Text>
        <View style={styles.segmentedRow}>
          {PERSONALITY_OPTIONS.map(({ key, label }) => {
            const isSelected = tone.personality === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
                onPress={() => update({ personality: key })}
                activeOpacity={0.7}
                accessibilityLabel={`Personalidad ${label}`}
              >
                <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── Nivel de detalle ────────────────────────────────────────── */}
        <Text style={styles.detailLabel}>Nivel de detalle</Text>
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

        {/* ── Toggles ─────────────────────────────────────────────────── */}
        <View style={styles.toggleRow}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Pistas más directas</Text>
            <Text style={styles.rowSubtitle}>Acércate más a la respuesta</Text>
          </View>
          <Switch
            value={tone.directHints}
            onValueChange={(v) => update({ directHints: v })}
            trackColor={{ false: '#E2E2E6', true: colors.purple }}
            thumbColor={colors.white}
            accessibilityLabel={`Pistas directas ${tone.directHints ? 'activadas' : 'desactivadas'}`}
          />
        </View>

        <View style={styles.toggleRow}>
          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Motivación en los avisos</Text>
            <Text style={styles.rowSubtitle}>Mensajes de ánimo</Text>
          </View>
          <Switch
            value={tone.motivational}
            onValueChange={(v) => update({ motivational: v })}
            trackColor={{ false: '#E2E2E6', true: colors.purple }}
            thumbColor={colors.white}
            accessibilityLabel={`Mensajes motivacionales ${tone.motivational ? 'activados' : 'desactivados'}`}
          />
        </View>

        {/* ── Vista previa ────────────────────────────────────────────── */}
        <View style={styles.previewBubble}>
          <Text style={styles.previewText}>{PREVIEW_TEXTS[tone.personality]}</Text>
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
    marginBottom: 10,
  },

  // ── Personalidad ──────────────────────────────────────────────
  segmentedRow: {
    flexDirection: 'row',
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

  // ── Nivel de detalle ──────────────────────────────────────────
  detailLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 14,
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

  // ── Toggles ───────────────────────────────────────────────────
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
  },

  // ── Vista previa ──────────────────────────────────────────────
  previewBubble: {
    backgroundColor: colors.purple,
    borderRadius: 14,
    padding: spacing.md,
    marginTop: spacing.sm + 4,
  },
  previewText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 18,
  },
});
