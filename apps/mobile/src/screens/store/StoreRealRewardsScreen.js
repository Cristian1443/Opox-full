import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    StatusBar,
    FlatList,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, Feather } from '@expo/vector-icons';
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

function GemIcon({ width = 32, height = 23.5, color = colors.white }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 121 89" fill="none">
      <Path d="M60.4491 88.6297C60.1966 88.6299 59.9465 88.5804 59.7132 88.4839C59.4799 88.3875 59.2678 88.246 59.0892 88.0676L0.5768 26.8898C0.317128 26.6283 0.143318 26.2938 0.0785304 25.931C0.0137425 25.5682 0.0610529 25.1943 0.214158 24.859C0.350185 24.5279 0.581184 24.2444 0.878044 24.0444C1.1749 23.8443 1.52434 23.7366 1.88231 23.7348H118.961C119.326 23.7294 119.683 23.8337 119.987 24.0342C120.291 24.2347 120.528 24.5221 120.666 24.859C120.819 25.1943 120.866 25.5682 120.801 25.931C120.737 26.2938 120.563 26.6283 120.303 26.8898L61.7183 88.0676C61.3811 88.408 60.9278 88.6087 60.4491 88.6297ZM6.27029 27.4519L60.4491 84.0967L114.61 27.4519H6.27029Z" fill={color} />
      <Path d="M60.4488 88.6294C60.0816 88.6385 59.7203 88.5359 59.4127 88.3352C59.1051 88.1344 58.8657 87.845 58.7263 87.5052L32.9424 26.3274L36.3512 24.8768L60.4488 81.993L81.5546 31.9665L84.9816 33.4171L62.1532 87.5052C62.0149 87.8421 61.7783 88.1295 61.4743 88.33C61.1703 88.5305 60.813 88.6348 60.4488 88.6294Z" fill={color} />
      <Path d="M118.962 27.6336H1.88241C1.53796 27.6467 1.19691 27.5614 0.899208 27.3877C0.60151 27.2139 0.359507 26.9589 0.201561 26.6525C0.0436146 26.3461 -0.0237299 26.0011 0.00742021 25.6578C0.0385703 25.3145 0.166924 24.9872 0.377439 24.7143L16.4969 0.816144C16.6645 0.561558 16.8936 0.353333 17.163 0.210717C17.4324 0.0681018 17.7334 -0.00430239 18.0381 0.000197658H102.86C103.165 -0.00430239 103.466 0.0681018 103.735 0.210717C104.005 0.353333 104.234 0.561558 104.401 0.816144L120.503 24.7143C120.71 24.9898 120.835 25.3188 120.862 25.6626C120.889 26.0063 120.817 26.3507 120.655 26.6552C120.493 26.9598 120.248 27.2119 119.948 27.3819C119.648 27.552 119.306 27.633 118.962 27.6154V27.6336ZM5.50883 23.9165H115.462L101.863 3.71728H19.0173L5.50883 23.9165Z" fill={color} />
      <Path d="M35.9164 27.125L33.3779 24.4233L59.1618 0.253174H61.7184L80.9566 18.2946L78.4181 20.9963L60.4492 4.16971L35.9164 27.125Z" fill={color} />
      <Path d="M24.1233 7.5405L21.0381 9.62207L32.8472 27.1248L35.9324 25.0433L24.1233 7.5405Z" fill={color} />
      <Path d="M118.962 27.6332H86.4508C86.1098 27.639 85.7741 27.5485 85.4823 27.3721C85.1904 27.1957 84.9542 26.9405 84.8008 26.636C84.6605 26.3493 84.5984 26.0307 84.6206 25.7123C84.6429 25.3939 84.7488 25.0871 84.9277 24.8227L101.247 0.906475C101.414 0.651889 101.643 0.443665 101.913 0.301049C102.182 0.158434 102.483 0.0860296 102.788 0.0905297C103.097 0.0911267 103.401 0.165478 103.675 0.307399C103.95 0.44932 104.186 0.654707 104.365 0.906475L120.503 24.714C120.71 24.9895 120.835 25.3184 120.862 25.6622C120.889 26.006 120.817 26.3504 120.655 26.6549C120.494 26.9595 120.248 27.2115 119.948 27.3816C119.648 27.5517 119.306 27.6327 118.962 27.6151V27.6332ZM89.9503 23.9161H115.462L102.77 5.13126L89.9503 23.9161Z" fill={color} />
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
    if (userBalance !== null && userBalance < reward.cost) {
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
          style={styles.backBtn}
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recompensas reales</Text>
        <View style={styles.headerPlaceholder} />
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
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(65, 41, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPlaceholder: {
    width: 44,
    height: 44,
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
