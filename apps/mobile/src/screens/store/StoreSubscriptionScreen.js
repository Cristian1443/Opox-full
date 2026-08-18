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
import { colors } from '../../theme';
import PaymentErrorModal from '../../components/PaymentErrorModal';

const ACCENT = '#6C5CE7';

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
      <Ionicons key={i} name="star" size={14} color="#FFD700" />
    ))}
    <Text style={styles.ratingText}>4.9 (12k reseñas)</Text>
  </View>
);

const FeatureList = ({ features }) => (
  <View style={styles.featuresList}>
    {features.map((feature, i) => (
      <View key={i} style={styles.featureRow}>
        <Ionicons name="checkmark-circle" size={18} color={colors.success} />
        <Text style={styles.featureText}>{feature}</Text>
      </View>
    ))}
  </View>
);

const PlanCard = ({ plan, onSubscribe }) => (
  <View style={[styles.planCard, plan.isPopular && styles.planCardPopular]}>
    {/* Badge "POPULAR" centrado sobre el borde superior */}
    {plan.isPopular && (
      <View style={styles.popularBadgeWrapper}>
        <View style={styles.popularBadge}>
          <Text style={styles.popularText}>{'POPULAR'}</Text>
        </View>
      </View>
    )}

    {/* Badge de ahorro, esquina superior derecha */}
    {plan.savings && (
      <View style={styles.savingsBadge}>
        <Text style={styles.savingsText}>{plan.savings}</Text>
      </View>
    )}

    <Text style={styles.planName}>{plan.name}</Text>
    <View style={styles.priceContainer}>
      <Text style={styles.planPrice}>{plan.price}</Text>
      <Text style={styles.planPeriod}>{plan.period}</Text>
    </View>
    <Text style={styles.planDesc}>{plan.desc}</Text>

    <View style={styles.divider} />

    <FeatureList features={plan.features} />

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

export default function StoreSubscriptionScreen({ navigation, route }) {
  const [pendingPlan, setPendingPlan] = useState(null);
  const [showPaymentError, setShowPaymentError] = useState(false);
  const initialPlanKey = route?.params?.planKey;

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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Elige tu plan</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Sección de confianza */}
        <View style={styles.trustSection}>
          <Text style={styles.trustText}>
            Únete a +10.000 opositores que ya estudian mejor
          </Text>
          <StarRow />
        </View>

        {/* Planes */}
        <View style={styles.plansContainer}>
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSubscribe={handleSubscribe}
            />
          ))}
        </View>

        {/* Garantías */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>Cancelación gratuita en cualquier momento</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="refresh-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>Prueba de 7 días gratis disponible</Text>
          </View>
          <TouchableOpacity
            style={styles.faqLink}
            accessibilityLabel="Ver preguntas frecuentes sobre suscripciones"
          >
            <Text style={styles.faqText}>Ver preguntas frecuentes</Text>
            <Ionicons name="chevron-forward-outline" size={16} color={ACCENT} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },
  // Sección de confianza
  trustSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trustText: {
    fontSize: 14,
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
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Planes
  plansContainer: {
    gap: 20,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    position: 'relative',
    borderWidth: 1,
    borderColor: colors.separator,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  planCardPopular: {
    borderColor: ACCENT,
    borderWidth: 2,
  },
  // Badge POPULAR: wrapper a ancho completo centrado sobre el borde
  popularBadgeWrapper: {
    position: 'absolute',
    top: -14,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  popularBadge: {
    backgroundColor: ACCENT,
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 14,
  },
  popularText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  // Badge de ahorro
  savingsBadge: {
    position: 'absolute',
    top: -12,
    right: 16,
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  savingsText: {
    color: colors.success,
    fontSize: 11,
    fontWeight: '800',
  },
  planName: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '800',
    color: ACCENT,
  },
  planPeriod: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  planDesc: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 14,
  },
  featuresList: {
    marginBottom: 20,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  // Botones de plan
  subscribeButton: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: ACCENT,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  subscribeButtonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.separator,
    shadowOpacity: 0,
    elevation: 0,
  },
  subscribeButtonSecondary: {
    backgroundColor: colors.dark,
    shadowColor: colors.dark,
  },
  subscribeButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '800',
  },
  subscribeButtonTextOutline: {
    color: colors.text,
  },
  // Garantías
  infoSection: {
    marginTop: 28,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
  },
  faqLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    gap: 4,
  },
  faqText: {
    fontSize: 14,
    color: ACCENT,
    fontWeight: '600',
  },
});
