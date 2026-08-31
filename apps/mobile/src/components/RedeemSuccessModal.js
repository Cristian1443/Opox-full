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
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

// ─── 11.3 · Canje realizado ────────────────────────────────────────────────
// Fiel al Figma (TiendaModalesScreen.tsx → CanjeRealizadoModal). Único
// consumidor: StoreConfirmRedeemScreen, tras un canje exitoso.
const FIGMA = {
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

// Ícono confirmado en Figma: círculo + check verde, sin círculo de fondo
// adicional detrás (mismo lenguaje visual que el resto de modales de éxito
// de la app — NotesDigitizedModal, BoeUpdateSuccessScreen).
function SuccessCheckIcon({ size = 56, color = colors.ctaGreen }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Circle cx={24} cy={24} r={22} stroke={color} strokeWidth={3} fill="none" />
      <Path d="M14 24.5L20.5 31L34 16.5" stroke={color} strokeWidth={3.2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

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
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Cerrar"
      />

      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <SuccessCheckIcon />

          <Text style={styles.title}>¡Canje realizado!</Text>

          <Text style={styles.message}>
            {`El ${productName ?? 'producto'} ya está en tu cuenta. Saldo restante: ${(newBalance ?? 0).toLocaleString('es-ES')} Opopoints.`}
          </Text>

          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            accessibilityLabel="Empezar a usar el producto"
          >
            <Text style={styles.continueButtonText}>Empezar a usarlo</Text>
          </TouchableOpacity>

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
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  centeredContainer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 10.7,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    width: width * 0.9,
    maxWidth: 348,
    paddingVertical: 28,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
    marginTop: 16,
  },
  message: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  continueButton: {
    width: '100%',
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  continueButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  closeLink: {
    marginTop: 14,
  },
  closeLinkText: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
  },
});
