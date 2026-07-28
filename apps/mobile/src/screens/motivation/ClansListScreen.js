import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import { motivationApi } from '../../api';
import { colors, spacing } from '../../theme';

// DATA GAP: ni ClanSummaryDTO ni ClanDetailDTO (packages/types/src/motivation.ts) exponen un
// conteo de retos activos por clan. Figma ("CLANES - LISTADO", 2334:489) muestra "3 retos
// activos" como valor de ejemplo en la sección MIS CLANES — se hardcodea desde el diseño
// hasta que el backend exponga el dato real (mismo criterio que ClanDetailScreen.js).
const FIGMA_ACTIVE_CHALLENGES = 3;

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

            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backBtn}
                    onPress={() => navigation.goBack()}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Text style={styles.backBtnText}>‹</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle} numberOfLines={1}>Clanes</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {myClan && (
                    <>
                        <Text style={styles.groupTitle}>MIS CLANES</Text>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => navigation.navigate('ClanDetail', { clanId: myClan.id })}
                            activeOpacity={0.7}
                        >
                            <View style={styles.myClanIcon}><Text style={styles.myClanIconText}>{myClan.initials}</Text></View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.clanName}>{myClan.name}</Text>
                                <Text style={styles.clanCaption}>{myClan.memberCount} miembros · {FIGMA_ACTIVE_CHALLENGES} retos activos</Text>
                            </View>
                            <Text style={styles.chevron}>›</Text>
                        </TouchableOpacity>
                        <View style={styles.separator} />
                    </>
                )}

                <Text style={styles.groupTitle}>EXPLORAR CLANES</Text>
                {clans.length === 0 ? (
                    <Text style={styles.empty}>No hay más clanes todavía.</Text>
                ) : (
                    clans.map((c, index) => (
                        <View key={c.id}>
                            <View style={styles.row}>
                                <Text style={styles.exploreClanInitials}>{c.initials}</Text>
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
                            {index < clans.length - 1 && <View style={styles.separator} />}
                        </View>
                    ))
                )}

                {!myClan && (
                    <TouchableOpacity style={styles.createBtn} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
                        <Text style={styles.createBtnText}>+ Crear Clan</Text>
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
    statusBarTime: { fontSize: 10, fontWeight: '700', color: colors.textDark, marginRight: 'auto' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
    },
    // Figma: botón de volver = 24x24dp exacto (1dp = 2.25px de Figma).
    backBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: `${colors.textDark}1A`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    backBtnText: { color: colors.textDark, fontWeight: '700', fontSize: 14, marginTop: -1 },
    // Figma (2334:540 "Clanes"): fontSize 21dp exacto.
    headerTitle: { fontSize: 21, fontWeight: '700', color: colors.textDark, letterSpacing: -0.4, flexShrink: 1 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: spacing.lg },
    // Figma (2334:642/612 "MIS CLANES"/"EXPLORAR CLANES"): fontSize 16dp exacto.
    groupTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, letterSpacing: 0.4, textTransform: 'uppercase', marginBottom: spacing.sm, marginTop: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    // Figma (2336:894 "ICONO CLAN 1"): círculo de 54x54dp exacto, verde sólido con iniciales blancas.
    myClanIcon: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.ctaGreen, alignItems: 'center', justifyContent: 'center' },
    myClanIconText: { color: colors.white, fontWeight: '800', fontSize: 18 },
    // Figma: en EXPLORAR CLANES no hay círculo — solo iniciales en texto naranja.
    exploreClanInitials: { width: 54, fontWeight: '800', fontSize: 22, color: colors.accentOrange },
    // Figma (2334:643 "Opo Justicia"): fontSize 16dp exacto.
    clanName: { fontSize: 16, fontWeight: '700', color: colors.textDark },
    // Figma (2334:649 "28 miembros..."): fontSize 9dp exacto.
    clanCaption: { fontSize: 9, color: colors.textMuted },
    chevron: { color: colors.textDark, fontSize: 18 },
    empty: { textAlign: 'center', color: colors.textMuted, fontSize: 12.5, marginTop: 10 },
    separator: { height: 1, backgroundColor: colors.grayLight },
    // Figma: pill de borde fino (no relleno), morado oscuro
    joinBtn: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.textDark, borderRadius: 9, paddingVertical: 6, paddingHorizontal: 14 },
    joinBtnText: { fontSize: 12, fontWeight: '700', color: colors.textDark },
    // Figma (2334:633 "Rectangle 1"): botón de 322x61dp exacto.
    createBtn: { backgroundColor: colors.ctaGreen, borderRadius: 24, paddingVertical: 16, alignItems: 'center', marginTop: spacing.md },
    createBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: colors.white, borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: colors.textDark, marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: colors.textDark, marginBottom: 10 },
    btn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: colors.white, fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: colors.textMuted, fontSize: 12, fontWeight: '700' },
});
