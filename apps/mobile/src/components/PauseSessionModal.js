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
 * Pantalla de pausa (7.6) — overlay oscuro a pantalla completa.
 * No dismissable con tap: el usuario debe elegir Reanudar o Guardar y salir.
 *
 * Props:
 *   visible         — boolean
 *   currentIndex    — índice 0-based de la pregunta actual
 *   total           — total de preguntas
 *   correctAnswers  — aciertos hasta ahora
 *   elapsedSeconds  — segundos transcurridos
 *   onResume        — callback: reanudar
 *   onExitAndSave   — callback: guardar y salir
 */
export default function PauseSessionModal({
  visible,
  currentIndex,
  total,
  correctAnswers,
  elapsedSeconds,
  onResume,
  onExitAndSave,
}) {
  const opacityValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      opacityValue.setValue(0);
      Animated.timing(opacityValue, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const animateOut = (callback) => {
    Animated.timing(opacityValue, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) callback?.();
    });
  };

  const handleResume = () => animateOut(onResume);
  const handleExitAndSave = () => animateOut(onExitAndSave);

  const formatElapsed = (s) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleResume}
    >
      <Animated.View style={[styles.screen, { opacity: opacityValue }]}>

        {/* Ícono de play (el test está en pausa → mostrar triángulo de reanudar) */}
        <View style={styles.iconCircle}>
          <Ionicons name="play" size={38} color={colors.white} />
        </View>

        {/* Título */}
        <Text style={styles.title}>Test en pausa</Text>

        {/* Info compacta */}
        <Text style={styles.infoLine}>
          Vas por la pregunta {currentIndex + 1} de {total} · {correctAnswers} aciertos
        </Text>

        {/* Estado del cronómetro */}
        <Text style={styles.clockLine}>El cronómetro está detenido</Text>

        {/* Botones */}
        <View style={styles.buttons}>
          <TouchableOpacity
            style={styles.resumeBtn}
            onPress={handleResume}
            activeOpacity={0.85}
            accessibilityLabel="Reanudar la sesión"
          >
            <Text style={styles.resumeBtnText}>Reanudar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.exitBtn}
            onPress={handleExitAndSave}
            activeOpacity={0.75}
            accessibilityLabel="Guardar progreso y salir"
          >
            <Text style={styles.exitBtnText}>Guardar y salir</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: 'rgba(8,14,24,0.97)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },

  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: -0.5,
  },

  infoLine: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.60)',
    textAlign: 'center',
    lineHeight: 22,
  },

  clockLine: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    fontWeight: '600',
    marginBottom: spacing.lg,
  },

  buttons: {
    width: '100%',
    gap: spacing.md,
  },

  resumeBtn: {
    backgroundColor: colors.purple,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  resumeBtnText: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
  },

  exitBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  exitBtnText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 17,
    fontWeight: '600',
  },
});
