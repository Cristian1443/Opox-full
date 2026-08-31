import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 12.4 · Dispositivos ────────────────────────────────────────────────────
// Fiel al Figma (DispositivosScreen.tsx). El TSX de referencia genericiza
// "Apple Watch"/"Garmin" a nombres ficticios para no reproducir marcas en el
// diseño entregado — eso aplica a ESE documento de diseño, no a la app real:
// aquí sí son nombres reales de hardware que el usuario necesita reconocer
// para saber si su dispositivo es compatible, así que se mantienen tal como
// ya estaban en el código real.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  textDisabled: 'rgba(65, 41, 80, 0.3)',
  cardBorder: 'rgba(65, 41, 80, 0.15)',
  banner: 'rgba(159, 110, 228, 0.75)',
};

// TODO: cargar desde user_connected_devices — endpoint GET /health/devices (Bloque 3 backend pendiente)
const MOCK_DEVICES = [
  {
    id: '1',
    name: 'Apple Watch',
    icon: 'watch-outline',
    isConnected: true,
    lastSync: '2 min',
  },
  {
    id: '2',
    name: 'Garmin',
    icon: 'pulse-outline',
    isConnected: false,
    lastSync: null,
  },
];

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function EmptyDeviceIcon({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={9} stroke={FIGMA.textDisabled} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

function DeviceCard({ device, onConnect, onDisconnect }) {
  return (
    <View style={[styles.deviceCard, device.isConnected && styles.deviceCardConnected]}>
      {device.isConnected
        ? <Ionicons name={device.icon} size={26} color={colors.accentOrange} />
        : <EmptyDeviceIcon />
      }
      <View style={styles.deviceTextWrap}>
        <Text style={styles.deviceName}>{device.name}</Text>
        {device.isConnected ? (
          <Text style={styles.deviceStatus}>Sincronizado hace {device.lastSync}</Text>
        ) : (
          <Text style={styles.deviceStatusMuted}>No conectado</Text>
        )}
      </View>
      {device.isConnected ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onDisconnect(device.id)}
          accessibilityLabel={`Quitar ${device.name}`}
        >
          <Text style={styles.actionLink}>Quitar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onConnect(device.id)}
          accessibilityLabel={`Conectar ${device.name}`}
        >
          <Text style={styles.actionLink}>Conectar</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function ConfigDevicesScreen({ navigation }) {
  const [devices, setDevices] = useState(MOCK_DEVICES);

  // Conectar → reutiliza el flujo de pairing del Bloque 3 (ya implementado)
  const handleConnect = () => {
    navigation.navigate('ConnectDevice');
  };

  const handleDisconnect = (id) => {
    const device = devices.find((d) => d.id === id);
    Alert.alert(
      'Quitar dispositivo',
      `¿Seguro que quieres desconectar ${device?.name}? Dejarás de recibir datos de fatiga.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Quitar',
          style: 'destructive',
          onPress: () => {
            // TODO: llamar a endpoint DELETE /health/devices/:id (Bloque 3 backend)
            setDevices((prev) =>
              prev.map((d) => d.id === id ? { ...d, isConnected: false, lastSync: null } : d),
            );
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
        {devices.length > 0 ? (
          <View style={styles.deviceList}>
            {devices.map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                onConnect={handleConnect}
                onDisconnect={handleDisconnect}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="watch-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No tienes dispositivos conectados.</Text>
          </View>
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
  deviceStatusMuted: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textDisabled,
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
