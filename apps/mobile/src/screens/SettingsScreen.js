import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../components/ScreenHeader';
import { authApi } from '../api';

function IconProfile() {
    return (
        <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={8} r={3.5} stroke="#2D6FB0" strokeWidth={1.6} />
            <Path d="M5 20a7 7 0 0 1 14 0" stroke="#2D6FB0" strokeWidth={1.6} />
        </Svg>
    );
}

function IconWarning() {
    return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path d="M5 7h14M9 7V5h6v2M6 7l1 13h10l1-13" stroke="#E2483D" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function getInitials(name) {
    if (!name) return '?';
    return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() || '').join('');
}

function resetToSplash(navigation) {
    navigation.reset({ index: 0, routes: [{ name: 'Splash' }] });
}

export default function SettingsScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [editVisible, setEditVisible] = useState(false);
    const [form, setForm] = useState({ oposicion: '', especialidad: '' });
    const [deleteVisible, setDeleteVisible] = useState(false);

    const load = () => {
        authApi.me().then(({ data }) => {
            if (data) {
                setUser(data);
                setForm({ oposicion: data.oposicion || '', especialidad: data.especialidad || '' });
            }
        });
    };

    useEffect(load, []);

    const handleSaveProfile = async () => {
        const { data } = await authApi.updateProfile({
            oposicion: form.oposicion.trim() || undefined,
            especialidad: form.especialidad.trim() || undefined,
        });
        if (data) setUser(data);
        setEditVisible(false);
    };

    const handleLogout = async () => {
        await authApi.logout();
        resetToSplash(navigation);
    };

    const handleDeleteAccount = async () => {
        await authApi.deleteAccount();
        resetToSplash(navigation);
    };

    const oposicionLine = user?.oposicion
        ? [user.oposicion, user.especialidad].filter(Boolean).join(' · ')
        : 'Toca para configurar tu oposición';

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Ajustes" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <View style={styles.profileCard}>
                    <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(user?.displayName)}</Text></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.profileName}>{user?.displayName || 'Opositor'}</Text>
                        <Text style={styles.profileEmail}>{user?.email}</Text>
                    </View>
                </View>

                <Text style={styles.groupTitle}>CUENTA</Text>
                <View style={styles.group}>
                    <TouchableOpacity style={styles.row} onPress={() => setEditVisible(true)} activeOpacity={0.7}>
                        <View style={[styles.rowIcon, { backgroundColor: '#EAF3FB' }]}><IconProfile /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>Oposición</Text>
                            <Text style={styles.rowSubtitle}>{oposicionLine}</Text>
                        </View>
                        <Text style={styles.chevron}>›</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.groupTitle}>SESIÓN</Text>
                <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
                    <Text style={styles.logoutText}>Cerrar sesión</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteVisible(true)} activeOpacity={0.7}>
                    <Text style={styles.deleteText}>Eliminar cuenta</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={editVisible} animationType="fade" onRequestClose={() => setEditVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Tu oposición</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Oposición (ej. Justicia)"
                            placeholderTextColor="#AEB5C2"
                            value={form.oposicion}
                            onChangeText={(oposicion) => setForm((f) => ({ ...f, oposicion }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Especialidad (ej. Tramitación)"
                            placeholderTextColor="#AEB5C2"
                            value={form.especialidad}
                            onChangeText={(especialidad) => setForm((f) => ({ ...f, especialidad }))}
                        />
                        <TouchableOpacity style={styles.btn} onPress={handleSaveProfile} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Guardar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setEditVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <Modal transparent visible={deleteVisible} animationType="fade" onRequestClose={() => setDeleteVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.confirmCard}>
                        <View style={styles.confirmIcon}><IconWarning /></View>
                        <Text style={styles.confirmTitle}>¿Eliminar tu cuenta?</Text>
                        <Text style={styles.confirmText}>
                            Perderás tu progreso, Opopoints y racha. <Text style={{ fontWeight: '800' }}>Esta acción es irreversible.</Text>
                        </Text>
                        <TouchableOpacity style={styles.destructiveBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Eliminar definitivamente</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setDeleteVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 24 },
    profileCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 8 },
    avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#1B2A4A', alignItems: 'center', justifyContent: 'center' },
    avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
    profileName: { fontSize: 13, fontWeight: '700', color: '#1B2A4A' },
    profileEmail: { fontSize: 10.5, color: '#8A92A0' },
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8, marginTop: 14 },
    group: { borderRadius: 13, overflow: 'hidden', borderWidth: 1.5, borderColor: '#EEF1F7' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, backgroundColor: '#fff' },
    rowIcon: { width: 34, height: 34, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
    rowTitle: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A' },
    rowSubtitle: { fontSize: 10.5, color: '#8A92A0', marginTop: 1 },
    chevron: { color: '#C4CBD6', fontSize: 16 },
    logoutBtn: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#D4DAE6', borderRadius: 12, paddingVertical: 13, alignItems: 'center', marginBottom: 10 },
    logoutText: { fontSize: 13, fontWeight: '700', color: '#1B2A4A' },
    deleteBtn: { alignItems: 'center', paddingVertical: 8 },
    deleteText: { fontSize: 11.5, fontWeight: '700', color: '#E2483D' },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 10 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
    confirmCard: { backgroundColor: '#fff', borderRadius: 16, width: 260, padding: 20, alignItems: 'center' },
    confirmIcon: { width: 52, height: 52, borderRadius: 14, backgroundColor: '#FDEBE9', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    confirmTitle: { fontSize: 14, fontWeight: '800', color: '#0F1B33', marginBottom: 8, textAlign: 'center' },
    confirmText: { fontSize: 11.5, color: '#5A6373', textAlign: 'center', marginBottom: 16, lineHeight: 17 },
    destructiveBtn: { backgroundColor: '#E2483D', borderRadius: 12, paddingVertical: 12, alignItems: 'center', width: '100%' },
});
