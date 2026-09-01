import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
import { healthApi } from '../../api';

// ─── 12.4 · Dispositivos ────────────────────────────────────────────────────
// Fiel al Figma (DispositivosScreen.tsx). El TSX de referencia genericiza
// "Apple Watch"/"Garmin" a nombres ficticios para no reproducir marcas en el
// diseño entregado — eso aplica a ESE documento de diseño, no a la app real:
// aquí sí son nombres reales de hardware que el usuario necesita reconocer
// para saber si su dispositivo es compatible, así que se mantienen tal como
// ya estaban en el código real. La lista viene de GET /health/devices — solo
// incluye dispositivos ya conectados (desconectar quita la fila; conectar
// navega a ConnectDevice), así que no existe un estado "tarjeta desconectada".
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  textDisabled: 'rgba(65, 41, 80, 0.3)',
  cardBorder: 'rgba(65, 41, 80, 0.15)',
  banner: 'rgba(159, 110, 228, 0.75)',
};

// Formatea una fecha ISO a "X min", "X h" o "X d" para mostrar como lastSync
function formatRelative(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(1, diffMin)} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return `${Math.round(diffH / 24)} d`;
}

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function DeviceCard({ device, onDisconnect }) {
  return (
    <View style={[styles.deviceCard, styles.deviceCardConnected]}>
      <Ionicons name={device.icon || 'watch-outline'} size={26} color={colors.accentOrange} />
      <View style={styles.deviceTextWrap}>
        <Text style={styles.deviceName}>{device.deviceName}</Text>
        <Text style={styles.deviceStatus}>Sincronizado hace {formatRelative(device.connectedAt)}</Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onDisconnect(device)}
        accessibilityLabel={`Quitar ${device.deviceName}`}
      >
        <Text style={styles.actionLink}>Quitar</Text>
      </TouchableOpacity>
    </View>
  );
}

export default function ConfigDevicesScreen({ navigation }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const res = await healthApi.getDevices();
      if (!cancelled) {
        setDevices(!res?.error && Array.isArray(res?.data) ? res.data : []);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []));

  const handleConnect = () => {
    navigation.navigate('ConnectDevice');
  };

  const handleDisconnect = (device) => {
    Alert.alert(
      'Quitar dispositivo',
      `¿Seguro que quieres desconectar ${device.deviceName}? Dejarás de recibir datos de fatiga.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: async () => {
            const res = await healthApi.deleteDevice(device.id);
            if (!res?.error) {
              setDevices((prev) => prev.filter((d) => d.id !== device.id));
            }
          },
        },
      ],
    );
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
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Dispositivos</Text>
          <Text style={styles.headerSubtitle}>Gestiona tus wearables para el control de fatiga.</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.accentOrange} />
          </View>
        ) : devices.length > 0 ? (
          <View style={styles.deviceList}>
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onDisconnect={handleDisconnect}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="watch-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No tienes dispositivos conectados.</Text>
            <TouchableOpacity
              style={styles.connectBtnLarge}
              onPress={handleConnect}
              activeOpacity={0.85}
              accessibilityLabel="Conectar dispositivo"
            >
              <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" />
              <Text style={styles.connectBtnText}>Conectar dispositivo</Text>
            </TouchableOpacity>
          </View>
        )}

        {devices.length > 0 && (
          <TouchableOpacity
            style={styles.addMore}
            onPress={handleConnect}
            activeOpacity={0.7}
            accessibilityLabel="Añadir otro dispositivo"
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.accentOrange} />
            <Text style={styles.addMoreText}>Añadir dispositivo</Text>
          </TouchableOpacity>
        )}

        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            Tus datos de salud se procesan de forma segura para el control de fatiga. Puedes desconectar cuando quieras.
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
  loadingBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  deviceList: {
    gap: 14,
  },
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 12,
    padding: 16,
  },
  deviceCardConnected: {
    borderColor: colors.ctaGreen,
  },
  deviceTextWrap: {
    flex: 1,
  },
  deviceName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  deviceStatus: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
  },
  actionLink: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },

  // ── Vacío ─────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: spacing.sm + 4,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  connectBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.purple,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 4,
  },
  connectBtnText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.white,
  },

  // ── Añadir otro dispositivo ────────────────────────────────────
  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingVertical: 8,
  },
  addMoreText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.accentOrange,
  },

  // ── Banner de privacidad ──────────────────────────────────────
  banner: {
    backgroundColor: FIGMA.banner,
    borderRadius: 10,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  bannerText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.white,
    textAlign: 'center',
    lineHeight: 16,
  },
});
