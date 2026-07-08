import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import NudgeModal from '../../components/NudgeModal';
import { motivationApi } from '../../api';

function IconChallenge({ color = '#2BB673', size = 26 }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M13 2L4 14h7l-1 8 9-12h-7z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
    );
}

function hoursLeft(expiresAt) {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / 3600000);
}

function ChallengeCard({ item, onComplete }) {
    const percent = item.memberCount > 0 ? Math.round((item.completedCount / item.memberCount) * 100) : 0;
    const left = hoursLeft(item.expiresAt);
    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => !item.completedByMe && onComplete(item)}
            activeOpacity={item.completedByMe ? 1 : 0.7}
        >
            <View style={styles.cardHead}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                {left !== null && (
                    <Text style={styles.timeBadge}>{left > 0 ? `${left}h restantes` : 'Caducado'}</Text>
                )}
            </View>
            {item.subtitle && <Text style={styles.cardSubtitle}>{item.subtitle}</Text>}
            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>
            <Text style={styles.progressCaption}>
                {item.completedByMe ? '✓ Ya lo completaste · ' : ''}
                {item.completedCount} de {item.memberCount} del clan ya lo hicieron
            </Text>
        </TouchableOpacity>
    );
}

export default function ChallengesScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [challenges, setChallenges] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewVisible, setPreviewVisible] = useState(false);
    const [form, setForm] = useState({ title: '', subtitle: '', questionCount: '20', rewardPoints: '50' });

    const load = useCallback(() => {
        motivationApi.listClanChallenges(clanId).then(({ data }) => { if (data) setChallenges(data); });
    }, [clanId]);

    useEffect(() => { load(); }, [load]);

    const handleComplete = async (item) => {
        const { data } = await motivationApi.completeChallenge(clanId, item.id);
        if (data) load();
    };

    const handleCreate = async () => {
        const questionCount = parseInt(form.questionCount, 10);
        const rewardPoints = parseInt(form.rewardPoints, 10);
        if (!form.title.trim() || Number.isNaN(questionCount) || Number.isNaN(rewardPoints)) return;
        const { data } = await motivationApi.createClanChallenge(clanId, {
            title: form.title.trim(),
            subtitle: form.subtitle.trim() || undefined,
            questionCount,
            rewardPoints,
        });
        if (data) {
            setModalVisible(false);
            setForm({ title: '', subtitle: '', questionCount: '20', rewardPoints: '50' });
            load();
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>
            <ScreenHeader title="Retos" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.groupTitle}>RETOS ACTIVOS</Text>
                {challenges.length === 0 ? (
                    <Text style={styles.empty}>Todavía no hay retos en tu clan.</Text>
                ) : (
                    challenges.map((c) => <ChallengeCard key={c.id} item={c} onComplete={handleComplete} />)
                )}

                <Text style={styles.groupTitle}>CREAR RETO</Text>
                <TouchableOpacity style={styles.createCard} onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                    <IconChallenge />
                    <Text style={styles.createTitle}>Crear un reto para tu clan</Text>
                    <Text style={styles.createCaption}>Elige tema, nº de preguntas y duración</Text>
                </TouchableOpacity>

                {/* Vista previa temporal del popup "reto recibido" — no hay sistema de
                    retos 1vs1 entre usuarios todavía, solo retos de clan */}
                <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewVisible(true)}>
                    <Text style={styles.previewBtnText}>Vista previa: reto recibido</Text>
                </TouchableOpacity>
            </ScrollView>

            <Modal transparent visible={modalVisible} animationType="fade" onRequestClose={() => setModalVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Nuevo reto</Text>
                        <TextInput
                            style={styles.input}
                            placeholder="Título (ej. Maratón semanal)"
                            placeholderTextColor="#AEB5C2"
                            value={form.title}
                            onChangeText={(title) => setForm((f) => ({ ...f, title }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Descripción (opcional)"
                            placeholderTextColor="#AEB5C2"
                            value={form.subtitle}
                            onChangeText={(subtitle) => setForm((f) => ({ ...f, subtitle }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Nº de preguntas"
                            placeholderTextColor="#AEB5C2"
                            keyboardType="number-pad"
                            value={form.questionCount}
                            onChangeText={(questionCount) => setForm((f) => ({ ...f, questionCount }))}
                        />
                        <TextInput
                            style={styles.input}
                            placeholder="Opopoints de premio"
                            placeholderTextColor="#AEB5C2"
                            keyboardType="number-pad"
                            value={form.rewardPoints}
                            onChangeText={(rewardPoints) => setForm((f) => ({ ...f, rewardPoints }))}
                        />
                        <TouchableOpacity style={styles.btn} onPress={handleCreate} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Crear reto</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setModalVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {previewVisible && (
                <NudgeModal
                    visible
                    iconBg="#F1ECFA"
                    icon={<IconChallenge color="#7B4BC4" />}
                    title="Ana_G te ha retado"
                    description="Reto de 20 preguntas de Constitución. ¿Aceptas el desafío?"
                    primaryLabel="Aceptar reto"
                    secondaryLabel="Ahora no"
                    onPrimaryPress={() => setPreviewVisible(false)}
                    onSecondaryPress={() => setPreviewVisible(false)}
                />
            )}
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
    empty: { textAlign: 'center', color: '#8A92A0', fontSize: 12.5, marginBottom: 10 },
    card: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: 13, marginBottom: 9 },
    cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
    cardTitle: { fontSize: 12.5, fontWeight: '700', color: '#1B2A4A', flex: 1 },
    timeBadge: { fontSize: 9, fontWeight: '700', color: '#E0552F', backgroundColor: '#FFF1EC', paddingVertical: 3, paddingHorizontal: 8, borderRadius: 8 },
    cardSubtitle: { fontSize: 11, color: '#7A8290' },
    progressTrack: { height: 6, backgroundColor: '#EEF1F7', borderRadius: 3, marginTop: 9, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: '#FF6B4A' },
    progressCaption: { fontSize: 10, color: '#8A92A0', marginTop: 5 },
    createCard: { borderWidth: 1.5, borderColor: '#E4E8F0', borderStyle: 'dashed', borderRadius: 14, padding: 16, alignItems: 'center' },
    createTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A', marginTop: 6 },
    createCaption: { fontSize: 10, color: '#8A92A0', marginTop: 2 },
    previewBtn: { marginTop: 14, alignItems: 'center', borderWidth: 1.5, borderColor: '#D4DAE6', borderRadius: 12, paddingVertical: 10 },
    previewBtnText: { fontSize: 11, fontWeight: '700', color: '#1B2A4A' },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 10 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
