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
import { colors } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

const ACCENT = '#6C5CE7';

const partnerAbbr = (name) => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const getExpiryColor = (days) => {
  if (days <= 3) return colors.error;
  if (days <= 7) return '#FF9F43';
  return colors.success;
};

const getExpiryBg = (days) => {
  if (days <= 3) return colors.errorBg;
  if (days <= 7) return '#FFF3E0';
  return colors.successBg;
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

  const renderDiscountCard = (item) => {
    const expiryColor = getExpiryColor(item.expiryDays);
    const expiryBg = getExpiryBg(item.expiryDays);

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, item.isExpired && styles.cardExpired]}
        onPress={() => handleRedeem(item)}
        disabled={item.isExpired}
        activeOpacity={0.8}
        accessibilityLabel={`${item.partner} ${item.discount}, ${item.cost} Opopoints`}
      >
        <View style={styles.cardHeader}>
          <View style={[styles.partnerAvatar, { backgroundColor: item.color }]}>
            <Text style={styles.partnerAvatarText}>{partnerAbbr(item.partner)}</Text>
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{item.discount}</Text>
          </View>
        </View>

        <View style={styles.cardBody}>
          <Text style={styles.partnerName}>{item.partner}</Text>
          <Text style={styles.description} numberOfLines={2}>{item.description}</Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.costContainer}>
            <Ionicons name="cash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.costText}>{item.cost} O</Text>
          </View>

          <View style={[styles.expiryBadge, { backgroundColor: item.isExpired ? colors.errorBg : expiryBg }]}>
            <Ionicons
              name={item.isExpired ? 'close-circle' : 'time-outline'}
              size={14}
              color={item.isExpired ? colors.error : expiryColor}
            />
            <Text style={[styles.expiryText, { color: item.isExpired ? colors.error : expiryColor }]}>
              {item.isExpired ? 'Expirado' : `Caduca en ${item.expiry}`}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Descuentos</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.balanceBanner}>
        <Text style={styles.balanceLabel}>Tus Opopoints:</Text>
        <Text style={styles.balanceAmount}>
          {userBalance !== null ? userBalance.toLocaleString() : '—'} O
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.infoBanner}>
          <Ionicons name="information-circle-outline" size={20} color={ACCENT} />
          <Text style={styles.infoText}>
            Canjea tus puntos por códigos promocionales válidos en nuestros partners.
            {' '}¡Los códigos caducan!
          </Text>
        </View>

        {discountsData.map(renderDiscountCard)}

        {discountsData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={48} color={colors.textSecondary} />
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
  },
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: 6,
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 16,
    fontWeight: '800',
    color: ACCENT,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.grayLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.separator,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardExpired: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  discountBadge: {
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  discountText: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.success,
  },
  cardBody: {
    marginBottom: 12,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  costContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  costText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  expiryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  expiryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
