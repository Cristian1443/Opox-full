import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';

const ACCENT = '#6C5CE7';

const DISCOUNTS_DATA = [
  {
    id: '1',
    partner: 'FNAC',
    discount: '-15%',
    description: 'En libros y material de estudio',
    cost: 250,
    expiry: '60 días',
    expiryDays: 60,
    icon: 'book-outline',
    color: '#E91E63',
    isExpired: false,
  },
  {
    id: '2',
    partner: 'Cafetería Study',
    discount: '5€',
    description: 'En cafetería para tus jornadas',
    cost: 180,
    expiry: '30 días',
    expiryDays: 30,
    icon: 'cafe-outline',
    color: '#795548',
    isExpired: false,
  },
  {
    id: '3',
    partner: 'Papelería Online',
    discount: '-10%',
    description: 'Subrayadores, fichas, agendas',
    cost: 120,
    expiry: '15 días',
    expiryDays: 15,
    icon: 'pricetags-outline',
    color: '#3F51B5',
    isExpired: false,
  },
  {
    id: '4',
    partner: 'GymPartner',
    discount: '2 meses gratis',
    description: 'Suscripción al gimnasio',
    cost: 300,
    expiry: '10 días',
    expiryDays: 10,
    icon: 'fitness-outline',
    color: '#F44336',
    isExpired: false,
  },
  {
    id: '5',
    partner: 'Librería Antigua',
    discount: '-20%',
    description: 'Libros de segunda mano',
    cost: 100,
    expiry: '2 días',
    expiryDays: 2,
    icon: 'book-outline',
    color: '#9C27B0',
    isExpired: true,
  },
];

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
  const [userBalance] = useState(1840);
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  const handleRedeem = (discount) => {
    if (userBalance < discount.cost) {
      setSelectedDiscount(discount);
      setShowInsufficientModal(true);
      return;
    }
    navigation.navigate('StoreConfirmRedeem', {
      product: {
        name: `${discount.discount} en ${discount.partner}`,
        price: discount.cost,
        icon: discount.icon,
      },
      currentBalance: userBalance,
      newBalance: userBalance - discount.cost,
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
        <Text style={styles.balanceAmount}>{userBalance.toLocaleString()} O</Text>
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

        {DISCOUNTS_DATA.map(renderDiscountCard)}

        {DISCOUNTS_DATA.length === 0 && (
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
