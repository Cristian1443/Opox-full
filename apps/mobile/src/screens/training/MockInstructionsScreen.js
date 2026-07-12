import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import NudgeModal from '../../components/NudgeModal';

// Acento del flujo Simulacros (verde, mismo que la card 6.1)
const SIM_COLOR = '#1f9d6b';
const SIM_BG = '#EAF7F1';

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

function IconList({ color = SIM_COLOR }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={5} cy={7} r={1.5} fill={color} />
            <Circle cx={5} cy={12} r={1.5} fill={color} />
            <Circle cx={5} cy={17} r={1.5} fill={color} />
            <Path d="M10 7h11M10 12h11M10 17h8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconTimer({ color = '#E89B2C' }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={13} r={8} stroke={color} strokeWidth={1.7} />
            <Path d="M12 8v5l3 2M9 3h6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconMinusCircle({ color = '#E2483D' }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Path d="M8 12h8" stroke={color} strokeWidth={2} strokeLinecap="round" />
        </Svg>
    );
}

function IconAlertBig() {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3l9 16H3z" stroke="#E89B2C" strokeWidth={1.8} strokeLinejoin="round" />
            <Path d="M12 9v4M12 16v.3" stroke="#E89B2C" strokeWidth={1.9} strokeLinecap="round" />
        </Svg>
    );
}

function IconStart() {
    return (
        <Svg width={26} height={26} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={10} stroke="#FF6B4A" strokeWidth={1.8} />
            <Path d="M10 8l6 4-6 4z" fill="#FF6B4A" />
        </Svg>
    );
}

