import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const COLORS = {
  card: '#FFFFFF',
  primaryText: '#1E293B',
  secondaryText: '#64748B',
  success: '#10B981',
  successBg: '#ECFDF5',
  border: '#E2E8F0',
  overlay: 'rgba(0, 0, 0, 0.5)',
  buttonPrimary: '#3B82F6',
  buttonText: '#FFFFFF',
};

export default function ReportSuccessModal({ visible, periodLabel, onShare, onSave, onClose }) {
  const slideAnim = useRef(new Animated.Value(height * 0.2)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          useNativeDriver: true,
          duration: 300,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: height * 0.2,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          useNativeDriver: true,
          duration: 200,
        }),
      ]).start();
    }
  }, [visible]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
          {/* TouchableOpacity sin onPress — captura el toque y evita que cierre el overlay */}
          <TouchableOpacity style={styles.card} activeOpacity={1}>
            <View style={styles.iconContainer}>
              <Ionicons name="checkmark-circle" size={36} color={COLORS.success} />
            </View>

            <Text style={styles.title}>Informe listo</Text>
            <Text style={styles.description}>
              Tu PDF de rendimiento
              {periodLabel ? ` de ${periodLabel.toLowerCase()}` : ''} se ha generado correctamente.
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={onShare}
                activeOpacity={0.85}
                accessibilityLabel="Compartir informe PDF"
              >
                <Ionicons name="share-outline" size={18} color="#FFFFFF" />
                <Text style={styles.btnText}>Compartir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onSave}
                activeOpacity={0.7}
                accessibilityLabel="Guardar informe en el móvil"
              >
                <Ionicons name="download-outline" size={18} color={COLORS.primaryText} />
                <Text style={styles.btnTextSecondary}>Guardar en el móvil</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} accessibilityLabel="Cerrar">
              <Text style={styles.closeText}>Cerrar</Text>
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
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.successBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    marginHorizontal: 8,
  },
  actions: {
    width: '100%',
    gap: 12,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    borderWidth: 1,
  },
  btnPrimary: {
    backgroundColor: COLORS.buttonPrimary,
    borderColor: COLORS.buttonPrimary,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderColor: COLORS.border,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.buttonText,
  },
  btnTextSecondary: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryText,
  },
  closeBtn: {
    marginTop: 12,
    paddingVertical: 10,
  },
  closeText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.secondaryText,
  },
});
