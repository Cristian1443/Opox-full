import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import InsufficientPointsModal from '../../components/InsufficientPointsModal';
import { storeApi } from '../../api/store';

// ─── 11.2 · Tienda · Recompensas reales ────────────────────────────────────
// Fiel al Figma (RecompensasRealesScreen.tsx). El reference sustituye marcas
// reales (Uber Eats, Decathlon, Spotify) por partners ficticios solo para no
// reproducirlas en el diseño entregado — el backend real (storeApi.listProducts)
// ya sirve icon/color genéricos por recompensa, así que aquí se usan
// directamente sin necesidad de sustituir nada. Los filtros por categoría y
// los 3 niveles de urgencia de stock (Figma solo confirma 2: disponible/
// agotado) son funcionalidad real que se conserva.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function GemIcon({ size = 32, color = colors.white }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M5 8L2 3L7 3L12 3L17 3L22 3L19 8L12 21L5 8Z"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path d="M2 3L22 3M5 8L19 8M9 3L12 8L15 3" stroke={color} strokeWidth={1.2} fill="none" strokeLinejoin="round" />
    </Svg>
  );
}

const CATEGORIES = [
  { key: 'all', label: 'Todos' },
  { key: 'Food', label: 'Comida' },
  { key: 'Sport', label: 'Deporte' },
  { key: 'Music', label: 'Música' },
  { key: 'Books', label: 'Libros' },
];

function StockBadge({ stock, isAvailable }) {
  if (!isAvailable) {
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${colors.statRed}1A` }]}>
        <Text style={[styles.statusBadgeText, { color: colors.statRed }]}>Agotado</Text>
      </View>
    );
  }
  if (stock <= 3) {
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${colors.statRed}1A` }]}>
        <Text style={[styles.statusBadgeText, { color: colors.statRed }]}>¡Últimas {stock}!</Text>
      </View>
    );
  }
  if (stock <= 6) {
    return (
      <View style={[styles.statusBadge, { backgroundColor: `${colors.accentOrange}1A` }]}>
        <Text style={[styles.statusBadgeText, { color: colors.accentOrange }]}>{stock} disp.</Text>
      </View>
    );
  }
  return (
    <View style={[styles.statusBadge, { backgroundColor: `${colors.ctaGreen}1A` }]}>
      <Text style={[styles.statusBadgeText, { color: colors.ctaGreen }]}>{stock} disp.</Text>
    </View>
  );
}

export default function StoreRealRewardsScreen({ navigation }) {
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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <ChevronLeftIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recompensas reales</Text>
        <View style={styles.iconButton} />
      </View>

      {/* ── Tarjeta de saldo (reutilizada de Home - Tienda) ────────────── */}
      <View style={styles.balanceCard}>
        <GemIcon />
        <View style={styles.balanceTextWrap}>
          <Text style={styles.balanceAmount}>
            {userBalance !== null ? userBalance.toLocaleString('es-ES') : '—'}
          </Text>
          <Text style={styles.balanceLabel}>OPOPOINTS DISPONIBLES</Text>
        </View>
        <TouchableOpacity
          style={styles.earnButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('StoreHowToEarn')}
        >
          <Text style={styles.earnButtonText}>Cómo ganar +</Text>
        </TouchableOpacity>
      </View>

      {/* Filtros por categoría — real, sin equivalente en Figma */}
      <View style={styles.filtersRow}>
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

      <FlatList
        data={filteredRewards}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={[styles.row, index === 0 && styles.rowFirst, !item.isAvailable && styles.rowUnavailable]}
            activeOpacity={0.7}
            disabled={!item.isAvailable}
            onPress={() => handleRedeem(item)}
            accessibilityLabel={`${item.partner} ${item.title}, ${item.cost} Opopoints`}
          >
            <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
              <Ionicons name={item.icon ?? 'gift-outline'} size={22} color={colors.white} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{item.partner} · {item.title}</Text>
              <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
              <Text style={styles.rowPrice}>{item.cost.toLocaleString('es-ES')} Opopoints</Text>
            </View>
            <StockBadge stock={item.stock} isAvailable={item.isAvailable} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="gift-outline" size={44} color={colors.textSecondary} />
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

  // ── Tarjeta de saldo ──────────────────────────────────────────
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentOrange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  balanceTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  balanceAmount: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 20,
    color: colors.white,
  },
  balanceLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: colors.white,
    marginTop: 2,
  },
  earnButton: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  earnButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.white,
  },

  // ── Filtros ───────────────────────────────────────────────────
  filtersRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: colors.grayLight,
  },
  filterChipActive: {
    backgroundColor: colors.purple,
  },
  filterText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  filterTextActive: {
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },

  // ── Lista ─────────────────────────────────────────────────────
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 40,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowUnavailable: {
    opacity: 0.5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: colors.textSecondary,
    marginTop: 2,
  },
  rowPrice: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: colors.accentOrange,
    marginTop: 3,
  },
  statusBadge: {
    borderRadius: 10,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusBadgeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10.5,
  },

  // ── Vacío ─────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
});