// ─── Pantalla 6.7 · Simulacro · Instrucciones ────────────────────────────────
export default function MockInstructionsScreen({ navigation, route }) {
    const { exam } = route.params ?? {};

    // Fallback por si alguien navega directo sin params (dev / deep link)
    const safeExam = exam ?? {
        id: 'demo',
        year: '2023',
        title: 'Examen oficial 2023',
        category: 'Justicia · Tramitación',
        questions: 100,
        minutes: 90,
        status: 'pending',
    };

    // El default es contrarreloj (examen oficial). El CTA secundario permite
    // arrancar el mismo examen en modo estudio (sin cronómetro) para primeras
    // vueltas y aprendizaje.
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [pendingTimerMode, setPendingTimerMode] = useState(true);
    const timerMode = pendingTimerMode;

    const openConfirmOfficial = () => {
        setPendingTimerMode(true);
        setConfirmOpen(true);
    };
    const openConfirmStudy = () => {
        setPendingTimerMode(false);
        setConfirmOpen(true);
    };

    const startExam = () => {
        setConfirmOpen(false);
        navigation.navigate('TrainingSession', {
            source: 'official',
            examId: safeExam.id,
            questionsCount: safeExam.questions,
            minutes: safeExam.minutes,
            timerMode: pendingTimerMode,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader title="Simulacro" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Cabecera con año y título */}
                <View style={styles.yearBadge}>
                    <Text style={styles.yearBadgeText}>{safeExam.year}</Text>
                </View>
                <Text style={styles.examTitle}>{safeExam.title}</Text>
                <Text style={styles.examCategory}>{safeExam.category}</Text>

                {/* Resumen visual */}
                <View style={styles.summaryCard}>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{safeExam.questions}</Text>
                        <Text style={styles.summaryLabel}>PREGUNTAS</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryValue}>{safeExam.minutes}</Text>
                        <Text style={styles.summaryLabel}>MINUTOS</Text>
                    </View>
                </View>

                {/* Reglas / condiciones */}
                <Text style={styles.groupTitle}>CONDICIONES</Text>

                <View style={styles.ruleItem}>
                    <View style={[styles.ruleIcon, { backgroundColor: SIM_BG }]}>
                        <IconList />
                    </View>
                    <View style={styles.ruleContent}>
                        <Text style={styles.ruleTitle}>Formato</Text>
                        <Text style={styles.ruleValue}>{safeExam.questions} preguntas tipo test</Text>
                    </View>
                </View>

                <View style={styles.ruleItem}>
                    <View style={[styles.ruleIcon, { backgroundColor: '#FFF4E5' }]}>
                        <IconTimer />
                    </View>
                    <View style={styles.ruleContent}>
                        <Text style={styles.ruleTitle}>Tiempo</Text>
                        <Text style={styles.ruleValue}>
                            {safeExam.minutes} minutos {timerMode ? '· contrarreloj' : '· sin límite'}
                        </Text>
                    </View>
                </View>

                <View style={styles.ruleItem}>
                    <View style={[styles.ruleIcon, { backgroundColor: '#FDEBE9' }]}>
                        <IconMinusCircle />
                    </View>
                    <View style={styles.ruleContent}>
                        <Text style={styles.ruleTitle}>Penalización</Text>
                        <Text style={styles.ruleValue}>Cada 3 fallos resta 1 acierto</Text>
                    </View>
                </View>

                {/* Aviso contrarreloj */}
                {timerMode && (
                    <View style={styles.warningCard}>
                        <IconAlertBig />
                        <Text style={styles.warningText}>
                            Cuando lleguen los {safeExam.minutes} minutos entregamos el examen tal como esté.
                        </Text>
                    </View>
                )}
            </ScrollView>

            {/* CTA fijo abajo: examen oficial (primary) + modo estudio (ghost) */}
            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btn} onPress={openConfirmOfficial} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Comenzar examen</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnGhost} onPress={openConfirmStudy} activeOpacity={0.85}>
                    <Text style={styles.btnGhostText}>Practicar sin límite de tiempo</Text>
                </TouchableOpacity>
            </View>

            {/* Confirmación antes de arrancar */}
            {confirmOpen && (
                <NudgeModal
                    visible
                    iconBg="#FFF1EC"
                    icon={<IconStart />}
                    title={pendingTimerMode ? '¿Empezar el simulacro?' : '¿Practicar sin cronómetro?'}
                    description={
                        pendingTimerMode
                            ? `Una vez pulses "Sí, empezar", el cronómetro de ${safeExam.minutes} minutos se pondrá en marcha y no se puede pausar.`
                            : 'Podrás pausar y volver cuando quieras. Al terminar verás tu resultado, pero no cuenta como intento oficial en tus estadísticas.'
                    }
                    primaryLabel="Sí, empezar"
                    secondaryLabel="Todavía no"
                    onPrimaryPress={startExam}
                    onSecondaryPress={() => setConfirmOpen(false)}
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
    body: { paddingHorizontal: 16, paddingBottom: 150 },

    yearBadge: {
        alignSelf: 'flex-start',
        backgroundColor: SIM_BG,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 8,
    },
    yearBadgeText: { fontSize: 11, fontWeight: '800', color: SIM_COLOR, letterSpacing: 0.3 },
    examTitle: { fontSize: 20, fontWeight: '800', color: '#0F1B33', marginBottom: 4 },
    examCategory: { fontSize: 12.5, color: '#7A8290', marginBottom: 16 },

    summaryCard: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 18,
    },
    summaryItem: { flex: 1, alignItems: 'center' },
    summaryDivider: { width: 1, height: 40, backgroundColor: '#EEF1F7' },
    summaryValue: { fontSize: 28, fontWeight: '800', color: '#0F1B33', lineHeight: 30 },
    summaryLabel: { fontSize: 10, fontWeight: '700', color: '#7A8290', letterSpacing: 0.4, marginTop: 3 },

    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 10 },

    ruleItem: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 9,
    },
    ruleIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    ruleContent: { flex: 1 },
    ruleTitle: { fontSize: 12, fontWeight: '700', color: '#1B2A4A' },
    ruleValue: { fontSize: 11.5, color: '#5A6373', marginTop: 2 },

    warningCard: {
        backgroundColor: '#FFF4E5',
        borderWidth: 1.5,
        borderColor: '#F5D9A8',
        borderRadius: 14,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 8,
    },
    warningText: { flex: 1, fontSize: 12, color: '#8A5A17', fontWeight: '600', lineHeight: 17 },

    btnRow: {
        position: 'absolute',
        bottom: 16,
        left: 18,
        right: 18,
        gap: 8,
    },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
    btnGhost: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#D4DAE6',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    btnGhostText: { color: '#1B2A4A', fontSize: 13, fontWeight: '700' },
});
