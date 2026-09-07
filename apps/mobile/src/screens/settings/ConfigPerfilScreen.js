import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Switch, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import { authApi } from '../../api';
import { colors, spacing } from '../../theme';
import {
  isBiometricLinked, detectBiometricType, biometricLabel,
  setupBiometric, disableBiometric,
} from '../../lib/biometric';

// ─── 12.2 · Perfil y biometría ─────────────────────────────────────────────
// Fiel al Figma (PerfilYBiometriaScreen.tsx). El hallazgo de nomenclatura
// ("EXPLORAR" en vez de "SEGURIDAD" en el árbol de capas) es solo un
// problema interno de Figma, sin impacto en el contenido. La detección real
// de biometría (oculta el interruptor si el dispositivo no la soporta, pide
// confirmación al desactivar) y los modales de edición de nombre/email son
// funcionalidad real que Figma no modela — se conservan.
const FIGMA = {
  textMuted: 'rgba(65, 41, 80, 0.5)',
  separator: 'rgba(65, 41, 80, 0.12)',
  cardBorder: 'rgba(65, 41, 80, 0.3)',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ChevronRightIcon({ size = 18, color = colors.textDark }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 5L16 12L9 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Ruta exacta exportada de Figma (avatar circular, 355×355 — mismo que Ajustes).
function AvatarIcon({ size = 110 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 355 355">
      <Path d="M177.31 0C79.54 0 0 79.54 0 177.31C0 276.82 81 354.56 177.31 354.56C273.31 354.56 354.61 277.11 354.61 177.31C354.61 79.54 275.07 0 177.31 0Z" fill={colors.white} />
      <Path d="M177.31 0C79.54 0 0 79.54 0 177.31C0 276.82 81 354.56 177.31 354.56C273.31 354.56 354.61 277.11 354.61 177.31C354.61 79.54 275.07 0 177.31 0ZM84.17 304.93C91.9993 286.722 104.994 271.208 121.547 260.308C138.1 249.407 157.485 243.597 177.305 243.597C197.125 243.597 216.51 249.407 233.063 260.308C249.616 271.208 262.611 286.722 270.44 304.93C243.423 324.728 210.8 335.401 177.305 335.401C143.81 335.401 111.187 324.728 84.17 304.93ZM285.67 292.39C275.818 272.025 260.426 254.848 241.26 242.829C222.093 230.81 199.928 224.435 177.305 224.435C154.682 224.435 132.517 230.81 113.35 242.829C94.1839 254.848 78.7923 272.025 68.94 292.39C53.1975 277.645 40.6549 259.82 32.0913 240.023C23.5278 220.226 19.1262 198.88 19.16 177.31C19.16 90.1 90.1 19.16 177.31 19.16C264.52 19.16 335.45 90.1 335.45 177.31C335.487 198.88 331.087 220.228 322.524 240.025C313.96 259.823 301.415 277.647 285.67 292.39Z" fill={colors.purple} stroke={colors.purple} strokeWidth={1.5} />
      <Path d="M177.31 87.61C165.177 87.608 153.316 91.2041 143.228 97.9435C133.139 104.683 125.275 114.263 120.631 125.472C115.987 136.68 114.772 149.015 117.138 160.914C119.505 172.814 125.347 183.745 133.926 192.324C142.505 200.903 153.436 206.745 165.336 209.112C177.235 211.478 189.57 210.263 200.778 205.619C211.987 200.975 221.567 193.111 228.307 183.022C235.046 172.934 238.642 161.073 238.64 148.94C238.621 132.68 232.154 117.091 220.656 105.594C209.159 94.096 193.57 87.6285 177.31 87.61ZM177.31 191.12C168.967 191.122 160.811 188.65 153.873 184.016C146.936 179.383 141.528 172.796 138.334 165.089C135.14 157.381 134.303 148.9 135.929 140.717C137.556 132.534 141.572 125.018 147.471 119.118C153.369 113.218 160.885 109.2 169.067 107.571C177.25 105.943 185.731 106.778 193.439 109.97C201.147 113.162 207.735 118.568 212.371 125.505C217.006 132.442 219.48 140.597 219.48 148.94C219.467 160.121 215.02 170.84 207.115 178.748C199.209 186.655 188.491 191.104 177.31 191.12Z" fill={colors.purple} stroke={colors.purple} strokeWidth={1.5} />
    </Svg>
  );
}

function FaceIdIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 8V6C4 4.9 4.9 4 6 4H8M16 4H18C19.1 4 20 4.9 20 6V8M20 16V18C20 19.1 19.1 20 18 20H16M8 20H6C4.9 20 4 19.1 4 18V16" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Circle cx={9} cy={11} r={0.9} fill={color} />
      <Circle cx={15} cy={11} r={0.9} fill={color} />
      <Path d="M9 15C10 15.8 14 15.8 15 15" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function FingerprintIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3C7 3 3 7 3 12V15" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M12 3C17 3 21 7 21 12V13" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M8 20C6.7 18 6 15.9 6 13.5C6 10.5 8.7 8 12 8C15.3 8 18 10.5 18 13.5C18 14.4 17.9 15.2 17.6 16" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M12 20C10.3 17.8 9.3 16 9.3 13.5C9.3 12.1 10.5 11 12 11C13.5 11 14.7 12.1 14.7 13.5C14.7 14.6 14.5 15.5 14.1 16.4" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

function LockIcon({ size = 24, color = colors.accentOrange }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 10V7.5C7 5 8.8 3 12 3C15.2 3 17 5 17 7.5V10" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" />
      <Path d="M5.5 10H18.5V19.5C18.5 20.3 17.8 21 17 21H7C6.2 21 5.5 20.3 5.5 19.5V10Z" stroke={color} strokeWidth={1.6} fill="none" strokeLinejoin="round" />
      <Line x1={12} y1={14} x2={12} y2={17} stroke={color} strokeWidth={1.6} strokeLinecap="round" />
    </Svg>
  );
}

export default function ConfigPerfilScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Estado biométrico real desde SecureStore
  const [bioType, setBioType] = useState('none');
  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);

  // Modal editar nombre
  const [nameModalVisible, setNameModalVisible] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [nameSaving, setNameSaving] = useState(false);

  // Modal email (informativo — cambio requiere verificación)
  const [emailModalVisible, setEmailModalVisible] = useState(false);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const { data } = await authApi.me();
    if (data) {
      setUser(data);
      setNameInput(data.displayName || '');
    }
    setLoading(false);
  }, []);

  const loadBiometric = useCallback(async () => {
    const [type, linked] = await Promise.all([detectBiometricType(), isBiometricLinked()]);
    setBioType(type);
    setBioEnabled(linked);
  }, []);

  useEffect(() => {
    loadProfile();
    loadBiometric();
  }, [loadProfile, loadBiometric]);

  const handleOpenNameModal = () => {
    setNameInput(user?.displayName || '');
    setNameModalVisible(true);
  };

  const handleSaveName = async () => {
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    setNameSaving(true);
    const { data } = await authApi.updateProfile({ name: trimmed });
    if (data) setUser((u) => ({ ...u, displayName: trimmed }));
    setNameSaving(false);
    setNameModalVisible(false);
  };

  const handleBioToggle = async (value) => {
    if (bioLoading) return;
    setBioLoading(true);

    if (value) {
      const { ok, error } = await setupBiometric();
      if (ok) {
        setBioEnabled(true);
      } else {
        Alert.alert('No se pudo activar', error || 'Inténtalo de nuevo.');
      }
    } else {
      Alert.alert(
        'Desactivar biometría',
        'Tendrás que usar tu contraseña para acceder. ¿Continuar?',
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Desactivar',
            style: 'destructive',
            onPress: async () => {
              await disableBiometric();
              setBioEnabled(false);
            },
          },
        ],
      );
    }

    setBioLoading(false);
  };

  const handleChangePassword = () => {
    // Inicia el flujo de reset por email (Bloque 1)
    // TODO(bloque-12): implementar cambio in-app cuando el backend exponga PATCH /auth/password
    navigation.navigate('RecuperarPassword');
  };

  const handleEditPhoto = () => {
    // TODO(bloque-12): expo-image-picker + endpoint de subida a Supabase Storage
    Alert.alert('Cambiar foto', 'Función disponible próximamente.');
  };

  const oposicionLine = [user?.oposicion, user?.especialidad].filter(Boolean).join(' · ')
    || 'Sin configurar';

  const bioLabel = bioType !== 'none' ? biometricLabel(bioType) : null;
  const BioIcon = bioType === 'face' ? FaceIdIcon : FingerprintIcon;

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
        <Text style={styles.headerTitle}>Perfil y biometría</Text>
        <View style={styles.iconButton} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Avatar ──────────────────────────────────────────────────── */}
        <View style={styles.avatarBlock}>
          <AvatarIcon />
          {!loading && (
            <Text style={styles.avatarName} numberOfLines={1}>{user?.displayName || 'Opositor'}</Text>
          )}
          <TouchableOpacity activeOpacity={0.7} onPress={handleEditPhoto}>
            <Text style={styles.cambiarFoto}>Cambiar foto</Text>
          </TouchableOpacity>
        </View>

        {/* ── Datos personales ───────────────────────────────────────── */}
        <Text style={styles.sectionLabel}>DATOS PERSONALES</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.row}
            onPress={handleOpenNameModal}
            activeOpacity={0.7}
            accessibilityLabel="Editar nombre"
          >
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowSmallLabel}>Nombre y apellidos</Text>
              <Text style={styles.rowValue}>{user?.displayName || '—'}</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.row, styles.rowBorder]}
            onPress={() => setEmailModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Ver email"
          >
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowSmallLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email || '—'}</Text>
            </View>
            <ChevronRightIcon />
          </TouchableOpacity>

          {/* Oposición — sin chevron: campo informativo, sin pantalla de edición dedicada */}
          <View style={[styles.row, styles.rowBorder]}>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowSmallLabel}>Oposición</Text>
              <Text style={styles.rowValue}>{oposicionLine}</Text>
            </View>
          </View>
        </View>

        {/* ── Seguridad ───────────────────────────────────────────────── */}
        <Text style={[styles.sectionLabel, styles.securityLabel]}>SEGURIDAD</Text>
        <View style={styles.card}>
          {bioType !== 'none' && (
            <View style={styles.row}>
              <BioIcon />
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>{bioLabel}</Text>
                <Text style={styles.rowSubtitle}>Acceso biométrico</Text>
              </View>
              <Switch
                value={bioEnabled}
                onValueChange={handleBioToggle}
                disabled={bioLoading}
                trackColor={{ false: '#E2E2E6', true: colors.purple }}
                thumbColor={colors.white}
                accessibilityLabel={`${bioLabel} ${bioEnabled ? 'activada' : 'desactivada'}`}
              />
            </View>
          )}
          <TouchableOpacity
            style={[styles.row, bioType !== 'none' && styles.rowBorder]}
            onPress={handleChangePassword}
            activeOpacity={0.7}
            accessibilityLabel="Cambiar contraseña"
          >
            <LockIcon />
            <Text style={[styles.rowTitle, { flex: 1 }]}>Cambiar contraseña</Text>
            <ChevronRightIcon />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* ── Modal: editar nombre ─────────────────────────────────────── */}
      <Modal
        transparent
        visible={nameModalVisible}
        animationType="fade"
        onRequestClose={() => setNameModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar nombre</Text>
            <TextInput
              style={styles.input}
              placeholder="Tu nombre completo"
              placeholderTextColor={FIGMA.textMuted}
              value={nameInput}
              onChangeText={setNameInput}
              autoFocus
            />
            <TouchableOpacity
              style={[styles.btn, (!nameInput.trim() || nameSaving) && styles.btnDisabled]}
              onPress={handleSaveName}
              activeOpacity={0.85}
              disabled={!nameInput.trim() || nameSaving}
              accessibilityLabel="Guardar nombre"
            >
              {nameSaving
                ? <ActivityIndicator color={colors.white} size="small" />
                : <Text style={styles.btnText}>Guardar</Text>
              }
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setNameModalVisible(false)}
              style={{ marginTop: 8 }}
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal: cambiar email (informativo) ───────────────────────── */}
      <Modal
        transparent
        visible={emailModalVisible}
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
      >
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Cambiar email</Text>
            <Text style={styles.modalBody}>
              Para cambiar tu email necesitamos verificar tu identidad. Recibirás un
              enlace en tu dirección actual.
            </Text>
            <TouchableOpacity
              style={styles.btn}
              onPress={() => {
                setEmailModalVisible(false);
                navigation.navigate('RecuperarPassword');
              }}
              activeOpacity={0.85}
              accessibilityLabel="Ir a recuperar contraseña"
            >
              <Text style={styles.btnText}>Ir al flujo de verificación</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setEmailModalVisible(false)}
              style={{ marginTop: 8 }}
              accessibilityLabel="Cancelar"
            >
              <Text style={styles.cancel}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: spacing.xl,
  },
  avatarBlock: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarName: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textDark,
    marginTop: 10,
  },
  cambiarFoto: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: FIGMA.textMuted,
    marginTop: 6,
  },
  sectionLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: colors.textDark,
    marginBottom: 8,
  },
  securityLabel: {
    marginTop: spacing.lg,
  },
  card: {
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
  },
  rowBorder: {
    borderTopWidth: 1,
    borderTopColor: FIGMA.separator,
  },
  rowTextWrap: {
    flex: 1,
  },
  rowSmallLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: FIGMA.textMuted,
    marginBottom: 2,
  },
  rowValue: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: colors.textDark,
  },
  rowSubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10.5,
    color: FIGMA.textMuted,
    marginTop: 2,
  },

  // ── Modal compartido ──────────────────────────────────────────
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  modalCard: {
    backgroundColor: colors.white,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    padding: spacing.lg,
    width: '100%',
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: colors.textDark,
    marginBottom: 12,
  },
  modalBody: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 19,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: FIGMA.cardBorder,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: colors.textDark,
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.accentOrange,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  btnText: {
    fontFamily: 'Poppins-SemiBold',
    color: colors.white,
    fontSize: 14,
  },
  cancel: {
    textAlign: 'center',
    fontFamily: 'Poppins-SemiBold',
    color: colors.textSecondary,
    fontSize: 12,
  },
});
