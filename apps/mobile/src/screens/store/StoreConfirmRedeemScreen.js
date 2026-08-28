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
import { colors } from '../../theme';
import RedeemSuccessModal from '../../components/RedeemSuccessModal';
import { storeApi } from '../../api/store';

const ACCENT = '#6C5CE7';

const MOCK_FALLBACK = {
  product: { name: 'Pack de Tests Premium', icon: 'document-text-outline', price: 500 },
  currentBalance: 1840,
  newBalance: 1340,
};

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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleCancel}
          disabled={isLoading}
          accessibilityLabel="Cerrar"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar canje</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryCard}>
          {/* Icono del producto */}
          <View style={styles.iconWrapper}>
            <Ionicons
              name={product?.icon ?? 'cube-outline'}
              size={48}
              color={ACCENT}
            />
          </View>

          <Text style={styles.productName}>{product?.name ?? '—'}</Text>
          <Text style={styles.productDesc}>
            Vas a canjear este producto por {productCost.toLocaleString()} Opopoints.
          </Text>

          <View style={styles.divider} />

          {/* Saldo resultante */}
          <View style={styles.balanceSection}>
            <Text style={styles.balanceLabel}>Te quedarán</Text>
            <View style={styles.balanceResult}>
              <Ionicons name="wallet-outline" size={24} color={colors.success} />
              <Text style={styles.balanceAmount}>{newBalance.toLocaleString()} O</Text>
            </View>
            <Text style={styles.balanceNote}>
              Saldo actual: {currentBalance.toLocaleString()} O
            </Text>
          </View>

          {/* Aviso */}
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.warningText}>
              Esta operación es irreversible. Asegúrate de que deseas continuar.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer fijo con dos botones */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 12 }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          disabled={isLoading}
          accessibilityLabel="Cancelar el canje"
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonLoading]}
          onPress={handleConfirm}
          disabled={isLoading}
          accessibilityLabel="Confirmar el canje"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.white} />
              <Text style={styles.confirmButtonText}>Confirmar canje</Text>
            </>
          )}
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
  closeButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 20,
    flexGrow: 1,
  },
  // Tarjeta resumen
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EDE7F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  productName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  productDesc: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 4,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 20,
  },
  // Saldo resultante
  balanceSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  balanceResult: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.success,
  },
  balanceNote: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 10,
  },
  // Aviso irreversible
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.background,
    padding: 14,
    borderRadius: 12,
    marginTop: 4,
    gap: 10,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  warningText: {
    fontSize: 13,
    color: colors.textSecondary,
    flex: 1,
    lineHeight: 19,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.separator,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonLoading: {
    backgroundColor: colors.grayMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
});
