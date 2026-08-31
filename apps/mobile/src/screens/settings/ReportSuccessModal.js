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

// ─── 12.11 · Informe generado ───────────────────────────────────────────────
// Fiel al Figma (ConfiguracionModalesScreen.tsx → InformeGeneradoModal). Se
// mantiene el contrato de props ya cableado en ConfigExportScreen ({visible,
// periodLabel, onShare, onSave, onClose}) — periodLabel es funcionalidad real
// (Figma solo confirma un único ejemplo estático "del trimestre") y se
// conserva dinámico, adaptando la frase confirmada por Figma a cada periodo.
const FIGMA = {
  overlay: 'rgba(0, 0, 0, 0.55)',
};

function CheckIcon({ size = 40, color = colors.ctaGreen }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Z" stroke={color} strokeWidth={1.6} fill="none" />
      <Path d="M7.5 12.5L10.5 15.5L16.5 9" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export default function ReportSuccessModal({ visible, periodLabel, onShare, onSave, onClose }) {
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
            <CheckIcon />
            <Text style={styles.title}>Informe listo</Text>
            <Text style={styles.subtitle}>
              Tu PDF de rendimiento{periodLabel ? ` de ${periodLabel.toLowerCase()}` : ''} se ha generado.
            </Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={onShare}
              activeOpacity={0.85}
              accessibilityLabel="Compartir informe PDF"
            >
              <Text style={styles.primaryButtonText}>Compartir</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryLinkMuted}
              onPress={onSave}
              activeOpacity={0.7}
              accessibilityLabel="Guardar informe en el móvil"
            >
              <Text style={styles.secondaryLinkMutedText}>Guardar en el móvil</Text>
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
  secondaryLinkMuted: {
    marginTop: 14,
    paddingVertical: 6,
  },
  secondaryLinkMutedText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: 'rgba(65, 41, 80, 0.5)',
  },
});
