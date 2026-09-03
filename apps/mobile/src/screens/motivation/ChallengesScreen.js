import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Modal, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { RetoRecibidoModal } from '../../components/MotivationModals';
import { motivationApi, boeApi } from '../../api';
import { colors, spacing } from '../../theme';

function IconChevronLeft({ size = 11, color = colors.textDark }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M15 18l-6-6 6-6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function hoursLeft(expiresAt) {
    if (!expiresAt) return null;
    const ms = new Date(expiresAt).getTime() - Date.now();
    if (ms <= 0) return 0;
    return Math.ceil(ms / 3600000);
}

// Figma ("RETOS - LISTADO Y CREACION", 2336:959)
function ChallengeCard({ item, onStart }) {
    const percent = item.memberCount > 0 ? Math.round((item.completedCount / item.memberCount) * 100) : 0;
    const left = hoursLeft(item.expiresAt);
    const isMarathon = !item.expiresAt;
    const subtitle = isMarathon
        ? [
            item.questionCount != null ? `${item.questionCount} preguntas` : null,
            item.rewardPoints != null ? `premio ${item.rewardPoints} Opopoints` : null,
        ].filter(Boolean).join(' · ')
        : item.subtitle;

    return (
        <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>

            <View style={styles.cardFootRow}>
                <Text style={styles.progressCaption}>
                    {item.completedByMe ? '✓ Completado · ' : ''}
                    {item.completedCount} de {item.memberCount} del clan
                </Text>
                {isMarathon ? (
                    <TouchableOpacity
                        onPress={() => !item.completedByMe && onStart(item)}
                        activeOpacity={item.completedByMe ? 1 : 0.7}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <Text style={[styles.startLink, item.completedByMe && styles.startLinkDone]}>
                            {item.completedByMe ? '✓ Listo' : 'Iniciar →'}
                        </Text>
                    </TouchableOpacity>
                ) : (
                    left !== null && (
                        <Text style={styles.timeBadge}>{left > 0 ? `${left}h restantes` : 'Caducado'}</Text>
                    )
                )}
            </View>
        </View>
    );
}

// ─── Stepper numérico ─────────────────────────────────────────────────────────
function Stepper({ value, min, max, step, onChange, label }) {
    return (
        <View style={styles.stepperRow}>
            <Text style={styles.stepperLabel}>{label}</Text>
            <View style={styles.stepperControls}>
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => onChange(Math.max(min, value - step))}
                    activeOpacity={0.7}
                >
                    <Text style={styles.stepperBtnText}>−</Text>
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{value}</Text>
                <TouchableOpacity
                    style={styles.stepperBtn}
                    onPress={() => onChange(Math.min(max, value + step))}
                    activeOpacity={0.7}
                >
                    <Text style={styles.stepperBtnText}>+</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

export default function ChallengesScreen({ navigation, route }) {
    const { clanId } = route.params;
    const [challenges, setChallenges] = useState([]);

    // ─── Wizard de creación ────────────────────────────────────────────────────
    const [wizardVisible, setWizardVisible] = useState(false);
    const [wizardStep, setWizardStep] = useState(1); // 1: tema, 2: detalle
    const [topics, setTopics] = useState([]);
    const [topicsLoading, setTopicsLoading] = useState(false);
    const [selectedTopic, setSelectedTopic] = useState(null); // { topicId, label }
    const [form, setForm] = useState({ title: '', questionCount: 20, rewardPoints: 50 });
    const [creating, setCreating] = useState(false);

    const load = useCallback(() => {
        motivationApi.listClanChallenges(clanId).then(({ data }) => { if (data) setChallenges(data); });
    }, [clanId]);

    useEffect(() => { load(); }, [load]);

    const openWizard = async () => {
        setWizardStep(1);
        setSelectedTopic(null);
        setForm({ title: '', questionCount: 20, rewardPoints: 50 });
        setWizardVisible(true);
        setTopicsLoading(true);
        const { data } = await boeApi.listTopics('justicia-tramitacion');
        setTopics(data ?? []);
        setTopicsLoading(false);
    };

    const handleTopicSelect = (topic) => {
        setSelectedTopic(topic);
        if (topic) setForm((f) => ({ ...f, title: topic.label }));
        setWizardStep(2);
    };

    const handleCreate = async () => {
        if (!form.title.trim() || creating) return;
        setCreating(true);
        const { data } = await motivationApi.createClanChallenge(clanId, {
            title: form.title.trim(),
            questionCount: form.questionCount,
            rewardPoints: form.rewardPoints,
            topicId: selectedTopic?.topicId,
        });
        setCreating(false);
        if (data) {
            setWizardVisible(false);
            load();
        }
    };

    // "Iniciar" un reto: navega al Generador con el contexto del reto pre-cargado
    const handleStart = (item) => {
        navigation.navigate('GeneratorConfig', {
            challengeId: item.id,
            clanId,
            topicId: item.topicId ?? null,
            questionCount: item.questionCount,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.grayLight} />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <IconChevronLeft />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Retos</Text>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Text style={styles.groupTitle}>RETOS ACTIVOS</Text>
                {challenges.length === 0 ? (
                    <Text style={styles.empty}>Todavía no hay retos en tu clan.</Text>
                ) : (
                    challenges.map((c) => <ChallengeCard key={c.id} item={c} onStart={handleStart} />)
                )}

                <TouchableOpacity style={styles.createCard} onPress={openWizard} activeOpacity={0.85}>
                    <Text style={styles.createTitle}>+ Crear reto</Text>
                    <Text style={styles.createCaption}>Elige tema, preguntas y puntos</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* ─── Wizard modal ──────────────────────────────────────────────── */}
            <Modal transparent visible={wizardVisible} animationType="fade" onRequestClose={() => setWizardVisible(false)}>
                <View style={styles.overlay}>
                    <View style={styles.modalCard}>
                        {/* Cabecera del wizard */}
                        <View style={styles.wizardHeader}>
                            {wizardStep === 2 && (
                                <TouchableOpacity onPress={() => setWizardStep(1)} hitSlop={8}>
                                    <Text style={styles.wizardBack}>‹ Volver</Text>
                                </TouchableOpacity>
                            )}
                            <Text style={styles.modalTitle}>
                                {wizardStep === 1 ? 'Elige el tema' : 'Configura el reto'}
                            </Text>
                            <Text style={styles.wizardStep}>{wizardStep}/2</Text>
                        </View>

                        {/* Paso 1: selector de tema */}
                        {wizardStep === 1 && (
                            topicsLoading ? (
                                <ActivityIndicator size="small" color={colors.ctaGreen} style={{ marginVertical: 24 }} />
                            ) : (
                                <ScrollView style={styles.topicList} showsVerticalScrollIndicator={false}>
                                    {topics.map((t) => (
                                        <TouchableOpacity
                                            key={t.id}
                                            style={styles.topicItem}
                                            onPress={() => handleTopicSelect(t)}
                                            activeOpacity={0.75}
                                        >
                                            <Text style={styles.topicItemText}>{t.label}</Text>
                                            <Text style={styles.topicItemArrow}>›</Text>
                                        </TouchableOpacity>
                                    ))}
                                    {/* Sin tema específico */}
                                    <TouchableOpacity
                                        style={[styles.topicItem, { borderTopWidth: 1, borderTopColor: '#EEF1F7', marginTop: 4 }]}
                                        onPress={() => handleTopicSelect(null)}
                                        activeOpacity={0.75}
                                    >
                                        <Text style={[styles.topicItemText, { color: colors.textMuted }]}>Sin tema específico</Text>
                                        <Text style={styles.topicItemArrow}>›</Text>
                                    </TouchableOpacity>
                                </ScrollView>
                            )
                        )}

                        {/* Paso 2: configuración del reto */}
                        {wizardStep === 2 && (
                            <>
                                {selectedTopic && (
                                    <View style={styles.selectedTopicBadge}>
                                        <Text style={styles.selectedTopicText}>{selectedTopic.label}</Text>
                                    </View>
                                )}
                                <Text style={styles.fieldLabel}>Nombre del reto</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej. Maratón semanal"
                                    placeholderTextColor="#AEB5C2"
                                    value={form.title}
                                    onChangeText={(title) => setForm((f) => ({ ...f, title }))}
                                />
                                <Stepper
                                    label="Preguntas"
                                    value={form.questionCount}
                                    min={5}
                                    max={100}
                                    step={5}
                                    onChange={(v) => setForm((f) => ({ ...f, questionCount: v }))}
                                />
                                <Stepper
                                    label="Opopoints de premio"
                                    value={form.rewardPoints}
                                    min={10}
                                    max={500}
                                    step={10}
                                    onChange={(v) => setForm((f) => ({ ...f, rewardPoints: v }))}
                                />
                                <TouchableOpacity
                                    style={[styles.btn, (!form.title.trim() || creating) && { opacity: 0.5 }]}
                                    onPress={handleCreate}
                                    activeOpacity={0.85}
                                    disabled={!form.title.trim() || creating}
                                >
                                    {creating
                                        ? <ActivityIndicator size="small" color="#fff" />
                                        : <Text style={styles.btnText}>Crear reto</Text>
                                    }
                                </TouchableOpacity>
                            </>
                        )}

                        <TouchableOpacity onPress={() => setWizardVisible(false)} style={{ marginTop: 8 }}>
                            <Text style={styles.cancel}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.grayLight },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: colors.textDark, marginRight: 'auto' },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingTop: 6,
        paddingBottom: spacing.sm,
    },
    // Figma (NAV 2336:963 "Ellipse 352"): botón de volver = 24x24dp exacto.
    backBtn: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: 'rgba(65, 41, 80, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Figma (2336:965 "Retos"): fontSize 21dp exacto.
    headerTitle: { fontSize: 21, fontWeight: '600', color: colors.textDark, letterSpacing: -0.3 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: 24 },
    // Figma (2336:991 "RETOS ACTIVOS"): fontSize 16dp exacto.
    groupTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, letterSpacing: 0.4, marginBottom: 8, marginTop: 8, textTransform: 'uppercase' },
    empty: { textAlign: 'center', color: colors.textMuted, fontSize: 12.5, marginBottom: 10 },
    card: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: spacing.md, marginBottom: 9 },
    // Figma (2337:1025/1003 "Maratón semanal"): fontSize 16dp exacto.
    cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, textAlign: 'center' },
    // Figma (2337:1024/1002 subtítulos): fontSize 7dp exacto.
    cardSubtitle: { fontSize: 7, fontWeight: '600', color: colors.accentOrange, textAlign: 'center', marginTop: 2 },
    // Figma (Vector 2337:1021/999): barra de progreso de 11.6dp de alto exacto.
    progressTrack: { height: 12, backgroundColor: '#EEF1F7', borderRadius: 6, marginTop: spacing.sm, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: colors.ctaGreen },
    cardFootRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
    // Figma (2337:1001 "12 de 28 del clan ya lo hicieron"): fontSize 9dp exacto.
    progressCaption: { fontSize: 9, fontWeight: '400', color: colors.textDark, flex: 1 },
    // Figma (2337:1000 "6h restantes"): fontSize 9dp exacto.
    timeBadge: { fontSize: 9, fontWeight: '700', color: colors.accentOrange },
    // Figma (2337:1022 "Iniciar"): fontSize 9dp exacto.
    startLink: { fontSize: 9, fontWeight: '700', color: colors.ctaGreen },
    startLinkDone: { color: colors.textMuted },
    createCard: { backgroundColor: colors.ctaGreen, borderRadius: 14, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center', marginTop: spacing.sm },
    // Figma (2337:1029 "+ Crear reto para tu clan"): fontSize 16dp exacto.
    createTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
    // Figma (2337:1030 "Elige tema, nº de preguntas y duración"): fontSize 7dp exacto.
    createCaption: { fontSize: 7, fontWeight: '500', color: colors.white, marginTop: 2 },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%', maxHeight: '80%' },
    wizardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    wizardBack: { fontSize: 13, fontWeight: '600', color: colors.ctaGreen },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', flex: 1, textAlign: 'center' },
    wizardStep: { fontSize: 11, color: colors.textMuted, fontWeight: '600' },
    topicList: { maxHeight: 320 },
    topicItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 4, borderBottomWidth: 1, borderBottomColor: '#F0F2F6' },
    topicItemText: { fontSize: 13, fontWeight: '500', color: '#0F1B33', flex: 1 },
    topicItemArrow: { fontSize: 18, color: colors.ctaGreen, marginLeft: 8 },
    selectedTopicBadge: { backgroundColor: `${colors.ctaGreen}22`, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10, alignSelf: 'flex-start', marginBottom: 12 },
    selectedTopicText: { fontSize: 11, fontWeight: '700', color: colors.ctaGreen },
    fieldLabel: { fontSize: 11, fontWeight: '600', color: '#0F1B33', marginBottom: 4 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 14 },
    stepperRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    stepperLabel: { fontSize: 13, fontWeight: '500', color: '#0F1B33' },
    stepperControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    stepperBtn: { width: 32, height: 32, borderRadius: 8, backgroundColor: '#F0F2F6', alignItems: 'center', justifyContent: 'center' },
    stepperBtnText: { fontSize: 18, fontWeight: '700', color: '#0F1B33', lineHeight: 22 },
    stepperValue: { fontSize: 16, fontWeight: '700', color: '#0F1B33', minWidth: 32, textAlign: 'center' },
    btn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8 },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
