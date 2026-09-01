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
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../../theme';

// ─── 12.8 · Ayuda y soporte ─────────────────────────────────────────────────
// Fiel al Figma (AyudaScreen.tsx) para buscador, FAQ y botón de chat.
//
// ⚠️ El propio TSX de referencia documenta un hallazgo grave: el título y
// subtítulo que trae la capa "AYUDA" en Figma son texto idéntico, carácter
// por carácter, al de "EXPORTAR INFORME" ("Exportar informe" / "Genera un
// PDF..."), es decir, no son contenido real de esta pantalla — un copy-paste
// sin actualizar. No se propaga ese error aquí. Se usa "Ayuda y soporte"
// como título porque es el mismo texto ya usado para esta pantalla en el
// menú de SettingsScreen (real, no inventado); el subtítulo se omite por
// completo en vez de inventar uno, ya que Figma no confirma ningún texto
// válido para él.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  searchBorder: 'rgba(65, 41, 80, 0.15)',
  separator: 'rgba(65, 41, 80, 0.12)',
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

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronDownIcon({ size = 18, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 9L12 16L19 9" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function SearchIcon({ size = 18, color = FIGMA.textMuted }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={10.5} cy={10.5} r={6.5} stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M20 20L15 15" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

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
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

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
        <Text style={styles.headerTitle}>Ayuda y soporte</Text>
        <View style={styles.iconButton} />
      </View>

      <KeyboardAvoidingView
        style={styles.kbContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* ── Buscador ──────────────────────────────────────────────── */}
          <View style={styles.searchBar}>
            <SearchIcon />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar en la ayuda..."
              placeholderTextColor={FIGMA.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                accessibilityLabel="Limpiar búsqueda"
              >
                <Ionicons name="close-circle" size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {/* ── FAQ o estado vacío ────────────────────────────────────── */}
          {filteredFaqs.length > 0 ? (
            <>
              <Text style={styles.sectionLabel}>PREGUNTAS FRECUENTES</Text>
              {filteredFaqs.map((faq, index) => {
                const isExpanded = expandedFaq === faq.id;
                return (
                  <TouchableOpacity
                    key={faq.id}
                    style={[styles.faqRow, index > 0 && styles.faqRowBorder]}
                    onPress={() => toggleFaq(faq.id)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${faq.question} ${isExpanded ? 'expandido' : 'colapsado'}`}
                  >
                    <View style={styles.faqHeaderRow}>
                      <Text style={styles.faqText}>{faq.question}</Text>
                      {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
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
              <Ionicons name="search-outline" size={44} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Sin resultados para "{searchQuery}"</Text>
              <Text style={styles.emptySubtitle}>
                Prueba con otras palabras clave o contacta con soporte.
              </Text>
            </View>
          )}

          {/* ── Botón chat ────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={handleChatSupport}
            activeOpacity={0.85}
            accessibilityLabel="Abrir chat con soporte"
          >
            <Text style={styles.ctaButtonText}>Chat con soporte</Text>
          </TouchableOpacity>
        </ScrollView>
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
  headerTitle: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 21.3,
    color: colors.textDark,
    textAlign: 'center',
  },

  // ── Contenido ─────────────────────────────────────────────────
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: FIGMA.searchBorder,
    borderRadius: 10.7,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textDark,
    padding: 0,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 4,
  },

  // ── FAQ ───────────────────────────────────────────────────────
  faqRow: {
    paddingVertical: 16,
  },
  faqRowBorder: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  faqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqText: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13.5,
    color: colors.textDark,
    marginRight: 12,
  },
  faqAnswer: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginTop: 10,
  },

  // ── Vacío ─────────────────────────────────────────────────────
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
  },
  emptyTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 19,
  },

  // ── Botón chat ────────────────────────────────────────────────
  ctaButton: {
    height: 61.3,
    borderRadius: 14.2,
    backgroundColor: colors.purple,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  ctaButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.white,
  },
});
