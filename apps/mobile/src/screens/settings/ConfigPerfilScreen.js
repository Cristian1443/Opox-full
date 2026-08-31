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

function AvatarIcon({ size = 110 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={11} stroke={colors.purple} strokeWidth={1.4} fill="none" />
      <Circle cx={12} cy={9.5} r={3.3} stroke={colors.purple} strokeWidth={1.4} fill="none" />
      <Path d="M5.5 19C6.8 16.2 9.1 14.7 12 14.7C14.9 14.7 17.2 16.2 18.5 19" stroke={colors.purple} strokeWidth={1.4} fill="none" strokeLinecap="round" />
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
