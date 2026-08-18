import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

// Acento propio del Bloque 11 · Tienda (violeta)
const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';
const PHASE2_COLOR = '#7B1FA2';

const TABS = [
  { key: 'virtual', label: 'Virtual' },
  { key: 'discounts', label: 'Descuentos' },
  { key: 'real', label: 'Reales', isPhase2: true },
  { key: 'subscription', label: 'Suscripción' },
  { key: 'comunidad', label: 'Comunidad', isPhase2: true, navigateTo: 'StoreMarketplace' },
];

const MOCK_PRODUCTS = [
  { id: '1', name: 'Avatar Pro', price: 300, icon: 'cube-outline', type: 'virtual' },
  { id: '2', name: 'Insignia Élite', price: 150, icon: 'trophy-outline', type: 'virtual' },
  { id: '3', name: 'Pack Tests Premium', price: 500, icon: 'document-text-outline', type: 'virtual' },
  { id: '4', name: 'Tema Desbloqueado', price: 400, icon: 'color-palette-outline', type: 'virtual' },
];

const MOCK_DISCOUNTS = [
  { id: '1', name: 'FNAC -15%', price: 250, desc: 'Libros y material', icon: 'book-outline', type: 'discounts' },
  { id: '2', name: '5€ en cafetería', price: 180, desc: 'Para jornadas de estudio', icon: 'cafe-outline', type: 'discounts' },
  { id: '3', name: '-10% Papelería', price: 120, desc: 'Subrayadores, agendas', icon: 'pricetags-outline', type: 'discounts' },
];

const MOCK_REAL_REWARDS = [
  { id: '1', name: 'Uber Eats (1 mes)', price: 1500, desc: 'Suscripción Uber One', icon: 'restaurant-outline', type: 'real', isPhase2: true },
  { id: '2', name: 'Decathlon -20%', price: 1200, desc: 'Prueba física', icon: 'fitness-outline', type: 'real', isPhase2: true },
];

const SUBSCRIPTION_PLANS = [
  {
    key: 'free',
    name: 'Gratis',
    price: '0€',
    desc: 'Tests limitados · con anuncios',
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '9,99€/mes',
    desc: 'Tests infinitos sin anuncios',
    isPopular: true,
    features: ['Tutor IA ilimitado · Foto-Test', 'Monitor BOE y Estadísticas Pro'],
  },
  {
    key: 'annual',
    name: 'Anual',
    price: '89€/año',
    desc: 'Ahorra un 25% · 2 meses gratis',
  },
];

// --- Sub-componentes ---

const OpopointsHeader = ({ balance, onEarnClick, onWalletClick, onAffiliateClick }) => (
  <View style={styles.heroContainer}>
    <View style={styles.opopointsCard}>
      <View style={styles.opopointsTop}>
        <Ionicons name="gift-outline" size={24} color={ACCENT} />
        <Text style={styles.opopointsLabel}>Opopoints disponibles</Text>
      </View>
      <Text style={styles.opopointsBalance}>{balance.toLocaleString()}</Text>
      <TouchableOpacity
        style={styles.earnButton}
        onPress={onEarnClick}
        accessibilityLabel="Ver cómo ganar Opopoints"
      >
        <Ionicons name="add-circle" size={16} color={colors.white} />
        <Text style={styles.earnButtonText}>Cómo ganar</Text>
      </TouchableOpacity>

      {/* Accesos rápidos */}
      <View style={styles.quickLinks}>
        <TouchableOpacity
          style={styles.quickLink}
          onPress={onWalletClick}
          accessibilityLabel="Mi cartera de recompensas"
        >
          <Ionicons name="wallet-outline" size={16} color={ACCENT} />
          <Text style={styles.quickLinkText}>Mi cartera</Text>
        </TouchableOpacity>
        <View style={styles.quickLinkDivider} />
        <TouchableOpacity
          style={styles.quickLink}
          onPress={onAffiliateClick}
          accessibilityLabel="Programa de afiliación"
        >
          <Ionicons name="people-outline" size={16} color={ACCENT} />
          <Text style={styles.quickLinkText}>Invita y ahorra</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

const ProductCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.85}
    onPress={onPress}
    accessibilityLabel={`${item.name}, ${item.price} Opopoints`}
  >
    <View style={[styles.cardIconContainer, item.isPhase2 && styles.phase2IconBg]}>
      <Ionicons
        name={item.icon}
        size={32}
        color={item.isPhase2 ? ACCENT : ACCENT_LIGHT}
      />
    </View>
    <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
    <Text style={styles.cardDesc} numberOfLines={2}>{item.desc || 'Mejora virtual'}</Text>
    <View style={styles.cardFooter}>
      <Ionicons name="cash-outline" size={14} color={colors.text} />
      <Text style={styles.cardPrice}>{item.price} O</Text>
    </View>
  </TouchableOpacity>
);

