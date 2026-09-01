import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
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

function GemIcon({ size = 56, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 8L2 3L7 3L12 3L17 3L22 3L19 8L12 21L5 8Z" fill="none" stroke={color} strokeWidth={1.2} strokeLinejoin="round" />
      <Path d="M2 3L22 3M5 8L19 8M9 3L12 8L15 3" stroke={color} strokeWidth={1} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

export default function StoreConfirmRedeemScreen({ navigation, route }) {
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [redeemResult, setRedeemResult] = useState(null);

  const { product, currentBalance, newBalance, productId, redeemType } = route?.params ?? MOCK_FALLBACK;
  const productCost = product?.price ?? (currentBalance - newBalance);

  const handleConfirm = async () => {
    setIsLoading(true);
    let res;
    if (redeemType === 'discount') res = await storeApi.redeemDiscount(productId);
    else if (redeemType === 'community_test') res = await storeApi.obtainCommunityTest(productId);
    else res = await storeApi.redeemProduct(productId);
    setIsLoading(false);
    if (res?.error) {
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
