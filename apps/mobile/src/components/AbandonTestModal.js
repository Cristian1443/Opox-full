import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Modal de confirmación para abandonar una sesión de preguntas en curso.
 *
 * Props:
 *   visible        — controla si el modal está abierto
 *   currentIndex   — pregunta actual (0-based), para mostrar el progreso
 *   total          — total de preguntas de la sesión
 *   onStay         — el usuario elige quedarse → cerrar el modal
 *   onConfirmExit  — el usuario confirma salir → navegar fuera
 */
export default function AbandonTestModal({ visible, currentIndex = 0, total = 0, onStay, onConfirmExit }) {
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Entrada: spring natural hacia tamaño real
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Salida: reducción rápida
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0.88,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const answered = currentIndex + 1;

  return (
    // Sin early return — el Modal se renderiza siempre y gestiona su propia visibilidad.
    // El early return antes del <Modal> desmontaría el componente e impediría la animación de salida.
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={onStay}
    >
      {/* Fondo oscuro — toca para quedarse */}
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onStay}
        accessibilityLabel="Cerrar y volver al test"
      >
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Icono de advertencia */}
          <View style={styles.iconWrap}>
            <Ionicons name="warning-outline" size={40} color={colors.warning} />
          </View>

          {/* Título */}
          <Text style={styles.title}>¿Abandonar el test?</Text>

          {/* Progreso actual */}
          <Text style={styles.progressLine}>
            Llevas{' '}
            <Text style={styles.progressHighlight}>{answered} de {total}</Text>{' '}
            {answered === 1 ? 'pregunta respondida' : 'preguntas respondidas'}.
          </Text>

          {/* Aviso de pérdida de progreso */}
          <View style={styles.warningBox}>
            <Ionicons name="information-circle-outline" size={16} color={colors.warning} />
            <Text style={styles.warningText}>
              Si sales ahora se guardará como{' '}
              <Text style={styles.warningStrong}>incompleto</Text> y los errores
              cometidos se registrarán en tu Laboratorio.
            </Text>
          </View>

          {/* Botones */}
          <View style={styles.btnGroup}>
            {/* Acción primaria → seguir (la acción segura va primero) */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={onStay}
              activeOpacity={0.82}
              accessibilityLabel="Seguir respondiendo el test"
            >
              <Text style={styles.btnPrimaryText}>Seguir respondiendo</Text>
            </TouchableOpacity>

            {/* Acción destructiva → abandonar */}
            <TouchableOpacity
              style={styles.btnDestructive}
              onPress={onConfirmExit}
              activeOpacity={0.82}
              accessibilityLabel="Confirmar abandono del test"
            >
              <Text style={styles.btnDestructiveText}>Abandonar</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.58)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: width * 0.87,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: spacing.lg,
    alignItems: 'center',
    // Sombra
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },

  // Icono
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.warningBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  // Título
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
    letterSpacing: -0.3,
  },

  // Progreso
  progressLine: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  progressHighlight: {
    fontWeight: '800',
    color: colors.dark,
  },

  // Caja de advertencia
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    backgroundColor: colors.warningBg,
    borderRadius: 10,
    padding: spacing.sm,
    marginBottom: spacing.lg,
    width: '100%',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
  },
  warningStrong: {
    fontWeight: '700',
    color: colors.dark,
  },

  // Botones
  btnGroup: {
    width: '100%',
    gap: spacing.sm,
  },
  btnPrimary: {
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDestructive: {
    backgroundColor: 'transparent',
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.separator,
  },
  btnDestructiveText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '600',
  },
});
