import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api';
import { colors } from '../theme';

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function resetToSplash(navigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

export default function SettingsScreen({ navigation }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    authApi.me().then(({ data }) => { if (data) setUser(data); });
  }, []);

  const oposicionLine = [user?.oposicion, user?.especialidad].filter(Boolean).join(' · ')
    || 'Configura tu oposición';

  // TODO: leer estado de suscripción real desde RevenueCat/backend
  const subscriptionSubtext = 'Premium · renueva 14 jul';

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
          subtext: subscriptionSubtext,
          onPress: () => navigation.navigate('ConfigSubscription'),
        },
        {
          id: 'dispositivos',
          title: 'Dispositivos conectados',
          icon: 'pulse-outline',
          subtext: 'Sin dispositivos',
          // TODO: cargar count real desde user_devices (Bloque 3)
          onPress: () => navigation.navigate('ConfigDevices'),
        },
        {
          id: 'tono-ia',
          title: 'Tono de la IA',
          icon: 'chatbubbles-outline',
          subtext: 'Equilibrado',
          // TODO: leer preferencia desde perfil Supabase o AsyncStorage
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
          subtext: '78% Prob. Aprobado',
          // TODO: calcular desde training_attempt_responses — endpoint GET /config/pro-stats
          onPress: () => navigation.navigate('ConfigStats'),
        },
        {
          id: 'accesibilidad',
          title: 'Accesibilidad',
          icon: 'accessibility-outline',
          subtext: 'Tema automático',
          // Preferencia local — AsyncStorage, no necesita backend
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
          {/* Cerrar — va a la derecha (no back, Settings es un destino de tab) */}
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

        {/* ACCIONES DE SESIÓN — separadas por seguridad UX */}
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
  // Elimina borde inferior del último item para evitar doble línea con el grupo
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
