import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Rect, Line } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 12.3 · Mi suscripción ──────────────────────────────────────────────────
// Fiel al Figma (SuscripcionScreen.tsx). Apple y Google NO permiten
// gestionar pagos ni cancelar suscripciones directamente desde la app — el
// diseño muestra "Cambiar"/"Cancelar suscripción" como si fueran acciones
// in-app, pero el comportamiento real (confirmar y redirigir a los ajustes
// de suscripciones del sistema operativo) es una restricción de política de
// las tiendas, no negociable, y se conserva sin cambios.
const FIGMA = {
  cardBorder: 'rgba(65, 41, 80, 0.3)',
  textMuted: 'rgba(65, 41, 80, 0.5)',
  // Aproximado visualmente: no se pudo confirmar el hex exacto del badge
  // "ACTIVO" en el panel de Diseño de Figma.
  activeBadge: '#FF6B4A',
};

// TODO: integrar RevenueCat — cargar desde endpoint GET /config/subscription
const MOCK_SUBSCRIPTION = {
  status: 'active',
  planName: 'Premium',
  priceMonthly: '9,99€',
  period: 'mes',
  renewalDate: '14 jul 2026',
  paymentLast4: '6411',
  cardBrand: 'VISA',
  affiliatePrice: '3,99€',
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

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CardIcon({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={5} width={20} height={14} rx={2.2} fill={colors.accentOrange} />
      <Line x1={2} y1={9.5} x2={22} y2={9.5} stroke={colors.white} strokeWidth={1.6} />
    </Svg>
  );
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
        <Text style={styles.headerTitle}>Mi suscripción</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Tarjeta de plan ───────────────────────────────────────── */}
        <View style={styles.planCard}>
          <View style={styles.planCardTopRow}>
            <Text style={styles.planName}>{sub.planName}</Text>
            <View style={styles.activoBadge}>
              <Text style={styles.activoBadgeText}>ACTIVO</Text>
            </View>
          </View>
          <Text style={styles.planPrice}>
            {sub.priceMonthly}/{sub.period} · próxima renovación {sub.renewalDate}
          </Text>
          <Text style={styles.affiliateLine}>Con afiliados: pagas {sub.affiliatePrice}/mes</Text>
        </View>

        {/* ── Método de pago ────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>MÉTODO DE PAGO</Text>
        <TouchableOpacity
          style={styles.paymentRow}
          activeOpacity={0.7}
          onPress={handleChangePayment}
          accessibilityLabel="Cambiar método de pago"
        >
          <CardIcon />
          <View style={styles.paymentTextWrap}>
            <Text style={styles.paymentNumber}>•••• {sub.paymentLast4}</Text>
            <Text style={styles.paymentBrand}>{sub.cardBrand}</Text>
          </View>
          <Text style={styles.cambiarLink}>Cambiar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.outlineButton}
          activeOpacity={0.85}
          onPress={handleChangePlan}
          accessibilityLabel="Cambiar de plan"
        >
          <Text style={styles.outlineButtonText}>Cambiar de plan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleCancelSubscription}
          accessibilityLabel="Cancelar suscripción"
        >
          <Text style={styles.cancelText}>Cancelar suscripción</Text>
        </TouchableOpacity>
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

  // ── Contenido ─────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // ── Tarjeta de plan ───────────────────────────────────────────
  planCard: {
    backgroundColor: colors.bannerPurple,
    borderRadius: 12,
    padding: 18,
    marginBottom: spacing.lg,
  },
  planCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  planName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  activoBadge: {
    backgroundColor: FIGMA.activeBadge,
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  activoBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9,
    color: colors.white,
  },
  planPrice: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6,
  },
  affiliateLine: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10.5,
    color: colors.accentOrange,
    marginTop: 4,
  },

  // ── Método de pago ────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  paymentTextWrap: {
    flex: 1,
  },
  paymentNumber: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  paymentBrand: {
    fontFamily: 'Poppins-Regular',
    fontSize: 9,
    color: FIGMA.textMuted,
    marginTop: 1,
  },
  cambiarLink: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },

  // ── Acciones ──────────────────────────────────────────────────
  outlineButton: {
    height: 61.3,
    borderRadius: 14.2,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 4,
  },
  outlineButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textDark,
  },
  cancelText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.activeBadge,
    textAlign: 'center',
  },
});
