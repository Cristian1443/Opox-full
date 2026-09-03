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

// Ruta exacta exportada de Figma (icono "Eliminar cuenta", 134×169 — papelera).
function TrashIcon({ size = 40, color = colors.statRed }) {
  return (
    <Svg width={size} height={size * (169 / 134)} viewBox="0 0 134 169" fill="none">
      <Path d="M133.996 33.3971C133.996 23.8737 127.9 17.7734 118.386 17.7516C110.923 17.7516 103.46 17.7036 96.001 17.7865C94.3726 17.7865 93.3885 17.3853 92.5177 15.9115C89.8355 11.3504 86.953 6.91138 84.2099 2.3939C83.2476 0.819754 82.0589 -2.04295e-05 80.1562 -2.04295e-05C71.3926 0.0523056 62.6277 0.0523056 53.8613 -2.04295e-05C53.0677 -0.0532855 52.2758 0.124143 51.5806 0.510928C50.8854 0.897712 50.3165 1.47738 49.9425 2.18023C47.2864 6.5887 44.4127 10.8664 41.8785 15.3446C40.7813 17.2807 39.5142 17.8344 37.3894 17.7996C29.861 17.6775 22.3239 17.6949 14.7912 17.769C6.33534 17.8475 0.108855 24.1092 0 32.4944C0 34.3084 0 36.1224 0.0217709 37.9364C0.0696669 40.5875 1.22788 41.7518 3.88829 41.8041C5.97394 41.8434 8.06395 41.8041 10.2497 41.8041C10.363 42.3623 10.4326 42.5672 10.4457 42.7765C11.3368 59.3639 12.2265 75.9498 13.1148 92.5342C14.4036 116.372 15.691 140.199 16.977 164.016C17.2034 168.206 17.9175 168.987 22.0017 168.987H112.412C115.926 168.987 116.836 168.036 117.019 164.482C117.768 150.067 118.532 135.654 119.313 121.244C120.434 100.459 121.557 79.6736 122.683 58.8886C122.993 53.2592 123.319 47.6341 123.65 41.8041C125.827 41.8041 127.856 41.8041 129.868 41.8041C132.824 41.7649 133.948 40.6529 133.991 37.7489C134.009 36.3012 133.996 34.8491 133.996 33.3971ZM54.793 7.17301C55.0238 6.81545 55.7902 6.65411 56.3083 6.64975C63.4666 6.61777 70.6234 6.61777 77.7788 6.64975C78.089 6.65615 78.3944 6.72733 78.6756 6.85873C78.9568 6.99013 79.2075 7.17885 79.4116 7.41283C81.519 10.6789 83.5219 14.0146 85.7644 17.66H48.2052C50.5085 13.9536 52.6072 10.5262 54.793 7.17301ZM110.479 162.272H23.5344C21.3718 122.225 19.2063 82.1184 17.0379 41.9524H116.966C114.804 82.0428 112.641 122.149 110.479 162.272ZM127.207 35.0671H6.96669C5.5211 29.3636 9.14379 24.4188 14.8391 24.4188C49.5477 24.3897 84.252 24.3897 118.952 24.4188C124.752 24.4188 127.969 28.5526 127.207 35.0671Z" fill={color} />
      <Path d="M63.719 142.309C64.1283 144.093 65.3432 145.091 67.1632 144.965C68.8483 144.847 69.9804 143.866 70.1589 142.078C70.2503 141.141 70.2634 140.195 70.2677 139.253C70.2677 127.282 70.2677 115.312 70.2677 103.344C70.2677 91.0822 70.2677 78.8219 70.2677 66.5631C70.2844 65.835 70.2524 65.1066 70.172 64.3828C69.9151 62.5166 68.7307 61.518 66.9324 61.5093C65.23 61.5093 64.0761 62.486 63.7103 64.1866C63.5937 64.9071 63.5543 65.638 63.5928 66.3669C63.5928 90.8874 63.5928 115.407 63.5928 139.924C63.5449 140.721 63.5873 141.522 63.719 142.309Z" fill={color} />
      <Path d="M91.7904 144.991C93.802 145.135 95.178 143.683 95.3086 141.206C96.4407 119.985 97.5641 98.764 98.6787 77.5429C98.8921 73.4876 99.1141 69.428 99.2535 65.3683C99.3362 63.1009 97.9821 61.5267 96.0662 61.4918C94.1504 61.457 92.7962 62.8523 92.6525 65.1852C92.6525 65.4032 92.6525 65.6212 92.6525 65.8393C91.9965 78.2958 91.3361 90.7552 90.6714 103.217C90.027 115.75 89.384 128.282 88.7425 140.814C88.5988 143.365 89.7526 144.847 91.7904 144.991Z" fill={color} />
      <Path d="M37.9206 129.699C38.1339 133.754 38.3211 137.814 38.6433 141.86C38.8088 143.905 40.2936 145.113 42.1267 144.991C43.9598 144.869 45.1746 143.461 45.2225 141.446C45.2225 140.94 45.2225 140.43 45.1746 139.924C44.5273 127.756 43.8771 115.587 43.2239 103.418C42.565 90.8134 41.9162 78.2086 41.2776 65.6039C41.1426 62.9875 39.7929 61.396 37.7943 61.4745C35.6651 61.5573 34.4764 63.3059 34.6201 66.0268C35.726 87.2508 36.8262 108.475 37.9206 129.699Z" fill={color} />
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
