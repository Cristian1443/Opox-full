import React, { useState } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import AlertCardModal from '../../components/AlertCardModal';
import { storeApi } from '../../api/store';

// ─── 11.4 · Confirmar canje real ───────────────────────────────────────────
// Fiel al Figma (TiendaModalesScreen.tsx → ConfirmarCanjeRealModal). El
// nombre de marca real citado en el diseño ("Uber Eats") se sustituye aquí
// solo en este comentario por respeto a la marca registrada — el nombre
// real del partner (reward.partner) sigue viniendo del backend sin cambios,
// ya que es contenido de negocio real, no un artefacto de diseño.
const FALLBACK = {
  reward: {
    partner: 'Uber Eats',
    title: '1 mes de Uber Eats gratis',
    icon: 'restaurant-outline',
    color: '#000000',
    cost: 1500,
  },
  currentBalance: 1840,
  newBalance: 340,
};

// Ícono exacto exportado de Figma (círculo + exclamación), en naranja —
// mismo path que IconAlertCircleGray de ConfirmExitModal.js, recoloreado.
function WarningIcon({ size = 56, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 185 185" fill="none">
      <Path d="M92.4995 175C138.063 175 175 138.063 175 92.4996C175 46.9361 138.063 9.99957 92.4995 9.99957C46.936 9.99957 9.99951 46.9361 9.99951 92.4996C9.99951 138.063 46.936 175 92.4995 175Z" stroke={color} strokeWidth={15.32} strokeMiterlimit={10} />
      <Path d="M75.9995 42L84.2495 115H100.75L109 42H75.9995Z" fill={color} />
      <Path d="M106 138.5C106 131.044 99.9554 125 92.4995 125C85.0437 125 78.9995 131.044 78.9995 138.5C78.9995 145.955 85.0437 152 92.4995 152C99.9554 152 106 145.955 106 138.5Z" fill={color} />
    </Svg>
  );
}

