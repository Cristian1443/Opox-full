import React, { useState } from 'react';
import {
  View,
  Text,
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import FeedbackSuccessModal from './FeedbackSuccessModal';

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

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ConfigFeedbackScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState('suggestion');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleSubmit = async () => {
    if (!message.trim()) {
      Alert.alert('Atención', 'Por favor, escribe un mensaje antes de enviar.');
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: POST /config/feedback — body: { type: selectedType, message }
      await new Promise((resolve) => setTimeout(resolve, 1500));
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
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.iconButton}
            activeOpacity={0.7}
            onPress={() => navigation.goBack()}
            accessibilityLabel="Volver"
          >
            <ChevronLeftIcon />
          </TouchableOpacity>
          <View style={styles.headerTitles}>
            <Text style={styles.headerTitle}>Tu opinión</Text>
            <Text style={styles.headerSubtitle}>Cuéntanos qué mejorarías. Lo leemos todo.</Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

  // ── Header ────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
  },
  headerSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },

  // ── Contenido ─────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
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
