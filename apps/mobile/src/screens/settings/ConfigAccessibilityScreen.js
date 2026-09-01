import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import AccentSlider from '../../components/AccentSlider';
import { colors, spacing } from '../../theme';
import { settingsApi } from '../../api';

// ─── 12.5 · Accesibilidad ───────────────────────────────────────────────────
// Fiel al Figma (AccesibilidadScreen.tsx). Dos ajustes reales tienen más
// capacidad que la captura estática de Figma:
//  - "Modo noche" en Figma es un switch binario, pero el real soporta un
//    tercer estado "Auto" (sigue el tema del sistema) que no tiene forma de
//    representarse en un switch de 2 posiciones. Se adapta al selector
//    segmentado de 3 opciones ya confirmado en esta misma pantalla del
//    bloque (ConfigToneScreen · "PERSONALIDAD"), en vez de perder "Auto".
//  - El tamaño de fuente real es un valor discreto de 3 pasos (no continuo);
//    se mapea sobre AccentSlider (steps=3), igual que en ConfigToneScreen,
//    conservando el snap a los 3 tamaños reales y añadiendo el texto de
//    vista previa (real, sin equivalente en Figma).
// El auto-preview de tema completo de la pantalla (fondo/tarjetas oscuros en
// vivo) se retira aquí porque Figma confirma un fondo blanco fijo; la
// preferencia sigue guardándose y sincronizándose con el backend igual
// (theme/fontScale/reduceMotion vía /config/preferences) para cuando exista
// un ThemeContext real que la aplique al resto de la app.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
  segmentBorder: 'rgba(65, 41, 80, 0.2)',
  sliderTrack: '#F8DFC0',
};

const A11Y_KEY = 'opox.accessibility';

const DEFAULT = {
  theme: 'auto',       // 'claro' | 'auto' | 'oscuro'  (valores UI internos)
  fontSize: 'medio',   // 'pequeno' | 'medio' | 'grande'
  highContrast: false, // solo local — no en backend
  reduceAnimations: false,
};

// Mapeos entre valores UI y valores del backend
const THEME_TO_API   = { claro: 'light', auto: 'auto', oscuro: 'dark' };
const THEME_FROM_API = { light: 'claro', auto: 'auto', dark: 'oscuro' };
const FONT_TO_SCALE  = { pequeno: 0.85, medio: 1.0, grande: 1.15 };
function scaleToFont(scale) {
  if (scale <= 0.9) return 'pequeno';
  if (scale <= 1.05) return 'medio';
  return 'grande';
}

const THEME_OPTIONS = [
  { key: 'claro', label: 'Claro' },
  { key: 'auto', label: 'Auto' },
  { key: 'oscuro', label: 'Oscuro' },
];

const FONT_SIZE_OPTIONS = ['pequeno', 'medio', 'grande'];
const FONT_SIZE_INDEX = { pequeno: 0, medio: 1, grande: 2 };
const PREVIEW_TEXT_SIZE = { pequeno: 13, medio: 16, grande: 20 };

async function loadA11yLocal() {
  try {
    const raw = await AsyncStorage.getItem(A11Y_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : null;
  } catch {
    return null;
  }
}

async function saveA11yLocal(prefs) {
  try {
    await AsyncStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
  } catch { /* fallo silencioso */ }
}

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function MoonIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M20 14.5A8.5 8.5 0 1 1 9.5 4A6.8 6.8 0 0 0 20 14.5Z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
      <Path d="M18 3L18.6 4.4L20 5L18.6 5.6L18 7L17.4 5.6L16 5L17.4 4.4L18 3Z" fill={color} />
    </Svg>
  );
}

