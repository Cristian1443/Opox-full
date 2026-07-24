import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { trainingApi } from '../api';

// Motivos definidos fuera del componente — son constantes, no estado
const MOTIVOS = [
  {
    id: 'wrong_answer',
    title: 'La respuesta correcta marcada es errónea',
    desc: 'La solución dada no coincide con la ley vigente.',
    icon: 'checkmark-circle-outline',
    accent: colors.error,
  },
  {
    id: 'typo',
    title: 'El enunciado tiene una errata',
    desc: 'Faltas de ortografía o errores de redacción.',
    icon: 'create-outline',
    accent: colors.warning,
  },
  {
    id: 'outdated',
    title: 'Pregunta desactualizada (cambio en BOE)',
    desc: 'La norma ha sido modificada recientemente.',
    icon: 'document-text-outline',
    accent: colors.dark,
    isBOE: true,
  },
  {
    id: 'other',
    title: 'Otro motivo',
    desc: 'Un problema técnico u otra incidencia.',
    icon: 'alert-circle-outline',
    accent: colors.textSecondary,
  },
];

/**
 * Modal de reporte de errores en preguntas (7.5).
 *
 * Arquitectura backdrop/modal:
 *   Sibling pattern — backdrop y modal son hermanos dentro del Modal.
 *   El View centrador usa pointerEvents="box-none" para que los taps
 *   fuera del modal pasen al backdrop y lo cierren.
 *
 * Props:
 *   visible        — boolean
 *   questionId     — ID de la pregunta a reportar
 *   onClose        — el usuario cancela sin enviar
 *   onSendReport   — (motivoId: string) => void — reporte confirmado
 */
export default function ReportQuestionModal({ visible, questionId, onClose, onSendReport }) {
  const [selectedId, setSelectedId] = useState(null);
  const [isSending, setIsSending] = useState(false);

  // useRef, no useState — valores estables y reseteables
  const scaleAnim = useRef(new Animated.Value(0.88)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Resetear estado y animación al abrir (importante para segunda aparición)
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
    // La salida la gestiona handleClose — no aquí,
    // para asegurar que la animación termina antes de llamar a onClose.
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
      // El reporte falla silenciosamente — no interrumpimos la sesión del usuario
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

        {/* ── BACKDROP ── */}
        <Animated.View style={[styles.backdrop, { opacity: opacityAnim }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
            accessibilityLabel="Cancelar y cerrar reporte"
          />
        </Animated.View>

        {/*
          Centrador con pointerEvents="box-none":
          el View en sí no captura taps (los pasa al backdrop),
          pero sus hijos (el Animated.View modal) sí lo hacen.
        */}
        <View style={styles.center} pointerEvents="box-none">
          <Animated.View style={[
            styles.modal,
            { transform: [{ scale: scaleAnim }], opacity: opacityAnim },
          ]}>

            {/* ── CABECERA ── */}
            <View style={styles.header}>
              <View style={styles.iconBadge}>
                <Ionicons name="flag" size={17} color={colors.dark} />
              </View>
              <Text style={styles.headerTitle}>Reportar esta pregunta</Text>
              <TouchableOpacity
                onPress={handleClose}
                style={styles.closeBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel="Cerrar sin reportar"
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {/* ── CUERPO ── */}
            <ScrollView
              contentContainerStyle={styles.body}
              showsVerticalScrollIndicator={false}
              bounces={false}
              keyboardShouldPersistTaps="handled"
            >
              <Text style={styles.subtitle}>¿Qué problema encontraste?</Text>

              <View style={styles.motivosList}>
                {MOTIVOS.map(motivo => {
                  const isSelected = selectedId === motivo.id;
                  return (
                    <TouchableOpacity
                      key={motivo.id}
                      onPress={() => setSelectedId(motivo.id)}
                      activeOpacity={0.72}
                      accessibilityLabel={motivo.title}
                      accessibilityState={{ selected: isSelected }}
                      style={[
                        styles.motivoCard,
                        isSelected && {
                          borderColor: motivo.accent,
                          backgroundColor: colors.grayLight,
                        },
                      ]}
                    >
                      {/* Icono del motivo */}
                      <View style={[
                        styles.motivoIcon,
                        { borderColor: isSelected ? motivo.accent : colors.separator },
                      ]}>
                        <Ionicons
                          name={motivo.icon}
                          size={20}
                          color={isSelected ? motivo.accent : colors.grayText}
                        />
                      </View>

                      {/* Textos */}
                      <View style={styles.motivoBody}>
                        <Text style={[
                          styles.motivoTitle,
                          isSelected && { color: motivo.accent },
                        ]}>
                          {motivo.title}
                        </Text>

                        {/* Badge BOE — View, no Text, para poder usar flexRow */}
                        {motivo.isBOE && (
                          <View style={styles.boeTag}>
                            <Ionicons name="flash" size={11} color={colors.dark} />
                            <Text style={styles.boeTagText}>Monitor BOE</Text>
                          </View>
                        )}

                        <Text style={styles.motivoDesc}>{motivo.desc}</Text>
                      </View>

                      {/* Radio button */}
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={22}
                        color={isSelected ? motivo.accent : colors.separator}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── BOTÓN DE ENVÍO ── */}
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!selectedId || isSending) && styles.sendBtnDisabled,
                ]}
                onPress={handleSend}
                disabled={!selectedId || isSending}
                activeOpacity={0.82}
                accessibilityLabel="Enviar reporte de error"
              >
                {isSending
                  ? <ActivityIndicator size="small" color={colors.white} />
                  : <Text style={styles.sendBtnText}>Enviar reporte</Text>
                }
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Backdrop absoluteFill
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },

  // Centrador — pointerEvents="box-none" se pasa como prop, no aquí
  center: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },

  // Modal
  modal: {
    width: '100%',
    maxWidth: 400,
    maxHeight: '82%',
    backgroundColor: colors.card,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 16,
  },

  // Cabecera con fondo neutro navy suave
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    backgroundColor: '#E8EAF0',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,27,42,0.10)',
  },
  iconBadge: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
  },
  closeBtn: {
    padding: spacing.xs,
  },

  // Cuerpo
  body: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginBottom: spacing.md,
  },

  // Lista de motivos — solo gap, sin marginBottom en las cards
  motivosList: {
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  motivoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.separator,
    backgroundColor: colors.card,
  },
  motivoIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grayLight,
    flexShrink: 0,
  },
  motivoBody: {
    flex: 1,
    gap: 2,
  },
  motivoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    lineHeight: 19,
  },

  // Badge BOE: View con flexRow (Text no soporta flexDirection)
  boeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  boeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.dark,
  },

  motivoDesc: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Botón de envío morado
  sendBtn: {
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    shadowColor: colors.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  sendBtnDisabled: {
    backgroundColor: colors.grayMid,
    shadowOpacity: 0,
    elevation: 0,
  },
  sendBtnText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
});
