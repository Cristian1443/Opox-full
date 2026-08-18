import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const PHASE2_COLOR = '#7B1FA2';
const ACCENT = '#6C5CE7';

// TODO(11.x): reemplazar por mockup final de pantalla de éxito de recompensa real
export default function StoreRealRewardSuccessScreen({ navigation, route }) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    reward = { partner: 'Partner', title: 'Recompensa', cost: 0 },
    newBalance = 0,
    code = '—',
  } = route?.params ?? {};

  const handleCopyCode = async () => {
    try {
      await Share.share({ message: code });
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Ionicons name="checkmark-circle" size={72} color={colors.success} />
        </View>

        <Text style={styles.title}>¡Recompensa canjeada!</Text>
        <Text style={styles.subtitle}>
          Tu código para {reward.partner} está listo.
        </Text>

        <View style={styles.codeCard}>
          <Text style={styles.codeLabel}>Tu código de canje</Text>
          <Text style={styles.codeValue}>{code}</Text>
          <TouchableOpacity
            style={styles.copyButton}
            onPress={handleCopyCode}
            accessibilityLabel="Copiar código"
          >
            <Ionicons name="copy-outline" size={16} color={ACCENT} />
            <Text style={styles.copyButtonText}>Copiar código</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>Nuevo saldo</Text>
          <Text style={styles.balanceValue}>{newBalance.toLocaleString()} O</Text>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('StoreWallet')}
          accessibilityLabel="Ver mi cartera de recompensas"
        >
          <Text style={styles.primaryButtonText}>Ver mi cartera</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('StoreHome')}
          accessibilityLabel="Ir a la tienda"
        >
          <Text style={styles.secondaryButtonText}>Ir a la tienda</Text>
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
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  codeCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: PHASE2_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: PHASE2_COLOR,
    letterSpacing: 2,
    marginBottom: 14,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.grayLight,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ACCENT,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.successBg,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.success,
    fontWeight: '600',
  },
  balanceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.success,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  primaryButton: {
    backgroundColor: PHASE2_COLOR,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: PHASE2_COLOR,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    marginTop: 10,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.separator,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});
