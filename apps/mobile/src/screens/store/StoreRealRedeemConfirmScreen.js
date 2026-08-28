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
import { storeApi } from '../../api/store';

const ACCENT = '#6C5CE7';
const PHASE2_COLOR = '#7B1FA2';

const FALLBACK = {
  reward: {
    partner: 'Uber Eats',
    title: '1 mes de Uber Eats gratis',
    icon: 'restaurant-outline',
    color: '#000000',
    cost: 1500,
  },
  currentBalance: 1840,
  newBalance: 340,
};

export default function StoreRealRedeemConfirmScreen({ navigation, route }) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    reward = FALLBACK.reward,
    currentBalance = FALLBACK.currentBalance,
    newBalance = FALLBACK.newBalance,
  } = route?.params ?? {};

  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    const res = await storeApi.redeemProduct(reward.id);
    setIsLoading(false);
    if (res?.error) {
      Alert.alert('Error al canjear', res.error.message ?? 'Inténtalo de nuevo');
      return;
    }
    navigation.navigate('StoreRealRewardSuccess', {
      reward,
      newBalance: res.data?.newBalance ?? newBalance,
      code: res.data?.code ?? '',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeButton}
          disabled={isLoading}
          accessibilityLabel="Cancelar y volver"
        >
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar canje real</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Banner de advertencia */}
        <View style={styles.warningBanner}>
          <Ionicons name="alert-circle" size={22} color={colors.error} />
          <Text style={styles.warningText}>
            <Text style={styles.warningBold}>ATENCIÓN: </Text>
            Esta operación es irreversible. Los Opopoints no se devolverán.
          </Text>
        </View>

        {/* Tarjeta resumen */}
        <View style={styles.summaryCard}>
          <View style={[styles.iconWrapper, { backgroundColor: (reward.color ?? ACCENT) + '18' }]}>
            <Ionicons name={reward.icon ?? 'gift-outline'} size={48} color={reward.color ?? ACCENT} />
          </View>

          <Text style={styles.rewardPartner}>{reward.partner}</Text>
          <Text style={styles.rewardTitle}>{reward.title}</Text>

          <View style={styles.divider} />

          {/* Balance breakdown */}
          <View style={styles.balanceSection}>
            <View style={styles.balanceRow}>
              <Text style={styles.rowLabel}>Saldo actual</Text>
              <Text style={styles.rowValue}>{currentBalance.toLocaleString()} O</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.balanceRow}>
              <Text style={styles.rowLabel}>Vas a gastar</Text>
              <Text style={[styles.rowValue, { color: colors.error }]}>{reward.cost} O</Text>
            </View>

            <View style={styles.divider} />

            <View style={[styles.resultRow, { backgroundColor: colors.successBg }]}>
              <Text style={[styles.rowLabel, { color: colors.success }]}>Te quedarán</Text>
              <Text style={[styles.rowValueLarge, { color: colors.success }]}>
                {newBalance.toLocaleString()} O
              </Text>
            </View>
          </View>

          <View style={styles.termsBox}>
            <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.termsText}>
              Al confirmar, aceptas los términos de uso de {reward.partner} y el canje de tus puntos.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer sticky */}
      <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          accessibilityLabel="Cancelar"
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.confirmButton, isLoading && styles.confirmButtonLoading]}
          onPress={handleConfirm}
          disabled={isLoading}
          accessibilityLabel="Confirmar canje"
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={20} color={colors.white} />
              <Text style={styles.confirmButtonText}>Sí, canjear</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
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
    padding: 16,
  },
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: colors.errorBg,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    gap: 10,
    alignItems: 'flex-start',
    borderWidth: 1,
    borderColor: colors.error,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: colors.error,
    lineHeight: 20,
  },
  warningBold: {
    fontWeight: '800',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  rewardPartner: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
    lineHeight: 28,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 14,
  },
  balanceSection: {
    width: '100%',
  },
  balanceRow: {
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
  rowValueLarge: {
    fontSize: 20,
    fontWeight: '800',
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.grayLight,
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
    gap: 8,
    width: '100%',
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 14,
    gap: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
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
    borderRadius: 16,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonLoading: {
    opacity: 0.75,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.white,
  },
});
