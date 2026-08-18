import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// TODO: integrar RevenueCat — cargar desde endpoint GET /config/subscription
const MOCK_SUBSCRIPTION = {
  status: 'active',
  planName: 'Plan Premium',
  priceMonthly: '9,99€',
  period: 'mes',
  renewalDate: '14 jul 2026',
  paymentLast4: '6411',
  affiliatePrice: '3,99€',
  affiliateSavings: '60%',
};

// Abre los ajustes de suscripciones del sistema operativo.
// Apple y Google no permiten cancelar/cambiar método de pago desde la app.
async function openSubscriptionSettings() {
  const url = Platform.OS === 'ios'
    ? 'itms-apps://apps.apple.com/account/subscriptions'
    : 'https://play.google.com/store/account/subscriptions';
  try {
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('No disponible', 'Gestiona tu suscripción desde los ajustes de tu dispositivo.');
    }
  } catch {
    Alert.alert('No disponible', 'Gestiona tu suscripción desde los ajustes de tu dispositivo.');
  }
}

export default function ConfigSubscriptionScreen({ navigation }) {
  const sub = MOCK_SUBSCRIPTION;

  const handleChangePlan = () => {
    navigation.navigate('StoreSubscription');
  };

  const handleChangePayment = () => {
    // Apple/Google no permiten gestionar pagos desde la app
    Alert.alert(
      'Cambiar método de pago',
      'Los datos de pago se gestionan desde los ajustes de tu cuenta en la App Store / Google Play.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Ir a ajustes', onPress: openSubscriptionSettings },
      ],
    );
  };

  const handleCancelSubscription = () => {
    Alert.alert(
      'Cancelar suscripción',
      'Las suscripciones se gestionan desde los ajustes de tu cuenta en la App Store / Google Play. Perderás el acceso a Premium al final del periodo actual.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Ir a ajustes',
          style: 'destructive',
          onPress: openSubscriptionSettings,
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
        <View style={styles.headerCenter}>
          {/* Badge de estado encima del título — diseño del cliente */}
          <View style={styles.statusBadge}>
            <Ionicons name="checkmark-circle" size={15} color={colors.success} />
            <Text style={styles.statusText}>ACTIVO</Text>
          </View>
          <Text style={styles.headerTitle}>Mi suscripción</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* TARJETA DE PLAN ACTUAL */}
        <View style={styles.planCard}>
          <Text style={styles.planName}>{sub.planName}</Text>
          <View style={styles.planPriceRow}>
            <Text style={styles.planPrice}>{sub.priceMonthly}</Text>
            <Text style={styles.planPeriod}>/{sub.period}</Text>
          </View>
          <Text style={styles.renewalDate}>
            Próxima renovación:{' '}
            <Text style={styles.renewalDateBold}>{sub.renewalDate}</Text>
          </Text>

          {/* Caja de ahorro por afiliados */}
          <View style={styles.savingsBox}>
            <Ionicons name="leaf-outline" size={20} color="#2563EB" />
            <View style={styles.savingsTexts}>
              <Text style={styles.savingsMain}>
                Con afiliados: pagas {sub.affiliatePrice}/mes
              </Text>
              <Text style={styles.savingsSub}>
                ¡Ahorras un {sub.affiliateSavings} con tu plan de afiliados!
              </Text>
            </View>
          </View>
        </View>

        {/* MÉTODO DE PAGO */}
        <Text style={styles.sectionTitle}>MÉTODO DE PAGO</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={handleChangePayment}
            activeOpacity={0.7}
            accessibilityLabel="Cambiar método de pago"
          >
            <View style={styles.rowInfo}>
              <Text style={styles.rowLabel}>Tarjeta</Text>
              <Text style={styles.rowValue}>•••• {sub.paymentLast4}</Text>
            </View>
            <View style={styles.rowRight}>
              <Ionicons name="card-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
              <Text style={styles.linkText}>Cambiar</Text>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </View>
          </TouchableOpacity>
        </View>

        {/* GESTIÓN */}
        <Text style={styles.sectionTitle}>GESTIÓN</Text>
        <View style={styles.group}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleChangePlan}
            activeOpacity={0.7}
            accessibilityLabel="Cambiar de plan"
          >
            <View style={styles.actionLeft}>
              <Ionicons name="swap-horizontal-outline" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Cambiar de plan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={handleCancelSubscription}
            activeOpacity={0.7}
            accessibilityLabel="Cancelar suscripción"
          >
            <View style={styles.actionLeft}>
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={[styles.actionText, styles.dangerText]}>Cancelar suscripción</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: { padding: 8 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1E293B' },
  headerRight: { width: 40 },

  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.success,
    letterSpacing: 0.5,
  },

  // Scroll
  scroll: { paddingBottom: 40 },

  // Plan card
  planCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  planName: { fontSize: 18, fontWeight: '700', color: '#1E293B', marginBottom: 4 },
  planPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2, marginTop: 6 },
  planPrice: { fontSize: 26, fontWeight: '800', color: '#1E293B' },
  planPeriod: { fontSize: 16, color: '#64748B' },
  renewalDate: { fontSize: 13, color: '#64748B', marginTop: 10 },
  renewalDateBold: { fontWeight: '700', color: '#1E293B' },

  savingsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#EFF6FF',
    padding: 12,
    borderRadius: 10,
    marginTop: 14,
  },
  savingsTexts: { flex: 1 },
  savingsMain: { fontSize: 13, fontWeight: '600', color: '#2563EB' },
  savingsSub: { fontSize: 11, color: '#2563EB', marginTop: 2 },

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
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: { borderBottomWidth: 0 },

  // Fila de pago
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  rowValue: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  linkText: { fontSize: 14, fontWeight: '600', color: '#2563EB', marginRight: 4 },

  // Filas de acciones
  actionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  actionText: { fontSize: 15, fontWeight: '500', color: '#1E293B' },
  dangerText: { color: colors.error, fontWeight: '600' },
});
