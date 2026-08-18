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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#1E293B',
  secondaryText: '#64748B',
  border: '#E2E8F0',
  accentBlue: '#3B82F6',
  accentPurple: '#8B5CF6',
};

const FAQS = [
  {
    id: '1',
    question: '¿Cómo gano Opopoints?',
    answer: 'Ganas Opopoints completando tests diarios, manteniendo rachas de estudio y superando exámenes simulados. Cada 100 puntos te acercas a un premio.',
  },
  {
    id: '2',
    question: '¿Cómo conecto mi smartwatch?',
    answer: 'Ve a Configuración > Dispositivos conectados. Selecciona tu marca (Apple Watch o Garmin) y sigue las instrucciones en pantalla para sincronizar.',
  },
  {
    id: '3',
    question: '¿Cómo funciona el Monitor BOE?',
    answer: 'El Monitor BOE te avisa automáticamente cuando se publican nuevas leyes o modificaciones en el Boletín Oficial del Estado relacionadas con tu oposición.',
  },
  {
    id: '4',
    question: '¿Puedo cambiar mi plan de suscripción?',
    answer: 'Sí, puedes cambiar o cancelar tu suscripción en cualquier momento desde la sección "Mi suscripción" en Configuración.',
  },
];

export default function ConfigHelpScreen({ navigation }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFaq, setExpandedFaq] = useState(null);

  const toggleFaq = (id) => {
    setExpandedFaq(expandedFaq === id ? null : id);
  };

  const handleChatSupport = () => {
    // TODO: integrar canal de soporte real (Intercom, Crisp, etc.)
    Alert.alert(
      'Chat con Soporte',
      'Conectando con un agente de soporte...',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Abrir Chat', onPress: () => {} },
      ],
    );
  };

  const filteredFaqs = FAQS.filter(
    (faq) =>
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.card} />

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
        <Text style={styles.headerTitle}>Ayuda</Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.kbContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* BARRA DE BÚSQUEDA */}
        <View style={styles.searchContainer}>
          <View style={styles.searchIconWrap} pointerEvents="none">
            <Ionicons name="search-outline" size={20} color={COLORS.secondaryText} />
          </View>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar en la ayuda..."
            placeholderTextColor={COLORS.secondaryText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearIconWrap}
              onPress={() => setSearchQuery('')}
              accessibilityLabel="Limpiar búsqueda"
            >
              <Ionicons name="close-circle" size={20} color={COLORS.secondaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* FAQs o estado vacío */}
        {filteredFaqs.length > 0 ? (
          <>
            <View style={styles.sectionTitleRow}>
              <Ionicons name="help-circle" size={18} color={COLORS.accentBlue} />
              <Text style={styles.sectionTitle}>Preguntas Frecuentes</Text>
            </View>

            {filteredFaqs.map((faq) => {
              const isExpanded = expandedFaq === faq.id;
              return (
                <TouchableOpacity
                  key={faq.id}
                  style={styles.faqCard}
                  onPress={() => toggleFaq(faq.id)}
                  activeOpacity={0.7}
                  accessibilityLabel={`${faq.question} ${isExpanded ? 'expandido' : 'colapsado'}`}
                >
                  <View style={styles.faqHeader}>
                    <Text style={styles.faqQuestion}>{faq.question}</Text>
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={20}
                      color={COLORS.secondaryText}
                    />
                  </View>
                  {isExpanded && (
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={48} color={COLORS.secondaryText} />
            <Text style={styles.emptyTitle}>
              Sin resultados para "{searchQuery}"
            </Text>
            <Text style={styles.emptySubtitle}>
              Prueba con otras palabras clave o contacta con soporte.
            </Text>
          </View>
        )}

        {/* BOTÓN CHAT */}
        <TouchableOpacity
          style={styles.chatButton}
          onPress={handleChatSupport}
          activeOpacity={0.85}
          accessibilityLabel="Abrir chat con soporte"
        >
          <Ionicons name="chatbubbles-outline" size={24} color="#FFFFFF" />
          <View>
            <Text style={styles.chatButtonText}>Chat con soporte</Text>
            <Text style={styles.chatSubtext}>Respuesta en minutos</Text>
          </View>
        </TouchableOpacity>

      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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

  // Búsqueda
  searchContainer: {
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  searchIconWrap: {
    position: 'absolute',
    left: 14,
    top: 14,
    zIndex: 1,
  },
  clearIconWrap: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 44,
    fontSize: 16,
    color: COLORS.primaryText,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },

  // Sección
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
  },

  // FAQ cards
  faqCard: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 10,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primaryText,
    marginRight: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: COLORS.secondaryText,
    lineHeight: 20,
    marginTop: 10,
  },

  // Estado vacío
  emptyState: {
    marginHorizontal: 16,
    marginTop: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    color: COLORS.secondaryText,
    marginTop: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.secondaryText,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },

  // Botón chat
  chatButton: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: COLORS.accentPurple,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: COLORS.accentPurple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  chatButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  chatSubtext: {
    fontSize: 12,
    color: '#E0E7FF',
    marginTop: 2,
  },
});
