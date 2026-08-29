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
import Svg, { Path, Circle, Polygon } from 'react-native-svg';
import { colors } from '../../theme';

// ─── 11.1 · Tienda · home ──────────────────────────────────────────────────
// Fiel al Figma (TiendaHomeScreen.tsx) para header, tarjeta de saldo, tabs y
// tarjeta de producto — las únicas piezas que el reference cubre (solo
// muestra el tab "Virtual"). Suscripción/Descuentos/Reales y los accesos
// rápidos de cartera/afiliación son funcionalidad real sin equivalente en
// Figma y se conservan (ver notas junto a cada bloque).
const FIGMA = {
  cardBorder: 'rgba(65, 41, 80, 0.3)',
  tabTextMuted: 'rgba(65, 41, 80, 0.5)',
  comoGanarBg: 'rgba(255,255,255,0.25)',
  quickLinkDivider: 'rgba(255,255,255,0.35)',
  quickLinkBorder: 'rgba(255,255,255,0.3)',
};

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

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Ícono de diamante/gema (ver hallazgo 2: nombrado "Capa_1" en Figma).
// Reutilizado para el saldo y para el precio de cada tarjeta de producto.
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

// --- Sub-componentes ---

const OpopointsHeader = ({ balance, onEarnClick, onWalletClick, onAffiliateClick }) => (
  <View style={styles.heroContainer}>
    <View style={styles.balanceCard}>
      <GemIcon />
      <View style={styles.balanceTextWrap}>
        <Text style={styles.balanceAmount}>{balance.toLocaleString('es-ES')}</Text>
        <Text style={styles.balanceLabel}>OPOPOINTS DISPONIBLES</Text>
      </View>
      <TouchableOpacity
        style={styles.earnButton}
        onPress={onEarnClick}
        accessibilityLabel="Ver cómo ganar Opopoints"
      >
        <Text style={styles.earnButtonText}>Cómo ganar +</Text>
      </TouchableOpacity>
    </View>

    {/* Accesos rápidos (Mi cartera / Invita y ahorra) — funcionalidad real
        sin equivalente en Figma, se conserva porque son los únicos puntos
        de entrada a StoreWallet/StoreAffiliate. */}
    <View style={styles.quickLinks}>
      <TouchableOpacity
        style={styles.quickLink}
        onPress={onWalletClick}
        accessibilityLabel="Mi cartera de recompensas"
      >
        <Ionicons name="wallet-outline" size={16} color={colors.textDark} />
        <Text style={styles.quickLinkText}>Mi cartera</Text>
      </TouchableOpacity>
      <View style={styles.quickLinkDivider} />
      <TouchableOpacity
        style={styles.quickLink}
        onPress={onAffiliateClick}
        accessibilityLabel="Programa de afiliación"
      >
        <Ionicons name="people-outline" size={16} color={colors.textDark} />
        <Text style={styles.quickLinkText}>Invita y ahorra</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const ProductCard = ({ item, onPress }) => (
  <TouchableOpacity
    style={styles.card}
    activeOpacity={0.8}
    onPress={onPress}
    accessibilityLabel={`${item.name}, ${item.price} Opopoints`}
  >
    <Ionicons name={item.icon} size={40} color={colors.accentOrange} />
    <Text style={styles.cardTitle} numberOfLines={2}>{item.name}</Text>
    {item.desc ? (
      <Text style={styles.cardDesc} numberOfLines={2}>{item.desc}</Text>
    ) : null}
    <View style={styles.cardFooter}>
      <Text style={styles.cardPrice}>{item.price}</Text>
      <GemIcon size={14} color={colors.accentOrange} />
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
            <Ionicons name="checkmark-circle" size={18} color={colors.ctaGreen} />
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
        <Text style={styles.headerTitle}>Tienda</Text>
        <View style={styles.iconButton} />
      </View>

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
              style={[styles.tab, isActive && styles.tabActive]}
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
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
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
    backgroundColor: colors.white,
  },

  // ── Header ──────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
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

  // ── Tarjeta de saldo ──────────────────────────────────────────────
  heroContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  balanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentOrange,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 18,
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
    backgroundColor: FIGMA.comoGanarBg,
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  earnButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.white,
  },

  // ── Accesos rápidos (real, sin equivalente en Figma) ─────────────
  quickLinks: {
    flexDirection: 'row',
    marginTop: 10,
    justifyContent: 'center',
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  quickLinkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },
  quickLinkDivider: {
    width: 1,
    backgroundColor: colors.separator,
  },

  // ── Pestañas ──────────────────────────────────────────────────────
  tabsWrapper: {
    backgroundColor: colors.white,
    flexGrow: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  tabActive: {
    backgroundColor: colors.purple,
  },
  tabText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: FIGMA.tabTextMuted,
  },
  tabTextActive: {
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
  },

  // ── Grid de productos ─────────────────────────────────────────────
  gridContent: {
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 40,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  card: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 11,
    padding: 16,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  cardDesc: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardPrice: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },

  // ── Suscripciones (sin referencia de Figma, sin cambios de fondo) ─
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
    borderColor: colors.purple,
    borderWidth: 2,
  },
  badgePopularContainer: {
    position: 'absolute',
    top: -14,
    right: 16,
    backgroundColor: colors.purple,
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
    color: colors.purple,
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
    backgroundColor: colors.purple,
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
