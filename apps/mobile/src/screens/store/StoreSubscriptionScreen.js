import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import PaymentErrorModal from '../../components/PaymentErrorModal';

// ─── 11.2 · Tienda · Planes ─────────────────────────────────────────────────
// Fiel al Figma (SuscripcionesScreen.tsx, título confirmado "Planes"). El
// reference solo captura una comparativa estática de 3 filas con un único
// CTA "Suscribirme a premium"; la app real ofrece un botón de suscripción
// por plan (incluye "Anual" con badge de ahorro), prueba social y garantías
// — todo eso es funcionalidad real de conversión que se conserva, solo se
// reestiliza con la tipografía/color confirmados.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
  popularBg: 'rgba(246, 150, 36, 0.15)',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 12.5L9.5 18L20 6" stroke={color} strokeWidth={2.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const PLANS = [
  {
    id: 'free',
    name: 'Gratis',
    price: '0€',
    period: '/mes',
    desc: 'Tests limitados · con anuncios',
    features: [
      'Tests diarios limitados (20)',
      'Con publicidad',
      'Acceso básico a estadísticas',
    ],
    isPopular: false,
    buttonText: 'Empezar',
    buttonVariant: 'outline',
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '9,99€',
    period: '/mes',
    desc: 'Tests infinitos sin anuncios',
    features: [
      'Tests infinitos sin anuncios',
      'Tutor IA ilimitado · Foto-Test',
      'Monitor BOE y Estadísticas Pro',
      'Soporte prioritario',
    ],
    isPopular: true,
    buttonText: 'Suscribirme a Premium',
    buttonVariant: 'primary',
  },
  {
    id: 'annual',
    name: 'Anual',
    price: '89€',
    period: '/año',
    desc: 'Ahorra un 25% · 2 meses gratis',
    features: [
      'Todo lo incluido en Premium',
      'Ahorro de 29,88€ al año',
      '2 meses de regalo',
      'Acceso anticipado a nuevas funciones',
    ],
    isPopular: false,
    buttonText: 'Suscribirme Anual',
    buttonVariant: 'secondary',
    savings: '25% OFF',
  },
];

const StarRow = () => (
  <View style={styles.ratingRow}>
    {[...Array(5)].map((_, i) => (
      <Ionicons key={i} name="star" size={14} color={colors.accentOrange} />
    ))}
    <Text style={styles.ratingText}>4.9 (12k reseñas)</Text>
  </View>
);

const FeatureList = ({ features }) => (
  <View style={styles.featuresList}>
    {features.map((feature, i) => (
      <View key={i} style={styles.featureRow}>
        <CheckIcon />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    ))}
  </View>
);

const PlanCard = ({ plan, onSubscribe }) => (
  <View style={[styles.planCard, plan.isPopular && styles.planCardPopular]}>
    {plan.savings && (
      <View style={styles.savingsBadge}>
        <Text style={styles.savingsText}>{plan.savings}</Text>
      </View>
    )}

    <View style={styles.planHeaderRow}>
      <View style={styles.planNameRow}>
        <Text style={styles.planName}>{plan.name}</Text>
        {plan.isPopular && (
          <View style={styles.popularBadge}>
            <Text style={styles.popularText}>Popular</Text>
          </View>
        )}
      </View>
      <View style={styles.priceContainer}>
        <Text style={styles.planPrice}>{plan.price}</Text>
        <Text style={styles.planPeriod}>{plan.period}</Text>
      </View>
    </View>

    {plan.isPopular ? (
      <FeatureList features={plan.features} />
    ) : (
      <Text style={styles.planDesc}>{plan.desc}</Text>
    )}

    <TouchableOpacity
      style={[
        styles.subscribeButton,
        plan.buttonVariant === 'outline' && styles.subscribeButtonOutline,
        plan.buttonVariant === 'secondary' && styles.subscribeButtonSecondary,
      ]}
      onPress={() => onSubscribe(plan)}
      accessibilityLabel={plan.buttonText}
    >
      <Text style={[
        styles.subscribeButtonText,
        plan.buttonVariant === 'outline' && styles.subscribeButtonTextOutline,
      ]}>
        {plan.buttonText}
      </Text>
    </TouchableOpacity>
  </View>
);

