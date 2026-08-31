import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 11.2 · Tienda · Invita y ahorra ────────────────────────────────────────
// Fiel al Figma (AfiliacionScreen.tsx). El diseño en realidad confirma DOS
// datos distintos que el real conflaba en una sola tarjeta: la tarifa fija
// por amigo referido (tarjeta morada, "-2€/mes") y el ahorro acumulado
// actual ("Ahorro actual · -6€/mes", verde) — se separan tal como Figma los
// muestra. La lista de afiliados con nombre/fecha/estado y la barra de
// progreso a "nivel Oro" son funcionalidad real sin equivalente en el
// reference y se conservan.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

const REFERRAL_MAX = 10;

const AFFILIATE_DATA = {
  userLink: 'opox.app/r/juan-l4k2',
  totalActive: 3,
  savingsPerReferral: 2,
  currentSavings: 6,
  referrals: [
    { id: '1', name: 'Carlos M.', date: 'Hace 2 días', status: 'Activo' },
    { id: '2', name: 'Lucía R.', date: 'Hace 1 semana', status: 'Activo' },
    { id: '3', name: 'Pedro S.', date: 'Hace 3 semanas', status: 'Activo' },
  ],
};

const shareMessage = `Prepara tu oposición con OPOX 🎓 Tests, IA y seguimiento personalizado. Únete con mi enlace y tendrás acceso gratuito al primer mes: ${AFFILIATE_DATA.userLink}`;

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function StoreAffiliateScreen({ navigation }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await Share.share({ message: shareMessage, url: AFFILIATE_DATA.userLink });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      // El usuario cerró el share sheet sin compartir — no es un error
    }
  };

  const progressWidth = Math.min((AFFILIATE_DATA.totalActive / REFERRAL_MAX) * 100, 100);

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
        <Text style={styles.headerTitle}>Invita y ahorra</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tarjeta destacada: tarifa fija por amigo ───────────────── */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightLine1}>Cada amigo que se suscribe</Text>
          <Text style={styles.highlightAmount}>-{AFFILIATE_DATA.savingsPerReferral}€/mes</Text>
          <Text style={styles.highlightLine2}>en tu propia suscripción</Text>
        </View>

        {/* ── Enlace ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>TU ENLACE</Text>
        <View style={styles.linkRow}>
          <Text style={styles.linkText} numberOfLines={1}>{AFFILIATE_DATA.userLink}</Text>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleCopyLink}
            accessibilityLabel={copied ? 'Enlace compartido' : 'Copiar o compartir enlace'}
          >
            <Text style={[styles.copyText, copied && styles.copyTextDone]}>
              {copied ? 'Compartido' : 'Copiar'}
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85} onPress={handleCopyLink}>
          <Text style={styles.ctaButtonText}>Compartir enlace</Text>
        </TouchableOpacity>

        {/* ── Afiliados + ahorro acumulado ────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.affiliatesLabel]}>
          TUS AFILIADOS · {AFFILIATE_DATA.totalActive} activos
        </Text>
        <View style={styles.savingsRow}>
          <Text style={styles.savingsLabel}>Ahorro actual</Text>
          <Text style={styles.savingsValue}>-{AFFILIATE_DATA.currentSavings}€/mes</Text>
        </View>

        {/* Progreso a nivel Oro — real, sin equivalente en Figma */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {AFFILIATE_DATA.totalActive} de {REFERRAL_MAX} amigos para el nivel Oro
          </Text>
        </View>

        {/* Lista de afiliados — real, sin equivalente en Figma */}
        <View style={styles.referralsList}>
          {AFFILIATE_DATA.referrals.map((ref, index) => (
            <View
              key={ref.id}
              style={[styles.referralItem, index > 0 && styles.referralItemBorder]}
            >
              <View style={styles.referralAvatar}>
                <Text style={styles.referralInitial}>{ref.name.charAt(0)}</Text>
              </View>
              <View style={styles.referralInfo}>
                <Text style={styles.referralName}>{ref.name}</Text>
                <Text style={styles.referralDate}>{ref.date}</Text>
              </View>
              <View style={styles.referralStatus}>
                <Ionicons name="checkmark-circle" size={16} color={colors.ctaGreen} />
                <Text style={styles.referralStatusText}>{ref.status}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Info legal — real, sin equivalente en Figma */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
          <Text style={styles.infoText}>
            El descuento se aplica automáticamente al mes siguiente de que tu amigo se suscriba.
          </Text>
        </View>
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

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },

  // ── Tarjeta destacada ─────────────────────────────────────────
  highlightCard: {
    backgroundColor: colors.bannerPurple,
    borderRadius: 12,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  highlightLine1: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.white,
  },
  highlightAmount: {
    fontFamily: 'Poppins-Bold',
    fontSize: 28,
    color: colors.white,
    marginTop: 4,
  },
  highlightLine2: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.accentOrange,
    marginTop: 4,
  },

  // ── Enlace ────────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.textDark,
    marginBottom: 8,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 10.7,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: spacing.lg,
  },
  linkText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: FIGMA.textMuted,
    marginRight: spacing.sm,
  },
  copyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },
  copyTextDone: {
    color: colors.ctaGreen,
  },
  ctaButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },

  // ── Afiliados + ahorro ────────────────────────────────────────
  affiliatesLabel: {
    fontSize: 13,
  },
  savingsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  savingsLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textDark,
  },
  savingsValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.ctaGreen,
  },

  // ── Progreso a nivel Oro (real) ───────────────────────────────
  progressContainer: {
    marginBottom: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: `${colors.textDark}15`,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.accentOrange,
    borderRadius: 4,
  },
  progressText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: FIGMA.textMuted,
    textAlign: 'center',
  },

  // ── Lista de afiliados (real) ─────────────────────────────────
  referralsList: {
    marginBottom: spacing.lg,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  referralItemBorder: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.cardBorder,
  },
  referralAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${colors.purple}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referralInitial: {
    fontFamily: 'Poppins-Bold',
    fontSize: 14,
    color: colors.purple,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },
  referralDate: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  referralStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  referralStatusText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.ctaGreen,
  },

  // ── Info legal (real) ─────────────────────────────────────────
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 2,
  },
  infoText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },
});
