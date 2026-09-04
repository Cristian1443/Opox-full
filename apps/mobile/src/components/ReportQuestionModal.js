import React, { useState, useRef, useEffect } from 'react';
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
import { colors, spacing } from '../theme';
import { trainingApi } from '../api';

const SHEET_OFFSET = 520;

// Motivos simplificados según el mockup REPORTAR
const MOTIVOS = [
  { id: 'wrong_answer', label: 'La respuesta marcada como correcta es errónea' },
  { id: 'typo', label: 'El enunciado tiene una errata' },
  { id: 'outdated', label: 'La pregunta está desactualizada (cambio BOE)' },
  { id: 'other', label: 'Otro motivo' },
];

/**
 * Bottom sheet de reporte de errores en preguntas (mockup REPORTAR).
 * Mismo patrón que HintBottomSheet/LawReferenceBottomSheet: card blanca
 * anclada abajo, handle de arrastre, 4 opciones con borde y CTA morado.
 * La opción seleccionada se marca con borde morado.
 */
export default function ReportQuestionModal({ visible, questionId, onClose, onSendReport }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      setIsSending(false);
      translateY.setValue(SHEET_OFFSET);
      backdropOpacity.setValue(0);

      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          tension: 68,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 210,
          useNativeDriver: true,
        }),
      ]).start();
    }
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

  const handleSend = async () => {
    if (!selectedId || isSending) return;
    setIsSending(true);
    try {
      await trainingApi.reportQuestion(questionId, selectedId);
    } catch (_err) {
      // Reporte silencioso — no interrumpe la sesión
    } finally {
      setIsSending(false);
      onSendReport?.(selectedId);
      handleClose();
    }
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            {
              transform: [{ translateY }],
              paddingBottom: insets.bottom + spacing.md,
            },
          ]}
        >
          <View {...panResponder.panHandlers} style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <Text style={styles.title}>Reportar esta pregunta</Text>
            <Text style={styles.subtitle}>¿Qué le pasa?</Text>

            <View style={styles.optionsList}>
              {MOTIVOS.map(motivo => {
                const isSelected = selectedId === motivo.id;
                return (
                  <TouchableOpacity
                    key={motivo.id}
                    onPress={() => setSelectedId(motivo.id)}
                    activeOpacity={0.75}
                    style={[
                      styles.option,
                      isSelected && styles.optionSelected,
                    ]}
                  >
                    <Text style={styles.optionText}>{motivo.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!selectedId || isSending) && styles.sendBtnDisabled,
            ]}
            onPress={handleSend}
            disabled={!selectedId || isSending}
            activeOpacity={0.82}
          >
            {isSending
              ? <ActivityIndicator size="small" color={colors.white} />
              : <Text style={styles.sendBtnText}>Enviar reporte</Text>
            }
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15,27,51,0.55)',
  },

  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: '88%',
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

  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },

  title: {
    fontSize: 22,
    fontFamily: 'Poppins-SemiBold',
    color: colors.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  optionsList: {
    gap: 10,
  },
  option: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E4E8F0',
    backgroundColor: colors.card,
  },
  optionSelected: {
    borderColor: colors.purple,
    borderWidth: 2.5,
  },
  optionText: {
    fontSize: 14.5,
    fontFamily: 'Poppins-Regular',
    color: colors.textDark,
    lineHeight: 20,
  },

  sendBtn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.purple,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.gray,
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: 'Poppins-SemiBold',
  },
});
