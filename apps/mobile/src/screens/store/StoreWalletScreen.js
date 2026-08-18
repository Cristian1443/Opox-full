import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';
const PHASE2_COLOR = '#7B1FA2';

const WALLET_DATA = [
  {
    id: '1',
    partner: 'Uber Eats',
    title: '1 mes gratis',
    code: 'OPOX-UE-30',
    status: 'active',
    expiryDate: '24 jul 2026',
    usedDate: null,
    color: '#000000',
    icon: 'restaurant-outline',
    actionUrl: 'https://www.ubereats.com',
  },
  {
    id: '2',
    partner: 'Decathlon',
    title: '-20% descuento',
    code: 'DECA-20-OPOX',
    status: 'active',
    expiryDate: '30 ago 2026',
    usedDate: null,
    color: '#0082C3',
    icon: 'fitness-outline',
    actionUrl: null,
  },
  {
    id: '3',
    partner: 'FNAC',
    title: '-15% libros',
    code: 'FNAC-15-USED',
    status: 'used',
    expiryDate: '15 jun 2026',
    usedDate: '02 jun 2026',
    color: '#E91E63',
    icon: 'book-outline',
    actionUrl: null,
  },
  {
    id: '4',
    partner: 'Spotify',
    title: '3 meses Premium',
    code: 'SPOT-3M-OLD',
    status: 'expired',
    expiryDate: '01 may 2026',
    usedDate: null,
    color: '#1DB954',
    icon: 'musical-notes-outline',
    actionUrl: null,
  },
];

const STATUS_LABELS = { active: 'Activo', used: 'Usado', expired: 'Caducado' };

const getStatusColor = (status) => {
  if (status === 'active') return colors.success;
  if (status === 'expired') return colors.error;
  return colors.textSecondary;
};

const getStatusBg = (status) => {
  if (status === 'active') return colors.successBg;
  if (status === 'expired') return colors.errorBg;
  return colors.grayLight;
};

const partnerAbbr = (name) => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const RewardCard = ({ item, navigation }) => {
  const handlePress = () => {
    if (item.status !== 'active') return;
    navigation.navigate('StoreCodeDetail', {
      codeData: {
        partner: item.partner,
        title: item.title,
        code: item.code,
        expiryDate: item.expiryDate,
        color: item.color,
        icon: item.icon,
        deepLink: item.actionUrl ?? null,
        conditions: [],
      },
    });
  };

  const handleShare = async () => {
    try {
      await Share.share({ message: `${item.partner} — ${item.code}` });
    } catch (_) {}
  };

  const handleLink = async () => {
    if (!item.actionUrl) return;
    try {
      await Linking.openURL(item.actionUrl);
    } catch (_) {}
  };

  const isActive = item.status === 'active';

  return (
    <TouchableOpacity
      style={[styles.card, !isActive && styles.cardInactive]}
      onPress={handlePress}
      disabled={!isActive}
      activeOpacity={0.8}
      accessibilityLabel={`${item.partner} ${item.title}, ${STATUS_LABELS[item.status]}`}
    >
      <View style={[styles.partnerAvatar, { backgroundColor: item.color }]}>
        <Text style={styles.partnerAvatarText}>{partnerAbbr(item.partner)}</Text>
      </View>

      <View style={styles.cardInfo}>
        <View style={styles.cardTopRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>{item.partner} · {item.title}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusBg(item.status) }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {STATUS_LABELS[item.status]}
            </Text>
          </View>
        </View>

        <Text style={styles.cardSubtitle}>
          {item.status === 'used' && item.usedDate
            ? `Usado el ${item.usedDate}`
            : item.status === 'expired'
            ? `Caducó el ${item.expiryDate}`
            : `Caduca el ${item.expiryDate}`}
        </Text>

        {isActive && (
          <View style={styles.codeRow}>
            <View style={styles.codePreview}>
              <Text style={styles.codePreviewText}>{item.code}</Text>
            </View>
            <TouchableOpacity
              onPress={item.actionUrl ? handleLink : handleShare}
              style={styles.actionChip}
              accessibilityLabel={item.actionUrl ? `Ir a ${item.partner}` : 'Copiar código'}
            >
              <Ionicons
                name={item.actionUrl ? 'open-outline' : 'copy-outline'}
                size={14}
                color={ACCENT}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function StoreWalletScreen({ navigation }) {
  const { top: topInset } = useSafeAreaInsets();

  const activeItems = WALLET_DATA.filter((i) => i.status === 'active');
  const usedItems = WALLET_DATA.filter((i) => i.status === 'used');
  const expiredItems = WALLET_DATA.filter((i) => i.status === 'expired');

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" />

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
          <Text style={styles.headerTitle}>Mi cartera</Text>
          <Text style={styles.headerSubtitle}>Tus códigos y recompensas canjeadas</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeItems.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>ACTIVAS</Text>
            {activeItems.map((item) => (
              <RewardCard key={item.id} item={item} navigation={navigation} />
            ))}
          </>
        )}

        {usedItems.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>USADAS</Text>
            {usedItems.map((item) => (
              <RewardCard key={item.id} item={item} navigation={navigation} />
            ))}
          </>
        )}

        {expiredItems.length > 0 && (
          <>
            <Text style={styles.sectionHeader}>CADUCADAS</Text>
            {expiredItems.map((item) => (
              <RewardCard key={item.id} item={item} navigation={navigation} />
            ))}
          </>
        )}

        {WALLET_DATA.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No tienes recompensas todavía.</Text>
          </View>
        )}
      </ScrollView>
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
  // Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Section headers
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.textSecondary,
    letterSpacing: 0.8,
    marginTop: 16,
    marginBottom: 10,
  },
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.separator,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardInactive: {
    opacity: 0.6,
  },
  partnerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  partnerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardInfo: {
    flex: 1,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  cardSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    flexShrink: 0,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  codePreview: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codePreviewText: {
    fontSize: 12,
    fontWeight: '700',
    color: ACCENT,
    letterSpacing: 1,
  },
  actionChip: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.grayLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
