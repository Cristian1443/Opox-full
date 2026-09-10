import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
    Alert,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import RedeemSuccessModal from '../../components/RedeemSuccessModal';
import { storeApi } from '../../api/store';

// ─── 11.3 · Confirmar canje ────────────────────────────────────────────────
// Fiel al Figma (TiendaModalesScreen.tsx → ConfirmarCanjeModal). El TSX lo
// compone como Modal solo como convención de previsualización (mismo patrón
// que en Bloques 9/10); se mantiene como pantalla completa real, a la que
// se llega tras "Canjear ahora" en el detalle del producto.
const FIGMA = {
  balanceMuted: 'rgba(65, 41, 80, 0.5)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

const MOCK_FALLBACK = {
  product: { name: 'Pack de Tests Premium', icon: 'document-text-outline', price: 500 },
  currentBalance: 1840,
  newBalance: 1340,
};

// Ícono exacto exportado de Figma (diamante), mismo lenguaje visual que
// StoreHomeScreen.
function GemIcon({ size = 56, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={(size * 157) / 214} viewBox="0 0 214 157" fill="none">
      <Path d="M107.027 156.922C106.579 156.923 106.137 156.835 105.724 156.664C105.31 156.493 104.935 156.243 104.619 155.927L1.02034 47.6095C0.560576 47.1464 0.25284 46.5542 0.13813 45.9119C0.0234208 45.2695 0.107186 44.6074 0.378264 44.0139C0.619105 43.4276 1.0281 42.9257 1.5537 42.5715C2.0793 42.2173 2.69799 42.0266 3.3318 42.0234H210.625C211.27 42.0138 211.902 42.1985 212.441 42.5535C212.979 42.9085 213.398 43.4174 213.643 44.0139C213.914 44.6074 213.998 45.2695 213.883 45.9119C213.768 46.5542 213.46 47.1464 213.001 47.6095L109.274 155.927C108.677 156.53 107.874 156.885 107.027 156.922ZM11.1009 48.6047L107.027 148.896L202.92 48.6047H11.1009Z" fill={color} />
      <Path d="M107.026 156.922C106.376 156.938 105.736 156.756 105.191 156.401C104.647 156.046 104.223 155.533 103.976 154.931L58.3247 46.6138L64.3602 44.0455L107.026 145.172L144.395 56.598L150.462 59.1663L110.044 154.931C109.799 155.528 109.38 156.037 108.842 156.392C108.303 156.747 107.671 156.931 107.026 156.922Z" fill={color} />
      <Path d="M210.626 48.9263H3.33287C2.72302 48.9496 2.11917 48.7985 1.59208 48.4909C1.065 48.1833 0.636521 47.7318 0.356871 47.1893C0.0772213 46.6469 -0.0420147 46.0359 0.0131378 45.4281C0.0682902 44.8203 0.295546 44.2409 0.66827 43.7576L29.2084 1.44501C29.5052 0.99426 29.9108 0.62559 30.3877 0.373083C30.8647 0.120577 31.3976 -0.00761755 31.9372 0.000349961H182.118C182.658 -0.00761755 183.191 0.120577 183.667 0.373083C184.144 0.62559 184.55 0.99426 184.847 1.44501L213.355 43.7576C213.722 44.2455 213.942 44.8279 213.99 45.4366C214.038 46.0453 213.911 46.655 213.625 47.1942C213.338 47.7333 212.904 48.1797 212.373 48.4808C211.842 48.7819 211.236 48.9253 210.626 48.8942V48.9263ZM9.7536 42.345H204.43L180.352 6.5816H33.6708L9.7536 42.345Z" fill={color} />
      <Path d="M63.5929 48.026L59.0984 43.2426L104.75 0.448425H109.276L143.338 32.3915L138.844 37.175L107.029 7.38281L63.5929 48.026Z" fill={color} />
      <Path d="M42.7095 13.3508L37.2471 17.0363L58.1555 48.0256L63.618 44.3401L42.7095 13.3508Z" fill={color} />
      <Path d="M210.626 48.9257H153.064C152.46 48.9359 151.866 48.7757 151.349 48.4633C150.833 48.151 150.414 47.6993 150.143 47.16C149.894 46.6525 149.784 46.0883 149.824 45.5247C149.863 44.961 150.051 44.4177 150.367 43.9497L179.261 1.60499C179.557 1.15423 179.963 0.785563 180.44 0.533056C180.917 0.28055 181.45 0.152356 181.99 0.160323C182.536 0.16138 183.075 0.293022 183.561 0.544299C184.047 0.795575 184.466 1.15922 184.783 1.60499L213.355 43.757C213.722 44.2449 213.942 44.8273 213.99 45.436C214.038 46.0447 213.911 46.6544 213.625 47.1936C213.338 47.7328 212.904 48.1791 212.373 48.4802C211.842 48.7813 211.236 48.9248 210.626 48.8936V48.9257ZM159.26 42.3445H204.43L181.957 9.08513L159.26 42.3445Z" fill={color} />
    </Svg>
  );
}

export default function StoreConfirmRedeemScreen({ navigation, route }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);
  const isSubmittingRef = useRef(false);

  const { product, currentBalance, newBalance, productId, redeemType } = route?.params ?? MOCK_FALLBACK;
  const productCost = product?.price ?? (currentBalance - newBalance);

  const handleConfirm = async () => {
    // Guard anti-doble-tap: `isLoading` (estado) no bloquea un segundo toque
    // que llega antes del siguiente render — `isSubmittingRef` sí, porque se
    // actualiza de forma síncrona.
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsLoading(true);
    let res;
    if (redeemType === 'discount') res = await storeApi.redeemDiscount(productId);
    else if (redeemType === 'community_test') res = await storeApi.obtainCommunityTest(productId);
    else res = await storeApi.redeemProduct(productId);
    setIsLoading(false);
    if (res?.error) {
      isSubmittingRef.current = false;
      Alert.alert('Error al canjear', res.error.message ?? 'Inténtalo de nuevo');
      return;
    }
    setRedeemResult(res?.data ?? null);
    setShowSuccess(true);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    navigation.navigate('StoreWallet');
  };

  const handleSuccessContinue = () => {
    setShowSuccess(false);
    if (redeemType === 'community_test') {
      navigation.navigate('StoreMarketplace');
    } else {
      navigation.navigate('StoreWallet');
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={handleCancel}
          disabled={isLoading}
          accessibilityLabel="Cerrar"
        >
          <Ionicons name="close" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar canje</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <GemIcon />
          <Text style={styles.title}>Confirmar canje</Text>
          <Text style={styles.subtitle}>
            Vas a canjear el <Text style={styles.bold}>{product?.name ?? '—'}</Text> por{' '}
            <Text style={styles.bold}>{productCost.toLocaleString('es-ES')} Opopoints</Text>. Te quedarán {newBalance.toLocaleString('es-ES')}.
          </Text>
        </View>
      </ScrollView>

      {/* ── CTA fijo al fondo ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={isLoading}
          accessibilityLabel="Confirmar el canje"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Confirmar canje</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={handleCancel}
          disabled={isLoading}
          accessibilityLabel="Cancelar el canje"
        >
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      <RedeemSuccessModal
        visible={showSuccess}
        productName={product?.name}
        newBalance={redeemResult?.newBalance ?? newBalance}
        onContinue={handleSuccessContinue}
        onClose={handleSuccessClose}
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  bold: {
    fontFamily: 'Poppins-SemiBold',
  },

  // ── CTA fijo al fondo ─────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  confirmButton: {
    width: '100%',
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  cancelLink: {
    marginTop: 14,
    paddingVertical: 4,
  },
  cancelLinkText: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
  },
});
