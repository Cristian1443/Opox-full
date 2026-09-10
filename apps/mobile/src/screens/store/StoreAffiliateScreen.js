import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Share,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';

// ─── 11.2 · Tienda · Invita y ahorra ────────────────────────────────────────
// Fiel al Figma (AfiliacionScreen.tsx). El diseño confirma DOS datos
// distintos: la tarifa fija por amigo referido (tarjeta morada, "-2€/mes")
// y el ahorro acumulado actual ("Ahorro actual · -6€/mes", verde) — se
// separan tal como Figma los muestra. Sin lista de afiliados, barra de
// progreso ni aviso legal: no están en el reference.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

const AFFILIATE_DATA = {
  userLink: 'opox.app/r/juan-l4k2',
  totalActive: 3,
  savingsPerReferral: 2,
  currentSavings: 6,
};

const shareMessage = `Prepara tu oposición con OPOX 🎓 Tests, IA y seguimiento personalizado. Únete con mi enlace y tendrás acceso gratuito al primer mes: ${AFFILIATE_DATA.userLink}`;

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
        <Text style={styles.headerTitle}>Invita y ahorra</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Tarjeta destacada: tarifa fija por amigo ───────────────── */}
        <View style={styles.highlightCard}>
          <Text style={styles.highlightLine1}>Cada amigo que se suscriba</Text>
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
});
