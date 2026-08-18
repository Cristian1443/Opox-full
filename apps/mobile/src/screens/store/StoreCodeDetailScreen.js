import React, { useState } from 'react';
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

const partnerAbbr = (name) => {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.substring(0, 2).toUpperCase();
};

const FALLBACK = {
  id: '1',
  partner: 'Uber Eats',
  title: '1 mes gratis',
  subtitle: 'Suscripción Uber One durante 30 días sin coste',
  code: 'OPOX-UE-30',
  expiryDate: '24 jul 2026',
  color: '#000000',
  icon: 'restaurant-outline',
  conditions: [
    'Válido solo en España',
    'Requiere cuenta verificada de Opox',
    'El código caduca a los 30 días de canjearlo',
    'Solo para usuarios sin Uber One activo',
  ],
  deepLink: 'https://www.ubereats.com',
};

export default function StoreCodeDetailScreen({ navigation, route }) {
  const { top: topInset } = useSafeAreaInsets();
  const { codeData = FALLBACK } = route?.params ?? {};
  const [copied, setCopied] = useState(false);

  const handleCopyCode = async () => {
    try {
      await Share.share({ message: codeData.code });
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {}
  };

  const handleOpenPartner = async () => {
    if (!codeData.deepLink) return;
    try {
      await Linking.openURL(codeData.deepLink);
    } catch (_) {}
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
      <StatusBar barStyle="light-content" />

      {/* Header gradiente que cubre el status bar */}
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
          <Text style={styles.headerTitle}>Tu código</Text>
        </View>

        <View style={{ width: 40 }} />
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta principal */}
        <View style={styles.codeCard}>
          <View style={styles.partnerHeader}>
            <View style={[styles.partnerAvatar, { backgroundColor: codeData.color }]}>
              <Text style={styles.partnerAvatarText}>{partnerAbbr(codeData.partner)}</Text>
            </View>
            <Text style={styles.partnerName}>{codeData.partner}</Text>
          </View>

          <Text style={styles.rewardTitle}>{codeData.title}</Text>
          <Text style={styles.rewardSubtitle}>{codeData.subtitle}</Text>

          {/* Sección del código */}
          <View style={styles.codeSection}>
            <Text style={styles.codeLabel}>TU CÓDIGO</Text>
            <View style={styles.codeBox}>
              <Text style={styles.codeText}>{codeData.code}</Text>
            </View>

            <TouchableOpacity
              style={[styles.copyButton, copied && styles.copyButtonCopied]}
              onPress={handleCopyCode}
              accessibilityLabel={copied ? 'Código compartido' : 'Compartir código'}
            >
              <Ionicons
                name={copied ? 'checkmark-circle' : 'copy-outline'}
                size={18}
                color={copied ? colors.success : ACCENT}
              />
              <Text style={[styles.copyButtonText, copied && styles.copyButtonTextCopied]}>
                {copied ? 'Compartido' : 'Copiar código'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fecha de caducidad */}
          <View style={styles.expiryRow}>
            <Ionicons name="time-outline" size={18} color="#FF9F43" />
            <Text style={styles.expiryText}>
              Caduca el{' '}
              <Text style={styles.expiryDate}>{codeData.expiryDate}</Text>
            </Text>
          </View>

          {/* CTA principal */}
          {!!codeData.deepLink && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleOpenPartner}
              accessibilityLabel={`Ir a ${codeData.partner}`}
            >
              <Ionicons name="arrow-forward-circle" size={22} color={colors.white} />
              <Text style={styles.actionButtonText}>Ir a {codeData.partner}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Condiciones */}
        {(codeData.conditions ?? []).length > 0 && (
          <View style={styles.conditionsCard}>
            <View style={styles.conditionsHeader}>
              <Ionicons name="document-text-outline" size={20} color={ACCENT} />
              <Text style={styles.conditionsTitle}>Condiciones de uso</Text>
            </View>
            {codeData.conditions.map((cond, index) => (
              <View key={index} style={styles.conditionItem}>
                <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
                <Text style={styles.conditionText}>{cond}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Info adicional */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={20} color={ACCENT} />
          <Text style={styles.infoText}>
            Si tienes problemas al canjear el código, contacta con el soporte de {codeData.partner} o con nosotros a través de la configuración de la app.
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
  phase2BadgeContainer: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  phase2BadgeText: {
    color: colors.white,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
  },
  // Scroll
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  // Code card
  codeCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  partnerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
    alignSelf: 'flex-start',
  },
  partnerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  partnerAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  partnerName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  rewardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: PHASE2_COLOR,
    textAlign: 'center',
    marginBottom: 8,
  },
  rewardSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 21,
  },
  // Code section
  codeSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  codeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 1,
  },
  codeBox: {
    backgroundColor: colors.background,
    borderWidth: 2,
    borderColor: ACCENT,
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    marginBottom: 14,
    width: '100%',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 26,
    fontWeight: '800',
    color: ACCENT,
    letterSpacing: 2,
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.grayLight,
  },
  copyButtonCopied: {
    backgroundColor: colors.successBg,
  },
  copyButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: ACCENT,
  },
  copyButtonTextCopied: {
    color: colors.success,
  },
  // Expiry
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 20,
    gap: 8,
    alignSelf: 'stretch',
  },
  expiryText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  expiryDate: {
    fontWeight: '700',
    color: '#FF9F43',
  },
  // Action button
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ACCENT_LIGHT,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    width: '100%',
    justifyContent: 'center',
    gap: 10,
    shadowColor: ACCENT_LIGHT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButtonText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.white,
  },
  // Conditions card
  conditionsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  conditionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  conditionsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 8,
  },
  conditionText: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
    lineHeight: 20,
  },
  // Info box
  infoBox: {
    backgroundColor: colors.grayLight,
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
  },
});
