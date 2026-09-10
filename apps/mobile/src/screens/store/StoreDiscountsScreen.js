import React, { useState, useCallback, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

// ─── 11.2 · Tienda · Descuentos ────────────────────────────────────────────
// Fiel al Figma (DescuentosScreen.tsx) para header y fila de lista. El
// chequeo de "opopoints insuficientes" antes de navegar a confirmar es
// funcionalidad real sin equivalente en el reference (se conserva). Sin
// logos reales de partners provistos, todos usan el ícono genérico de tienda.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
};

function ChevronRightIcon({ size = 16, color = FIGMA.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Ícono exacto exportado de Figma (tienda genérica) — usado cuando el
// partner no tiene logo real provisto.
function StoreIcon({ size = 40, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 85 85" fill="none">
      <Path d="M84.9935 42.5716C84.9935 42.5716 84.9935 42.526 84.9935 42.5C84.9883 42.1723 84.9105 41.8498 84.7656 41.5558C84.7656 41.5558 84.7656 41.5168 84.7656 41.4972L75.8124 23.6039C75.6266 23.2327 75.3412 22.9204 74.9882 22.702C74.6353 22.4835 74.2285 22.3674 73.8134 22.3667H67.1066V17.8934H73.8134C74.1072 17.8942 74.3984 17.8371 74.6701 17.7252C74.9418 17.6134 75.1888 17.449 75.3969 17.2415C75.6049 17.034 75.7701 16.7875 75.8827 16.5161C75.9953 16.2448 76.0533 15.9538 76.0533 15.66V2.23993C76.0533 1.64586 75.8173 1.07613 75.3973 0.656059C74.9772 0.235992 74.4075 0 73.8134 0L11.1866 0C10.5925 0 10.0228 0.235992 9.60274 0.656059C9.18268 1.07613 8.94668 1.64586 8.94668 2.23993V15.66C8.94668 15.9538 9.00467 16.2448 9.11731 16.5161C9.22996 16.7875 9.39505 17.034 9.60314 17.2415C9.81122 17.449 10.0582 17.6134 10.3299 17.7252C10.6016 17.8371 10.8928 17.8942 11.1866 17.8934H17.8934V22.3667H11.1866C10.7705 22.367 10.3627 22.4828 10.0086 22.7012C9.65451 22.9197 9.36802 23.2322 9.1811 23.6039L0.234411 41.4972C0.234411 41.4972 0.234411 41.5363 0.234411 41.5558C0.090184 41.8504 0.0102778 42.1722 0 42.5C0 42.5 0 42.5456 0 42.5716C0 42.5977 0 42.6172 0 42.6367C0.0338317 45.5665 0.890608 48.4277 2.47255 50.8939C4.05449 53.3601 6.29788 55.3318 8.94668 56.5842V82.7601C8.94668 83.3541 9.18268 83.9239 9.60274 84.3439C10.0228 84.764 10.5925 85 11.1866 85H73.8134C74.4075 85 74.9772 84.764 75.3973 84.3439C75.8173 83.9239 76.0533 83.3541 76.0533 82.7601V56.5842C78.6997 55.33 80.9404 53.3574 82.5199 50.8914C84.0995 48.4253 84.9543 45.5651 84.987 42.6367C84.987 42.6367 84.9935 42.5977 84.9935 42.5716ZM79.1332 40.2601H57.6456L54.3117 26.8401H72.433L79.1332 40.2601ZM49.7016 26.8401L53.055 40.2601H31.945L35.2984 26.8401H49.7016ZM53.4587 44.7334C52.9412 47.2578 51.5681 49.5261 49.5714 51.155C47.5747 52.7839 45.0769 53.6735 42.5 53.6735C39.9232 53.6735 37.4253 52.7839 35.4286 51.155C33.4319 49.5261 32.0588 47.2578 31.5413 44.7334H53.4587ZM13.42 4.47334H71.58V13.42H13.42V4.47334ZM22.3667 17.8934H62.6333V22.3667H22.3667V17.8934ZM12.5996 26.8401H30.6883L27.3479 40.2601H5.86027L12.5996 26.8401ZM4.70124 44.7334H26.6122C26.0979 47.2596 24.7265 49.5305 22.73 51.1616C20.7335 52.7926 18.2347 53.6836 15.6567 53.6836C13.0787 53.6836 10.5799 52.7926 8.58338 51.1616C6.5869 49.5305 5.21544 47.2596 4.70124 44.7334ZM35.7867 80.5462V72.1725C35.7902 70.8289 36.3259 69.5414 37.2766 68.5919C38.2273 67.6424 39.5155 67.1084 40.8591 67.1066H44.1148C45.4579 67.1084 46.7454 67.6426 47.695 68.5923C48.6447 69.542 49.179 70.8295 49.1807 72.1725V80.5267L35.7867 80.5462ZM71.5995 80.5462H53.6801V72.1725C53.6784 69.6431 52.6728 67.2178 50.8842 65.4292C49.0956 63.6406 46.6703 62.635 44.1409 62.6333H40.8852C38.3551 62.635 35.9291 63.6404 34.1395 65.4288C32.3499 67.2172 31.3429 69.6425 31.3394 72.1725V80.5267H13.42V57.9516C14.1603 58.0807 14.9088 58.1568 15.66 58.1795C18.3769 58.1669 21.0435 57.4463 23.3969 56.0886C25.7503 54.7309 27.7091 52.7831 29.08 50.4374C30.4455 52.7863 32.4037 54.7356 34.7587 56.0905C37.1137 57.4454 39.783 58.1585 42.5 58.1585C45.217 58.1585 47.8863 57.4454 50.2413 56.0905C52.5963 54.7356 54.5545 52.7863 55.92 50.4374C57.2934 52.7795 59.2532 54.7234 61.6064 56.0775C63.9596 57.4317 66.625 58.1494 69.34 58.16C70.0911 58.1369 70.8397 58.0608 71.58 57.9321L71.5995 80.5462ZM69.3596 53.6996C66.7767 53.6992 64.2732 52.8066 62.2728 51.1728C60.2723 49.5389 58.8976 47.2642 58.3813 44.7334H80.2988C79.7803 47.2579 78.4072 49.5263 76.4108 51.1561C74.4145 52.7859 71.9172 53.6773 69.34 53.6801L69.3596 53.6996Z" fill={color} />
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
  const isNavigatingRef = useRef(false);

  useFocusEffect(useCallback(() => {
    isNavigatingRef.current = false;
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
    // Guard anti-doble-tap: un segundo toque antes de que la navegación
    // procese el primero puede empujar "StoreConfirmRedeem" dos veces al
    // stack (bug conocido de React Navigation en Android con doble-tap),
    // dejando una segunda copia de esa pantalla visible detrás del modal
    // de éxito. Se libera al recuperar el foco (useFocusEffect abajo).
    if (isNavigatingRef.current) return;

    const bal = userBalance ?? 0;
    if (userBalance === null || bal < discount.cost) {
      setSelectedDiscount(discount);
      setShowInsufficientModal(true);
      return;
    }
    isNavigatingRef.current = true;
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
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Descuentos</Text>
          <Text style={styles.headerSubtitle}>Códigos canjeables con tus Opopoints.</Text>
        </View>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {discountsData.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, item.isExpired && styles.rowExpired]}
            activeOpacity={0.7}
            disabled={item.isExpired}
            onPress={() => handleRedeem(item)}
            accessibilityLabel={`${item.partner} ${item.discount}, ${item.cost} Opopoints`}
          >
            <StoreIcon />
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
