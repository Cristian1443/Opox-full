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
};

export default function FeedbackSuccessModal({ visible, onClose }) {
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
          <TouchableOpacity style={styles.card} activeOpacity={1}>
            <View style={styles.iconContainer}>
              <Ionicons name="chatbubble-ellipses" size={32} color={COLORS.success} />
            </View>

            <Text style={styles.title}>¡Recibido!</Text>
            <Text style={styles.description}>
              Gracias por ayudarnos a mejorar OPOX. Revisamos todo lo que llega.
            </Text>

            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.85}
              accessibilityLabel="Cerrar"
            >
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
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primaryText,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    marginHorizontal: 8,
  },
  closeButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  closeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
