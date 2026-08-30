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
import { Ionicons } from '@expo/vector-icons';
import FeedbackSuccessModal from './FeedbackSuccessModal';
import { settingsApi } from '../../api';

const MAX_CHARS = 500;

const COLORS = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#1E293B',
  secondaryText: '#64748B',
  border: '#E2E8F0',
  accentBlue: '#3B82F6',
  accentYellow: '#F59E0B',
  accentPurple: '#8B5CF6',
  danger: '#FF3B30',
};

const FEEDBACK_TYPES = [
  { id: 'suggestion', label: 'Sugerencia', icon: 'bulb', color: COLORS.accentYellow },
  { id: 'bug', label: 'Error', icon: 'bug', color: COLORS.danger },
  { id: 'other', label: 'Otro', icon: 'chatbubble-ellipses', color: COLORS.accentPurple },
];

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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />
      <KeyboardAvoidingView
        style={styles.kbContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={24} color={COLORS.primaryText} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Tu opinión</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.intro}>
          <Text style={styles.introText}>¿Qué mejorarías en OPOX?</Text>
          <Text style={styles.introSubtext}>Cuéntanos qué mejorarías. Lo leemos todo.</Text>
        </View>

        {/* TIPO DE FEEDBACK */}
        <Text style={styles.sectionTitle}>TIPO</Text>
        <View style={styles.card}>
          <View style={styles.typeGrid}>
            {FEEDBACK_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.typeOption,
                    isSelected
                      ? { backgroundColor: type.color, borderColor: type.color }
                      : styles.typeOptionInactive,
                  ]}
                  onPress={() => setSelectedType(type.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Tipo ${type.label}`}
                >
                  <Ionicons
                    name={type.icon}
                    size={20}
                    color={isSelected ? '#FFFFFF' : COLORS.secondaryText}
                  />
                  <Text style={[
                    styles.typeLabel,
                    { color: isSelected ? '#FFFFFF' : COLORS.secondaryText },
                    isSelected && styles.typeLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* MENSAJE */}
        <Text style={styles.sectionTitle}>MENSAJE</Text>
        <View style={styles.card}>
          <TextInput
            style={styles.textInput}
            placeholder="Escribe aquí tu mensaje..."
            placeholderTextColor={COLORS.secondaryText}
            value={message}
            onChangeText={setMessage}
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={MAX_CHARS}
          />
          <Text style={[
            styles.charCount,
            message.length > MAX_CHARS * 0.8 && { color: message.length >= MAX_CHARS ? COLORS.danger : '#F59E0B' },
          ]}>
            {message.length}/{MAX_CHARS}
          </Text>
        </View>

        {/* BOTÓN ENVIAR */}
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit}
          activeOpacity={0.85}
          accessibilityLabel="Enviar feedback"
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="paper-plane" size={20} color="#FFFFFF" />
              <Text style={styles.submitText}>Enviar feedback</Text>
            </>
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
  container: { flex: 1, backgroundColor: COLORS.background },
  kbContainer: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerBack: { padding: 8 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryText,
  },
  headerRight: { width: 40 },

  // Scroll
  scroll: { paddingBottom: 40 },

  // Intro
  intro: {
    marginHorizontal: 16,
    marginTop: 20,
    marginBottom: 4,
  },
  introText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryText,
    marginBottom: 4,
  },
  introSubtext: {
    fontSize: 14,
    color: COLORS.secondaryText,
    lineHeight: 20,
  },

  // Sección
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondaryText,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Tipo
  typeGrid: { flexDirection: 'row', gap: 10 },
  typeOption: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 6,
  },
  typeOptionInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: COLORS.border,
  },
  typeLabel: { fontSize: 13, fontWeight: '500' },
  typeLabelSelected: { fontWeight: '700' },

  // Texto
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
    minHeight: 100,
    fontSize: 15,
    color: COLORS.primaryText,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  charCount: {
    textAlign: 'right',
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 6,
  },

  // Botón enviar
  submitButton: {
    backgroundColor: COLORS.accentBlue,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginHorizontal: 16,
    shadowColor: COLORS.accentBlue,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  submitButtonDisabled: { opacity: 0.5 },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
