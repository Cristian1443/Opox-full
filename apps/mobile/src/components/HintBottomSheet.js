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
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { colors, spacing } from '../theme';

const SHEET_OFFSET = 520;

// Ícono burbuja con "?" y tres puntos (esquina superior derecha del sheet)
function IconChatQuestion() {
  return (
    <Svg width={54} height={54} viewBox="0 0 54 54" fill="none">
      {/* Burbuja principal con ? */}
      <Path
        d="M6 10 a6 6 0 0 1 6 -6 h30 a6 6 0 0 1 6 6 v18 a6 6 0 0 1 -6 6 h-10 l-6 6 l0 -6 h-14 a6 6 0 0 1 -6 -6 z"
        stroke={colors.dark}
        strokeWidth={2}
        fill="#FFFFFF"
        strokeLinejoin="round"
      />
      <Path
        d="M23 14 a4 4 0 1 1 4 4 v3"
        stroke={colors.dark}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx={27} cy={26} r={1.4} fill={colors.dark} />
      {/* Tres puntos morados */}
      <Circle cx={20} cy={19} r={1.5} fill={colors.purple} />
      <Circle cx={27} cy={19} r={1.5} fill={colors.purple} />
      <Circle cx={34} cy={19} r={1.5} fill={colors.purple} />
    </Svg>
  );
}

/**
 * Bottom sheet de pista IA (mockup PISTA IA).
 * Card blanca con icono burbuja+? en esquina, título, texto de pista,
 * línea morada y CTA morado "Entendido, sigo".
 */
export default function HintBottomSheet({ visible, hint, isLoading = false, onClose }) {
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
            style={styles.body}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.headerRow}>
              <Text style={styles.title}>Pista del tutor IA</Text>
              <View style={styles.headerIcon}>
                <IconChatQuestion />
              </View>
            </View>

            {isLoading ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.purple} />
              </View>
            ) : (
              <Text style={styles.hintText}>{hint}</Text>
            )}

            <Text style={styles.disclaimer}>
              La IA te guía sin revelar la respuesta correcta.
            </Text>
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

  body: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '800',
    color: colors.dark,
    marginTop: 6,
  },
  headerIcon: { marginLeft: spacing.md },

  hintText: {
    fontSize: 14,
    lineHeight: 21,
    color: colors.dark,
    marginBottom: spacing.md,
  },

  disclaimer: {
    fontSize: 13,
    color: colors.purple,
    fontWeight: '600',
    marginBottom: spacing.lg,
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