const SubscriptionCard = ({ plan, onPress }) => (
  <TouchableOpacity
    style={[styles.subCard, plan.isPopular && styles.subCardPopular]}
    onPress={onPress}
    accessibilityLabel={`Plan ${plan.name}, ${plan.price}`}
  >
    {plan.isPopular && (
      <View style={styles.badgePopularContainer}>
        <Text style={styles.badgePopularText}>POPULAR</Text>
      </View>
    )}
    <Text style={styles.subTitle}>{plan.name}</Text>
    <Text style={styles.subPrice}>{plan.price}</Text>
    <Text style={styles.subDesc}>{plan.desc}</Text>
    {plan.features && (
      <View style={styles.subFeatures}>
        {plan.features.map((f, i) => (
          <View key={i} style={styles.subFeatureRow}>
            <Ionicons name="checkmark-circle" size={18} color={colors.success} />
            <Text style={styles.subFeatureText}>{f}</Text>
          </View>
        ))}
      </View>
    )}
    <TouchableOpacity
      style={styles.subButton}
      onPress={onPress}
      accessibilityLabel={plan.name === 'Gratis' ? 'Empezar gratis' : `Suscribirse al plan ${plan.name}`}
    >
      <Text style={styles.subButtonText}>
        {plan.name === 'Gratis' ? 'Empezar' : 'Suscribirme'}
      </Text>
    </TouchableOpacity>
  </TouchableOpacity>
);

// --- Pantalla principal ---

export default function StoreHomeScreen({ navigation }) {
  const [activeTab, setActiveTab] = useState('virtual');
  const [opopointsBalance] = useState(1840);

  const getCurrentItems = () => {
    if (activeTab === 'virtual') return MOCK_PRODUCTS;
    if (activeTab === 'discounts') return MOCK_DISCOUNTS;
    if (activeTab === 'real') return MOCK_REAL_REWARDS;
    return [];
  };

  const renderItem = ({ item }) => (
    <ProductCard
      item={item}
      onPress={() => {
        if (item.type === 'real') {
          navigation.navigate('StoreRealRewards');
        } else if (item.type === 'discounts') {
          navigation.navigate('StoreDiscounts');
        } else {
          navigation.navigate('StoreProductDetail', { item });
        }
      }}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <OpopointsHeader
        balance={opopointsBalance}
        onEarnClick={() => navigation.navigate('StoreHowToEarn')}
        onWalletClick={() => navigation.navigate('StoreWallet')}
        onAffiliateClick={() => navigation.navigate('StoreAffiliate')}
      />

      {/* Pestañas */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsWrapper}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              onPress={() => {
                if (tab.navigateTo) {
                  navigation.navigate(tab.navigateTo);
                  return;
                }
                setActiveTab(tab.key);
              }}
              accessibilityLabel={tab.label}
              accessibilityRole="tab"
              accessibilityState={{ selected: isActive }}
            >
              <Text style={[
                styles.tabText,
                isActive && (tab.isPhase2 ? styles.phase2TabText : styles.activeTabText),
              ]}>
                {tab.label}
              </Text>
              {isActive && (
                <View style={[styles.tabIndicator, tab.isPhase2 && styles.phase2Indicator]} />
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Contenido: se evita anidar FlatList dentro de ScrollView */}
      {activeTab === 'subscription' ? (
        <ScrollView contentContainerStyle={styles.subScrollContent}>
          <Text style={styles.sectionTitle}>Elige tu plan</Text>
          {SUBSCRIPTION_PLANS.map((plan) => (
            <SubscriptionCard
              key={plan.key}
              plan={plan}
              onPress={() => navigation.navigate('StoreSubscription', { planKey: plan.key })}
            />
          ))}
        </ScrollView>
      ) : (
        <FlatList
          data={getCurrentItems()}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No hay productos en esta categoría.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  // Hero
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  opopointsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    alignItems: 'center',
  },
  opopointsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  opopointsLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  opopointsBalance: {
    fontSize: 32,
    fontWeight: '800',
    color: ACCENT,
    marginBottom: 16,
  },
  earnButton: {
    flexDirection: 'row',
    backgroundColor: ACCENT_LIGHT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignItems: 'center',
    gap: 4,
  },
  earnButtonText: {
    color: colors.white,
    fontWeight: '600',
    fontSize: 12,
  },
  quickLinks: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.separator,
    width: '100%',
    justifyContent: 'center',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  quickLinkText: {
    fontSize: 13,
    color: ACCENT,
    fontWeight: '700',
  },
  quickLinkDivider: {
    width: 1,
    height: '100%',
    backgroundColor: colors.separator,
  },
  // Pestañas
  tabsWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    flexGrow: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingTop: 4,
    paddingHorizontal: 4,
  },
  tab: {
    paddingHorizontal: 16,
    alignItems: 'center',
    paddingVertical: 12,
    position: 'relative',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  activeTabText: {
    color: ACCENT,
  },
  phase2TabText: {
    color: PHASE2_COLOR,
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 4,
    right: 4,
    height: 2,
    backgroundColor: ACCENT,
    borderRadius: 2,
  },
  phase2Indicator: {
    backgroundColor: PHASE2_COLOR,
  },
  // Grid de productos
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.separator,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  phase2IconBg: {
    backgroundColor: '#EDE7F6',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 12,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  // Suscripciones
  subScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 16,
  },
  subCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.separator,
    marginBottom: 16,
    position: 'relative',
  },
  subCardPopular: {
    borderColor: ACCENT,
    borderWidth: 2,
  },
  badgePopularContainer: {
    position: 'absolute',
    top: -14,
    right: 16,
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePopularText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  subTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  subPrice: {
    fontSize: 24,
    fontWeight: '800',
    color: ACCENT,
    marginBottom: 8,
  },
  subDesc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
  },
  subFeatures: {
    marginBottom: 8,
  },
  subFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subFeatureText: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
  },
  subButton: {
    backgroundColor: ACCENT,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  subButtonText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    color: colors.textSecondary,
    fontSize: 14,
  },
});
