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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import Svg, { Path, Polygon } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { storeApi } from '../../api/store';

// ─── 11.2 · Tienda · Tests de la comunidad ─────────────────────────────────
// Fiel al Figma (MarketplaceTestsScreen.tsx). Los filtros Todos/Gratis/
// Premium son funcionalidad real sin equivalente en Figma, se conservan.
// Había dos entradas redundantes para publicar un test (ícono "+" del
// header y botón fijo al fondo) — Figma solo confirma la segunda, así que
// se retira el ícono duplicado del header.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
};

const FILTERS = [
  { key: 'all', label: 'Todos' },
  { key: 'free', label: 'Gratis' },
  { key: 'paid', label: 'Premium' },
];

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function StarIcon({ size = 11, color = '#F9BB00' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Polygon
        points="12,2 14.9,8.6 22,9.3 16.6,14 18.2,21 12,17.3 5.8,21 7.4,14 2,9.3 9.1,8.6"
        fill={color}
      />
    </Svg>
  );
}

function TestRow({ item, index, onPress, onObtain }) {
  return (
    <TouchableOpacity
      style={[styles.row, index === 0 && styles.rowFirst]}
      activeOpacity={0.7}
      onPress={onPress}
      accessibilityLabel={`Test: ${item.title}, ${item.isFree ? 'Gratis' : item.price + ' Opopoints'}`}
    >
      <View style={styles.rowTextWrap}>
        <Text style={styles.rowTitle} numberOfLines={2}>{item.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.metaText}>por {item.author}</Text>
          {item.category ? <Text style={styles.metaText}>· {item.category}</Text> : null}
          <StarIcon />
          <Text style={styles.metaText}>{item.rating}</Text>
          <Text style={styles.metaText}>· {item.totalMade} hechos</Text>
        </View>
        <Text style={item.isFree ? styles.freeText : styles.priceText}>
          {item.isFree ? 'Gratis' : `${item.price} Opopoints`}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.obtenerPill}
        activeOpacity={0.7}
        onPress={onObtain}
        accessibilityLabel={item.isFree ? `Obtener ${item.title} gratis` : `Comprar ${item.title} por ${item.price} Opopoints`}
      >
        <Text style={styles.obtenerPillText}>Obtener</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function StoreMarketplaceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
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
      setTests(res.data);
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
        <View style={styles.headerTitles}>
          <Text style={styles.headerTitle}>Tests de la comunidad</Text>
          <Text style={styles.headerSubtitle}>Tests creados por otros opositores. Valóralos tras hacerlos.</Text>
        </View>
        <View style={styles.iconButton} />
      </View>

      {/* Filtros — real, sin equivalente en Figma */}
      <View style={styles.filtersRow}>
        {FILTERS.map((filter) => {
          const isActive = activeFilter === filter.key;
          return (
            <TouchableOpacity
              key={filter.key}
              style={[styles.filterChip, isActive && styles.filterChipActive]}
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
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TestRow
            item={item}
            index={index}
            onPress={() => navigation.navigate('StoreTestDetail', { test: item })}
            onObtain={() => handleObtain(item)}
          />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No hay tests en esta categoría.</Text>
        }
      />

      {/* ── Botón fijo: publicar test ─────────────────────────────────── */}
      <View style={[styles.publishFooter, { paddingBottom: spacing.sm + insets.bottom }]}>
        <TouchableOpacity
          style={styles.publishButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StorePublishTest')}
          accessibilityLabel="Publicar un test en la comunidad"
        >
          <Text style={styles.publishButtonText}>+ Publicar mi test</Text>
        </TouchableOpacity>
      </View>
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
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Filtros ───────────────────────────────────────────────────
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: 8,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
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
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  rowFirst: {
    borderTopWidth: 0,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
  },
  priceText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10.5,
    color: colors.accentOrange,
    marginTop: 4,
  },
  freeText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 10.5,
    color: colors.ctaGreen,
    marginTop: 4,
  },
  obtenerPill: {
    backgroundColor: `${colors.ctaGreen}1A`,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  obtenerPillText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.ctaGreen,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    fontSize: 14,
  },

  // ── Botón fijo: publicar ──────────────────────────────────────
  publishFooter: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  publishButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.textDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
