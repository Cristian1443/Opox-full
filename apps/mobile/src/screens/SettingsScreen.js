import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, settingsApi } from '../api';
import { colors } from '../theme';

const TONE_KEY = 'opox.ai.tone';
const PERSONALITY_LABELS = { cercano: 'Cercano', equilibrado: 'Equilibrado', exigente: 'Exigente' };

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function resetToSplash(navigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [toneLabel, setToneLabel] = useState('Equilibrado');
  const [probLabel, setProbLabel] = useState(null); // null = sin datos aún

  useFocusEffect(useCallback(() => {
    let cancelled = false;

    async function load() {
      // Perfil de usuario
      const { data } = await authApi.me();
      if (!cancelled && data) setUser(data);

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

  const SETTINGS = [
    {
      group: 'CUENTA',
      items: [
        {
          id: 'perfil',
          title: 'Perfil y biometría',
          icon: 'person-outline',
          subtext: oposicionLine,
          onPress: () => navigation.navigate('ConfigPerfil'),
        },
        {
          id: 'suscripcion',
          title: 'Suscripción',
          icon: 'card-outline',
          subtext: 'Gestionar plan',
          onPress: () => navigation.navigate('ConfigSubscription'),
        },
        {
          id: 'dispositivos',
          title: 'Dispositivos conectados',
          icon: 'pulse-outline',
          subtext: 'Wearables y salud',
          onPress: () => navigation.navigate('ConfigDevices'),
        },
        {
          id: 'tono-ia',
          title: 'Tono de la IA',
          icon: 'chatbubbles-outline',
          subtext: toneLabel,
          onPress: () => navigation.navigate('ConfigTone'),
        },
      ],
    },
    {
      group: 'APLICACIÓN',
      items: [
        {
          id: 'estadisticas',
          title: 'Estadísticas Pro',
          icon: 'bar-chart-outline',
          subtext: probLabel ?? 'Calculando…',
          onPress: () => navigation.navigate('ConfigStats'),
        },
        {
          id: 'accesibilidad',
          title: 'Accesibilidad',
          icon: 'accessibility-outline',
          subtext: 'Tema y fuente',
          onPress: () => navigation.navigate('ConfigAccessibility'),
        },
        {
          id: 'ayuda',
          title: 'Ayuda y soporte',
          icon: 'help-circle-outline',
          subtext: 'FAQ y Chat',
          onPress: () => navigation.navigate('ConfigHelp'),
        },
        {
          id: 'feedback',
          title: 'Tu opinión',
          icon: 'chatbubble-outline',
          subtext: 'Sugerencias y errores',
          onPress: () => navigation.navigate('ConfigFeedback'),
        },
      ],
    },
  ];

  const handleLogout = async () => {
    await authApi.logout();
    resetToSplash(navigation);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* HEADER con perfil */}
      <View style={styles.header}>
        <View style={styles.profileRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(user?.displayName)}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{user?.displayName || 'Opositor'}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText} numberOfLines={1}>{oposicionLine}</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar ajustes"
            style={styles.closeBtn}
          >
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {SETTINGS.map((section) => (
          <View key={section.group}>
            <Text style={styles.sectionTitle}>{section.group}</Text>
            <View style={styles.group}>
              {section.items.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.row, idx === section.items.length - 1 && styles.rowLast]}
                  onPress={item.onPress}
                  activeOpacity={0.7}
                  accessibilityLabel={item.title}
                >
                  <View style={styles.rowLeft}>
                    <Ionicons name={item.icon} size={22} color="#64748B" />
                    <View style={styles.rowTexts}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      {item.subtext ? (
                        <Text style={styles.rowSub} numberOfLines={1}>{item.subtext}</Text>
                      ) : null}
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        {/* ACCIONES DE SESIÓN */}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  userInfo: { flex: 1 },
  userName: { fontSize: 16, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: colors.success,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: colors.success },
  closeBtn: { padding: 4 },

  // Scroll
  scroll: { paddingBottom: 32 },

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
  group: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  rowTexts: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  rowSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  // Footer
  footer: { paddingHorizontal: 16, paddingTop: 32, alignItems: 'center', gap: 12 },
  logoutBtn: {
    width: '100%',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  deleteLink: { paddingVertical: 4 },
  deleteText: { fontSize: 13, fontWeight: '600', color: colors.error },
});
