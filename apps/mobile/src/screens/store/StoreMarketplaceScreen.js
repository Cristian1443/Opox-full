import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  StatusBar,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { storeApi } from '../../api/store';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';
const PHASE2_DARK = '#7B1FA2';

// Paleta rotativa para avatares — evita lógica hardcoded por nombre de autor
const AVATAR_COLORS = ['#E1BEE7', '#BBDEFB', '#C8E6C9', '#FFF9C4', '#FFCCBC'];
const avatarBg = (id) => AVATAR_COLORS[parseInt(id, 10) % AVATAR_COLORS.length];


const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'free', label: 'Gratis' },
  { key: 'paid', label: 'Premium' },
];

const StarRating = ({ rating }) => (
  <View style={styles.starsContainer}>
    {[...Array(5)].map((_, i) => (
      <Ionicons
        key={i}
        name={i < Math.floor(rating) ? 'star' : 'star-outline'}
        size={14}
        color={i < Math.floor(rating) ? '#FFC107' : colors.grayMid}
      />
    ))}
    <Text style={styles.ratingText}>{rating}</Text>
  </View>
);

const TestCard = ({ item, onPress, onObtain }) => (
  <TouchableOpacity
    style={styles.card}
    onPress={onPress}
    activeOpacity={0.88}
    accessibilityLabel={`Test: ${item.title}, ${item.isFree ? 'Gratis' : item.price + ' Opopoints'}`}
  >
    <View style={styles.cardHeader}>
      <View style={styles.authorContainer}>
        <View style={[styles.avatar, { backgroundColor: avatarBg(item.id) }]}>
          <Text style={styles.avatarText}>{item.avatar}</Text>
        </View>
        <Text style={styles.authorName}>{item.author}</Text>
      </View>
      <View style={styles.categoryBadge}>
        <Text style={styles.categoryText}>{item.category}</Text>
      </View>
    </View>

    <Text style={styles.testTitle} numberOfLines={2}>{item.title}</Text>

    <View style={styles.ratingRow}>
      <StarRating rating={item.rating} />
      <Text style={styles.madeText}>{item.totalMade} hechos</Text>
    </View>

    <View style={styles.cardFooter}>
      {item.isFree ? (
        <View style={styles.freeBadge}>
          <Ionicons name="gift-outline" size={15} color={colors.success} />
          <Text style={styles.freeText}>Gratis</Text>
        </View>
      ) : (
        <View style={styles.priceBadge}>
          <Ionicons name="pricetags-outline" size={15} color={PHASE2_DARK} />
          <Text style={styles.priceText}>{item.price} O</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.actionButton, item.isFree ? styles.actionButtonFree : styles.actionButtonPaid]}
        onPress={onObtain}
        accessibilityLabel={item.isFree ? `Obtener ${item.title} gratis` : `Comprar ${item.title} por ${item.price} Opopoints`}
      >
        <Text style={styles.actionButtonText}>Obtener</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

export default function StoreMarketplaceScreen({ navigation }) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState('all');
  const [tests, setTests] = useState([]);
  const [balance, setBalance] = useState(null);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getBalance().then(res => {
      if (cancelled || !res?.data) return;
      setBalance(res.data.balance);
    });
    storeApi.listCommunityTests().then(res => {
      if (cancelled || !res?.data) return;
      setTests(res.data.map(t => ({ ...t, avatar: t.author.substring(0, 1).toUpperCase() })));
    });
    return () => { cancelled = true; };
  }, []));

  const filteredTests = tests.filter((test) => {
    if (activeFilter === 'all') return true;
    return activeFilter === 'free' ? test.isFree : !test.isFree;
  });

  const handleObtain = async (item) => {
    if (item.isFree) {
      const res = await storeApi.obtainCommunityTest(item.id);
      if (res?.error) {
        Alert.alert('Error', res.error.message ?? 'Inténtalo de nuevo');
        return;
      }
      navigation.navigate('StoreRedeemSuccess', {
        productName: item.title,
        newBalance: res.data?.newBalance ?? (balance ?? 0),
      });
    } else {
      navigation.navigate('StoreConfirmRedeem', {
        productId: item.id,
        redeemType: 'community_test',
        product: { name: item.title, price: item.price, icon: 'document-text-outline' },
        currentBalance: balance ?? 0,
        newBalance: (balance ?? 0) - item.price,
      });
    }
  };

  const renderItem = ({ item }) => (
    <TestCard
      item={item}
      onPress={() => navigation.navigate('StoreTestDetail', { test: item })}
      onObtain={() => handleObtain(item)}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            accessibilityLabel="Volver"
          >
            <Ionicons name="chevron-back" size={24} color={ACCENT} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.title}>Tests de la comunidad</Text>
            <Text style={styles.subtitle}>
              Tests creados por otros opositores. Valóralos tras hacerlos.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.publishButton}
          onPress={() => navigation.navigate('StorePublishTest')}
          accessibilityLabel="Publicar un test"
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterButton, isActive && styles.filterButtonActive]}
              onPress={() => setActiveFilter(filter.key)}
              accessibilityLabel={filter.label}
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FlatList
        data={filteredTests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 90 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay tests en esta categoría.</Text>
        }
      />

      {/* Footer fijo publicar */}
      <View style={[styles.publishFooter, { paddingBottom: bottomInset + 12 }]}>
        <TouchableOpacity
          style={styles.publishFooterButton}
          onPress={() => navigation.navigate('StorePublishTest')}
          accessibilityLabel="Publicar un test en la comunidad"
        >
          <Ionicons name="add" size={20} color={colors.white} />
          <Text style={styles.publishFooterText}>+ Publicar mi test</Text>
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
  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 4,
  },
  backButton: {
    paddingTop: 2,
    marginRight: 4,
  },
  headerContent: {
    flex: 1,
  },
  phase2BadgeContainer: {
    backgroundColor: PHASE2_DARK,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  phase2BadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  publishButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
    marginTop: 2,
    shadowColor: ACCENT_LIGHT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  // Filtros
  filtersContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    gap: 8,
  },
  filterButton: {
    paddingVertical: 7,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
  },
  filterButtonActive: {
    backgroundColor: ACCENT_LIGHT,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.white,
  },
  // Lista
  listContent: {
    padding: 16,
  },
  // Tarjeta
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.text,
  },
  authorName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  categoryBadge: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  testTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    lineHeight: 21,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  starsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 4,
  },
  madeText: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 'auto',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  freeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.successBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  freeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.success,
  },
  priceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E5F5',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 5,
  },
  priceText: {
    fontSize: 13,
    fontWeight: '700',
    color: PHASE2_DARK,
  },
  actionButton: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  actionButtonFree: {
    backgroundColor: colors.success,
  },
  actionButtonPaid: {
    backgroundColor: ACCENT_LIGHT,
  },
  actionButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '800',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
    fontSize: 14,
  },
  // Footer publicar
  publishFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingTop: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  publishFooterButton: {
    backgroundColor: PHASE2_DARK,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 16,
    gap: 6,
    shadowColor: PHASE2_DARK,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  publishFooterText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
});
