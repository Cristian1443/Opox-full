import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

/**
 * Pantalla de pausa (mockup PAUSA) — overlay semi-transparente tenue sobre la
 * pantalla del test (sin card contenedora). Círculo morado con play naranja
 * centrado, textos directos sobre el overlay y dos CTA anchos.
 */
export default function PauseSessionModal({
  visible,
  currentIndex,
  total,
  correctAnswers,
  onResume,
  onExitAndSave,
}) {
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacityValue.setValue(0);
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const animateOut = (callback) => {
    Animated.timing(opacityValue, {
      toValue: 0,
      duration: 160,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) callback?.();
    });
  };

  const handleResume = () => animateOut(onResume);
  const handleExitAndSave = () => animateOut(onExitAndSave);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleResume}
    >
      <Animated.View style={[styles.overlay, { opacity: opacityValue }]}>
        <View style={styles.center}>
          {/* Círculo morado con play naranja */}
          <View style={styles.iconCircle}>
            <Ionicons name="play" size={44} color={colors.primary} />
          </View>

          <Text style={styles.title}>Test en pausa</Text>
          <Text style={styles.infoLine}>
            Vas por la pregunta {currentIndex + 1} de {total} · {correctAnswers} aciertos
          </Text>
          <Text style={styles.clockLine}>El cronómetro está detenido</Text>

          <TouchableOpacity
            style={styles.resumeBtn}
            onPress={handleResume}
            activeOpacity={0.85}
          >
            <Text style={styles.resumeBtnText}>Reanudar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={handleExitAndSave}
            activeOpacity={0.75}
          >
            <Text style={styles.exitBtnText}>Guardar y salir</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // Overlay tenue: el test detrás sigue visible pero difuminado
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(120, 120, 140, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  center: {
    width: '100%',
    alignItems: 'center',
  },
  // Círculo morado con play naranja (sin card contenedora)
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.purple,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: 'center',
  },
  infoLine: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 4,
  },
  clockLine: {
    fontSize: 13,
    color: colors.error,
    fontWeight: '700',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  resumeBtn: {
    backgroundColor: colors.purple,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
  },
  resumeBtnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  exitBtn: {
    backgroundColor: colors.card,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    maxWidth: 320,
    borderWidth: 1.5,
    borderColor: '#D4DAE6',
    marginTop: 10,
  },
  exitBtnText: {
    color: colors.dark,
    fontSize: 15,
    fontWeight: '700',
  },
});
