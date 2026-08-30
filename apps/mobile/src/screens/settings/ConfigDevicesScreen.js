import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../theme';
import { healthApi } from '../../api';

// Formatea una fecha ISO a "X min", "X h" o "X d" para mostrar como lastSync
function formatRelative(isoString) {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.round(diffMs / 60000);
  if (diffMin < 60) return `${Math.max(1, diffMin)} min`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} h`;
  return `${Math.round(diffH / 24)} d`;
}

function DeviceCard({ device, onDisconnect }) {
  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceLeft}>
        <View style={styles.deviceIconConnected}>
          <Ionicons name={device.icon || 'watch-outline'} size={26} color="#3B82F6" />
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{device.deviceName}</Text>
          <Text style={styles.statusConnected}>
            Conectado hace {formatRelative(device.connectedAt)}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={styles.disconnectBtn}
        onPress={() => onDisconnect(device)}
        activeOpacity={0.7}
        accessibilityLabel={`Quitar ${device.deviceName}`}
      >
        <Text style={styles.disconnectText}>Quitar</Text>
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

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
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
            <Ionicons name="watch-outline" size={48} color="#CBD5E1" />
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
            <Ionicons name="add-circle-outline" size={18} color="#3B82F6" />
            <Text style={styles.addMoreText}>Añadir dispositivo</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },

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

  loadingBox: { alignItems: 'center', marginTop: 40 },

  deviceList: { marginTop: 16, gap: 10, paddingHorizontal: 16 },

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
  deviceIconConnected: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  deviceInfo: { flex: 1 },
  deviceName: { fontSize: 15, fontWeight: '700', color: '#1E293B', marginBottom: 3 },
  statusConnected: { fontSize: 12, fontWeight: '500', color: colors.success },

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

  emptyState: { alignItems: 'center', marginTop: 60, gap: 12, paddingHorizontal: 24 },
  emptyText: { fontSize: 15, color: '#64748B', textAlign: 'center' },
  connectBtnLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#3B82F6',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 4,
  },
  connectBtnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },

  addMore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  addMoreText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
});
