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

// Ruta exacta exportada de Figma (icono "Feedback enviado", 156×133).
function PaperPlaneIcon({ size = 40, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size * (133 / 156)} viewBox="0 0 156 133" fill="none">
      <Path d="M146.127 3.75029H8.76762C7.65484 3.72986 6.56682 4.08009 5.67455 4.74592C4.78228 5.41175 4.13633 6.35545 3.83823 7.42871C3.54013 8.50196 3.60677 9.64393 4.02768 10.6752C4.44859 11.7064 5.19991 12.5684 6.16356 13.1257L70.6468 53.9464L94.6266 125.8C94.9524 126.806 95.5884 127.684 96.4433 128.306C97.2982 128.928 98.3281 129.263 99.3851 129.263C100.442 129.263 101.472 128.928 102.327 128.306C103.182 127.684 103.818 126.806 104.144 125.8L151.747 12.3382C152.176 11.4059 152.361 10.3799 152.285 9.35636C152.209 8.33286 151.874 7.34549 151.313 6.48695C150.751 5.62841 149.98 4.92686 149.073 4.44817C148.166 3.96947 147.152 3.72933 146.127 3.75029Z" stroke={color} strokeWidth={8} strokeMiterlimit={10} />
      <Path d="M70.647 53.9464L151.335 6.61914" stroke={color} strokeWidth={8} strokeMiterlimit={10} />
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
