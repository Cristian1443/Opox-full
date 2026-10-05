import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    StatusBar,
    Switch,
} from 'react-native';
import Text from '../../components/AppText';
import AppHeader from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AccentSlider from '../../components/AccentSlider';
import { colors, spacing } from '../../theme';
import { settingsApi } from '../../api';

// ─── 12.4 · Tono de la IA — alineado con Motor /tone ───────────────────────
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
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
  const [scrollEnabled, setScrollEnabled] = useState(true);

  // El gesto nativo de "volver deslizando" de iOS compite con el arrastre
  // horizontal del slider — se desactiva para esta pantalla (ya tiene botón
  // de volver propio en el header).
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: false });
  }, [navigation]);

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

      <AppHeader
        title="Tono de la IA"
        subtitle="Cómo quieres que te hable tu Tutor IA."
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
      >

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
          onDragStart={() => setScrollEnabled(false)}
          onDragEnd={() => setScrollEnabled(true)}
        />
        <View style={styles.sliderLabelsRow}>
          {DETAIL_LABELS.map((label, idx) => (
            <TouchableOpacity key={label} onPress={() => update({ detailLevel: idx })}>
              <Text style={styles.sliderLabelText}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Estilo de pistas — switch como en Figma. Mapeo 1:1 con el Motor:
            encendido = 'directas', apagado = 'socraticas'. ─────────────── */}
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <Text style={styles.switchTitle}>Pistas más directas</Text>
            <Text style={styles.switchSubtitle}>Acércate más a la respuesta</Text>
          </View>
          <Switch
            value={tone.hintStyle === 'directas'}
            onValueChange={(on) => update({ hintStyle: on ? 'directas' : 'socraticas' })}
            trackColor={{ false: '#E2E2E6', true: 'rgba(65, 41, 80, 0.35)' }}
            ios_backgroundColor="#E2E2E6"
            thumbColor={tone.hintStyle === 'directas' ? colors.textDark : colors.white}
            accessibilityLabel="Pistas más directas"
          />
        </View>

        {/* ── Refuerzo (reinforcementLevel del Motor) — título de Figma, pero
            con los 3 niveles del Motor en vez de un switch sí/no. ─────── */}
        <Text style={[styles.sectionLabel, styles.sectionSpacing]}>MOTIVACIÓN EN LOS AVISOS</Text>
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


  scroll: {
    paddingHorizontal: spacing.lg,
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

  // Figma: las opciones se reparten todo el ancho; la activa lleva borde y
  // texto en morado oscuro (textDark), no el morado vivo.
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.lg,
  },
  segmentButton: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  segmentButtonActive: {
    borderColor: colors.textDark,
  },
  segmentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: FIGMA.textMuted,
  },
  segmentTextActive: {
    color: colors.textDark,
  },

  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: spacing.sm,
  },
  switchTextWrap: {
    flex: 1,
  },
  switchTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textDark,
  },
  switchSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
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

  // Figma: burbuja de ejemplo en lila claro, no morado sólido.
  previewBubble: {
    backgroundColor: 'rgba(159, 110, 228, 0.75)',
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
