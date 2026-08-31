import React, { useState, useCallback } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { storeApi } from '../../api/store';

// ─── 11.3 · Mi cartera ──────────────────────────────────────────────────────
// Fiel al Figma (MiCarteraScreen.tsx). El backend real ya devuelve un tercer
// estado, "expired" (caducado), que Figma no contempla (solo modela
// Activas/Usadas) — se conserva con el mismo tratamiento visual atenuado de
// "Usadas" para no perder esa información. El preview del código + acción
// de copiar/abrir enlace es funcionalidad real sin equivalente en Figma.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  textDisabled: 'rgba(65, 41, 80, 0.3)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
  greenBg: 'rgba(36, 189, 144, 0.06)',
};

const STATUS_LABELS = { active: 'Activo', used: 'Usado', expired: 'Caducado' };

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function RewardRow({ item, navigation }) {
  const isActive = item.status === 'active';
  const isExpired = item.status === 'expired';

  const handlePress = () => {
    if (!isActive) return;
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

  const caption = item.status === 'used' && item.usedDate
    ? `Usado el ${item.usedDate}`
    : isExpired
      ? `Caducó el ${item.expiryDate}`
      : `Caduca el ${item.expiryDate}`;

  return (
    <TouchableOpacity
      style={[styles.row, isActive ? styles.rowActive : styles.rowMuted]}
      onPress={handlePress}
      disabled={!isActive}
      activeOpacity={0.8}
      accessibilityLabel={`${item.partner} ${item.title}, ${STATUS_LABELS[item.status]}`}
    >
      <View style={[styles.iconWrap, { backgroundColor: isActive ? item.color : `${item.color}4D` }]}>
        <Ionicons name={item.icon ?? 'gift-outline'} size={18} color={colors.white} />
      </View>
      <View style={styles.rowTextWrap}>
        <Text style={[styles.rowTitle, !isActive && styles.rowTitleMuted]} numberOfLines={1}>
          {item.partner} · {item.title}
        </Text>
        <Text style={[styles.rowCaption, !isActive && styles.rowCaptionMuted]}>{caption}</Text>
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
                size={13}
                color={colors.ctaGreen}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
      <Text style={[
        styles.statusText,
        isActive && styles.statusTextActive,
        isExpired && styles.statusTextExpired,
      ]}>
        {STATUS_LABELS[item.status]}
      </Text>
    </TouchableOpacity>
  );
}

export default function StoreWalletScreen({ navigation }) {
  const [walletData, setWalletData] = useState([]);

  useFocusEffect(useCallback(() => {
    let cancelled = false;
    storeApi.getWallet().then(res => {
      if (cancelled || !res?.data) return;
      setWalletData(res.data);
    });
    return () => { cancelled = true; };
  }, []));

  const activeItems = walletData.filter((i) => i.status === 'active');
  const usedItems = walletData.filter((i) => i.status === 'used');
  const expiredItems = walletData.filter((i) => i.status === 'expired');

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
        <Text style={styles.headerTitle}>Mi cartera</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {activeItems.length > 0 && (
          <>
            <Text style={styles.sectionLabel}>ACTIVAS</Text>
            {activeItems.map((item) => (
              <RewardRow key={item.id} item={item} navigation={navigation} />
            ))}
          </>
        )}

        {usedItems.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>USADAS</Text>
            {usedItems.map((item) => (
              <RewardRow key={item.id} item={item} navigation={navigation} />
            ))}
          </>
        )}

        {/* "Caducadas" — real, sin equivalente en Figma (solo modela Activas/Usadas) */}
        {expiredItems.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, styles.sectionLabelSpaced]}>CADUCADAS</Text>
            {expiredItems.map((item) => (
              <RewardRow key={item.id} item={item} navigation={navigation} />
            ))}
          </>
        )}

        {walletData.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="folder-open-outline" size={44} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No tienes recompensas todavía.</Text>
          </View>
        )}

        {/* Banner de venta cruzada — ver hallazgo 2: su propósito en esta
            pantalla no es obvio, pero está anidado correctamente en Figma
            (no es un nodo huérfano), así que se implementa sin gate. */}
        <TouchableOpacity
          style={styles.ctaButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('StoreSubscription')}
        >
          <Text style={styles.ctaButtonText}>Suscribirme a premium</Text>
        </TouchableOpacity>
      </ScrollView>
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

  // ── Contenido ─────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 10,
  },
  sectionLabelSpaced: {
    marginTop: spacing.lg,
  },

  // ── Filas ─────────────────────────────────────────────────────
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  rowActive: {
    borderWidth: 1,
    borderColor: colors.ctaGreen,
    backgroundColor: FIGMA.greenBg,
  },
  rowMuted: {
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    opacity: 0.7,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTextWrap: {
    flex: 1,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },
  rowTitleMuted: {
    color: FIGMA.textDisabled,
  },
  rowCaption: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
  },
  rowCaptionMuted: {
    color: FIGMA.textDisabled,
  },
  statusText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textDisabled,
  },
  statusTextActive: {
    fontFamily: 'Poppins-SemiBold',
    color: colors.ctaGreen,
  },
  statusTextExpired: {
    color: colors.statRed,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  codePreview: {
    backgroundColor: `${colors.ctaGreen}1A`,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  codePreviewText: {
    fontFamily: 'Poppins-Bold',
    fontSize: 11.5,
    color: colors.ctaGreen,
    letterSpacing: 1,
  },
  actionChip: {
    width: 26,
    height: 26,
    borderRadius: 7,
    backgroundColor: `${colors.ctaGreen}1A`,
    alignItems: 'center',
    justifyContent: 'center',
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

  // ── Banner de venta cruzada ───────────────────────────────────
  ctaButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
