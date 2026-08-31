import React, { useEffect, useRef } from 'react';
import {
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

// ─── 12.10 · Feedback enviado ───────────────────────────────────────────────
// Fiel al Figma (ConfiguracionModalesScreen.tsx → FeedbackEnviadoModal). Se
// mantiene el contrato de props ya cableado en ConfigFeedbackScreen ({visible,
// onClose}) y la animación real de entrada/salida (slide + fade), solo se
// reestiliza el contenido.
const FIGMA = {
  overlay: 'rgba(0, 0, 0, 0.55)',
};

function PaperPlaneIcon({ size = 40, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M3 11L21 3L13 21L11 13L3 11Z"
        stroke={color}
        strokeWidth={1.6}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function FeedbackSuccessModal({ visible, onClose }) {
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(fadeAnim, { toValue: 1, useNativeDriver: true, duration: 300 }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 300, useNativeDriver: true, tension: 50, friction: 7 }),
        Animated.timing(fadeAnim, { toValue: 0, useNativeDriver: true, duration: 200 }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
          <TouchableOpacity style={styles.card} activeOpacity={1}>
            <PaperPlaneIcon />
            <Text style={styles.title}>¡Recibido!</Text>
            <Text style={styles.subtitle}>
              Gracias por ayudarnos a mejorar OPOX. Revisamos todo lo que llega.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityLabel="Cerrar"
            >
              <Text style={styles.primaryButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: FIGMA.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: 348,
    maxWidth: '88%',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: colors.textDark,
    marginTop: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: 'rgba(65, 41, 80, 0.7)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.ctaGreen,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.white,
  },
});
