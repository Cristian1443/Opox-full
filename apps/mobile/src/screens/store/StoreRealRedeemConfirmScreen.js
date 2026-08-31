import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Circle, Rect, Path } from 'react-native-svg';
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

function WarningIcon({ size = 56, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={22} stroke={color} strokeWidth={3} fill="none" />
      <Path d="M24 14V27" stroke={color} strokeWidth={3.2} strokeLinecap="round" />
      <Circle cx={24} cy={34} r={1.8} fill={color} />
    </Svg>
  );
}

// Ícono de "pago rechazado" (ver hallazgo "Modo_de_aislamiento" en Figma).
// Se conserva el glifo de tarjeta bloqueada del diseño como metáfora
// genérica de "no se pudo completar el canje con el partner" — la app no
// gestiona tarjetas de pago propias, el fallo es del lado del partner/API.
function CardBlockedIcon({ size = 48, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={5} width={16} height={11} rx={2} stroke={color} strokeWidth={1.4} fill="none" />
      <Path d="M2 9H18" stroke={color} strokeWidth={1.4} />
      <Circle cx={18} cy={16} r={4.5} stroke={color} strokeWidth={1.4} fill="none" />
      <Circle cx={21} cy={16} r={4.5} stroke={color} strokeWidth={1.4} fill="none" />
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
