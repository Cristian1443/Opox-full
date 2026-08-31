import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

// ─── 11.2 · Tienda · Descuentos ────────────────────────────────────────────
// Fiel al Figma (DescuentosScreen.tsx) para header y fila de lista. El
// aviso de saldo y el chequeo de "opopoints insuficientes" antes de navegar
// a confirmar son funcionalidad real sin equivalente en el reference (se
// conservan); el icono por fila usa el ícono real ya provisto por el
// backend (item.icon) en vez del ícono de tienda genérico del mockup, ya
// que es más específico por comercio sin reproducir ningún logo real.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 16, color = FIGMA.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const getExpiryColor = (days) => {
  if (days <= 3) return colors.statRed;
  if (days <= 7) return colors.accentOrange;
  return colors.ctaGreen;
};

export default function StoreDiscountsScreen({ navigation }) {
  const [userBalance, setUserBalance] = useState(null);
  const [discountsData, setDiscountsData] = useState([]);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getBalance().then(res => {
      if (cancelled || !res?.data) return;
      setUserBalance(res.data.balance);
    });
    storeApi.listDiscounts().then(res => {
      if (cancelled || !res?.data) return;
      setDiscountsData(res.data.map(d => ({
        id: d.id,
        partner: d.partner,
        discount: d.discount,
        description: d.subtitle,
        cost: d.cost,
        expiry: d.expiryDate,
        expiryDays: 30,
        icon: d.icon,
        color: d.color,
        isExpired: false,
      })));
    });
    return () => { cancelled = true; };
  }, []));

  const handleRedeem = (discount) => {
    const bal = userBalance ?? 0;
    if (userBalance === null || bal < discount.cost) {
      setSelectedDiscount(discount);
      setShowInsufficientModal(true);
      return;
    }
    navigation.navigate('StoreConfirmRedeem', {
      productId: discount.id,
      redeemType: 'discount',
      product: {
        name: `${discount.discount} en ${discount.partner}`,
        price: discount.cost,
        icon: discount.icon,
      },
      currentBalance: bal,
      newBalance: bal - discount.cost,
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
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Descuentos</Text>
          <Text style={styles.headerSubtitle}>Códigos canjeables con tus Opopoints.</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {/* Saldo — funcionalidad real sin equivalente en Figma, se conserva
          porque el chequeo de "te alcanza" depende de él. */}
      <View style={styles.balanceBanner}>
        <Text style={styles.balanceLabel}>Tus Opopoints:</Text>
        <Text style={styles.balanceAmount}>
          {userBalance !== null ? userBalance.toLocaleString('es-ES') : '—'}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {discountsData.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, index === 0 && styles.rowFirst, item.isExpired && styles.rowExpired]}
            activeOpacity={0.7}
            disabled={item.isExpired}
            onPress={() => handleRedeem(item)}
            accessibilityLabel={`${item.partner} ${item.discount}, ${item.cost} Opopoints`}
          >
            <Ionicons name={item.icon ?? 'pricetag-outline'} size={40} color={colors.accentOrange} />
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{item.discount} en {item.partner}</Text>
              <Text style={styles.rowSubtitle}>{item.description}</Text>
              <View style={styles.rowFooter}>
                <Text style={styles.rowPrice}>{item.cost} Opopoints</Text>
                <Text style={[styles.rowExpiry, { color: item.isExpired ? colors.statRed : getExpiryColor(item.expiryDays) }]}>
                  {item.isExpired ? 'Expirado' : `Caduca en ${item.expiry}`}
                </Text>
              </View>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>
        ))}

        {discountsData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No hay descuentos disponibles por ahora.</Text>
          </View>
        )}
      </ScrollView>

      <InsufficientPointsModal
        visible={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        cost={selectedDiscount?.cost ?? 0}
        currentBalance={userBalance ?? 0}
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
    marginBottom: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
  },

  // ── Saldo ─────────────────────────────────────────────────────
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: FIGMA.separator,
    gap: 6,
  },
  balanceLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
  },
  balanceAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.accentOrange,
  },

  // ── Fila de descuento ─────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: spacing.lg,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowExpired: {
    opacity: 0.5,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
  },
  rowFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  rowPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.accentOrange,
  },
  rowExpiry: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
  },

  // ── Vacío ─────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
