import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';
const PHASE2_COLOR = '#7B1FA2';


const partnerAbbr = (name) => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'Food', label: 'Comida' },
  { key: 'Sport', label: 'Deporte' },
  { key: 'Music', label: 'Música' },
  { key: 'Books', label: 'Libros' },
];

const StockBadge = ({ stock, isAvailable }) => {
  if (!isAvailable) {
    return (
      <View style={[styles.stockChip, { backgroundColor: colors.errorBg }]}>
        <Text style={[styles.stockChipText, { color: colors.error }]}>Agotado</Text>
      </View>
    );
  }
  if (stock <= 3) {
    return (
      <View style={[styles.stockChip, { backgroundColor: colors.errorBg }]}>
        <Text style={[styles.stockChipText, { color: colors.error }]}>¡Últimas {stock}!</Text>
      </View>
    );
  }
  if (stock <= 6) {
    return (
      <View style={[styles.stockChip, { backgroundColor: '#FFF3E0' }]}>
        <Text style={[styles.stockChipText, { color: '#FF9F43' }]}>{stock} disp.</Text>
      </View>
    );
  }
  return (
    <View style={[styles.stockChip, { backgroundColor: colors.successBg }]}>
      <Text style={[styles.stockChipText, { color: colors.success }]}>{stock} disp.</Text>
    </View>
  );
};

const RewardCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={[styles.card, !item.isAvailable && styles.cardUnavailable]}
    onPress={() => onPress(item)}
    disabled={!item.isAvailable}
    activeOpacity={0.9}
    accessibilityLabel={`${item.partner} ${item.title}, ${item.cost} Opopoints`}
  >
    <View style={styles.cardHeader}>
      <View style={[styles.partnerAvatar, { backgroundColor: item.color }]}>
        <Text style={styles.partnerAvatarText}>{partnerAbbr(item.partner)}</Text>
      </View>
      <StockBadge stock={item.stock} isAvailable={item.isAvailable} />
    </View>

    <Text style={styles.partnerName}>{item.partner}</Text>
    <Text style={styles.rewardTitle}>{item.title}</Text>
    <Text style={styles.rewardSubtitle}>{item.subtitle}</Text>

    <View style={styles.cardFooter}>
      <View style={styles.costContainer}>
        <Ionicons name="cash-outline" size={18} color={PHASE2_COLOR} />
        <Text style={styles.costText}>{item.cost} O</Text>
      </View>

      {item.isAvailable ? (
        <View style={styles.redeemButton}>
          <Text style={styles.redeemButtonText}>Canjear</Text>
        </View>
      ) : (
        <View style={styles.soldOutBadge}>
          <Ionicons name="close-circle" size={16} color={colors.white} />
          <Text style={styles.soldOutText}>Agotado</Text>
        </View>
      )}
    </View>

  </TouchableOpacity>
);

export default function StoreRealRewardsScreen({ navigation }) {
  const { top: topInset } = useSafeAreaInsets();
  const [userBalance, setUserBalance] = useState(null);
  const [rewardsData, setRewardsData] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showInsufficientModal, setShowInsufficientModal] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getBalance().then(res => {
      if (cancelled || !res?.data) return;
      setUserBalance(res.data.balance);
    });
    storeApi.listProducts().then(res => {
      if (cancelled || !res?.data) return;
      setRewardsData(res.data);
    });
    return () => { cancelled = true; };
  }, []));

  const filteredRewards = rewardsData.filter(
    (r) => activeCategory === 'all' || r.category === activeCategory,
  );

  const handleRedeem = (reward) => {
    const bal = userBalance ?? 0;
    if (userBalance === null || bal < reward.cost) {
      setSelectedReward(reward);
      setShowInsufficientModal(true);
      return;
    }
    navigation.navigate('StoreRealRewardDetail', { reward });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header con gradiente que cubre la zona del status bar */}
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
          <Text style={styles.headerTitle}>Recompensas Reales</Text>
          <Text style={styles.headerSubtitle}>
            Canjea tus puntos por premios del mundo real
          </Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      {/* Saldo flotante sobre el gradiente */}
      <View style={styles.balanceBanner}>
        <Text style={styles.balanceLabel}>Tus Opopoints:</Text>
        <Text style={styles.balanceAmount}>
          {userBalance !== null ? userBalance.toLocaleString() : '—'} O
        </Text>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {CATEGORIES.map((cat) => {
          const isActive = activeCategory === cat.key;
          return (
            <TouchableOpacity
              key={cat.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
              onPress={() => setActiveCategory(cat.key)}
              accessibilityLabel={cat.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Lista de recompensas */}
      <FlatList
        data={filteredRewards}
        renderItem={({ item }) => <RewardCard item={item} onPress={handleRedeem} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No hay recompensas en esta categoría.</Text>
          </View>
        }
      />

      <InsufficientPointsModal
        visible={showInsufficientModal}
        onClose={() => setShowInsufficientModal(false)}
        cost={selectedReward?.cost ?? 0}
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
  // Header gradient
  headerGradient: {
    paddingBottom: 28,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.82)',
    lineHeight: 18,
  },
  // Balance banner
  balanceBanner: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingVertical: 12,
    marginTop: -14,
    marginHorizontal: 16,
    borderRadius: 14,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
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
  // Filters
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    gap: 8,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  filterChipActive: {
    backgroundColor: ACCENT_LIGHT,
    borderColor: ACCENT_LIGHT,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  // List
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: ACCENT_LIGHT,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardUnavailable: {
    opacity: 0.55,
    borderColor: colors.separator,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  partnerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  stockChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  stockChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  partnerName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  rewardTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: PHASE2_COLOR,
    marginBottom: 4,
  },
  rewardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
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
    gap: 6,
  },
  costText: {
    fontSize: 16,
    fontWeight: '800',
    color: PHASE2_COLOR,
  },
  redeemButton: {
    backgroundColor: ACCENT,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 12,
  },
  redeemButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  soldOutBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    gap: 4,
  },
  soldOutText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  // Empty
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
