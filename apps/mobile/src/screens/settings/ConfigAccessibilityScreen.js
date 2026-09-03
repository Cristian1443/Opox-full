import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import AccentSlider from '../../components/AccentSlider';
import { colors, spacing } from '../../theme';
import { settingsApi } from '../../api';

// ─── 12.5 · Accesibilidad ───────────────────────────────────────────────────
// Fiel al Figma (AccesibilidadScreen.tsx). "Modo noche" es un switch binario
// (Claro/Oscuro) igual que en Figma — "Auto" ya no es seleccionable desde
// aquí, aunque sigue siendo un valor válido en el backend si se llegó a él
// por otra vía (queda tratado igual que "Claro" hasta que el usuario toca
// el switch). El tamaño de fuente real es un valor discreto de 3 pasos (no
// continuo); se mapea sobre AccentSlider (steps=3), igual que en
// ConfigToneScreen, conservando el snap a los 3 tamaños reales y añadiendo
// el texto de vista previa (real, sin equivalente en Figma).
// El auto-preview de tema completo de la pantalla (fondo/tarjetas oscuros en
// vivo) se retira aquí porque Figma confirma un fondo blanco fijo; la
// preferencia sigue guardándose y sincronizándose con el backend igual
// (theme/fontScale/reduceMotion vía /config/preferences) para cuando exista
// un ThemeContext real que la aplique al resto de la app.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
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

