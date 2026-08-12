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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

const ACCENT = '#6C5CE7';
const ACCENT_LIGHT = '#A29BFE';
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

const SHARE_PLATFORMS = [
  { key: 'whatsapp', label: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram', color: '#E1306C' },
  { key: 'twitter', label: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
];

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

  const handleShare = async () => {
    try {
      await Share.share({ message: shareMessage });
    } catch (_) {}
  };

  const progressWidth = Math.min((AFFILIATE_DATA.totalActive / REFERRAL_MAX) * 100, 100);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          accessibilityLabel="Volver"
        >
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invita y ahorra</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Card de ahorro con gradiente */}
        <LinearGradient
          colors={['#00B894', '#00CBA5']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.savingsCard}
        >
          <Text style={styles.savingsLabel}>Tu ahorro actual</Text>
          <View style={styles.savingsAmountRow}>
            <Ionicons name="cash-outline" size={32} color={colors.white} />
            <Text style={styles.savingsAmount}>-{AFFILIATE_DATA.currentSavings}€</Text>
            <Text style={styles.savingsPeriod}>/mes</Text>
          </View>
          <Text style={styles.savingsDesc}>
            Cada amigo que se suscribe reduce tu cuota en{' '}
            <Text style={styles.savingsHighlight}>-{AFFILIATE_DATA.savingsPerReferral}€/mes</Text>.
          </Text>

          {/* Barra de progreso */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progressWidth}%` }]} />
            </View>
            <Text style={styles.progressText}>
              {AFFILIATE_DATA.totalActive} de {REFERRAL_MAX} amigos para el nivel Oro
            </Text>
          </View>
        </LinearGradient>

        {/* Enlace único */}
        <View style={styles.linkCard}>
          <Text style={styles.linkLabel}>Tu enlace único</Text>
          <View style={styles.linkRow}>
            <Text style={styles.linkText} numberOfLines={1}>
              {AFFILIATE_DATA.userLink}
            </Text>
            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copyButtonCopied]}
              onPress={handleCopyLink}
              accessibilityLabel={copied ? 'Enlace copiado' : 'Copiar o compartir enlace'}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={20}
                color={copied ? colors.success : ACCENT}
              />
              <Text style={[styles.copyButtonText, copied && styles.copyButtonTextCopied]}>
                {copied ? 'Compartido' : 'Copiar'}
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.shareLabel}>Compartir por:</Text>
          <View style={styles.shareButtonsRow}>
            {SHARE_PLATFORMS.map((platform) => (
              <TouchableOpacity
                key={platform.key}
                style={styles.shareButton}
                onPress={handleShare}
                accessibilityLabel={`Compartir por ${platform.label}`}
              >
                <View style={[styles.shareIconBg, { backgroundColor: platform.color + '18' }]}>
                  <Ionicons name={platform.icon} size={24} color={platform.color} />
                </View>
                <Text style={styles.shareButtonText}>{platform.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Lista de referidos */}
        <View style={styles.referralsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Tus afiliados activos</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{AFFILIATE_DATA.totalActive}</Text>
            </View>
          </View>

          {AFFILIATE_DATA.referrals.map((ref, index) => {
            const isLast = index === AFFILIATE_DATA.referrals.length - 1;
            return (
              <View
                key={ref.id}
                style={[styles.referralItem, !isLast && styles.referralItemBorder]}
              >
                <View style={styles.referralAvatar}>
                  <Text style={styles.referralInitial}>{ref.name.charAt(0)}</Text>
                </View>
                <View style={styles.referralInfo}>
                  <Text style={styles.referralName}>{ref.name}</Text>
                  <Text style={styles.referralDate}>{ref.date}</Text>
                </View>
                <View style={styles.referralStatus}>
                  <Ionicons name="checkmark-circle" size={18} color={colors.success} />
                  <Text style={styles.referralStatusText}>{ref.status}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* Info legal */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={ACCENT} />
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
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Savings card
  savingsCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  savingsLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
    marginBottom: 8,
  },
  savingsAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 8,
  },
  savingsAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: colors.white,
  },
  savingsPeriod: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },
  savingsDesc: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  savingsHighlight: {
    fontWeight: '800',
    color: colors.white,
  },
  progressContainer: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  // Link card
  linkCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  linkLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  linkText: {
    flex: 1,
    fontSize: 14,
    color: ACCENT,
    fontWeight: '600',
    marginRight: 12,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  copyButtonCopied: {
    opacity: 0.8,
  },
  copyButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ACCENT,
  },
  copyButtonTextCopied: {
    color: colors.success,
  },
  shareLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 12,
  },
  shareButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  shareButton: {
    alignItems: 'center',
    width: '30%',
    gap: 6,
  },
  shareIconBg: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareButtonText: {
    fontSize: 11,
    color: colors.text,
    fontWeight: '600',
  },
  // Referrals card
  referralsCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
  },
  countBadge: {
    backgroundColor: colors.grayLight,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  referralItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  referralAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: ACCENT_LIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  referralInitial: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.white,
  },
  referralInfo: {
    flex: 1,
  },
  referralName: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  referralDate: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },
  referralStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  referralStatusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.success,
  },
  // Info box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 16,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
