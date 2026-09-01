import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

// ─── 11.2 · Tienda · detalle de producto ──────────────────────────────────
// Fiel al Figma (DetalleProductoScreen.tsx). El diseño confirma naranja
// (#F69624) como color de CTA primario en todo el Bloque 11 — coherente con
// el que ya usé en StoreHomeScreen (tarjeta de saldo, precios), a diferencia
// del verde usado en Bloques 9/10.
//
// ⚠️ Nota de alcance: tras la conexión real al backend (fusión de
// feat/revision-bloque-11-tienda), la pestaña "Virtual" de StoreHomeScreen
// se eliminó por no tener catálogo real detrás, y era la única vía que
// navegaba a esta pantalla — hoy queda inalcanzable desde la app. Se
// rediseña igualmente porque el backend (getProduct/redeem) sigue
// funcionando, por si se reconecta una fuente real de productos.
const FIGMA = {
  bodyMuted: 'rgba(52, 58, 61, 0.7)',
  balanceMuted: 'rgba(65, 41, 80, 0.5)',
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

export default function StoreProductDetailScreen({ navigation, route }) {
  const item = route.params?.item ?? {};
  const insets = useSafeAreaInsets();

  const [userBalance, setUserBalance] = useState(null);
  const [product, setProduct] = useState(item);
  const [showErrorModal, setShowErrorModal] = useState(false);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getBalance().then(res => {
      if (cancelled || !res?.data) return;
      setUserBalance(res.data.balance);
    });
    if (item.id) {
      storeApi.getProduct(item.id).then(res => {
        if (cancelled || !res?.data) return;
        setProduct(res.data);
      });
    }
    return () => { cancelled = true; };
  }, [item.id]));

  const title = product.title ?? item.name ?? '—';
  const description = product.description ?? product.subtitle ?? '';
  const productCost = product.cost ?? item.cost ?? item.price ?? 0;
  const remainingBalance = (userBalance ?? 0) - productCost;
  const canAfford = userBalance !== null && remainingBalance >= 0;

  const handleRedeem = () => {
    if (userBalance === null) return;
    if (!canAfford) {
      setShowErrorModal(true);
      return;
    }
    navigation.navigate('StoreConfirmRedeem', {
      productId: item.id,
      redeemType: 'product',
      product: { name: title, icon: product.icon ?? item.icon, price: productCost },
      currentBalance: userBalance,
      newBalance: remainingBalance,
    });
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
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ────────────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <Ionicons
            name={product.icon ?? item.icon ?? 'cube-outline'}
            size={80}
            color={colors.accentOrange}
          />
          <Text style={styles.productTitle}>{title}</Text>
          {description ? (
            <Text style={styles.description}>{description}</Text>
          ) : null}

          {product.conditions?.length > 0 && (
            <View style={styles.conditions}>
              {product.conditions.map((c, i) => (
                <View key={i} style={styles.conditionRow}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.ctaGreen} />
                  <Text style={styles.conditionText}>{c}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.priceRow}>
            <Text style={styles.price}>{productCost}</Text>
            <GemIcon />
          </View>
          <Text style={[styles.balanceNote, !canAfford && styles.balanceNoteError]}>
            {userBalance === null
              ? 'Consultando tu saldo…'
              : canAfford
                ? `Tienes ${userBalance.toLocaleString('es-ES')} · te sobran ${remainingBalance.toLocaleString('es-ES')}`
                : `Tienes ${userBalance.toLocaleString('es-ES')} · te faltan ${Math.abs(remainingBalance).toLocaleString('es-ES')}`}
          </Text>
        </View>
      </ScrollView>

      {/* ── CTA fijo al fondo ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TouchableOpacity
          style={[styles.ctaButton, !canAfford && styles.ctaButtonDisabled]}
          activeOpacity={0.85}
          onPress={handleRedeem}
          disabled={userBalance === null}
          accessibilityLabel={`Canjear ${title} por ${productCost} Opopoints`}
        >
          <Text style={styles.ctaButtonText}>Canjear ahora</Text>
          <Text style={styles.ctaButtonSubtext}>Por {productCost} Opopoints</Text>
        </TouchableOpacity>
      </View>

      <InsufficientPointsModal
        visible={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        cost={productCost}
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

  // ── Hero ──────────────────────────────────────────────────────
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    gap: 12,
  },
  productTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 19,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  description: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: FIGMA.bodyMuted,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  conditions: {
    width: '100%',
    gap: 8,
    marginTop: spacing.sm,
  },
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  conditionText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textDark,
    lineHeight: 19,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.sm,
  },
  price: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 24,
    color: colors.accentOrange,
  },
  balanceNote: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.balanceMuted,
  },
  balanceNoteError: {
    color: colors.statRed,
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
  ctaButtonDisabled: {
    backgroundColor: colors.grayMid,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  ctaButtonSubtext: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
});
