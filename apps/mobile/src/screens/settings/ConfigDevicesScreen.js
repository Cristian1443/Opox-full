import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

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

function DeviceCard({ device, onConnect, onDisconnect }) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceLeft}>
        <View style={[
          styles.deviceIcon,
          device.isConnected && styles.deviceIconConnected,
        ]}>
          <Ionicons
            name={device.icon}
            size={26}
            color={device.isConnected ? '#3B82F6' : '#CBD5E1'}
          />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.name}</Text>
          {device.isConnected
            ? (
              <Text style={styles.statusConnected}>
                Sincronizado hace {device.lastSync}
              </Text>
            ) : (
              <Text style={styles.statusDisconnected}>No conectado</Text>
            )
          }
        </View>
      </View>

      {device.isConnected ? (
        <TouchableOpacity
          style={styles.disconnectBtn}
          onPress={() => onDisconnect(device.id)}
          activeOpacity={0.7}
          accessibilityLabel={`Quitar ${device.name}`}
        >
          <Text style={styles.disconnectText}>Quitar</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.connectBtn}
          onPress={() => onConnect(device.id)}
          activeOpacity={0.7}
          accessibilityLabel={`Conectar ${device.name}`}
        >
          <Text style={styles.connectText}>Conectar</Text>
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Dispositivos</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <Text style={styles.description}>
          Gestiona tus wearables para el control de fatiga y rendimiento.
        </Text>
        <Text style={styles.privacyNote}>
          Tus datos de salud se procesan de forma segura. Puedes desconectar cuando quieras.
        </Text>

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
          // Estado vacío — cuando no hay ningún dispositivo en la lista
          <View style={styles.emptyState}>
            <Ionicons name="watch-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No tienes dispositivos conectados.</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: { padding: 8 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: '#1E293B' },
  headerRight: { width: 40 },

  // Intro
  scroll: { paddingBottom: 40 },
  description: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 20,
    lineHeight: 20,
  },
  privacyNote: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginHorizontal: 24,
    marginTop: 6,
    fontStyle: 'italic',
  },

  // Lista de dispositivos
  deviceList: { marginTop: 16, gap: 10, paddingHorizontal: 16 },

  // Card de dispositivo
  deviceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  deviceLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  deviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deviceIconConnected: { backgroundColor: '#EFF6FF' },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  statusConnected: { fontSize: 12, fontWeight: '500', color: colors.success },
  statusDisconnected: { fontSize: 12, color: '#64748B' },

  // Botones de acción
  connectBtn: {
    backgroundColor: '#3B82F6',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  connectText: { fontSize: 13, fontWeight: '700', color: '#FFFFFF' },
  disconnectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  disconnectText: { fontSize: 13, fontWeight: '700', color: colors.error },

  // Estado vacío
  emptyState: {
    alignItems: 'center',
    marginTop: 60,
    gap: 12,
  },
  emptyText: { fontSize: 15, color: '#64748B', textAlign: 'center' },
});
