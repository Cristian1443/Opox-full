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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Rect } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 11.4 · Tu código ───────────────────────────────────────────────────────
// Fiel al Figma (CodigoCanjeadoScreen.tsx). El QR es un patrón geométrico
// decorativo — el propio reference lo documenta como "sin datos reales", así
// que se reproduce igual en vez de añadir una librería de generación de QR
// real. Las condiciones y el aviso de soporte del real no aparecen en esta
// captura de Figma; se omiten aquí porque ya se muestran antes en
// RecompensaDetalleScreen (antes de confirmar el canje), así que no se
// pierde esa información, solo se evita repetirla.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
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
  deepLink: 'https://www.ubereats.com',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Patrón geométrico decorativo que simula un código QR (sin datos reales). */
function QrPlaceholder({ size = 180 }) {
  const cell = size / 9;
  const pattern = [
    [1, 1, 1, 0, 1, 0, 1, 1, 1],
    [1, 0, 1, 0, 0, 1, 1, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 0, 1],
    [0, 0, 0, 1, 0, 0, 1, 1, 0],
    [1, 1, 0, 0, 1, 1, 0, 1, 1],
    [0, 1, 1, 0, 1, 0, 1, 0, 0],
    [1, 0, 1, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 1, 0, 0, 1, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 0, 1],
  ];
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={colors.white} />
      {pattern.map((row, rowIndex) =>
        row.map((cellValue, colIndex) =>
          cellValue ? (
            <Rect
              key={`${rowIndex}-${colIndex}`}
              x={colIndex * cell}
              y={rowIndex * cell}
              width={cell}
              height={cell}
              fill={colors.textDark}
            />
          ) : null
        )
      )}
    </Svg>
  );
}

export default function StoreCodeDetailScreen({ navigation, route }) {
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
        <Text style={styles.headerTitle}>Tu código</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Marca + oferta ──────────────────────────────────────────── */}
        <View style={styles.brandBlock}>
          <View style={[styles.brandIcon, { backgroundColor: codeData.color ?? colors.purple }]}>
            <Ionicons name={codeData.icon ?? 'gift-outline'} size={30} color={colors.white} />
          </View>
          <Text style={styles.offerLabel}>{codeData.partner} · {codeData.title}</Text>
          {codeData.subtitle ? <Text style={styles.offerSubtitle}>{codeData.subtitle}</Text> : null}
        </View>

        {/* ── Código ──────────────────────────────────────────────────── */}
        <Text style={styles.codeLabel}>CÓDIGO</Text>
        <View style={styles.codeRow}>
          <Text style={styles.codeText}>{codeData.code}</Text>
          <TouchableOpacity
            activeOpacity={0.6}
            onPress={handleCopyCode}
            accessibilityLabel={copied ? 'Código compartido' : 'Compartir código'}
          >
            <Text style={[styles.copyText, copied && styles.copyTextDone]}>
              {copied ? 'Compartido' : 'Copiar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── QR (decorativo, ver nota arriba) ───────────────────────── */}
        <View style={styles.qrWrap}>
          <QrPlaceholder />
        </View>

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleCopyCode}>
          <Text style={styles.primaryButtonText}>Copiar código</Text>
        </TouchableOpacity>

        {!!codeData.deepLink && (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={handleOpenPartner}>
            <Text style={styles.secondaryButtonText}>+ Ir a {codeData.partner}</Text>
          </TouchableOpacity>
        )}

        <Text style={styles.expiryText}>Caduca el {codeData.expiryDate}</Text>
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
    paddingBottom: spacing.xl,
  },
  brandBlock: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offerLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
    marginTop: 10,
    textAlign: 'center',
  },
  offerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11.5,
    color: FIGMA.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },

  codeLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 11,
    color: colors.textDark,
    marginBottom: 8,
  },
  codeRow: {
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
  codeText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: FIGMA.textMuted,
  },
  copyText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.accentOrange,
  },
  copyTextDone: {
    color: colors.ctaGreen,
  },

  qrWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },

  primaryButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 4,
  },
  primaryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  secondaryButton: {
    height: 61.3,
    borderRadius: 14.2,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm + 4,
  },
  secondaryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textDark,
  },
  expiryText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    textAlign: 'center',
  },
});