// Ícono exacto exportado de Figma (tarjeta con chip + líneas + anillos) —
// se conserva como metáfora genérica de "no se pudo completar el canje con
// el partner" — la app no gestiona tarjetas de pago propias, el fallo es
// del lado del partner/API.
function CardBlockedIcon({ size = 48, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={(size * 127) / 185} viewBox="0 0 185 127" fill="none">
      <Path d="M170.389 0H14.6112C10.7372 0.0037644 7.023 1.54943 4.28367 4.29777C1.54435 7.04611 0.00375205 10.7726 0 14.6593L0 112.326C-1.81988e-06 116.216 1.53894 119.946 4.27867 122.697C7.0184 125.449 10.7348 126.996 14.6112 127H170.389C174.265 126.996 177.982 125.449 180.721 122.697C183.461 119.946 185 116.216 185 112.326V14.6593C184.996 10.7726 183.456 7.04611 180.716 4.29777C177.977 1.54943 174.263 0.0037644 170.389 0ZM175.264 112.326C175.264 112.968 175.138 113.603 174.893 114.196C174.647 114.789 174.288 115.327 173.835 115.78C173.382 116.233 172.845 116.592 172.253 116.836C171.662 117.081 171.028 117.205 170.389 117.203H14.6112C13.9717 117.205 13.3381 117.081 12.7467 116.836C12.1553 116.592 11.6177 116.233 11.1648 115.78C10.712 115.327 10.3526 114.789 10.1075 114.196C9.8623 113.603 9.73609 112.968 9.7361 112.326V14.6593C9.7361 13.3621 10.2497 12.118 11.164 11.2007C12.0783 10.2835 13.3183 9.76814 14.6112 9.76814H170.389C171.682 9.76814 172.922 10.2835 173.836 11.2007C174.75 12.118 175.264 13.3621 175.264 14.6593V112.326Z" fill={color} />
      <Path d="M141.181 58.6088C136.577 58.6178 132.072 59.95 128.199 62.4478C124.326 59.95 119.822 58.6178 115.218 58.6088C111.972 58.5302 108.743 59.1037 105.722 60.2957C102.7 61.4876 99.9464 63.2738 97.6231 65.5492C95.2997 67.8246 93.4535 70.5433 92.1929 73.5452C90.9323 76.5471 90.283 79.7717 90.283 83.0291C90.283 86.2866 90.9323 89.5111 92.1929 92.5131C93.4535 95.515 95.2997 98.2336 97.6231 100.509C99.9464 102.784 102.7 104.571 105.722 105.763C108.743 106.955 111.972 107.528 115.218 107.449C119.822 107.441 124.326 106.108 128.199 103.61C132.072 106.108 136.577 107.441 141.181 107.449C144.426 107.528 147.655 106.955 150.677 105.763C153.698 104.571 156.452 102.784 158.775 100.509C161.099 98.2336 162.945 95.515 164.205 92.5131C165.466 89.5111 166.115 86.2866 166.115 83.0291C166.115 79.7717 165.466 76.5471 164.205 73.5452C162.945 70.5433 161.099 67.8246 158.775 65.5492C156.452 63.2738 153.698 61.4876 150.677 60.2957C147.655 59.1037 144.426 58.5302 141.181 58.6088ZM126.584 83.0362C126.594 80.7489 127.148 78.497 128.199 76.4673C129.269 78.4906 129.828 80.746 129.828 83.0362C129.828 85.3265 129.269 87.5819 128.199 89.6052C127.149 87.5749 126.596 85.3234 126.584 83.0362ZM100.621 83.0362C100.615 80.6155 101.209 78.2313 102.348 76.0974C103.487 73.9634 105.136 72.1464 107.148 70.8091C109.159 69.4719 111.469 68.6562 113.872 68.4352C116.275 68.2142 118.695 68.5948 120.915 69.5429C118.248 73.5398 116.825 78.241 116.825 83.0505C116.825 87.86 118.248 92.5612 120.915 96.5581C118.692 97.4995 116.272 97.8742 113.87 97.6485C111.467 97.4228 109.158 96.6038 107.149 95.2647C105.139 93.9256 103.491 92.108 102.352 89.9742C101.213 87.8404 100.618 85.4568 100.621 83.0362ZM141.181 97.6813C139.233 97.6791 137.306 97.2876 135.512 96.5296C138.178 92.5327 139.601 87.8315 139.601 83.022C139.601 78.2125 138.178 73.5113 135.512 69.5144C137.504 68.671 139.659 68.2823 141.819 68.3765C143.98 68.4707 146.093 69.0453 148.005 70.0589C149.917 71.0725 151.581 72.4997 152.876 74.2374C154.171 75.975 155.065 77.9796 155.494 80.1064C155.922 82.2331 155.874 84.4288 155.353 86.5347C154.833 88.6406 153.852 90.604 152.482 92.2831C151.112 93.9622 149.388 95.315 147.434 96.2437C145.479 97.1724 143.343 97.6537 141.181 97.6529V97.6813Z" fill={color} />
      <Path d="M63.2917 19.5363H24.3473C23.0543 19.5363 21.8143 20.0516 20.9001 20.9688C19.9858 21.8861 19.4722 23.1302 19.4722 24.4274V53.7318C19.4722 54.3735 19.5984 55.0088 19.8435 55.6015C20.0887 56.1941 20.448 56.7324 20.9009 57.1854C21.3538 57.6385 21.8913 57.9974 22.4827 58.2417C23.0741 58.4859 23.7078 58.6107 24.3473 58.6088H63.2917C63.9306 58.6107 64.5635 58.4858 65.1541 58.2414C65.7447 57.997 66.2813 57.6378 66.7331 57.1846C67.1848 56.7313 67.5428 56.1929 67.7864 55.6004C68.0301 55.0078 68.1545 54.3728 68.1527 53.7318V24.4274C68.1545 23.7858 68.0302 23.1501 67.7867 22.5567C67.5433 21.9634 67.1855 21.4241 66.7339 20.9697C66.2824 20.5153 65.7459 20.1548 65.1552 19.9088C64.5645 19.6629 63.9312 19.5363 63.2917 19.5363ZM58.4166 48.8407H29.2083V29.3044H58.4166V48.8407Z" fill={color} />
      <Path d="M63.2917 97.6814H24.3474C23.686 97.6455 23.0243 97.7453 22.4026 97.9746C21.7809 98.2039 21.2123 98.5578 20.7316 99.0149C20.2508 99.4719 19.8678 100.022 19.6061 100.633C19.3444 101.243 19.2095 101.901 19.2095 102.565C19.2095 103.23 19.3444 103.888 19.6061 104.498C19.8678 105.108 20.2508 105.659 20.7316 106.116C21.2123 106.573 21.7809 106.927 22.4026 107.156C23.0243 107.386 23.686 107.485 24.3474 107.45H63.2917C64.5374 107.382 65.7099 106.838 66.5679 105.93C67.4259 105.021 67.9041 103.817 67.9041 102.565C67.9041 101.314 67.4259 100.11 66.5679 99.2013C65.7099 98.2928 64.5374 97.7488 63.2917 97.6814Z" fill={color} />
      <Path d="M24.3474 87.9133H43.8196C45.0652 87.8458 46.2377 87.3018 47.0957 86.3933C47.9537 85.4847 48.4319 84.2808 48.4319 83.0292C48.4319 81.7776 47.9537 80.5736 47.0957 79.6651C46.2377 78.7565 45.0652 78.2126 43.8196 78.1451H24.3474C23.686 78.1093 23.0243 78.2091 22.4026 78.4383C21.7809 78.6676 21.2123 79.0216 20.7316 79.4786C20.2508 79.9357 19.8678 80.4862 19.6061 81.0967C19.3444 81.7071 19.2095 82.3647 19.2095 83.0292C19.2095 83.6937 19.3444 84.3512 19.6061 84.9617C19.8678 85.5721 20.2508 86.1227 20.7316 86.5797C21.2123 87.0368 21.7809 87.3908 22.4026 87.62C23.0243 87.8493 23.686 87.9491 24.3474 87.9133Z" fill={color} />
    </Svg>
  );
}

