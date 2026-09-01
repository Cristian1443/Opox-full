import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import Svg, { Rect, Circle, Path } from 'react-native-svg';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

// ─── 11.5 · Pago rechazado (suscripción) ───────────────────────────────────
// Fiel al Figma (TiendaModalesScreen.tsx → PagoRechazadoModal). El mismo
// diseño se reutiliza también en StoreRealRedeemConfirmScreen para el fallo
// de canje real; aquí sí aplica literalmente "Cambiar método" porque este
// modal está atado a un cobro real (RevenueCat), a diferencia de aquel.
const FIGMA = {
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

function CardBlockedIcon({ size = 56, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={2} y={5} width={16} height={11} rx={2} stroke={color} strokeWidth={1.4} fill="none" />
      <Path d="M2 9H18" stroke={color} strokeWidth={1.4} />
      <Circle cx={18} cy={16} r={4.5} stroke={color} strokeWidth={1.4} fill="none" />
      <Circle cx={21} cy={16} r={4.5} stroke={color} strokeWidth={1.4} fill="none" />
    </Svg>
  );
}

// Props:
//   visible        — controla la visibilidad
//   onRetry        — relanza el proceso de pago
//   onChangeMethod — abre cambio de método de pago
//   onClose        — cierra el modal
export default function PaymentErrorModal({ visible, onClose, onRetry, onChangeMethod }) {
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

  const handleRetry = () => {
    if (onRetry) onRetry();
    onClose();
  };

  const handleChangeMethod = () => {
    if (onChangeMethod) onChangeMethod();
    onClose();
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
          <CardBlockedIcon />

          <Text style={styles.title}>No se ha podido cobrar</Text>
          <Text style={styles.description}>
            Tu método de pago ha sido rechazado. Revisa los datos o prueba con otra tarjeta.
          </Text>

          <TouchableOpacity
            style={styles.retryButton}
            onPress={handleRetry}
            accessibilityLabel="Reintentar el pago"
          >
            <Text style={styles.retryButtonText}>Reintentar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.changeLink}
            onPress={handleChangeMethod}
            accessibilityLabel="Cambiar método de pago"
          >
            <Text style={styles.changeLinkText}>Cambiar método</Text>
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
  description: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  retryButton: {
    width: '100%',
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  retryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
  changeLink: {
    marginTop: 14,
  },
  changeLinkText: {
    fontFamily: 'Poppins-Light',
    fontSize: 13.8,
    color: colors.textDark,
  },
});
