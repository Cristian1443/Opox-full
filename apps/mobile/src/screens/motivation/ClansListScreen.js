import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import ScreenHeader from '../../components/ScreenHeader';
import { motivationApi } from '../../api';

export default function ClansListScreen({ navigation }) {
    const [myClan, setMyClan] = useState(null);
    const [clans, setClans] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [form, setForm] = useState({ name: '', initials: '', description: '' });

    const load = useCallback(() => {
        motivationApi.getMyClan().then(({ data }) => setMyClan(data));
        motivationApi.listClans().then(({ data }) => { if (data) setClans(data); });
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleJoin = async (clanId) => {
        const { error } = await motivationApi.joinClan(clanId);
        if (!error) load();
    };

    const handleCreate = async () => {
        if (!form.name.trim() || !form.initials.trim()) return;
        const { data, error } = await motivationApi.createClan({
            name: form.name.trim(),
            initials: form.initials.trim(),
            description: form.description.trim() || undefined,
        });
        if (!error && data) {
            setModalVisible(false);
            setForm({ name: '', initials: '', description: '' });
            load();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Clanes" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {myClan && (
                    <>
                        <Text style={styles.groupTitle}>MI CLAN</Text>
                        <TouchableOpacity
                            style={styles.myClanCard}
                            onPress={() => navigation.navigate('ClanDetail', { clanId: myClan.id })}
                            activeOpacity={0.85}
                        >
                            <View style={styles.myClanIcon}><Text style={styles.myClanIconText}>{myClan.initials}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.myClanName}>{myClan.name}</Text>
                                <Text style={styles.myClanCaption}>{myClan.memberCount} miembros</Text>
                            </View>
                            <Text style={styles.chevronPurple}>›</Text>
                        </TouchableOpacity>
                    </>
                )}

                <Text style={styles.groupTitle}>EXPLORAR CLANES</Text>
                {clans.length === 0 ? (
                    <Text style={styles.empty}>No hay más clanes todavía.</Text>
                ) : (
                    clans.map((c) => (
                        <View key={c.id} style={styles.clanRow}>
                            <View style={styles.clanIcon}><Text style={styles.clanIconText}>{c.initials}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clanName}>{c.name}</Text>
                                <Text style={styles.clanCaption}>{c.memberCount} miembros</Text>
                            </View>
                            {!myClan && (
                                <TouchableOpacity style={styles.joinBtn} onPress={() => handleJoin(c.id)}>
                                    <Text style={styles.joinBtnText}>Unirse</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ))
                )}

                {!myClan && (
                    <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                        <Text style={styles.createBtnText}>+ Crear un clan</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nuevo clan</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Nombre del clan"
                            placeholderTextColor="#AEB5C2"
                            value={form.name}
                            onChangeText={(name) => setForm((f) => ({ ...f, name }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Iniciales (máx. 3, ej. OJ)"
                            placeholderTextColor="#AEB5C2"
                            maxLength={3}
                            autoCapitalize="characters"
                            value={form.initials}
                            onChangeText={(initials) => setForm((f) => ({ ...f, initials }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Descripción (opcional)"
                            placeholderTextColor="#AEB5C2"
                            value={form.description}
                            onChangeText={(description) => setForm((f) => ({ ...f, description }))}
                        />
                        <TouchableOpacity style={styles.btn} onPress={handleCreate} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Crear clan</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
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
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 8, marginTop: 8 },
    myClanCard: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#F8F4FE', borderWidth: 1.5, borderColor: '#7B4BC4', borderRadius: 14, padding: 12, marginBottom: 4 },
    myClanIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#7B4BC4', alignItems: 'center', justifyContent: 'center' },
    myClanIconText: { color: '#fff', fontWeight: '800', fontSize: 13 },
    myClanName: { fontSize: 13, fontWeight: '700', color: '#1B2A4A' },
    myClanCaption: { fontSize: 10.5, color: '#8A92A0' },
    chevronPurple: { color: '#7B4BC4', fontSize: 18 },
    empty: { textAlign: 'center', color: '#8A92A0', fontSize: 12.5, marginTop: 10 },
    clanRow: { flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 12, padding: 11, marginBottom: 8 },
    clanIcon: { width: 40, height: 40, borderRadius: 11, backgroundColor: '#EAF3FB', alignItems: 'center', justifyContent: 'center' },
    clanIconText: { fontWeight: '800', color: '#2D6FB0', fontSize: 11 },
    clanName: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A' },
    clanCaption: { fontSize: 10, color: '#8A92A0' },
    joinBtn: { backgroundColor: '#FFF1EC', borderRadius: 9, paddingVertical: 6, paddingHorizontal: 12 },
    joinBtnText: { fontSize: 10.5, fontWeight: '700', color: '#FF6B4A' },
    createBtn: { borderWidth: 1.5, borderColor: '#D4DAE6', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
    createBtnText: { fontSize: 13, fontWeight: '700', color: '#1B2A4A' },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 10 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