export default function StoreRealRedeemConfirmScreen({ navigation, route }) {
  const { bottom: bottomInset } = useSafeAreaInsets();
  const {
    reward = FALLBACK.reward,
    newBalance = FALLBACK.newBalance,
  } = route?.params ?? {};

  const [isLoading, setIsLoading] = useState(false);
  const [showDeclined, setShowDeclined] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    const res = await storeApi.redeemProduct(reward.id);
    setIsLoading(false);
    if (res?.error) {
      setShowDeclined(true);
      return;
    }
    navigation.navigate('StoreRealRewardSuccess', {
      reward,
      newBalance: res.data?.newBalance ?? newBalance,
      code: res.data?.code ?? '',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* ── Header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconButton}
          disabled={isLoading}
          accessibilityLabel="Cancelar y volver"
        >
          <Ionicons name="close" size={22} color={colors.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirmar canje real</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 120 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <WarningIcon />
          <Text style={styles.title}>Confirmar canje real</Text>
          <Text style={styles.subtitle}>
            Vas a gastar <Text style={styles.bold}>{reward.cost.toLocaleString('es-ES')} Opopoints</Text> en el mes de{' '}
            <Text style={styles.bold}>{reward.partner}</Text>. Esto no se puede deshacer.
          </Text>

          <View style={styles.termsBox}>
            <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.termsText}>
              Al confirmar, aceptas los términos de uso de {reward.partner} y el canje de tus puntos.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ── CTA fijo al fondo ─────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: spacing.sm + bottomInset }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleConfirm}
          disabled={isLoading}
          accessibilityLabel="Confirmar canje"
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.confirmButtonText}>Sí, canjear</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelLink}
          onPress={() => navigation.goBack()}
          disabled={isLoading}
          accessibilityLabel="Cancelar"
        >
          <Text style={styles.cancelLinkText}>Cancelar</Text>
        </TouchableOpacity>
      </View>

      {/* ── Pop-up: pago rechazado ──────────────────────────────────────── */}
      <AlertCardModal
        visible={showDeclined}
        iconBg="transparent"
        iconSize={64}
        icon={<CardBlockedIcon />}
        title="No se ha podido cobrar"
        description={`No hemos podido completar el canje con ${reward.partner}. Revisa tu conexión o inténtalo de nuevo en unos minutos.`}
        primaryLabel="Reintentar"
        primaryColor={colors.accentOrange}
        onPrimaryPress={() => {
          setShowDeclined(false);
          handleConfirm();
        }}
        secondaryLabel="Cancelar"
        onSecondaryPress={() => setShowDeclined(false)}
      />
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  subtitle: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 19,
    paddingHorizontal: spacing.sm,
  },
  bold: {
    fontFamily: 'Poppins-SemiBold',
  },
  termsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: spacing.lg,
    paddingHorizontal: spacing.sm,
  },
  termsText: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 17,
  },

  // ── CTA fijo al fondo ─────────────────────────────────────────
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    alignItems: 'center',
  },
  confirmButton: {
    width: '100%',
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  cancelLink: {
    marginTop: 14,
    paddingVertical: 4,
  },
  cancelLinkText: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
  },
});
