import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import PaymentErrorModal from '../../components/PaymentErrorModal';

// ─── 11.2 · Tienda · Planes ─────────────────────────────────────────────────
// Fiel al Figma (SuscripcionesScreen.tsx, título confirmado "Planes"): 3
// tarjetas seleccionables (tap para elegir, borde naranja marca la
// selección) + un único CTA fijo al fondo que suscribe al plan elegido.
// Sin prueba social ni sección de garantías — no están en el reference.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
  popularBg: 'rgba(246, 150, 36, 0.15)',
};

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
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '9,90€',
    period: '/mes',
    desc: 'Tests infinitos sin anuncios',
    features: [
      'Tests infinitos sin anuncios',
      'Tutor IA ilimitado · Foto-Test',
      'Monitor BOE y Estadísticas Pro',
    ],
    isPopular: true,
    buttonText: 'Suscribirme a premium',
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
    savings: '25% OFF',
  },
];

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

const PlanCard = ({ plan, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.planCard, isSelected && styles.planCardSelected]}
    activeOpacity={0.85}
    onPress={() => onSelect(plan.id)}
    accessibilityLabel={`Plan ${plan.name}, ${plan.price}${plan.period}`}
    accessibilityState={{ selected: isSelected }}
  >
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
  </TouchableOpacity>
);

export default function StoreSubscriptionScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [selectedId, setSelectedId] = useState('premium');
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showPaymentError, setShowPaymentError] = useState(false);

  const selectedPlan = PLANS.find(p => p.id === selectedId) ?? PLANS[0];

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
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Planes</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              isSelected={plan.id === selectedId}
              onSelect={setSelectedId}
            />
          ))}
        </View>
      </ScrollView>

      {/* ── CTA único fijo al fondo — suscribe al plan seleccionado ────── */}
      <View style={[styles.footer, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TouchableOpacity
          style={styles.subscribeButton}
          activeOpacity={0.85}
          onPress={() => handleSubscribe(selectedPlan)}
          accessibilityLabel={selectedPlan.buttonText}
        >
          <Text style={styles.subscribeButtonText}>{selectedPlan.buttonText}</Text>
        </TouchableOpacity>
      </View>

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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(65, 41, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
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
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
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
  planCardSelected: {
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

  // ── CTA único fijo al fondo ───────────────────────────────────
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  subscribeButton: {
    height: 61.3,
    borderRadius: 14.2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accentOrange,
  },
  subscribeButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
