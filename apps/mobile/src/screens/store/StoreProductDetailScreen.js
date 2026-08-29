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
import { colors } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';

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
      product: { name: product.title ?? item.name, icon: product.icon ?? item.icon, price: productCost },
      currentBalance: userBalance,
      newBalance: remainingBalance,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{product.title ?? item.name ?? 'Detalle del producto'}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons
              name={product.icon ?? item.icon ?? 'cube-outline'}
              size={64}
              color={ACCENT}
            />
          </View>
          <Text style={styles.productTitle}>{product.title ?? item.name ?? '—'}</Text>
          <Text style={styles.productSubtitle}>{product.subtitle ?? ''}</Text>
        </View>

        {/* Saldo y coste */}
        <View style={styles.balanceCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Tu saldo actual</Text>
            <Text style={styles.rowValue}>{userBalance !== null ? userBalance.toLocaleString() : '—'} O</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Coste del producto</Text>
            <Text style={[styles.rowValue, { color: ACCENT }]}>{productCost} O</Text>
          </View>

          <View style={styles.divider} />

          <View style={[
            styles.row,
            styles.remainingRow,
            { backgroundColor: canAfford ? colors.successBg : colors.errorBg },
          ]}>
            <Text style={[styles.rowLabel, { color: canAfford ? colors.text : colors.error }]}>
              Te quedarían
            </Text>
            <Text style={[
              styles.rowValue,
              { fontWeight: '800', color: canAfford ? colors.success : colors.error },
            ]}>
              {remainingBalance.toLocaleString()} O
            </Text>
          </View>

          {!canAfford && (
            <Text style={styles.errorText}>
              Te faltan {Math.abs(remainingBalance)} Opopoints para canjear este producto.
            </Text>
          )}
        </View>

        {/* Descripción y características */}
        {(product.description || (product.conditions?.length > 0)) && (
          <View style={styles.detailsCard}>
            {product.description ? (
              <>
                <Text style={styles.sectionTitle}>¿Qué incluye?</Text>
                <Text style={styles.descriptionText}>{product.description}</Text>
              </>
            ) : null}
            {product.conditions?.length > 0 ? (
              <>
                <Text style={styles.featuresTitle}>Condiciones</Text>
                {product.conditions.map((c, i) => (
                  <View key={i} style={styles.featureRow}>
                    <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                    <Text style={styles.featureText}>{c}</Text>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        )}
      </ScrollView>

      {/* Footer fijo */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
          onPress={handleRedeem}
          disabled={userBalance === null}
          accessibilityLabel={`Canjear ${product.title ?? item.name ?? 'producto'} por ${productCost} Opopoints`}
        >
          <>
            <Text style={styles.redeemButtonText}>Canjear ahora</Text>
            <Text style={styles.redeemSubtext}>Por {productCost} Opopoints</Text>
          </>
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
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingVertical: 0,
  },
  // Hero
  heroSection: {
    alignItems: 'center',
    paddingVertical: 28,
    backgroundColor: colors.white,
    marginBottom: 12,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  productSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 22,
  },
  // Saldo
  balanceCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rowLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  rowValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 14,
  },
  remainingRow: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    textAlign: 'center',
    color: colors.error,
    fontSize: 13,
    marginTop: 10,
    fontWeight: '600',
  },
  // Detalles
  detailsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 20,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
  },
  descriptionText: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 22,
    marginBottom: 18,
  },
  featuresTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
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
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  redeemButton: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.grayMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  redeemButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  redeemSubtext: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
    marginTop: 3,
    fontWeight: '600',
  },
});
