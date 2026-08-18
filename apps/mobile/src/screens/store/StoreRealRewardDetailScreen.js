import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';
const PHASE2_COLOR = '#7B1FA2';

const partnerAbbr = (name) => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const FALLBACK_REWARD = {
  id: '1',
  partner: 'Uber Eats',
  title: '1 mes de Uber Eats gratis',
  subtitle: 'Suscripción Uber One durante 30 días sin coste.',
  description: 'Pide tus menús equilibrados sin gastos de envío y con tarifas preferentes.',
  cost: 1500,
  icon: 'restaurant-outline',
  color: '#000000',
  conditions: [
    'Válido solo en España',
    'Requiere cuenta verificada de Opox',
    'El código caduca a los 30 días de canjearlo',
    'Solo para usuarios sin Uber One activo',
  ],
  expiry: 'El código caduca en 30 días',
  stock: 12,
};

export default function StoreRealRewardDetailScreen({ navigation, route }) {
  const { top: topInset } = useSafeAreaInsets();
  const { bottom: bottomInset } = useSafeAreaInsets();

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

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header gradiente que cubre el status bar */}
      <LinearGradient
        colors={[PHASE2_COLOR, ACCENT]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.headerGradient, { paddingTop: topInset + 12 }]}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={colors.white} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Recompensa Real</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <View style={[styles.heroSection, { backgroundColor: reward.color ?? ACCENT }]}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>{partnerAbbr(reward.partner)}</Text>
          </View>
          <Text style={styles.heroPartner}>{reward.partner}</Text>
        </View>
        <View style={styles.titleSection}>
          <Text style={styles.rewardTitle}>{reward.title}</Text>
          {!!reward.subtitle && <Text style={styles.rewardSubtitle}>{reward.subtitle}</Text>}
          {!!reward.description && <Text style={styles.description}>{reward.description}</Text>}
        </View>

        {/* Resumen de coste */}
        <View style={styles.balanceCard}>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Saldo actual</Text>
            <Text style={styles.rowValue}>{userBalance.toLocaleString()} O</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.row}>
            <Text style={styles.rowLabel}>Coste de la recompensa</Text>
            <Text style={[styles.rowValue, { color: PHASE2_COLOR }]}>{reward.cost} O</Text>
          </View>

          <View style={styles.divider} />

          <View style={[
            styles.resultRow,
            { backgroundColor: canAfford ? colors.successBg : colors.errorBg },
          ]}>
            <Text style={[styles.rowLabel, { color: canAfford ? colors.text : colors.error }]}>
              Te quedarán
            </Text>
            <Text style={[styles.rowValueLarge, { color: canAfford ? colors.success : colors.error }]}>
              {newBalance.toLocaleString()} O
            </Text>
          </View>

          {!canAfford && (
            <Text style={styles.errorText}>
              No tienes suficientes puntos para canjear esta recompensa.
            </Text>
          )}
        </View>

        {/* Condiciones */}
        <View style={styles.conditionsCard}>
          <View style={styles.conditionsHeader}>
            <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} />
            <Text style={styles.conditionsTitle}>Condiciones de uso</Text>
          </View>

          {(reward.conditions ?? []).map((cond, index) => (
            <View key={index} style={styles.conditionItem}>
              <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
              <Text style={styles.conditionText}>{cond}</Text>
            </View>
          ))}

          <View style={styles.expiryWarning}>
            <Ionicons name="time-outline" size={16} color="#FF9F43" />
            <Text style={styles.expiryText}>{reward.expiry}</Text>
          </View>
        </View>

        {/* Info adicional */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={ACCENT} />
          <Text style={styles.infoText}>
            El código será generado automáticamente tras el canje y estará disponible en tu Cartera.
          </Text>
        </View>
      </ScrollView>

      {/* Footer sticky */}
      <View style={[styles.footer, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          style={[styles.redeemButton, !canAfford && styles.redeemButtonDisabled]}
          onPress={handleRedeem}
          disabled={!canAfford}
          accessibilityLabel={canAfford ? 'Canjear recompensa' : 'Saldo insuficiente'}
        >
          <>
            <Text style={styles.redeemButtonText}>
              {canAfford ? 'Canjear recompensa' : 'Saldo insuficiente'}
            </Text>
            {canAfford && (
              <Text style={styles.redeemSubtext}>Por {reward.cost} Opopoints</Text>
            )}
          </>
        </TouchableOpacity>
        <Text style={styles.warningText}>Esta acción es irreversible.</Text>
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
    backgroundColor: colors.background,
  },
  // Header
  headerGradient: {
    paddingBottom: 24,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  phase2BadgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  phase2BadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  // Scroll
  scrollContent: {
    paddingTop: 0,
  },
  // Hero
  heroSection: {
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  heroBadge: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroBadgeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  heroPartner: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  titleSection: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: -1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rewardTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: PHASE2_COLOR,
    marginBottom: 6,
  },
  rewardSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
  },
  // Balance card
  balanceCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
  rowValueLarge: {
    fontSize: 20,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: colors.separator,
    marginVertical: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  // Conditions
  conditionsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  conditionsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  conditionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  expiryWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    padding: 12,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  expiryText: {
    fontSize: 13,
    color: '#FF9F43',
    fontWeight: '600',
    flex: 1,
  },
  // Info box
  infoBox: {
    backgroundColor: colors.grayLight,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  // Footer sticky
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingTop: 14,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    alignItems: 'center',
  },
  redeemButton: {
    backgroundColor: ACCENT_LIGHT,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    shadowColor: ACCENT_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  redeemButtonDisabled: {
    backgroundColor: colors.textSecondary,
    shadowOpacity: 0,
    elevation: 0,
  },
  redeemButtonText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '800',
  },
  redeemSubtext: {
    color: 'rgba(255,255,255,0.82)',
    fontSize: 12,
    marginTop: 4,
  },
  warningText: {
    color: colors.error,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 10,
  },
});