// Ruta exacta exportada de Figma (icono "Modo noche", 74×75 — luna + destellos).
function MoonIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (75 / 74)} viewBox="0 0 74 75" fill="none">
      <Path d="M51.4718 54.9565C44.0491 54.2722 37.044 51.1758 31.5026 46.1296C26.4145 41.642 22.7497 35.7325 20.9687 29.1432C18.3104 19.3761 19.5651 10.1258 24.4209 1.29175C12.6819 5.54015 -0.708884 19.857 1.2618 40.1158C2.21069 49.5701 6.65893 58.3105 13.7127 64.5807C20.7664 70.8509 29.9029 74.1862 39.2861 73.9164C49.494 73.6365 58.1707 69.6608 65.295 62.2476C68.3644 59.0542 72.7807 51.9496 72.7807 50.2775C66.3497 54.0907 58.8855 55.7297 51.4718 54.9565Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M59.7657 23.2657C60.6648 23.7015 61.3918 24.4324 61.8285 25.3396C62.5374 26.7247 63.1258 28.1312 63.7779 29.5306C63.8488 29.6813 63.9339 29.8249 64.0473 30.0473C64.1678 29.7962 64.2387 29.6455 64.3025 29.4948C64.8625 28.2604 65.4225 27.0189 65.9896 25.7846C66.5115 24.5851 67.4461 23.6185 68.6196 23.0647C68.9599 22.8997 69.3285 22.7131 69.6404 22.5552L72.9367 21.041L72.3979 20.7755C70.9802 20.1009 69.5624 19.4407 68.1446 18.7589C67.3332 18.3749 66.6809 17.7145 66.3016 16.8931C65.5927 15.4578 64.9547 14.0225 64.2883 12.6232L64.0119 12.0778L63.7496 12.616C63.1187 13.9651 62.4878 15.3143 61.8711 16.6778C61.4448 17.6337 60.6886 18.3992 59.7444 18.8307L55.9519 20.6678L55.2076 21.0482L55.8598 21.3783C57.1641 22.0026 58.4684 22.6198 59.7657 23.2657Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M31.6515 28.9063C32.4189 29.1254 33.1193 29.5368 33.688 30.1025C34.2567 30.6682 34.6754 31.3699 34.9053 32.1428C35.2781 33.0912 35.7066 34.0162 36.1883 34.9129C36.3159 34.6473 36.401 34.4895 36.4719 34.3316C36.9681 33.2623 37.4572 32.1787 37.9605 31.1309C38.3264 30.375 38.9403 29.7713 39.6973 29.423C40.6968 28.935 41.7105 28.4542 42.7171 27.9877L43.426 27.6504C42.5115 27.2413 41.753 26.8538 40.9591 26.5596C40.0825 26.2914 39.2879 25.8014 38.6504 25.1359C38.0129 24.4704 37.5534 23.6513 37.3155 22.7561C37.0182 21.9394 36.6579 21.1475 36.238 20.3879L35.841 21.2132C35.3873 22.1892 34.9265 23.1652 34.4799 24.1412C34.1406 24.9271 33.5238 25.5566 32.7503 25.9065L30.2692 27.0548L29.0641 27.6289C29.2413 27.7365 29.3264 27.8083 29.4185 27.8585C30.1407 28.2542 30.8865 28.6041 31.6515 28.9063Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M47.2894 9.3651C47.4808 9.88179 47.7431 10.3698 47.9983 10.9726C48.3244 10.255 48.6292 9.61627 48.8915 8.97757C49.0622 8.5265 49.3237 8.11625 49.6592 7.77282C49.9948 7.4294 50.3972 7.16029 50.8409 6.98255C51.486 6.71702 52.1098 6.39409 52.8399 6.04962C51.9609 5.61187 51.1528 5.20999 50.3305 4.83682C49.8282 4.62068 49.4271 4.21729 49.2105 3.71014C48.8844 2.9925 48.5583 2.27487 48.2251 1.59311C48.1542 1.44241 48.055 1.30606 47.9203 1.07642C47.7927 1.34912 47.7147 1.507 47.6438 1.67205C47.3886 2.28204 47.1263 2.89203 46.8782 3.5092C46.759 3.81947 46.5797 4.10247 46.3508 4.34156C46.1219 4.58065 45.8481 4.771 45.5455 4.90141L43.5961 5.83433C43.4756 5.89174 43.3622 5.97068 43.1779 6.07833C43.7521 6.33668 44.2341 6.59503 44.7445 6.79596C45.336 6.9959 45.8737 7.33196 46.3152 7.77773C46.7568 8.2235 47.0902 8.76685 47.2894 9.3651Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
      <Path d="M51.7482 36.0181C51.5138 36.5136 51.3056 37.0215 51.1244 37.5395C50.9525 38.2015 50.615 38.8074 50.1444 39.2989C49.6738 39.7904 49.086 40.1508 48.4378 40.3454C48.1968 40.4315 47.9628 40.5607 47.7289 40.6683L47.02 41.0343C47.7289 41.3644 48.3314 41.6659 48.9482 41.9242C49.4093 42.1029 49.8285 42.3771 50.1788 42.7293C50.5292 43.0815 50.803 43.5039 50.9827 43.9695C51.2449 44.6082 51.5498 45.2325 51.8758 45.943C52.3012 45.0244 52.6273 44.1847 53.0739 43.4241C53.3601 42.9656 53.7395 42.5742 54.1868 42.2758C54.7375 41.9475 55.3108 41.6597 55.9023 41.4147L56.7104 41.02C55.803 40.5894 55.0091 40.2019 54.2081 39.8359C53.6912 39.6072 53.2785 39.1894 53.0526 38.6661C52.7407 37.9485 52.4004 37.2309 52.0672 36.5132C51.968 36.4128 51.8829 36.2764 51.7482 36.0181Z" stroke={color} strokeWidth={3} strokeLinejoin="round" />
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
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Modo noche ────────────────────────────────────────────── */}
        <View style={styles.row}>
          <MoonIcon />
          <Text style={[styles.rowTitle, { flex: 1 }]}>Modo noche</Text>
          <Switch
            value={prefs.theme === 'oscuro'}
            onValueChange={(v) => update({ theme: v ? 'oscuro' : 'claro' })}
            trackColor={{ false: '#E2E2E6', true: colors.purple }}
            thumbColor={colors.white}
            accessibilityLabel={`Modo noche ${prefs.theme === 'oscuro' ? 'activado' : 'desactivado'}`}
          />
        </View>

        {/* ── Tamaño fuente ───────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>TAMAÑO FUENTE</Text>
        <View style={styles.sliderLabelsRow}>
          <Text style={styles.sliderLabelSmall}>A</Text>
          <Text style={styles.sliderLabelMedium}>A</Text>
          <Text style={styles.sliderLabelLarge}>A</Text>
        </View>
        <AccentSlider
          steps={3}
          valueIdx={FONT_SIZE_INDEX[prefs.fontSize] ?? 1}
          onChange={(idx) => update({ fontSize: FONT_SIZE_OPTIONS[idx] })}
          accentColor={colors.accentOrange}
          trackColor={FIGMA.sliderTrack}
        />
        {/* Vista previa — real, sin equivalente en Figma */}
        <Text style={[styles.previewText, { fontSize: PREVIEW_TEXT_SIZE[prefs.fontSize] }]}>
          Este es un ejemplo de texto con el tamaño seleccionado.
        </Text>

        {/* ── Alto contraste ──────────────────────────────────────────── */}
        <View style={[styles.row, styles.rowBorder]}>
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
    borderRadius: 18,
    backgroundColor: '#F0F0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSpacer: {
    width: 36,
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

  // ── Tamaño fuente ─────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  sliderLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 6,
  },
  sliderLabelSmall: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: FIGMA.textMuted,
  },
  sliderLabelMedium: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textDark,
  },
  sliderLabelLarge: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: colors.textDark,
  },
  previewText: {
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginTop: spacing.sm + 4,
  },
});
