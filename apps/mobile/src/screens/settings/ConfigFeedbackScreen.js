import React, { useState, useCallback } from 'react';
import {
    View,
    StyleSheet,
    TouchableOpacity,
    ScrollView,
    TextInput,
    StatusBar,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import Text from '../../components/AppText';
import AppHeader from '../../components/AppHeader';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing } from '../../theme';
import FeedbackSuccessModal from './FeedbackSuccessModal';
import { settingsApi, api } from '../../api';

// ─── 12.9 · Tu opinión ──────────────────────────────────────────────────────
// Fiel al Figma (FeedbackScreen.tsx). La validación de mensaje vacío, el
// spinner de envío, el contador de caracteres (límite real del backend,
// 500) y el modal de éxito son funcionalidad real sin equivalente en
// Figma — se conservan íntegros.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  segmentBorder: 'rgba(65, 41, 80, 0.2)',
  textareaBorder: 'rgba(65, 41, 80, 0.15)',
  placeholderMuted: 'rgba(65, 41, 80, 0.4)',
};

const MAX_CHARS = 500;

const FEEDBACK_TYPES = [
  { id: 'suggestion', label: 'Sugerencia' },
  { id: 'bug', label: 'Error' },
  { id: 'other', label: 'Otro' },
];

export default function ConfigFeedbackScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useFocusEffect(useCallback(() => {
    api.loadSession().then((session) => {
      if (!session?.user?.id) {
        Alert.alert(
          'Sesión expirada',
          'Vuelve a iniciar sesión para enviar tu opinión.',
          [{ text: 'Aceptar', onPress: () => navigation.goBack() }],
        );
      }
    }).catch(() => {});
  }, [navigation]));

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Atención', 'Por favor, escribe un mensaje antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await settingsApi.submitFeedback({ type: selectedType, message: message.trim() });
      if (res?.error) {
        Alert.alert('Error', 'No se pudo enviar el feedback. Inténtalo de nuevo.');
        return;
      }
      setMessage('');
      setSelectedType('suggestion');
      setShowModal(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = message.trim().length > 0 && !isSubmitting;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />
      <KeyboardAvoidingView
        style={styles.kbContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <AppHeader
          title="Tu opinión"
          subtitle="Cuéntanos qué mejorarías. Lo leemos todo."
          onBack={() => navigation.goBack()}
        />

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          // iOS: sin esto el primer toque con el teclado abierto solo lo cierra
          // (hay que pulsar dos veces el botón) y el multiline no tiene forma de
          // ocultar el teclado.
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          {/* ── Tipo ──────────────────────────────────────────────────── */}
          <Text style={styles.sectionLabel}>TIPO</Text>
          <View style={styles.segmentedRow}>
            {FEEDBACK_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[styles.segmentButton, isSelected && styles.segmentButtonActive]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Tipo ${type.label}`}
                >
                  <Text style={[styles.segmentText, isSelected && styles.segmentTextActive]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* ── Mensaje ───────────────────────────────────────────────── */}
          <TextInput
            style={styles.textarea}
            placeholder="Escribe aquí tu mensaje..."
            placeholderTextColor={FIGMA.placeholderMuted}
            value={message}
            onChangeText={setMessage}
            multiline
            textAlignVertical="top"
            maxLength={MAX_CHARS}
          />
          <Text style={[
            styles.charCount,
            message.length > MAX_CHARS * 0.8 && { color: message.length >= MAX_CHARS ? colors.statRed : colors.accentOrange },
          ]}>
            {message.length}/{MAX_CHARS}
          </Text>

          {/* ── Botón enviar ──────────────────────────────────────────── */}
          <TouchableOpacity
            style={[styles.ctaButton, !canSubmit && styles.ctaButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
            activeOpacity={0.85}
            accessibilityLabel="Enviar feedback"
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Text style={styles.ctaButtonText}>Enviar feedback</Text>
            )}
          </TouchableOpacity>
        </ScrollView>

        <FeedbackSuccessModal
          visible={showModal}
          onClose={() => {
            setShowModal(false);
            navigation.goBack();
          }}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
  },
  kbContainer: {
    flex: 1,
  },

  // ── Contenido ─────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: spacing.sm + 4,
  },

  // ── Tipo ──────────────────────────────────────────────────────
  segmentedRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: spacing.md,
  },
  segmentButton: {
    borderWidth: 1,
    borderColor: FIGMA.segmentBorder,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  segmentButtonActive: {
    borderColor: colors.purple,
  },
  segmentText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: FIGMA.textMuted,
  },
  segmentTextActive: {
    color: colors.purple,
  },

  // ── Mensaje ───────────────────────────────────────────────────
  textarea: {
    borderWidth: 1,
    borderColor: FIGMA.textareaBorder,
    borderRadius: 10.7,
    padding: 14,
    minHeight: 140,
    fontFamily: 'Poppins-Regular',
    fontSize: 12.5,
    color: colors.textDark,
  },
  charCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 6,
  },

  // ── Botón enviar ──────────────────────────────────────────────
  ctaButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  ctaButtonDisabled: {
    opacity: 0.5,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
