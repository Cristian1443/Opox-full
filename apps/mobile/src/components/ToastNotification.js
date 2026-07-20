import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Toast flotante de feedback rápido (guardado / reportado / etc.).
 *
 * Ciclo correcto de animación:
 *   visible=true  → anima entrada
 *   timer expira  → anima salida → al terminar llama onClose()
 *   onClose()     → parent pone visible=false
 *   visible=false → anima salida (si lo cierra el parent antes del timer)
 *
 * El componente NUNCA se desmonta por sí mismo (no early return).
 * Eso garantiza que la animación de salida siempre se ejecuta.
 *
 * Tipos disponibles: 'success' | 'info'
 *   success → verde  (acción completada positivamente: guardado)
 *   info    → navy   (reconocimiento neutro: reportado)
 */
export default function ToastNotification({
  visible,
  message,
  type = 'success',
  duration = 3000,
  onClose,
}) {
  // useRef, no useState — valores estables entre renders y remontajes
  const translateY = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);

  useEffect(() => {
    if (visible) {
      // Limpiar timer anterior por si acaso
      clearTimeout(timerRef.current);

      // Resetear posición inicial para que cada aparición empiece desde abajo
      translateY.setValue(80);
      opacity.setValue(0);

      // Animación de entrada
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 65,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-cierre: anima la salida primero, llama onClose al terminar
      timerRef.current = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: 80,
            duration: 260,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 260,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => {
          if (finished) onClose?.();
        });
      }, duration);

    } else {
      // El parent cerró el toast externamente — animar salida sin llamar onClose
      clearTimeout(timerRef.current);
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 80,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }

    return () => clearTimeout(timerRef.current);
  }, [visible]);

  const config = TOAST_CONFIG[type] ?? TOAST_CONFIG.success;

  // No se desmonta — la visibilidad la controlan los valores animados.
  // pointer-events none cuando está oculto para no bloquear interacciones.
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.container, { transform: [{ translateY }], opacity }]}
    >
      <View style={[styles.pill, { backgroundColor: config.bg }]}>
        <View style={[styles.iconWrap, { backgroundColor: config.iconBg }]}>
          <Ionicons name={config.icon} size={16} color={config.color} />
        </View>
        <Text style={[styles.message, { color: config.color }]} numberOfLines={2}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
}

// Configuración visual por tipo
const TOAST_CONFIG = {
  success: {
    bg: colors.successBg,
    iconBg: 'rgba(52,199,89,0.15)',
    color: colors.success,
    icon: 'checkmark-circle',
  },
  info: {
    bg: colors.grayLight,
    iconBg: 'rgba(13,27,42,0.08)',
    color: colors.dark,
    icon: 'flag',
  },
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: spacing.xl,
    left: spacing.md,
    right: spacing.md,
    zIndex: 9999,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderRadius: 14,
    maxWidth: Math.min(width * 0.9, 380),
    // shadowColor como hex plano — en iOS rgba en shadowColor es ignorado
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 6,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
});
