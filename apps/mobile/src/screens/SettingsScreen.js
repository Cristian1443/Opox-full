import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Rect, Line } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, storeApi, settingsApi } from '../api';
import { colors, spacing } from '../theme';

// ─── 12.1 · Ajustes · hub principal ────────────────────────────────────────
// Fiel al Figma (HomeConfigScreen.tsx). El reference no muestra la fila
// "Tu opinión" (Feedback) ni las acciones de sesión (cerrar sesión / eliminar
// cuenta) — son funcionalidad real imprescindible (sin logout no hay forma
// de salir de la cuenta) y se conservan, añadidas al final de la lista plana
// que sí confirma Figma. El saldo de Opopoints en el header es un dato real
// (mismo sistema de Bloque 11 · Tienda) que se conecta con storeApi.getBalance().
// El tono de la IA y la probabilidad de aprobado también son datos reales
// (GET /config/preferences y GET /config/pro-stats) en vez de los valores
// fijos que mostraba el diseño.
const TONE_KEY = 'opox.ai.tone';
const PERSONALITY_LABELS = { cercano: 'Cercano', equilibrado: 'Equilibrado', exigente: 'Exigente' };

const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
  highlightBg: '#F5F5F7',
};

function resetToSplash(navigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function AvatarIcon({ size = 96 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} stroke={colors.purple} strokeWidth={1.4} fill="none" />
      <Circle cx={12} cy={9.5} r={3.3} stroke={colors.purple} strokeWidth={1.4} fill="none" />
      <Path d="M5.5 19C6.8 16.2 9.1 14.7 12 14.7C14.9 14.7 17.2 16.2 18.5 19" stroke={colors.purple} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function PersonIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={3.4} stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M5 20C6 16.5 8.7 14.7 12 14.7C15.3 14.7 18 16.5 19 20" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function CardIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2.5} y={5} width={19} height={14} rx={2.2} stroke={color} strokeWidth={1.6} fill="none" />
      <Line x1={2.5} y1={9.5} x2={21.5} y2={9.5} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}

function DeviceIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={7} y={2} width={10} height={20} rx={2} stroke={color} strokeWidth={1.6} fill="none" />
      <Line x1={10.5} y1={18.3} x2={13.5} y2={18.3} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

function SparkleIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3L13.6 9.4L20 11L13.6 12.6L12 19L10.4 12.6L4 11L10.4 9.4L12 3Z" fill={color} />
    </Svg>
  );
}

function ChartIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={3.5} y={13} width={3.4} height={7.5} rx={0.8} fill={color} />
      <Rect x={10.3} y={8} width={3.4} height={12.5} rx={0.8} fill={color} />
      <Rect x={17.1} y={4} width={3.4} height={16.5} rx={0.8} fill={color} />
    </Svg>
  );
}

function AccessibilityIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={12} cy={7.3} r={1.6} fill={color} />
      <Path d="M6 10.2C8 10.9 10 11.2 12 11.2C14 11.2 16 10.9 18 10.2M12 11.2V20M12 14.5L9 20M12 14.5L15 20" stroke={color} strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function HelpIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9.5} stroke={color} strokeWidth={1.5} fill="none" />
      <Circle cx={12} cy={12} r={4} stroke={color} strokeWidth={1.3} fill="none" />
      <Line x1={5.3} y1={5.3} x2={9.2} y2={9.2} stroke={color} strokeWidth={1.3} />
      <Line x1={18.7} y1={5.3} x2={14.8} y2={9.2} stroke={color} strokeWidth={1.3} />
      <Line x1={5.3} y1={18.7} x2={9.2} y2={14.8} stroke={color} strokeWidth={1.3} />
      <Line x1={18.7} y1={18.7} x2={14.8} y2={14.8} stroke={color} strokeWidth={1.3} />
    </Svg>
  );
}

