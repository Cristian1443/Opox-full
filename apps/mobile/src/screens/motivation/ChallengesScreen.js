import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, ScrollView, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { RetoRecibidoModal } from '../../components/MotivationModals';
import { motivationApi } from '../../api';
import { colors, spacing } from '../../theme';

// Icono de chevron para el botón de volver (mismo patrón que el resto de Bloque 5).
// Figma (NAV 2336:964 "Vector"): ~5.6x11.1dp exacto dentro de un círculo de 24dp.
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

// Figma ("RETOS - LISTADO Y CREACION", 2336:959): título y subtítulo CENTRADOS arriba,
// luego la barra de progreso, y por último una fila inferior con la leyenda de progreso
// a la izquierda y el badge de tiempo (o "Iniciar") a la derecha — no título+badge en la
// misma fila de arriba, como tenía antes.
function ChallengeCard({ item, onComplete }) {
    const percent = item.memberCount > 0 ? Math.round((item.completedCount / item.memberCount) * 100) : 0;
    const left = hoursLeft(item.expiresAt);
    // Dos variantes de tarjeta en Figma: "Reto diario del clan" (con cuenta atrás) y
    // "Maratón semanal" (sin fecha límite, acción "Iniciar" + premio en Opopoints). El
    // modelo de datos actual no expone un campo `type`, así que usamos la ausencia de
    // `expiresAt` como mejor aproximación disponible.
    const isMarathon = !item.expiresAt;
    const subtitle = isMarathon
        ? [
            item.questionCount != null ? `${item.questionCount} preguntas` : null,
            item.rewardPoints != null ? `premio ${item.rewardPoints} Opopoints` : null,
        ].filter(Boolean).join(' · ')
        : item.subtitle;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => !item.completedByMe && onComplete(item)}
            activeOpacity={item.completedByMe ? 1 : 0.7}
        >
            <Text style={styles.cardTitle}>{item.title}</Text>
            {!!subtitle && <Text style={styles.cardSubtitle}>{subtitle}</Text>}

            <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${percent}%` }]} />
            </View>

            <View style={styles.cardFootRow}>
                <Text style={styles.progressCaption}>
                    {!isMarathon && (
                        <>
                            {item.completedByMe ? '✓ Ya lo completaste · ' : ''}
                            {item.completedCount} de {item.memberCount} del clan ya lo hicieron
                        </>
                    )}
                </Text>
                {isMarathon ? (
                    <Text style={styles.startLink}>Iniciar</Text>
                ) : (
                    left !== null && (
                        <Text style={styles.timeBadge}>{left > 0 ? `${left}h restantes` : 'Caducado'}</Text>
                    )
                )}
            </View>
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
                    challenges.map((c) => <ChallengeCard key={c.id} item={c} onComplete={handleComplete} />)
                )}

                <TouchableOpacity style={styles.createCard} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
                    <Text style={styles.createTitle}>+ Crear reto para tu clan</Text>
                    <Text style={styles.createCaption}>Elige tema, nº de preguntas y duración</Text>
                </TouchableOpacity>

                {/* Vista previa temporal del popup "reto recibido" — no hay sistema de
                    retos 1vs1 entre usuarios todavía, solo retos de clan. Afordancia
                    solo de desarrollo, discreta a propósito (no forma parte del Figma). */}
                <TouchableOpacity style={styles.previewBtn} onPress={() => setPreviewVisible(true)}>
                    <Text style={styles.previewBtnText}>DEV · Vista previa: reto recibido</Text>
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

            <RetoRecibidoModal
                visible={previewVisible}
                challengerName="Ana_G"
                description="Reto de 20 preguntas de Constitución. ¿Aceptas el desafío?"
                onPrimaryPress={() => setPreviewVisible(false)}
                onSecondaryPress={() => setPreviewVisible(false)}
            />
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
    // Figma (2336:965 "Retos"): fontSize 21dp exacto (1dp = 2.25px de Figma).
    headerTitle: { fontSize: 21, fontWeight: '600', color: colors.textDark, letterSpacing: -0.3 },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 27, paddingBottom: 24 },
    // Figma (2336:991 "RETOS ACTIVOS"): fontSize 16dp exacto.
    groupTitle: { fontSize: 16, fontWeight: '700', color: colors.textDark, letterSpacing: 0.4, marginBottom: 8, marginTop: 8, textTransform: 'uppercase' },
    empty: { textAlign: 'center', color: colors.textMuted, fontSize: 12.5, marginBottom: 10 },
    card: { backgroundColor: colors.white, borderWidth: 1.5, borderColor: '#EEF1F7', borderRadius: 14, padding: spacing.md, marginBottom: 9 },
    // Figma: título y subtítulo CENTRADOS, la barra de progreso debajo, y una fila
    // inferior con la leyenda a la izquierda y el badge/"Iniciar" a la derecha.
    // Figma (2337:1025/1003 "Maratón semanal"/"Reto diario del clan"): fontSize 16dp exacto.
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
    createCard: { backgroundColor: colors.ctaGreen, borderRadius: 14, paddingVertical: spacing.md, paddingHorizontal: spacing.md, alignItems: 'center' },
    // Figma (2337:1029 "+ Crear reto para tu clan"): fontSize 16dp exacto.
    createTitle: { fontSize: 16, fontWeight: '700', color: colors.white },
    // Figma (2337:1030 "Elige tema, nº de preguntas y duración"): fontSize 7dp exacto.
    createCaption: { fontSize: 7, fontWeight: '500', color: colors.white, marginTop: 2 },
    previewBtn: { marginTop: spacing.lg, alignSelf: 'center', paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: colors.grayLight },
    previewBtnText: { fontSize: 10, fontWeight: '600', color: colors.textMuted },
    overlay: { flex: 1, backgroundColor: 'rgba(15,27,51,0.45)', alignItems: 'center', justifyContent: 'center', padding: 24 },
    modalCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18, width: '100%' },
    modalTitle: { fontSize: 15, fontWeight: '800', color: '#0F1B33', marginBottom: 12 },
    input: { borderWidth: 1.5, borderColor: '#E4E8F0', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#1B2A4A', marginBottom: 10 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
    cancel: { textAlign: 'center', color: '#8A92A0', fontSize: 12, fontWeight: '700' },
});
