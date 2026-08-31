import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';

// ─── 11.4 · Detalle de recompensa real ─────────────────────────────────────
// Fiel al Figma (RecompensaDetalleScreen.tsx, título en Figma = nombre de la
// marca real "Uber Eats" — el propio dato real `reward.partner`, ya
// genérico en el backend, cumple ese mismo rol). El desglose de saldo (te
// alcanza/no te alcanza) es funcionalidad real que Figma no modela — se
// conserva como nota de una línea, igual que en StoreProductDetailScreen.
const FIGMA = {
  bodyMuted: 'rgba(52, 58, 61, 0.7)',
};

const FALLBACK_REWARD = {
  id: '1',
  partner: 'Uber Eats',
  title: '1 mes de Uber Eats gratis',
  subtitle: 'Suscripción Uber One durante 30 días sin coste.',
  description: 'Pide tus menús equilibrados sin gastos de envío y con tarifas preferentes.',
  cost: 1500,
  icon: 'restaurant-outline',
  color: '#000000',
  conditions: [
    'Válido solo en España',
    'Requiere cuenta verificada de Opox',
    'El código caduca a los 30 días de canjearlo',
    'Solo para usuarios sin Uber One activo',
  ],
  expiry: 'El código caduca en 30 días',
  stock: 12,
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GemIcon({ size = 22, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 8L2 3L7 3L12 3L17 3L22 3L19 8L12 21L5 8Z" fill="none" stroke={color} strokeWidth={1.4} strokeLinejoin="round" />
      <Path d="M2 3L22 3M5 8L19 8M9 3L12 8L15 3" stroke={color} strokeWidth={1.2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export default function StoreRealRewardDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { reward = FALLBACK_REWARD } = route?.params ?? {};
  const [userBalance] = useState(1840);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);

  const newBalance = userBalance - reward.cost;
  const canAfford = newBalance >= 0;

  const handleRedeem = () => {
    if (!canAfford) {
      setShowInsufficientModal(true);
      return;
    }
    navigation.navigate('StoreRealRedeemConfirm', {
      reward: {
        partner: reward.partner,
        title: reward.title,
        icon: reward.icon,
        color: reward.color,
        cost: reward.cost,
      },
      currentBalance: userBalance,
      newBalance,
    });
  };

  const description = reward.subtitle && reward.description
    ? `${reward.subtitle} ${reward.description}`
    : reward.subtitle ?? reward.description ?? '';

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
        <Text style={styles.headerTitle} numberOfLines={1}>{reward.partner}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner de marca (color sólido, ver hallazgo de marca) ────── */}
        <View style={[styles.banner, { backgroundColor: reward.color ?? colors.purple }]}>
          <Text style={styles.bannerText}>{reward.partner}</Text>
        </View>

        <Text style={styles.offerTitle}>{reward.title}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}

        {reward.conditions?.length > 0 && (
          <>
            <Text style={styles.conditionsLabel}>CONDICIONES</Text>
            <View style={styles.termsList}>
              {reward.conditions.map((term) => (
                <Text key={term} style={styles.termItem}>· {term}</Text>
              ))}
            </View>
          </>
        )}
        {reward.expiry ? <Text style={styles.expiryNote}>{reward.expiry}</Text> : null}

        <View style={styles.priceRow}>
          <Text style={styles.price}>{reward.cost.toLocaleString('es-ES')}</Text>
          <GemIcon />
        </View>
        <Text style={[styles.balanceNote, !canAfford && styles.balanceNoteError]}>
          {canAfford
            ? `Tienes ${userBalance.toLocaleString('es-ES')} · te quedarán ${newBalance.toLocaleString('es-ES')}`
            : `Tienes ${userBalance.toLocaleString('es-ES')} · te faltan ${Math.abs(newBalance).toLocaleString('es-ES')}`}
        </Text>

        <Text style={styles.infoNote}>
          El código se generará automáticamente tras el canje y estará disponible en tu Cartera.
        </Text>
      </ScrollView>

      {/* ── CTA fijo al fondo ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={handleRedeem}
          accessibilityLabel="Canjear recompensa"
        >
          <Text style={styles.ctaButtonText}>Canjear recompensa</Text>
        </TouchableOpacity>
      </View>

      <InsufficientPointsModal
        visible={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        cost={reward.cost}
        currentBalance={userBalance}
        navigation={navigation}
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

  // ── Contenido ─────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  banner: {
    height: 140,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  bannerText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 26,
    color: colors.white,
  },
  offerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: colors.textDark,
    textAlign: 'center',
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: FIGMA.bodyMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  conditionsLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginTop: spacing.lg,
    marginBottom: 8,
  },
  termsList: {
    gap: 4,
  },
  termItem: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: FIGMA.bodyMuted,
    lineHeight: 17,
  },
  expiryNote: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11.5,
    color: colors.accentOrange,
    marginTop: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.lg,
  },
  price: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: colors.accentOrange,
  },
  balanceNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 4,
  },
  balanceNoteError: {
    color: colors.statRed,
  },
  infoNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: colors.textSecondary,
    lineHeight: 17,
    marginTop: spacing.lg,
  },

  // ── CTA fijo al fondo ─────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  ctaButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
