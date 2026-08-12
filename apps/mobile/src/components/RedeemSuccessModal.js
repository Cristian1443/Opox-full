import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const ACCENT = '#6C5CE7';
const { width } = Dimensions.get('window');

// ─── Pop-up "¡Canje realizado!" (mockup 11.3·ok) ─────────────────────────────
// Modal centrado con animación fade+spring. Se muestra sobre StoreConfirmRedeemScreen
// tras un canje exitoso.
// Props:
//   visible        — controla la visibilidad
//   productName    — nombre del producto canjeado
//   newBalance     — saldo resultante
//   onContinue     — acción primaria ("Empezar a usarlo")
//   onClose        — acción secundaria ("Cerrar") / dismiss al pulsar fuera
export default function RedeemSuccessModal({
  visible,
  productName,
  newBalance,
  onContinue,
  onClose,
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      opacity.setValue(0);
      scale.setValue(0.85);
    }
  }, [visible]);

  const handleContinue = () => {
    if (onContinue) onContinue();
    else onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Overlay oscuro — tappable para cerrar */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Cerrar"
      />

      {/* Tarjeta centrada */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

          {/* Icono de éxito */}
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={colors.success} />
          </View>

          <Text style={styles.title}>¡Canje realizado!</Text>

          <Text style={styles.message}>
            El <Text style={styles.productNameHighlight}>{productName}</Text> ya está en tu cuenta.
          </Text>

          {/* Saldo restante */}
          <View style={styles.balanceCard}>
            <View style={styles.balanceRow}>
              <Ionicons name="wallet-outline" size={18} color={colors.textSecondary} />
              <Text style={styles.balanceLabel}>Saldo restante</Text>
            </View>
            <Text style={styles.balanceAmount}>
              {(newBalance ?? 0).toLocaleString()} O
            </Text>
          </View>

          {/* CTA principal */}
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            accessibilityLabel="Empezar a usar el producto"
          >
            <Ionicons name="chevron-forward" size={20} color={colors.white} />
            <Text style={styles.continueButtonText}>Empezar a usarlo</Text>
          </TouchableOpacity>

          {/* CTA secundario */}
          <TouchableOpacity
            style={styles.closeLink}
            onPress={onClose}
            accessibilityLabel="Cerrar y volver a la tienda"
          >
            <Text style={styles.closeLinkText}>Cerrar</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 24,
    width: width * 0.88,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 15,
  },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.successBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  productNameHighlight: {
    fontWeight: '700',
    color: ACCENT,
  },
  // Saldo
  balanceCard: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.separator,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.success,
  },
  // Botones
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ACCENT,
    paddingVertical: 15,
    paddingHorizontal: 28,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 12,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '800',
  },
  closeLink: {
    paddingVertical: 10,
  },
  closeLinkText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
});
