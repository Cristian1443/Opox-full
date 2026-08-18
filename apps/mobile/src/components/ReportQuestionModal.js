import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { trainingApi } from '../api';

// Motivos simplificados según el mockup REPORTAR
const MOTIVOS = [
  { id: 'wrong_answer', label: 'La respuesta marcada como correcta es errónea' },
  { id: 'typo', label: 'El enunciado tiene una errata' },
  { id: 'outdated', label: 'La pregunta está desactualizada (cambio BOE)' },
  { id: 'other', label: 'Otro motivo' },
];

/**
 * Modal de reporte de errores en preguntas (mockup REPORTAR).
 * Card blanca con título, 4 opciones con borde y CTA morado.
 * La opción seleccionada se marca con borde morado.
 */
export default function ReportQuestionModal({ visible, questionId, onClose, onSendReport }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setSelectedId(null);
      setIsSending(false);
      scaleAnim.setValue(0.88);
      opacityAnim.setValue(0);

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 190,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.88,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) onClose?.();
    });
  };

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
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
          />
        </Animated.View>

        <View style={styles.center} pointerEvents="box-none">
          <Animated.View style={[
            styles.modal,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Cerrar sin reportar"
            >
              <Ionicons name="close" size={22} color={colors.gray} />
            </TouchableOpacity>

            <Text style={styles.title}>Reportar esta pregunta</Text>
            <Text style={styles.subtitle}>¿Qué le pasó?</Text>

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
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modal: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },

  title: {
    fontSize: 17,
    fontFamily: 'Poppins-SemiBold',
    color: colors.textDark,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },

  optionsList: {
    gap: 8,
    marginBottom: spacing.md,
  },
  option: {
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E4E8F0',
    backgroundColor: colors.card,
  },
  optionSelected: {
    borderColor: colors.selectionBorder,
    borderWidth: 2,
  },
  optionText: {
    fontSize: 13.5,
    fontFamily: 'Poppins-Regular',
    color: colors.textDark,
    lineHeight: 18,
  },

  sendBtn: {
    marginTop: spacing.sm,
    backgroundColor: colors.purple,
    paddingVertical: 14,
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
