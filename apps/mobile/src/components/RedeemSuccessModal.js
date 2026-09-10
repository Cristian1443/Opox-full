import React, { useEffect, useRef } from 'react';
import {
    View,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Dimensions,
    Animated,
} from 'react-native';
import Text from './AppText';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../theme';

const { width } = Dimensions.get('window');

// ─── 11.3 · Canje realizado ────────────────────────────────────────────────
// Fiel al Figma (TiendaModalesScreen.tsx → CanjeRealizadoModal). Único
// consumidor: StoreConfirmRedeemScreen, tras un canje exitoso.
const FIGMA = {
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

// Ícono exacto exportado de Figma: solo el check, sin círculo alrededor
// (mismo path que SuccessCheckIcon de BoeHomeScreen).
function SuccessCheckIcon({ size = 56, color = colors.ctaGreen }) {
  return (
    <Svg width={size} height={(size * 158) / 240} viewBox="0 0 240 158" fill="none">
      <Path d="M232.992 3.6811C235.578 5.88163 237.541 8.58613 238.723 11.5768C239.905 14.5674 240.272 17.7606 239.796 20.8991C237.076 26.515 233.842 30.2469 228.998 34.4463L227.128 36.0929L221.178 41.1839L215.212 46.3504L209.854 50.9164C207.755 52.7644 205.77 54.6604 203.9 56.6042C200.554 59.8976 197.125 63.0662 193.613 66.1103L187.169 71.7981L180.198 77.8598L165.497 90.8029L148.406 105.774L135.485 117.153C131.067 121.043 131.067 121.043 130.128 122.693H128.425V124.189H126.718L125.019 127.184C121.617 130.179 121.617 130.179 119.914 130.179L118.215 133.17C114.814 136.165 114.814 136.165 113.115 136.165V137.664L107.161 142.155L104.441 145.002C96.5349 152.786 89.9887 158.923 77.4027 157.874C71.5988 155.721 66.3608 152.539 62.0153 148.526L60.0592 146.879L53.8479 141.414L49.5967 137.596L28.8514 119.404L9.71514 102.567L6.31748 99.4964C3.56719 96.9489 1.61896 93.8139 0.665048 90.401C-0.288861 86.9881 -0.215471 83.4152 0.877975 80.035C4.78609 73.1499 10.3971 69.1807 18.9893 68.4328C35.4834 69.702 49.854 87.8943 60.9086 97.7743L67.5406 103.689L69.5824 105.486C77.2353 112.224 77.2353 112.224 84.2062 112.224C91.5161 108.334 97.5518 102.117 103.592 96.8035L106.144 94.5601C109.43 91.7126 112.603 88.7164 115.663 85.5717C119.632 81.7775 123.716 78.0348 127.914 74.3436L130.548 72.0965L139.051 64.4636L142.113 61.839L186.062 23.0096L200.257 10.4978L202.707 8.25076C212.08 0.0174689 220.835 -3.04934 232.992 3.68829" fill={color} />
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
