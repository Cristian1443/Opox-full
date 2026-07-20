import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  ScrollView,
  Linking,
  PanResponder,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';

const SHEET_OFFSET = 520;

/**
 * Bottom sheet de referencia legislativa (7.3).
 * Muestra el artículo de ley relacionado con la pregunta activa.
 *
 * Misma arquitectura que HintBottomSheet:
 *   - Backdrop y sheet son hermanos (sin propagación de toques)
 *   - useRef para Animated.Value
 *   - useNativeDriver: true
 *   - Animación de salida completa antes de llamar onClose
 *   - useSafeAreaInsets para el fondo
 *
 * Props:
 *   visible       — boolean
 *   law           — nombre de la ley, ej. "Ley 39/2015"
 *   article       — número de artículo, ej. "Artículo 21"
 *   articleTitle  — título del artículo, ej. "Obligación de resolver"
 *   articleText   — texto literal del artículo (se muestra en cursiva como cita)
 *   boeUrl        — URL del artículo en el BOE (puede ser null si no está disponible)
 *   onClose       — callback al cerrar
 */
export default function LawReferenceBottomSheet({
  visible,
  law,
  article,
  articleTitle,
  articleText,
  boeUrl,
  onClose,
}) {
  const translateY = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (visible) {
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

  const handleOpenBoe = () => {
    if (!boeUrl) return;
    Linking.openURL(boeUrl).catch(() => {
      // Silenciar error de Linking — el usuario puede no tener navegador configurado
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
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity
            style={{ flex: 1 }}
            activeOpacity={1}
            onPress={handleClose}
            accessibilityLabel="Cerrar referencia legislativa"
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
            <View style={styles.iconBadge}>
              <Ionicons name="document-text" size={18} color={colors.dark} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.headerTitle}>Referencia legislativa</Text>
              {law && article && (
                <Text style={styles.headerSub}>{law} · {article}</Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="Cerrar referencia"
            >
              <Ionicons name="close" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Contenido */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Título del artículo */}
            {articleTitle && (
              <Text style={styles.articleTitle}>{articleTitle}</Text>
            )}

            {/* Bloque de cita legal */}
            {articleText && (
              <View style={styles.quoteBlock}>
                <Text style={styles.quoteText}>{articleText}</Text>
              </View>
            )}

            {/* Enlace al BOE */}
            {boeUrl && (
              <TouchableOpacity
                style={styles.boeLink}
                onPress={handleOpenBoe}
                accessibilityLabel="Abrir artículo completo en el BOE"
              >
                <Ionicons name="open-outline" size={15} color={colors.dark} />
                <Text style={styles.boeLinkText}>Ver artículo completo en BOE</Text>
              </TouchableOpacity>
            )}

            {/* Nota */}
            <View style={styles.footerNote}>
              <Ionicons name="information-circle-outline" size={13} color={colors.textSecondary} />
              <Text style={styles.footerText}>Consulta la norma sin salir del test.</Text>
            </View>
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={styles.btn}
            onPress={handleClose}
            activeOpacity={0.82}
            accessibilityLabel="Cerrar referencia y volver a la pregunta"
          >
            <Text style={styles.btnText}>Volver a la pregunta</Text>
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

  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
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

  // Header con fondo navy suave
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: '#E8EAF0',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13,27,42,0.10)',
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  headerTexts: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.dark,
    letterSpacing: 0.2,
  },
  headerSub: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 1,
  },
  closeBtn: {
    padding: spacing.xs,
  },

  // Scroll
  scrollContent: {
    padding: spacing.md,
    paddingTop: spacing.lg,
  },

  // Título del artículo
  articleTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.dark,
    textAlign: 'center',
    marginBottom: spacing.md,
    letterSpacing: -0.3,
  },

  // Bloque de cita
  quoteBlock: {
    backgroundColor: colors.grayLight,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.dark,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quoteText: {
    fontSize: 15,
    lineHeight: 25,
    color: colors.text,
    fontStyle: 'italic',
  },

  // Enlace BOE
  boeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  boeLinkText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.dark,
    textDecorationLine: 'underline',
  },

  // Nota
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  footerText: {
    fontSize: 12,
    color: colors.textSecondary,
  },

  // CTA
  btn: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.dark,
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
