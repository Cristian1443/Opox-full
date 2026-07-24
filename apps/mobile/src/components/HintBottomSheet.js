import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  PanResponder,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

// Desplazamiento inicial fuera de pantalla — mayor que cualquier altura posible del sheet
const SHEET_OFFSET = 520;

/**
 * Bottom sheet de pista IA (7.2).
 *
 * Arquitectura backdrop/sheet:
 *   Backdrop y sheet son HERMANOS dentro del Modal (no padre/hijo).
 *   Esto evita que un tap en el sheet propague el evento al backdrop y cierre el overlay.
 *
 * Ciclo de animación:
 *   open  → resetea translateY a SHEET_OFFSET → spring hasta 0
 *   close → timing de regreso a SHEET_OFFSET → llama onClose al terminar
 *
 * Props:
 *   visible          — boolean
 *   questionSummary  — texto breve de la pregunta (se trunca a 2 líneas)
 *   hint             — texto de la pista generada por la IA
 *   isLoading        — boolean, muestra spinner mientras el backend responde
 *   onClose          — callback al cerrar
 */
export default function HintBottomSheet({ visible, questionSummary, hint, isLoading = false, onClose }) {
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      // Resetear antes de la entrada para que siempre arranque desde abajo
      translateY.setValue(SHEET_OFFSET);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 68,
          friction: 11,
          useNativeDriver: true,  // translateY soporta native driver — más fluido
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }),
      ]).start();
    }
    // La salida la gestiona handleClose para asegurar que la animación se completa
    // antes de llamar a onClose y cambiar `visible` en el parent.
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SHEET_OFFSET,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose?.();
    });
  };

  // Ref en sync para que el PanResponder (creado una sola vez) lea siempre el handler actual
  const handleCloseRef = useRef(handleClose);
  handleCloseRef.current = handleClose;

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dy, dx }) =>
        dy > 8 && Math.abs(dy) > Math.abs(dx),
      onPanResponderMove: (_, { dy }) => {
        if (dy > 0) translateY.setValue(dy);
      },
      onPanResponderRelease: (_, { dy, vy }) => {
        if (dy > 80 || vy > 0.8) {
          handleCloseRef.current();
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            tension: 68,
            friction: 11,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/*
        Contenedor raíz: ocupa toda la pantalla.
        Backdrop y sheet son HERMANOS — ninguno es hijo del otro.
        Así, un tap en el sheet NO propaga el evento al backdrop.
      */}
      <View style={styles.root}>

        {/* ── BACKDROP ── */}
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
            accessibilityLabel="Cerrar pista"
          />
        </Animated.View>

        {/* ── SHEET ── */}
        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          {/* Drag handle — arrastra hacia abajo para cerrar */}
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Pista del tutor IA</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Cerrar pista"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Cuerpo scrollable por si la pista es larga */}
          <ScrollView
            style={styles.body}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Resumen de la pregunta */}
            {questionSummary && (
              <Text style={styles.questionSummary} numberOfLines={2}>
                {questionSummary}
              </Text>
            )}

            {/* Caja de la pista */}
            <View style={styles.hintBox}>
              {isLoading
                ? <ActivityIndicator size="small" color={colors.warning} />
                : <Text style={styles.hintText}>{hint}</Text>
              }
            </View>

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <Text style={styles.disclaimerText}>
                La IA te guía sin revelar la respuesta correcta.
              </Text>
            </View>
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleClose}
            activeOpacity={0.82}
            accessibilityLabel="Cerrar la pista y seguir respondiendo"
          >
            <Text style={styles.btnText}>Entendido, sigo</Text>
          </TouchableOpacity>
        </Animated.View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Backdrop: absoluteFill + semitransparente
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  // Sheet: anclado al fondo, se anima verticalmente
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
    // Sombra hacia arriba
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 12,
  },

  handleContainer: {
    alignSelf: 'stretch',
    alignItems: 'center',
    paddingVertical: 10,
  },
  handle: {
    width: 38,
    height: 4,
    backgroundColor: colors.separator,
    borderRadius: 2,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '800',
    color: colors.dark,
  },
  closeBtn: {
    padding: spacing.xs,
  },

  // Body
  body: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },

  // Resumen de la pregunta
  questionSummary: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },

  // Caja de la pista
  hintBox: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  hintText: {
    fontSize: 16,
    lineHeight: 25,
    color: colors.text,
  },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.xs,
  },
  disclaimerText: {
    fontSize: 13,
    color: colors.purple,
    fontStyle: 'italic',
    fontWeight: '600',
  },

  // Botón CTA morado
  btn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.purple,
    paddingVertical: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
