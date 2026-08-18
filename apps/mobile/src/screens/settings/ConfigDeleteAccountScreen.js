import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api';

const { width } = Dimensions.get('window');

const COLORS = {
  background: '#F8FAFC',
  card: '#FFFFFF',
  primaryText: '#1E293B',
  secondaryText: '#64748B',
  border: '#E2E8F0',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  warningBg: '#FFF7ED',
  warningText: '#C2410C',
  warningBodyText: '#9A3412',
  accentBlue: '#3B82F6',
};

function resetToSplash(navigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

export default function ConfigDeleteAccountScreen({ navigation }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openConfirmModal = () => {
    setShowConfirmModal(true);
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
        duration: 250,
      }),
    ]).start();
  };

  const closeConfirmModal = () => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        useNativeDriver: true,
        duration: 200,
      }),
    ]).start(() => setShowConfirmModal(false));
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Seguro que quieres cerrar sesión? Tu progreso se guardará.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          onPress: async () => {
            await authApi.logout();
            resetToSplash(navigation);
          },
        },
      ],
    );
  };

  const handleConfirmDelete = async () => {
    // TODO: DELETE /auth/account — eliminar usuario en Supabase + datos asociados
    await authApi.deleteAccount();
    closeConfirmModal();
    resetToSplash(navigation);
  };

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
        <Text style={styles.headerTitle}>Eliminar cuenta</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* ADVERTENCIA */}
        <View style={styles.warningBox}>
          <View style={styles.warningTitleRow}>
            <Ionicons name="warning-outline" size={18} color={COLORS.warningText} />
            <Text style={styles.warningTitle}>Atención: Esta acción es irreversible</Text>
          </View>
          <Text style={styles.warningText}>
            Al eliminar tu cuenta, perderás todo tu progreso, Opopoints y tu racha de estudio.
            Esta acción no se puede deshacer.
          </Text>
        </View>

        {/* ACCIONES */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Acciones</Text>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <View style={styles.actionTexts}>
              <Text style={styles.actionLabel}>Cerrar sesión</Text>
              <Text style={styles.actionSubtext}>Solo sal de la app, no borramos tus datos</Text>
            </View>
            <Ionicons name="log-out-outline" size={20} color={COLORS.secondaryText} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, styles.lastRow]}
            onPress={openConfirmModal}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar cuenta permanentemente"
          >
            <View style={styles.actionTexts}>
              <Text style={[styles.actionLabel, { color: COLORS.danger }]}>Eliminar cuenta</Text>
              <Text style={[styles.actionSubtext, { color: COLORS.danger }]}>Borrar todo permanentemente</Text>
            </View>
            <Ionicons name="trash-outline" size={20} color={COLORS.danger} />
          </TouchableOpacity>
        </View>

        {/* SOPORTE */}
        <TouchableOpacity
          style={styles.supportLink}
          onPress={() => navigation.navigate('ConfigHelp')}
          activeOpacity={0.7}
        >
          <Text style={styles.supportText}>
            ¿Tienes dudas antes de eliminar tu cuenta?{'\n'}
            <Text style={styles.supportLinkText}>Contacta con soporte</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>

      {/* MODAL CONFIRMACIÓN DESTRUCTIVA */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="none"
        onRequestClose={closeConfirmModal}
      >
        <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
          <Animated.View
            style={[styles.modalContent, { transform: [{ translateY: slideAnim }] }]}
          >
            <View style={styles.modalIcon}>
              <Ionicons name="close-circle" size={32} color={COLORS.danger} />
            </View>

            <Text style={styles.modalTitle}>¿Eliminar definitivamente?</Text>
            <Text style={styles.modalDescription}>
              Perderás tu progreso, Opopoints y racha. Esta acción es irreversible.
              ¿Estás seguro de que quieres continuar?
            </Text>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={closeConfirmModal}
                activeOpacity={0.7}
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.modalButtonTextCancel}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={handleConfirmDelete}
                activeOpacity={0.85}
                accessibilityLabel="Confirmar eliminación de cuenta"
              >
                <Text style={styles.modalButtonTextConfirm}>Eliminar definitivamente</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

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

  // Advertencia
  warningBox: {
    marginHorizontal: 16,
    marginTop: 24,
    backgroundColor: COLORS.warningBg,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warningText,
  },
  warningTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.warningText,
    flex: 1,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.warningBodyText,
    lineHeight: 18,
  },

  // Card
  card: {
    backgroundColor: COLORS.card,
    marginHorizontal: 16,
    marginTop: 24,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginBottom: 16,
  },

  // Filas de acción
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  lastRow: { borderBottomWidth: 0 },
  actionTexts: { flex: 1, marginRight: 12 },
  actionLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.primaryText,
  },
  actionSubtext: {
    fontSize: 12,
    color: COLORS.secondaryText,
    marginTop: 4,
  },

  // Enlace soporte
  supportLink: {
    marginHorizontal: 16,
    marginTop: 20,
    alignItems: 'center',
  },
  supportText: {
    fontSize: 13,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 20,
  },
  supportLinkText: {
    color: COLORS.accentBlue,
    fontWeight: '600',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
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
  },
  modalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.dangerBg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.primaryText,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalDescription: {
    fontSize: 15,
    color: COLORS.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    marginHorizontal: 4,
  },
  modalButtons: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  modalButtonTextCancel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primaryText,
  },
  modalButtonConfirm: {
    backgroundColor: COLORS.danger,
  },
  modalButtonTextConfirm: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