export default function ConfigAccessibilityScreen({ navigation }) {
  const [prefs, setPrefs] = useState(DEFAULT);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      // 1. AsyncStorage primero para respuesta instantánea
      const local = await loadA11yLocal();
      if (!cancelled && local) setPrefs(local);

      // 2. Backend como source of truth (theme, fontScale, reduceMotion)
      const res = await settingsApi.getPreferences();
      if (!cancelled && !res?.error && res?.data) {
        const { theme, fontScale, reduceMotion } = res.data;
        const merged = {
          ...(local ?? DEFAULT),
          theme:           THEME_FROM_API[theme] ?? (local?.theme ?? DEFAULT.theme),
          fontSize:        scaleToFont(fontScale ?? 1.0),
          reduceAnimations: reduceMotion ?? (local?.reduceAnimations ?? false),
          // highContrast permanece solo local
        };
        setPrefs(merged);
        saveA11yLocal(merged);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const update = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveA11yLocal(next);

      // Sincronizar con backend los campos soportados
      const apiPatch = {};
      if (patch.theme !== undefined)            apiPatch.theme       = THEME_TO_API[next.theme] ?? 'auto';
      if (patch.fontSize !== undefined)         apiPatch.fontScale   = FONT_TO_SCALE[next.fontSize] ?? 1.0;
      if (patch.reduceAnimations !== undefined) apiPatch.reduceMotion = next.reduceAnimations;
      // highContrast no existe en backend → no se sincroniza

      if (Object.keys(apiPatch).length > 0) {
        settingsApi.updatePreferences(apiPatch)
          .catch(() => { /* error silencioso — ya persistido localmente */ });
      }
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
        <Text style={styles.headerTitle}>Accesibilidad</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Modo noche (Claro/Auto/Oscuro) ─────────────────────────── */}
        <View style={styles.row}>
          <MoonIcon />
          <Text style={styles.rowTitle}>Modo noche</Text>
          <View style={styles.segmentedRow}>
            {THEME_OPTIONS.map(({ key, label }) => {
              const isSelected = prefs.theme === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
                  onPress={() => update({ theme: key })}
                  activeOpacity={0.7}
                  accessibilityLabel={`Tema ${label}`}
                >
                  <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Tamaño fuente ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>TAMAÑO FUENTE</Text>
        <View style={styles.sliderRow}>
          <Text style={styles.sliderEndLabelSmall}>A</Text>
          <View style={styles.sliderTrackWrap}>
            <AccentSlider
              steps={3}
              valueIdx={FONT_SIZE_INDEX[prefs.fontSize] ?? 1}
              onChange={(idx) => update({ fontSize: FONT_SIZE_OPTIONS[idx] })}
              accentColor={colors.accentOrange}
              trackColor={FIGMA.sliderTrack}
            />
          </View>
          <Text style={styles.sliderEndLabelLarge}>A</Text>
        </View>
        {/* Vista previa — real, sin equivalente en Figma */}
        <Text style={[styles.previewText, { fontSize: PREVIEW_TEXT_SIZE[prefs.fontSize] }]}>
          Este es un ejemplo de texto con el tamaño seleccionado.
        </Text>

        {/* ── Alto contraste ──────────────────────────────────────────── */}
        <View style={[styles.row, styles.rowBorder]}>
          <Ionicons name="contrast-outline" size={24} color={colors.accentOrange} />
          <Text style={[styles.rowTitle, { flex: 1 }]}>Alto contraste</Text>
          <Switch
            value={prefs.highContrast}
            onValueChange={(v) => update({ highContrast: v })}
            trackColor={{ false: '#E2E2E6', true: colors.purple }}
            thumbColor={colors.white}
            accessibilityLabel={`Alto contraste ${prefs.highContrast ? 'activado' : 'desactivado'}`}
          />
        </View>

        {/* ── Reducir animaciones ─────────────────────────────────────── */}
        <View style={[styles.row, styles.rowBorder]}>
          <Ionicons name="speedometer-outline" size={24} color={colors.accentOrange} />
          <Text style={[styles.rowTitle, { flex: 1 }]}>Reducir animaciones</Text>
          <Switch
            value={prefs.reduceAnimations}
            onValueChange={(v) => update({ reduceAnimations: v })}
            trackColor={{ false: '#E2E2E6', true: colors.purple }}
            thumbColor={colors.white}
            accessibilityLabel={`Reducir animaciones ${prefs.reduceAnimations ? 'activado' : 'desactivado'}`}
          />
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },

  // ── Modo noche: selector segmentado ───────────────────────────
  segmentedRow: {
    flexDirection: 'row',
    gap: 6,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: FIGMA.segmentBorder,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  segmentButtonActive: {
    borderColor: colors.purple,
  },
  segmentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10.5,
    color: FIGMA.textMuted,
  },
  segmentTextActive: {
    color: colors.purple,
  },

  // ── Tamaño fuente ─────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sliderEndLabelSmall: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: FIGMA.textMuted,
  },
  sliderEndLabelLarge: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: colors.textDark,
  },
  sliderTrackWrap: {
    flex: 1,
  },
  previewText: {
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginTop: spacing.sm + 4,
  },
});
