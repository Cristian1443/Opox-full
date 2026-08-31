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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import { authApi } from '../../api';

// ─── 12.3 (pantalla) + 12.12 (modal) · Eliminar cuenta ──────────────────────
// El TSX de referencia (ConfiguracionModalesScreen.tsx → EliminarCuentaModal)
// solo captura el modal de confirmación — no la pantalla completa. La pantalla
// real (banner de aviso, tarjeta de Acciones con Cerrar sesión/Eliminar
// cuenta, enlace de soporte) es funcionalidad real sin captura propia en
// Figma; se conserva íntegra y se reestiliza con el mismo lenguaje visual
// (Poppins, colors.*) del resto del bloque 12. El modal se reconcilia con el
// texto confirmado por Figma: título "¿Eliminar tu cuenta?" (real decía
// "¿Eliminar definitivamente?"), subtítulo sin la frase final "¿Estás seguro
// de que quieres continuar?" (no confirmada por Figma), botón secundario
// como enlace de texto plano (no botón con caja) y el ícono de papelera en
// vez del círculo con "X". La lógica real (animación slide+fade,
// authApi.logout/deleteAccount, resetToSplash) se conserva íntegra.
const FIGMA = {
  overlay: 'rgba(0, 0, 0, 0.55)',
  textMuted: 'rgba(65, 41, 80, 0.7)',
  separator: 'rgba(65, 41, 80, 0.12)',
  warningBg: 'rgba(246, 150, 36, 0.1)',
  warningBorder: 'rgba(246, 150, 36, 0.3)',
};

function resetToSplash(navigation) {
  navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function WarningIcon({ size = 22, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3L22 20H2L12 3Z" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
      <Path d="M12 9.5V14" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M12 17.2V17.3" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

function LogoutIcon({ size = 22, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M16 17L21 12L16 7" stroke={color} strokeWidth={1.8} fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M21 12H9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

function TrashIcon({ size = 40, color = colors.statRed }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 7H20" stroke={color} strokeWidth={1.6} strokeLinecap="round" />
      <Path d="M9 7V4.5A1.5 1.5 0 0 1 10.5 3H13.5A1.5 1.5 0 0 1 15 4.5V7" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
      <Path d="M6.5 7L7.3 19.5A2 2 0 0 0 9.3 21.3H14.7A2 2 0 0 0 16.7 19.5L17.5 7" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
      <Path d="M10 11V17" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path d="M14 11V17" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
    </Svg>
  );
}

export default function ConfigDeleteAccountScreen({ navigation }) {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const openConfirmModal = () => {
    setShowConfirmModal(true);
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 1, useNativeDriver: true, duration: 300 }),
    ]).start();
  };

  const closeConfirmModal = () => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 300, useNativeDriver: true, tension: 50, friction: 7 }),
      Animated.timing(fadeAnim, { toValue: 0, useNativeDriver: true, duration: 200 }),
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
        <Text style={styles.headerTitle}>Eliminar cuenta</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Aviso ─────────────────────────────────────────────────────── */}
        <View style={styles.warningBox}>
          <WarningIcon />
          <View style={styles.warningTextWrap}>
            <Text style={styles.warningTitle}>Atención: esta acción es irreversible</Text>
            <Text style={styles.warningBody}>
              Al eliminar tu cuenta perderás tu progreso, Opopoints, racha y todos tus datos de forma permanente.
            </Text>
          </View>
        </View>

        {/* ── Acciones ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACCIONES</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleLogout}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar sesión"
          >
            <LogoutIcon />
            <Text style={styles.rowLabel}>Cerrar sesión</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={openConfirmModal}
            activeOpacity={0.7}
            accessibilityLabel="Eliminar cuenta"
          >
            <TrashIcon size={22} />
            <Text style={[styles.rowLabel, styles.rowLabelDanger]}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>

        {/* ── Soporte ───────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={styles.supportLink}
          onPress={() => navigation.navigate('ConfigHelp')}
          activeOpacity={0.7}
          accessibilityLabel="Contactar con soporte"
        >
          <Text style={styles.supportLinkText}>¿Tienes dudas? Contacta con soporte</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Modal de confirmación ────────────────────────────────────── */}
      <Modal visible={showConfirmModal} transparent animationType="none" onRequestClose={closeConfirmModal}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={closeConfirmModal}>
          <Animated.View style={{ transform: [{ translateY: slideAnim }], opacity: fadeAnim }}>
            <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
              <TrashIcon />
              <Text style={styles.modalTitle}>¿Eliminar tu cuenta?</Text>
              <Text style={styles.modalSubtitle}>
                Perderás tu progreso, Opopoints y racha. Esta acción es irreversible.
              </Text>

              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleConfirmDelete}
                activeOpacity={0.85}
                accessibilityLabel="Eliminar definitivamente"
              >
                <Text style={styles.dangerButtonText}>Eliminar definitivamente</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryLink}
                onPress={closeConfirmModal}
                activeOpacity={0.7}
                accessibilityLabel="Cancelar"
              >
                <Text style={styles.secondaryLinkText}>Cancelar</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.white,
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

  // ── Aviso ─────────────────────────────────────────────────────
  warningBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: FIGMA.warningBg,
    borderWidth: 1,
    borderColor: FIGMA.warningBorder,
    borderRadius: 12,
    padding: 14,
    marginBottom: spacing.lg,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
    marginBottom: 4,
  },
  warningBody: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: FIGMA.textMuted,
    lineHeight: 18,
  },

  // ── Acciones ──────────────────────────────────────────────────
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: spacing.sm + 4,
  },
  card: {
    borderWidth: 1,
    borderColor: FIGMA.separator,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  rowLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowLabelDanger: {
    color: colors.statRed,
  },

  // ── Soporte ───────────────────────────────────────────────────
  supportLink: {
    alignItems: 'center',
    marginTop: spacing.lg,
    paddingVertical: 8,
  },
  supportLinkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12.5,
    color: colors.purple,
  },

  // ── Modal ─────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: FIGMA.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: 348,
    maxWidth: '88%',
    backgroundColor: colors.white,
    borderRadius: 14,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: colors.textDark,
    marginTop: 16,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: FIGMA.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
    marginBottom: 24,
  },
  dangerButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    backgroundColor: colors.statRed,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 15,
    color: colors.white,
  },
  secondaryLink: {
    marginTop: 14,
    paddingVertical: 6,
  },
  secondaryLinkText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: colors.textDark,
  },
});
