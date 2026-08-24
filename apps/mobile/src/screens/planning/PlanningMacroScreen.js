import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { planningApi } from '../../api';
import { colors, spacing } from '../../theme';

const DEFAULT_OPOSICION = 'justicia-tramitacion';

// Colores confirmados contra Figma (frame OPOSICION, Bloque 4) sin
// equivalente exacto en theme.js.
const FIGMA = {
    cardFaltan: '#F5F5F5',
    pendingOutline: '#D9D9D9',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
};

function CheckIcon() {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path d="M5 13l4.5 4.5L19 7" stroke={colors.white} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

function ArrowIcon() {
    return (
        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
            <Path d="M5 12h14M13 6l6 6-6 6" stroke={colors.white} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// La API solo expone el status por fase (done/current/upcoming), no un
// rango de meses por fase — Figma muestra rangos ilustrativos ("Oct-Dic",
// "Ene-Mar"...) que no existen como dato real; se mantiene el subtítulo
// dinámico ya existente en vez de fabricar fechas.
function phaseSubtitle(status, index) {
    if (status === 'done') return 'Completada';
    if (status === 'current') return 'En curso';
    return `Fase ${index + 1}`;
}

function TopicLine({ topics }) {
    if (!topics?.length) return null;
    return (
        <Text style={styles.topicLine} numberOfLines={2}>
            {topics.map((t) => t.name).join(' · ')}
        </Text>
    );
}

function PhaseRow({ phase, index, isLast, navigation }) {
    const hasTopics = phase.topics?.length > 0;
    const topicIds = hasTopics ? phase.topics.map((t) => t.topicId).join(',') : null;

    return (
        <View style={[styles.phaseRow, index === 0 && styles.phaseRowTop, isLast && styles.phaseRowSeparator]}>
            {phase.status === 'done' ? (
                <View style={[styles.phaseIcon, styles.phaseIconCompleted]}><CheckIcon /></View>
            ) : phase.status === 'current' ? (
                <View style={[styles.phaseIcon, styles.phaseIconInProgress]}><View style={styles.phaseIconDot} /></View>
            ) : (
                <View style={[styles.phaseIcon, styles.phaseIconPending]} />
            )}
            <View style={styles.phaseTextWrap}>
                <Text style={styles.phaseTitle}>{phase.title}</Text>
                <Text style={styles.phaseSubtitle}>{phaseSubtitle(phase.status, index)}</Text>
                <TopicLine topics={phase.topics} />
                {phase.status === 'current' && hasTopics && (
                    <TouchableOpacity
                        style={styles.ctaBtn}
                        onPress={() => navigation.navigate('GeneratorConfig', {
                            topicId: topicIds,
                            questionCount: 20,
                        })}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.ctaBtnText}>Estudiar esta fase</Text>
                        <ArrowIcon />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
}

export default function PlanningMacroScreen({ navigation, route }) {
    const oposicion = route?.params?.oposicion ?? DEFAULT_OPOSICION;
    const [macro, setMacro] = useState(null);
    const [goalCount, setGoalCount] = useState(3);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        Promise.all([planningApi.getMacro(oposicion), planningApi.getPlan()]).then(([m, p]) => {
            setMacro(m.data);
            if (p.data) setGoalCount(p.data.testsPerDay);
            setLoaded(true);
        });
    }, [oposicion]);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.iconBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                    <Ionicons name="chevron-back" size={24} color={colors.textDark} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Rumbo a la plaza</Text>
                <View style={styles.iconBtn} />
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {!loaded ? null : macro ? (
                    <>
                        <View style={styles.card}>
                            <Text style={styles.cardFaltan}>Faltan</Text>
                            <Text style={styles.cardTime}>{macro.monthsLeft} meses</Text>
                            <Text style={styles.cardGoal}>Objetivo diario: {goalCount} tests</Text>
                        </View>

                        <Text style={styles.sectionLabel}>RUTAS POR FASES</Text>
                        <View style={styles.phasesList}>
                            {macro.phases.map((p, i) => (
                                <PhaseRow key={p.key} phase={p} index={i} isLast={i === macro.phases.length - 1} navigation={navigation} />
                            ))}
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyCard}>
                        <Text style={styles.emptyTitle}>Aún no tienes fecha de examen</Text>
                        <Text style={styles.emptyText}>Añádela en el ajuste del plan para ver tu cuenta atrás y la ruta por fases.</Text>
                        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('PlanningEdit')} activeOpacity={0.85}>
                            <Text style={styles.btnText}>Ajustar mi plan</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: 4,
    },
    iconBtn: { width: 32, padding: 4 },
    headerTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 24 },
    card: {
        backgroundColor: colors.bannerPurple,
        borderRadius: 20,
        paddingVertical: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    cardFaltan: { fontFamily: 'Poppins-Light', fontSize: 14.3, color: FIGMA.cardFaltan, textAlign: 'center' },
    cardTime: { marginTop: 4, fontFamily: 'Poppins-SemiBold', fontSize: 42.7, color: colors.white, textAlign: 'center' },
    cardGoal: { marginTop: 4, fontFamily: 'Poppins-SemiBold', fontSize: 14.2, color: colors.accentOrange, textAlign: 'center' },
    sectionLabel: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark, marginBottom: 8 },
    phasesList: { marginBottom: 24 },
    phaseRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 16,
    },
    phaseRowTop: { borderTopWidth: 0.44, borderTopColor: FIGMA.separator },
    phaseRowSeparator: { borderBottomWidth: 0.44, borderBottomColor: FIGMA.separator },
    phaseIcon: { width: 29, height: 29, borderRadius: 2.7, alignItems: 'center', justifyContent: 'center', marginRight: 14, marginTop: 2 },
    phaseIconCompleted: { backgroundColor: colors.ctaGreen },
    phaseIconInProgress: { backgroundColor: colors.accentOrange },
    phaseIconDot: { width: 13, height: 13, borderRadius: 6.5, backgroundColor: colors.white },
    phaseIconPending: { borderWidth: 0.44, borderColor: FIGMA.pendingOutline },
    phaseTextWrap: { flex: 1 },
    phaseTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 16, color: colors.textDark },
    phaseSubtitle: { marginTop: 2, fontFamily: 'Poppins-Regular', fontSize: 9, color: FIGMA.textNote },
    topicLine: { marginTop: 3, fontFamily: 'Poppins-Regular', fontSize: 9, color: FIGMA.textNote, lineHeight: 13 },
    ctaBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.accentOrange,
        borderRadius: 8,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginTop: 8,
        alignSelf: 'flex-start',
    },
    ctaBtnText: { fontFamily: 'Poppins-SemiBold', fontSize: 11.5, color: colors.white },
    emptyCard: { backgroundColor: colors.white, borderRadius: 14, padding: 20, alignItems: 'center', marginTop: 20 },
    emptyTitle: { fontFamily: 'Poppins-SemiBold', fontSize: 14, color: colors.textDark, marginBottom: 6, textAlign: 'center' },
    emptyText: { fontFamily: 'Poppins-Regular', fontSize: 11.5, color: FIGMA.textNote, textAlign: 'center', marginBottom: 16, lineHeight: 17 },
    btn: { backgroundColor: colors.ctaGreen, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 20 },
    btnText: { fontFamily: 'Poppins-SemiBold', fontSize: 13, color: colors.white },
});