// Sin equivalente en Figma (la fila "Tu opinión" no está en el reference) —
// bocadillo de chat genérico, mismo lenguaje visual que el resto de íconos.
function FeedbackIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M3 5.5C3 4.1 4.1 3 5.5 3H18.5C19.9 3 21 4.1 21 5.5V14.5C21 15.9 19.9 17 18.5 17H9L4.5 20.5V17H5.5C4.1 17 3 15.9 3 14.5V5.5Z" stroke={color} strokeWidth={1.5} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [opopoints, setOpopoints] = useState(null);
  const [toneLabel, setToneLabel] = useState('Equilibrado');
  const [probLabel, setProbLabel] = useState(null); // null = sin datos aún

  useFocusEffect(useCallback(() => {
    let cancelled = false;

    async function load() {
      // Perfil de usuario
      const { data } = await authApi.me();
      if (!cancelled && data) setUser(data);

      // Saldo de Opopoints (Bloque 11 · Tienda)
      storeApi.getBalance().then((res) => {
        if (!cancelled && res?.data) setOpopoints(res.data.balance);
      });

      // Tono: AsyncStorage primero (rápido), luego backend como fuente de verdad
      try {
        const raw = await AsyncStorage.getItem(TONE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw);
          setToneLabel(PERSONALITY_LABELS[parsed.personality] ?? 'Equilibrado');
        }
      } catch { /* fallo silencioso */ }

      const prefsRes = await settingsApi.getPreferences();
      if (!cancelled && !prefsRes?.error && prefsRes?.data?.personality) {
        setToneLabel(PERSONALITY_LABELS[prefsRes.data.personality] ?? 'Equilibrado');
      }

      // Probabilidad de aprobado desde pro-stats
      const statsRes = await settingsApi.getProStats();
      if (!cancelled && !statsRes?.error && statsRes?.data) {
        setProbLabel(`${statsRes.data.passedProbabilityPct}% Prob. Aprobado`);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []));

  const oposicionLine = [user?.oposicion, user?.especialidad].filter(Boolean).join(' · ')
    || 'Configura tu oposición';

  // TODO: leer estado de suscripción real desde RevenueCat/backend
  const subscriptionSubtext = 'Premium · renueva 14 jul';

  const MENU_ROWS = [
    {
      id: 'perfil',
      icon: PersonIcon,
      label: 'Perfil y biometría',
      subtitle: oposicionLine,
      onPress: () => navigation.navigate('ConfigPerfil'),
    },
    {
      id: 'suscripcion',
      icon: CardIcon,
      label: 'Suscripción',
      subtitle: subscriptionSubtext,
      highlighted: true,
      onPress: () => navigation.navigate('ConfigSubscription'),
    },
    {
      id: 'dispositivos',
      icon: DeviceIcon,
      label: 'Dispositivos conectados',
      // TODO: cargar count real desde user_devices (Bloque 3)
      subtitle: 'Sin dispositivos',
      onPress: () => navigation.navigate('ConfigDevices'),
    },
    {
      id: 'tono-ia',
      icon: SparkleIcon,
      label: 'Tono de la IA',
      subtitle: toneLabel,
      onPress: () => navigation.navigate('ConfigTone'),
    },
    {
      id: 'estadisticas',
      icon: ChartIcon,
      label: 'Estadísticas Pro',
      subtitle: probLabel ?? 'Calculando…',
      onPress: () => navigation.navigate('ConfigStats'),
    },
    {
      id: 'accesibilidad',
      icon: AccessibilityIcon,
      label: 'Accesibilidad',
      // Preferencia local — AsyncStorage, no necesita backend
      subtitle: 'Tema automático',
      onPress: () => navigation.navigate('ConfigAccessibility'),
    },
    {
      id: 'ayuda',
      icon: HelpIcon,
      label: 'Ayuda y soporte',
      subtitle: 'FAQ y Chat',
      onPress: () => navigation.navigate('ConfigHelp'),
    },
    {
      id: 'feedback',
      icon: FeedbackIcon,
      label: 'Tu opinión',
      subtitle: 'Sugerencias y errores',
      onPress: () => navigation.navigate('ConfigFeedback'),
    },
  ];

  const handleLogout = async () => {
    await authApi.logout();
    resetToSplash(navigation);
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
        <Text style={styles.headerTitle}>Ajustes</Text>
        <View style={styles.iconButton} />
      </View>

      {/* ── Perfil ──────────────────────────────────────────────────── */}
      <View style={styles.profileBlock}>
        <AvatarIcon />
        <Text style={styles.userName} numberOfLines={1}>{user?.displayName || 'Opositor'}</Text>
        <Text style={styles.userPoints}>
          {opopoints !== null ? opopoints.toLocaleString('es-ES') : '—'} OpoPoints
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {MENU_ROWS.map((row) => {
          const Icon = row.icon;
          return (
            <TouchableOpacity
              key={row.id}
              style={[styles.row, row.highlighted && styles.rowHighlighted]}
              activeOpacity={0.7}
              onPress={row.onPress}
              accessibilityLabel={row.label}
            >
              <Icon />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowLabel}>{row.label}</Text>
                {row.subtitle ? (
                  <Text style={styles.rowSubtitle} numberOfLines={1}>{row.subtitle}</Text>
                ) : null}
              </View>
              <ChevronRightIcon />
            </TouchableOpacity>
          );
        })}

        {/* ── Acciones de sesión — reales, sin equivalente en Figma ──── */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.navigate('ConfigDeleteAccount')}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar cuenta"
            style={styles.deleteLink}
          >
            <Text style={styles.deleteText}>Eliminar cuenta</Text>
          </TouchableOpacity>
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

  // ── Perfil ────────────────────────────────────────────────────
  profileBlock: {
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: FIGMA.separator,
  },
  userName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textDark,
    marginTop: 10,
  },
  userPoints: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
  },

  // ── Lista ─────────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  rowHighlighted: {
    backgroundColor: FIGMA.highlightBg,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowLabel: {
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

  // ── Acciones de sesión ────────────────────────────────────────
  footer: {
    paddingTop: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  logoutBtn: {
    width: '100%',
    borderWidth: 1,
    borderColor: FIGMA.separator,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  logoutText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textDark,
  },
  deleteLink: {
    paddingVertical: 4,
  },
  deleteText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.statRed,
  },
});