export default function StoreSubscriptionScreen({ navigation }) {
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showPaymentError, setShowPaymentError] = useState(false);

  // TODO(revenuecat): reemplazar bloque de setTimeout por RevenueCat.purchasePackage(package)
  // En error: setShowPaymentError(true). En éxito: navigate StoreSubscriptionSuccess.
  // Ver: apps/backend — webhook POST /revenuecat con verificación de firma obligatoria.
  const handleSubscribe = (plan) => {
    if (plan.id === 'free') {
      navigation.goBack();
      return;
    }
    setPendingPlan(plan);
    // Simula llamada a RevenueCat — en producción esta línea desaparece
    setTimeout(() => {
      navigation.navigate('StoreSubscriptionSuccess', { planName: plan.name });
    }, 300);
  };

  const handleRetry = () => {
    if (pendingPlan) handleSubscribe(pendingPlan);
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
        <Text style={styles.headerTitle}>Planes</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de confianza — real, sin equivalente en Figma */}
        <View style={styles.trustSection}>
          <Text style={styles.trustText}>
            Únete a +10.000 opositores que ya estudian mejor
          </Text>
          <StarRow />
        </View>

        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </View>

        {/* Garantías — real, sin equivalente en Figma */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.accentOrange} />
            <Text style={styles.infoText}>Cancelación gratuita en cualquier momento</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="refresh-outline" size={18} color={colors.accentOrange} />
            <Text style={styles.infoText}>Prueba de 7 días gratis disponible</Text>
          </View>
          <TouchableOpacity
            style={styles.faqLink}
            accessibilityLabel="Ver preguntas frecuentes sobre suscripciones"
          >
            <Text style={styles.faqText}>Ver preguntas frecuentes</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <PaymentErrorModal
        visible={showPaymentError}
        onClose={() => setShowPaymentError(false)}
        onRetry={handleRetry}
        onChangeMethod={() => {
          setShowPaymentError(false);
          // TODO(revenuecat): abrir sheet de cambio de método de pago
        }}
      />
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

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // ── Confianza ─────────────────────────────────────────────────
  trustSection: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  trustText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // ── Tarjetas de plan ──────────────────────────────────────────
  plansContainer: {
    gap: spacing.md,
  },
  planCard: {
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 12,
    padding: spacing.md,
    position: 'relative',
  },
  planCardPopular: {
    borderWidth: 1.5,
    borderColor: colors.accentOrange,
  },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 14,
    backgroundColor: `${colors.ctaGreen}1A`,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  savingsText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
    color: colors.ctaGreen,
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  planName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textDark,
  },
  popularBadge: {
    backgroundColor: FIGMA.popularBg,
    borderRadius: 10,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  popularText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 9.5,
    color: colors.accentOrange,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  planPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.accentOrange,
  },
  planPeriod: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: FIGMA.textMuted,
  },
  planDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: FIGMA.textMuted,
    marginTop: 4,
  },
  featuresList: {
    marginTop: 10,
    gap: 6,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: colors.textDark,
  },

  // ── Botón por plan ────────────────────────────────────────────
  subscribeButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentOrange,
    marginTop: spacing.md,
  },
  subscribeButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
  },
  subscribeButtonSecondary: {
    backgroundColor: colors.textDark,
  },
  subscribeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.white,
  },
  subscribeButtonTextOutline: {
    color: colors.textDark,
  },

  // ── Garantías ─────────────────────────────────────────────────
  infoSection: {
    marginTop: spacing.xl,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  faqLink: {
    alignItems: 'center',
    marginTop: 8,
  },
  faqText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.accentOrange,
  },
});
