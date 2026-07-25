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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../theme';

const SHEET_OFFSET = 520;

// Ícono balanza + libro morado (mockup REFERENCIA LEGISLATIVA)
function IconScalesBook() {
  return (
    <Svg width={56} height={56} viewBox="0 0 56 56" fill="none">
      {/* Libro */}
      <Path
        d="M8 40 v-24 a4 4 0 0 1 4 -4 h32 a4 4 0 0 1 4 4 v24"
        stroke={colors.dark}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
      />
      <Path d="M28 12 v28" stroke={colors.dark} strokeWidth={2} strokeLinecap="round" />
      {/* Balanza morada */}
      <Path d="M28 6 v6" stroke={colors.purple} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M16 12 h24" stroke={colors.purple} strokeWidth={2.2} strokeLinecap="round" />
      <Path d="M18 12 l-4 8 h8 z" stroke={colors.purple} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Path d="M38 12 l-4 8 h8 z" stroke={colors.purple} strokeWidth={2} fill="none" strokeLinejoin="round" />
      <Circle cx={28} cy={7} r={1.5} fill={colors.purple} />
    </Svg>
  );
}

/**
 * Bottom sheet de referencia legislativa (mockup REFERENCIA LEGISLATIVA).
 * Card blanca con título grande "Ley 39/2015 / Artículo 21", subtítulo,
 * icono balanza+libro morado a la derecha, cuerpo con cita en cursiva
 * y CTA morado "Entendido, sigo".
 */
export default function LawReferenceBottomSheet({
  visible,
  law,
  article,
  articleTitle,
  articleText,
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
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                {law && (
                  <Text style={styles.law}>{law}</Text>
                )}
                {article && (
                  <Text style={styles.article}>{article}</Text>
                )}
                {articleTitle && (
                  <Text style={styles.articleTitle}>{articleTitle}</Text>
                )}
              </View>
              <View style={styles.headerIcon}>
                <IconScalesBook />
              </View>
            </View>

            <Text style={styles.sectionTitle}>Referencia legislativa</Text>

            {articleText && (
              <Text style={styles.quote}>{articleText}</Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={styles.btn}
            onPress={handleClose}
            activeOpacity={0.82}
          >
            <Text style={styles.btnText}>Entendido, sigo</Text>
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

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  headerIcon: { marginLeft: spacing.md, marginTop: 4 },

  law: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark,
    lineHeight: 26,
  },
  article: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark,
    lineHeight: 26,
  },
  articleTitle: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.dark,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  quote: {
    fontSize: 13.5,
    lineHeight: 21,
    color: colors.dark,
    fontStyle: 'italic',
    marginBottom: spacing.md,
  },

  btn: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    backgroundColor: colors.purple,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
