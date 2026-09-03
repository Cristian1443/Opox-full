import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar, Alert, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
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

// Ruta exacta exportada de Figma (mismo ícono de tarjeta que Ajustes, 83×56).
function CardIcon({ size = 28 }) {
  return (
    <Svg width={size} height={size * (56 / 83)} viewBox="0 0 83 56" fill="none">
      <Path d="M76.4447 0H6.55531C4.81725 0.00165989 3.15086 0.683214 1.92186 1.89508C0.69287 3.10695 0.00168335 4.75011 0 6.46395L0 49.5298C-8.16489e-07 51.2447 0.690443 52.8895 1.91962 54.1027C3.1488 55.3159 4.81615 55.9983 6.55531 56H76.4447C78.1839 55.9983 79.8512 55.3159 81.0804 54.1027C82.3096 52.8895 83 51.2447 83 49.5298V6.46395C82.9983 4.75011 82.3071 3.10695 81.0781 1.89508C79.8491 0.683214 78.1828 0.00165989 76.4447 0ZM4.36809 17.2288H78.6319V21.536H4.36809V17.2288ZM6.55531 4.30721H76.4447C77.0248 4.30721 77.5811 4.53444 77.9913 4.9389C78.4015 5.34337 78.6319 5.89195 78.6319 6.46395V12.9216H4.36809V6.46395C4.36809 5.89195 4.59853 5.34337 5.00871 4.9389C5.41889 4.53444 5.97522 4.30721 6.55531 4.30721ZM76.4447 51.6865H6.55531C6.26784 51.6874 5.98305 51.6321 5.7173 51.524C5.45156 51.4159 5.21011 51.2571 5.00684 51.0567C4.80357 50.8562 4.64249 50.6182 4.53287 50.3561C4.42325 50.0941 4.36725 49.8132 4.36809 49.5298V25.8433H78.6319V49.5298C78.6328 49.8132 78.5768 50.0941 78.4671 50.3561C78.3575 50.6182 78.1964 50.8562 77.9932 51.0567C77.7899 51.2571 77.5484 51.4159 77.2827 51.524C77.017 51.6321 76.7322 51.6874 76.4447 51.6865Z" fill={colors.accentOrange} />
      <Path d="M10.9233 38.7649H19.6594C20.2183 38.7352 20.7443 38.4953 21.1293 38.0947C21.5142 37.6941 21.7288 37.1632 21.7288 36.6113C21.7288 36.0595 21.5142 35.5286 21.1293 35.128C20.7443 34.7273 20.2183 34.4875 19.6594 34.4577H10.9233C10.6265 34.4419 10.3297 34.4859 10.0508 34.587C9.77185 34.6881 9.51675 34.8442 9.30104 35.0457C9.08533 35.2473 8.91353 35.49 8.79612 35.7592C8.67872 36.0284 8.61816 36.3183 8.61816 36.6113C8.61816 36.9043 8.67872 37.1943 8.79612 37.4635C8.91353 37.7326 9.08533 37.9754 9.30104 38.1769C9.51675 38.3785 9.77185 38.5345 10.0508 38.6356C10.3297 38.7367 10.6265 38.7807 10.9233 38.7649Z" fill={colors.accentOrange} />
      <Path d="M28.3959 38.7649H37.1321C37.691 38.7352 38.217 38.4953 38.6019 38.0947C38.9869 37.6941 39.2014 37.1632 39.2014 36.6113C39.2014 36.0595 38.9869 35.5286 38.6019 35.128C38.217 34.7273 37.691 34.4875 37.1321 34.4577H28.3959C28.0992 34.4419 27.8023 34.4859 27.5234 34.587C27.2445 34.6881 26.9894 34.8442 26.7737 35.0457C26.558 35.2473 26.3862 35.49 26.2688 35.7592C26.1514 36.0284 26.0908 36.3183 26.0908 36.6113C26.0908 36.9043 26.1514 37.1943 26.2688 37.4635C26.3862 37.7326 26.558 37.9754 26.7737 38.1769C26.9894 38.3785 27.2445 38.5345 27.5234 38.6356C27.8023 38.7367 28.0992 38.7807 28.3959 38.7649Z" fill={colors.accentOrange} />
      <Path d="M41.4999 43.072H10.9233C10.6265 43.0562 10.3297 43.1002 10.0508 43.2013C9.77185 43.3024 9.51675 43.4585 9.30104 43.66C9.08533 43.8615 8.91353 44.1043 8.79612 44.3735C8.67872 44.6426 8.61816 44.9326 8.61816 45.2256C8.61816 45.5186 8.67872 45.8085 8.79612 46.0777C8.91353 46.3469 9.08533 46.5897 9.30104 46.7912C9.51675 46.9927 9.77185 47.1488 10.0508 47.2499C10.3297 47.351 10.6265 47.395 10.9233 47.3792H41.4999C42.0587 47.3494 42.5848 47.1096 42.9697 46.709C43.3547 46.3084 43.5692 45.7775 43.5692 45.2256C43.5692 44.6737 43.3547 44.1428 42.9697 43.7422C42.5848 43.3416 42.0587 43.1017 41.4999 43.072Z" fill={colors.accentOrange} />
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
