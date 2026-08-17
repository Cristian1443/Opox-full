import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Switch,
  useColorScheme,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from '../../theme';

const A11Y_KEY = 'opox.accessibility';

const DEFAULT = {
  theme: 'auto',       // 'claro' | 'auto' | 'oscuro'
  fontSize: 'medio',   // 'pequeno' | 'medio' | 'grande'
  highContrast: false,
  reduceAnimations: false,
};

// TODO(bloque-12): propagar via ThemeContext para que afecte a todas las pantallas
// Por ahora el screen hace preview local del tema seleccionado.

const THEME_OPTIONS = [
  { key: 'claro', label: 'Claro', icon: 'sunny-outline' },
  { key: 'auto', label: 'Auto', icon: 'cloud-outline' },
  { key: 'oscuro', label: 'Oscuro', icon: 'moon-outline' },
];

const FONT_SIZE_OPTIONS = [
  { key: 'pequeno', label: 'Pequeño', sizePx: 13 },
  { key: 'medio', label: 'Medio', sizePx: 16 },
  { key: 'grande', label: 'Grande', sizePx: 20 },
];

const PREVIEW_TEXT_SIZE = { pequeno: 13, medio: 16, grande: 20 };

async function loadA11y() {
  try {
    const raw = await AsyncStorage.getItem(A11Y_KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

async function saveA11y(prefs) {
  try {
    await AsyncStorage.setItem(A11Y_KEY, JSON.stringify(prefs));
  } catch { /* fallo silencioso */ }
}

export default function ConfigAccessibilityScreen({ navigation }) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null
  const [prefs, setPrefs] = useState(DEFAULT);

  useEffect(() => {
    loadA11y().then(setPrefs);
  }, []);

  const update = useCallback((patch) => {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      saveA11y(next);
      return next;
    });
  }, []);

  // Resuelve si la vista previa muestra modo oscuro
  const isDark = prefs.theme === 'oscuro'
    || (prefs.theme === 'auto' && systemScheme === 'dark');

  const D = isDark ? DARK : LIGHT; // tokens de color del tema activo

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: D.bg }]} edges={['top', 'left', 'right']}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={D.header}
      />

      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: D.header, borderBottomColor: D.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={24} color={D.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: D.text }]}>Accesibilidad</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* APARIENCIA */}
        <Text style={[styles.sectionTitle, { color: D.textSecondary }]}>APARIENCIA</Text>
        <View style={[styles.card, { backgroundColor: D.card, borderColor: D.border }]}>
          <Text style={[styles.cardLabel, { color: D.textSecondary }]}>Modo de la aplicación</Text>
          <View style={styles.themeRow}>
            {THEME_OPTIONS.map(({ key, label, icon }) => {
              const isSelected = prefs.theme === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.themeOption,
                    isSelected
                      ? { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }
                      : { backgroundColor: D.bg, borderColor: D.border },
                  ]}
                  onPress={() => update({ theme: key })}
                  activeOpacity={0.7}
                  accessibilityLabel={`Tema ${label}`}
                >
                  <Ionicons
                    name={icon}
                    size={20}
                    color={isSelected ? '#3B82F6' : D.textSecondary}
                  />
                  <Text style={[
                    styles.themeLabel,
                    { color: isSelected ? '#3B82F6' : D.textSecondary },
                    isSelected && { fontWeight: '700' },
                  ]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* TAMAÑO DE FUENTE */}
        <Text style={[styles.sectionTitle, { color: D.textSecondary }]}>TAMAÑO DE FUENTE</Text>
        <View style={[styles.card, { backgroundColor: D.card, borderColor: D.border }]}>
          <Text style={[styles.cardLabel, { color: D.textSecondary }]}>
            Ajusta el tamaño del texto en toda la app
          </Text>
          <View style={styles.fontSizeRow}>
            {FONT_SIZE_OPTIONS.map(({ key, label, sizePx }) => {
              const isSelected = prefs.fontSize === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.fontSizeBtn, isSelected && styles.fontSizeBtnSelected]}
                  onPress={() => update({ fontSize: key })}
                  activeOpacity={0.7}
                  accessibilityLabel={`Tamaño de fuente ${label}`}
                >
                  <Text style={[
                    styles.fontSizeLetter,
                    { fontSize: sizePx },
                    isSelected && styles.fontSizeLetterSelected,
                  ]}>
                    A
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {/* Preview del tamaño seleccionado */}
          <View style={[styles.previewText, { backgroundColor: D.bg }]}>
            <Text style={{ fontSize: PREVIEW_TEXT_SIZE[prefs.fontSize], color: D.text }}>
              Este es un ejemplo de texto con el tamaño seleccionado.
            </Text>
          </View>
        </View>

        {/* ACCESIBILIDAD AVANZADA */}
        <Text style={[styles.sectionTitle, { color: D.textSecondary }]}>ACCESIBILIDAD AVANZADA</Text>
        <View style={[styles.card, { backgroundColor: D.card, borderColor: D.border }]}>

          <View style={[styles.switchRow, { borderBottomColor: D.separator }]}>
            <View style={styles.switchLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="contrast-outline" size={18} color="#3B82F6" />
              </View>
              <View style={styles.switchTexts}>
                <Text style={[styles.switchTitle, { color: D.text }]}>Alto contraste</Text>
                <Text style={[styles.switchSub, { color: D.textSecondary }]}>Mejora la legibilidad</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={prefs.highContrast ? '#FFFFFF' : '#F4F4F4'}
              onValueChange={(v) => update({ highContrast: v })}
              value={prefs.highContrast}
              accessibilityLabel={`Alto contraste ${prefs.highContrast ? 'activado' : 'desactivado'}`}
            />
          </View>

          <View style={[styles.switchRow, styles.switchRowLast]}>
            <View style={styles.switchLeft}>
              <View style={styles.iconBox}>
                <Ionicons name="speedometer-outline" size={18} color="#3B82F6" />
              </View>
              <View style={styles.switchTexts}>
                <Text style={[styles.switchTitle, { color: D.text }]}>Reducir animaciones</Text>
                <Text style={[styles.switchSub, { color: D.textSecondary }]}>Minimiza movimientos</Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#E2E8F0', true: '#93C5FD' }}
              thumbColor={prefs.reduceAnimations ? '#FFFFFF' : '#F4F4F4'}
              onValueChange={(v) => update({ reduceAnimations: v })}
              value={prefs.reduceAnimations}
              accessibilityLabel={`Reducir animaciones ${prefs.reduceAnimations ? 'activado' : 'desactivado'}`}
            />
          </View>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// Tokens de tema — claro y oscuro (preview local del screen)
const LIGHT = {
  bg: '#F8FAFC',
  header: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',
  separator: '#F1F5F9',
  text: '#1E293B',
  textSecondary: '#64748B',
};
const DARK = {
  bg: '#111827',
  header: '#1F2937',
  card: '#1F2937',
  border: '#374151',
  separator: '#374151',
  text: '#F9FAFB',
  textSecondary: '#9CA3AF',
};

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerBack: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: { width: 40 },

  // Scroll
  scroll: { paddingBottom: 40 },

  // Sección
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 14,
  },
  cardLabel: { fontSize: 12, marginBottom: 12 },

  // Selector de tema
  themeRow: { flexDirection: 'row', gap: 8 },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    gap: 4,
  },
  themeLabel: { fontSize: 13, fontWeight: '500' },

  // Selector de tamaño de fuente
  fontSizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 14,
    marginTop: 4,
  },
  fontSizeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  fontSizeBtnSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  fontSizeLetter: { fontWeight: '800', color: '#64748B' },
  fontSizeLetterSelected: { color: '#FFFFFF' },
  previewText: {
    padding: 12,
    borderRadius: 8,
    marginTop: 4,
  },

  // Filas con Switch
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  switchRowLast: { borderBottomWidth: 0 },
  switchLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchTexts: { flex: 1 },
  switchTitle: { fontSize: 14, fontWeight: '600' },
  switchSub: { fontSize: 12, marginTop: 2 },
});
