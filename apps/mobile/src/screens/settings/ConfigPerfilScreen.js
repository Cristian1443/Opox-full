import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, StatusBar,
  Switch, Modal, TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../../api';
import { colors } from '../../theme';
import {
  isBiometricLinked, detectBiometricType, biometricLabel,
  setupBiometric, disableBiometric,
} from '../../lib/biometric';

function getInitials(name) {
  if (!name) return '?';
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

// Icono en cuadro coloreado reutilizable dentro de la pantalla
function IconBox({ name, size = 20, color = '#3B82F6', bg = '#EFF6FF' }) {
  return (
    <View style={[styles.iconBox, { backgroundColor: bg }]}>
      <Ionicons name={name} size={size} color={color} />
    </View>
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

  // --- Editar nombre ---
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

  // --- Biometría ---
  const handleBioToggle = async (value) => {
    if (bioLoading) return;
    setBioLoading(true);

    if (value) {
      // Activar biometría
      const { ok, error } = await setupBiometric();
      if (ok) {
        setBioEnabled(true);
      } else {
        Alert.alert('No se pudo activar', error || 'Inténtalo de nuevo.');
      }
    } else {
      // Desactivar — pedir confirmación
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

  // --- Cambiar contraseña ---
  const handleChangePassword = () => {
    // Inicia el flujo de reset por email (Bloque 1)
    // TODO(bloque-12): implementar cambio in-app cuando el backend exponga PATCH /auth/password
    navigation.navigate('RecuperarPassword');
  };

  // --- Foto (stub) ---
  const handleEditPhoto = () => {
    // TODO(bloque-12): expo-image-picker + endpoint de subida a Supabase Storage
    Alert.alert('Cambiar foto', 'Función disponible próximamente.');
  };

  const oposicionLine = [user?.oposicion, user?.especialidad].filter(Boolean).join(' · ')
    || 'Sin configurar';

  const bioLabel = bioType !== 'none' ? biometricLabel(bioType) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          accessibilityLabel="Volver"
          style={styles.headerBack}
        >
          <Ionicons name="chevron-back" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Perfil y Biometría</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* AVATAR centrado */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatar}>
              {loading
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.avatarText}>{getInitials(user?.displayName)}</Text>
              }
            </View>
            <TouchableOpacity
              style={styles.cameraBtn}
              onPress={handleEditPhoto}
              activeOpacity={0.8}
              accessibilityLabel="Cambiar foto de perfil"
            >
              <Ionicons name="camera" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          {!loading && (
            <Text style={styles.avatarName}>{user?.displayName || 'Opositor'}</Text>
          )}
        </View>

        {/* DATOS PERSONALES */}
        <Text style={styles.sectionTitle}>DATOS PERSONALES</Text>
        <View style={styles.card}>

          {/* Nombre */}
          <TouchableOpacity
            style={styles.row}
            onPress={handleOpenNameModal}
            activeOpacity={0.7}
            accessibilityLabel="Editar nombre"
          >
            <View style={styles.rowLeft}>
              <IconBox name="person-outline" color="#3B82F6" bg="#EFF6FF" />
              <View style={styles.rowTexts}>
                <Text style={styles.rowLabel}>Nombre</Text>
                <Text style={styles.rowValue}>{user?.displayName || '—'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Email */}
          <TouchableOpacity
            style={styles.row}
            onPress={() => setEmailModalVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Ver email"
          >
            <View style={styles.rowLeft}>
              <IconBox name="mail-outline" color="#3B82F6" bg="#EFF6FF" />
              <View style={styles.rowTexts}>
                <Text style={styles.rowLabel}>Email</Text>
                <Text style={styles.rowValue}>{user?.email || '—'}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>

          {/* Oposición — solo lectura */}
          <View style={[styles.row, styles.rowLast]}>
            <View style={styles.rowLeft}>
              <IconBox name="briefcase-outline" color="#64748B" bg="#F1F5F9" />
              <View style={styles.rowTexts}>
                <Text style={styles.rowLabel}>Oposición</Text>
                {/* TODO(bloque-12): ¿hay pantalla dedicada para cambiar oposición? */}
                <Text style={styles.rowValueMuted}>{oposicionLine}</Text>
              </View>
            </View>
            {/* Sin chevron — campo informativo */}
          </View>
        </View>

        {/* SEGURIDAD */}
        <Text style={styles.sectionTitle}>SEGURIDAD</Text>
        <View style={styles.card}>

          {/* Toggle biométrico — solo si el dispositivo lo soporta */}
          {bioType !== 'none' && (
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <IconBox
                  name={bioType === 'face' ? 'scan-outline' : 'finger-print-outline'}
                  color={colors.success}
                  bg="#ECFDF5"
                />
                <View style={styles.rowTexts}>
                  <Text style={styles.rowLabel}>{bioLabel || 'Biometría'}</Text>
                  <Text style={styles.rowValue}>Acceso rápido</Text>
                </View>
              </View>
              <Switch
                trackColor={{ false: '#E2E8F0', true: '#D1FAE5' }}
                thumbColor={bioEnabled ? '#FFFFFF' : '#F4F4F4'}
                onValueChange={handleBioToggle}
                value={bioEnabled}
                disabled={bioLoading}
                accessibilityLabel={`${bioLabel || 'Biometría'} ${bioEnabled ? 'activada' : 'desactivada'}`}
              />
            </View>
          )}

          {/* Cambiar contraseña */}
          <TouchableOpacity
            style={[styles.row, styles.rowLast]}
            onPress={handleChangePassword}
            activeOpacity={0.7}
            accessibilityLabel="Cambiar contraseña"
          >
            <View style={styles.rowLeft}>
              <IconBox name="lock-closed-outline" color="#3B82F6" bg="#EFF6FF" />
              <View style={styles.rowTexts}>
                <Text style={styles.rowLabel}>Contraseña</Text>
                <Text style={styles.rowValue}>Cambiar contraseña</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* MODAL editar nombre */}
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
              placeholderTextColor="#AEB5C2"
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
                ? <ActivityIndicator color="#FFFFFF" size="small" />
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

      {/* MODAL email — informativo */}
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBack: { padding: 8 },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#1E293B' },
  headerRight: { width: 40 }, // balanceo para centrar el título

  // Avatar
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 8 },
  avatarWrap: { position: 'relative', marginBottom: 10 },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#1B2A4A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#FFFFFF' },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#3B82F6',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarName: { fontSize: 18, fontWeight: '700', color: '#1E293B' },

  // Scroll
  scroll: { paddingBottom: 40 },

  // Sección
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 8,
  },

  // Card
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },

  // Filas
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowLast: { borderBottomWidth: 0 },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  rowTexts: { flex: 1 },
  rowLabel: { fontSize: 12, color: '#64748B', marginBottom: 2 },
  rowValue: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  rowValueMuted: { fontSize: 15, fontWeight: '500', color: '#64748B' },

  // IconBox
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Modal compartido
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,27,51,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, width: '100%' },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
  modalBody: { fontSize: 13, color: '#5A6373', lineHeight: 19, marginBottom: 16 },
  input: {
    borderWidth: 1.5,
    borderColor: '#E4E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1B2A4A',
    marginBottom: 12,
  },
  btn: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
