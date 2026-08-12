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
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme';

const ACCENT = '#6C5CE7';
const { width } = Dimensions.get('window');

// ─── Pop-up "Pago rechazado" (mockup 11.5·err) ───────────────────────────────
// Modal centrado con animación fade+spring. Se monta dentro de
// StoreSubscriptionScreen cuando RevenueCat devuelve error de cobro.
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
      {/* Overlay oscuro tappable */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Cerrar"
      />

      {/* Tarjeta centrada */}
      <View style={styles.centeredContainer} pointerEvents="box-none">
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>

          {/* Icono de error */}
          <View style={styles.iconContainer}>
            <Ionicons name="alert-circle" size={56} color={colors.error} />
          </View>

          <Text style={styles.title}>No se ha podido cobrar</Text>
          <Text style={styles.description}>
            Tu método de pago ha sido rechazado. Revisa los datos o prueba con otra tarjeta.
          </Text>

          {/* Botones de acción */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.changeButton}
              onPress={handleChangeMethod}
              accessibilityLabel="Cambiar método de pago"
            >
              <Ionicons name="card-outline" size={18} color={colors.text} />
              <Text style={styles.changeButtonText}>Cambiar método</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              accessibilityLabel="Reintentar el pago"
            >
              <Ionicons name="refresh-outline" size={18} color={colors.white} />
              <Text style={styles.retryButtonText}>Reintentar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.closeLink}
            onPress={onClose}
            accessibilityLabel="Cerrar este mensaje"
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
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  buttonRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  changeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.grayLight,
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.separator,
    gap: 6,
  },
  changeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  retryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ACCENT,
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
    shadowColor: ACCENT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.white,
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
