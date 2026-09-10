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
  color: '#06C167',
  conditions: [
    'Válido solo en España',
    'Requiere cuenta verificada de Opox',
    'El código caduca a los 30 días de canjearlo',
    'Solo para usuarios sin Uber One activo',
  ],
  expiry: 'El código caduca en 30 días',
  stock: 12,
};

function GemIcon({ width = 22, height = 16.2, color = colors.accentOrange }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 121 89" fill="none">
      <Path d="M60.4491 88.6297C60.1966 88.6299 59.9465 88.5804 59.7132 88.4839C59.4799 88.3875 59.2678 88.246 59.0892 88.0676L0.5768 26.8898C0.317128 26.6283 0.143318 26.2938 0.0785304 25.931C0.0137425 25.5682 0.0610529 25.1943 0.214158 24.859C0.350185 24.5279 0.581184 24.2444 0.878044 24.0444C1.1749 23.8443 1.52434 23.7366 1.88231 23.7348H118.961C119.326 23.7294 119.683 23.8337 119.987 24.0342C120.291 24.2347 120.528 24.5221 120.666 24.859C120.819 25.1943 120.866 25.5682 120.801 25.931C120.737 26.2938 120.563 26.6283 120.303 26.8898L61.7183 88.0676C61.3811 88.408 60.9278 88.6087 60.4491 88.6297ZM6.27029 27.4519L60.4491 84.0967L114.61 27.4519H6.27029Z" fill={color} />
      <Path d="M60.4488 88.6294C60.0816 88.6385 59.7203 88.5359 59.4127 88.3352C59.1051 88.1344 58.8657 87.845 58.7263 87.5052L32.9424 26.3274L36.3512 24.8768L60.4488 81.993L81.5546 31.9665L84.9816 33.4171L62.1532 87.5052C62.0149 87.8421 61.7783 88.1295 61.4743 88.33C61.1703 88.5305 60.813 88.6348 60.4488 88.6294Z" fill={color} />
      <Path d="M118.962 27.6336H1.88241C1.53796 27.6467 1.19691 27.5614 0.899208 27.3877C0.60151 27.2139 0.359507 26.9589 0.201561 26.6525C0.0436146 26.3461 -0.0237299 26.0011 0.00742021 25.6578C0.0385703 25.3145 0.166924 24.9872 0.377439 24.7143L16.4969 0.816144C16.6645 0.561558 16.8936 0.353333 17.163 0.210717C17.4324 0.0681018 17.7334 -0.00430239 18.0381 0.000197658H102.86C103.165 -0.00430239 103.466 0.0681018 103.735 0.210717C104.005 0.353333 104.234 0.561558 104.401 0.816144L120.503 24.7143C120.71 24.9898 120.835 25.3188 120.862 25.6626C120.889 26.0063 120.817 26.3507 120.655 26.6552C120.493 26.9598 120.248 27.2119 119.948 27.3819C119.648 27.552 119.306 27.633 118.962 27.6154V27.6336ZM5.50883 23.9165H115.462L101.863 3.71728H19.0173L5.50883 23.9165Z" fill={color} />
      <Path d="M35.9164 27.125L33.3779 24.4233L59.1618 0.253174H61.7184L80.9566 18.2946L78.4181 20.9963L60.4492 4.16971L35.9164 27.125Z" fill={color} />
      <Path d="M24.1233 7.5405L21.0381 9.62207L32.8472 27.1248L35.9324 25.0433L24.1233 7.5405Z" fill={color} />
      <Path d="M118.962 27.6332H86.4508C86.1098 27.639 85.7741 27.5485 85.4823 27.3721C85.1904 27.1957 84.9542 26.9405 84.8008 26.636C84.6605 26.3493 84.5984 26.0307 84.6206 25.7123C84.6429 25.3939 84.7488 25.0871 84.9277 24.8227L101.247 0.906475C101.414 0.651889 101.643 0.443665 101.913 0.301049C102.182 0.158434 102.483 0.0860296 102.788 0.0905297C103.097 0.0911267 103.401 0.165478 103.675 0.307399C103.95 0.44932 104.186 0.654707 104.365 0.906475L120.503 24.714C120.71 24.9895 120.835 25.3184 120.862 25.6622C120.889 26.006 120.817 26.3504 120.655 26.6549C120.494 26.9595 120.248 27.2115 119.948 27.3816C119.648 27.5517 119.306 27.6327 118.962 27.6151V27.6332ZM89.9503 23.9161H115.462L102.77 5.13126L89.9503 23.9161Z" fill={color} />
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
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{reward.partner}</Text>
        <View style={styles.headerPlaceholder} />
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
