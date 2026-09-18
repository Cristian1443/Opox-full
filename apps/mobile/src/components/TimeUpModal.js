import React, { useRef, useEffect } from 'react';
import {
    View,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Animated,
    Dimensions,
} from 'react-native';
import Text from './AppText';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const { width } = Dimensions.get('window');

/**
 * Modal de sesión terminada por CRONÓMETRO GLOBAL agotado.
 *
 * Diseño deliberado:
 *   - El backdrop NO se puede tocar para cerrar — el usuario debe reconocer el evento.
 *   - El botón es naranja (primario), no rojo: quedarse sin tiempo no es un "error" del usuario.
 *   - El icono usa paleta warning (ámbar) por el mismo motivo.
 *
 * Props:
 *   visible       — controla visibilidad
 *   pendingCount  — nº de preguntas que quedaron sin responder (opcional, para el texto)
 *   onContinue    — navega a la pantalla de resultados
 */
export default function TimeUpModal({ visible, pendingCount = 0, onContinue }) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, { toValue: 0.85, duration: 150, useNativeDriver: true }),
        Animated.timing(opacityAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      ]).start();
    }
  }, [visible]);

  return (
    // Sin early return — el Modal gestiona su propia visibilidad.
    // Renderizar siempre garantiza que la animación de entrada y salida se ejecuten.
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={() => {/* El botón atrás del sistema no cierra este modal */}}
    >
      {/* Backdrop — no se puede tocar para cerrar (comportamiento intencional) */}
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.sheet,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}
        >
          {/* Icono de reloj */}
          <View style={styles.iconWrap}>
            <Ionicons name="alarm-outline" size={40} color={colors.warning} />
          </View>

          {/* Título */}
          <Text style={styles.title}>¡Tiempo agotado!</Text>

          {/* Explicación — refleja la realidad del cronómetro GLOBAL:
              solo se cierra el test cuando se acaba el minutero de todo el test,
              no el de una pregunta puntual. Las pendientes cuentan como fallo. */}
          <Text style={styles.subtitle}>
            {pendingCount > 0
              ? `Se acabó el cronómetro del test. Las ${pendingCount} preguntas sin responder cuentan como fallo. Vamos a revisar cómo lo hiciste.`
              : 'Se acabó el cronómetro del test. Vamos a revisar cómo lo hiciste.'}
          </Text>

          {/* CTA único — naranja, no rojo */}
          <TouchableOpacity
            style={styles.btn}
            onPress={onContinue}
            activeOpacity={0.82}
            accessibilityLabel="Ver los resultados de esta sesión"
          >
            <Ionicons name="trophy-outline" size={18} color={colors.white} />
            <Text style={styles.btnText}>Ver resultados</Text>
          </TouchableOpacity>

          {/* Nota contextual */}
          <View style={styles.note}>
            <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
            <Text style={styles.noteText}>Solo cuando se agota el tiempo global</Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  sheet: {
    width: Math.min(width * 0.88, 380),
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: spacing.lg,
    paddingTop: spacing.xl,
    alignItems: 'center',
    // Sombra pronunciada para contexto de urgencia
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.28,
    shadowRadius: 28,
    elevation: 20,
  },

  // Icono
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.warningBg,
    borderWidth: 1,
    borderColor: 'rgba(255,159,10,0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },

  // Título: dark navy, no rojo — el usuario no hizo nada mal
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark,
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xs,
  },

  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    backgroundColor: colors.success,
    paddingVertical: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Nota
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  noteText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});
