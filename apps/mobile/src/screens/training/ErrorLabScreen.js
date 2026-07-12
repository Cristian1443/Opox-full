import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';

// Acento del Laboratorio de Errores (rojo, mismo que la card 6.1)
const LAB_COLOR = '#E2483D';
const LAB_BG = '#FDEBE9';

// Mock de patrones (viene del backend cuando exista: /training/error-patterns)
const ERROR_PATTERNS = [
    {
        id: 'plazos',
        topic: 'Plazos y recursos',
        domain: 36,
        failRate: 64,
        description: 'Fallas el 64 % de las preguntas sobre plazos y recursos.',
        isPrimary: true,
    },
    {
        id: 'ley-39',
        topic: 'Ley 39/2015',
        domain: 52,
        failRate: 48,
        description: 'Necesitas reforzar conceptos clave de la Ley 39.',
        isPrimary: false,
    },
    {
        id: 'organizacion-estado',
        topic: 'Organización del Estado',
        domain: 58,
        failRate: 42,
        description: 'Algunos conceptos de la estructura estatal requieren repaso.',
        isPrimary: false,
    },
];

// Mapeo semántico de color por nivel de dominio
function getDomainColor(domain) {
    if (domain < 40) return '#E2483D'; // crítico
    if (domain < 70) return '#E89B2C'; // por mejorar
    return '#1f9d6b'; // sólido
}

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

function IconAlert({ color = LAB_COLOR }) {
    return (
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Path d="M12 7v6M12 16v.3" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
        </Svg>
    );
}

function IconTarget({ color = '#fff' }) {
    return (
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

function IconTargetBig({ color = '#C4CBD6' }) {
    return (
        <Svg width={48} height={48} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.5} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

// ─── Pantalla 6.8 · Laboratorio de Errores ───────────────────────────────────
const MIN_QUESTIONS_FOR_PATTERNS = 30;

export default function ErrorLabScreen({ navigation }) {
    const primary = ERROR_PATTERNS.find((p) => p.isPrimary);
    const others = ERROR_PATTERNS.filter((p) => !p.isPrimary);
    // Estado vacío: usuario nuevo sin historial suficiente.
    // Cuando exista backend: viene de summary.answeredCount < MIN.
    const hasEnoughHistory = ERROR_PATTERNS.length > 0;

    const startSurgical = () => {
        navigation.navigate('SurgicalTestPreview', {
            topicId: primary.id,
            topic: primary.topic,
            domain: primary.domain,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader title="Laboratorio de Errores" onBack={() => navigation.goBack()} />

            {!hasEnoughHistory ? (
                <View style={styles.emptyWrap}>
                    <IconTargetBig />
                    <Text style={styles.emptyTitle}>Aún no hay patrones que atacar</Text>
                    <Text style={styles.emptyDesc}>
                        Necesitamos que hagas al menos {MIN_QUESTIONS_FOR_PATTERNS} preguntas para que
                        la IA detecte en qué temas fallas más. Empieza con un test rápido.
                    </Text>
                    <TouchableOpacity
                        style={styles.emptyBtn}
                        onPress={() => navigation.navigate('GeneratorConfig')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.emptyBtnText}>Hacer un test rápido</Text>
                    </TouchableOpacity>
                </View>
            ) : (
            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Tarjeta principal: patrón detectado */}
                <View style={styles.primaryCard}>
                    <View style={styles.primaryHead}>
                        <Text style={styles.primaryLabel}>PATRÓN DE FALLO DETECTADO</Text>
                        <View style={styles.alertBadge}>
                            <IconAlert />
                        </View>
                    </View>

                    <Text style={styles.primaryTopic}>{primary.topic}</Text>

                    <View style={styles.statsRow}>
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: LAB_COLOR }]}>{primary.failRate}%</Text>
                            <Text style={styles.statLabel}>FALLOS</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statItem}>
                            <Text style={[styles.statValue, { color: getDomainColor(primary.domain) }]}>
                                {primary.domain}%
                            </Text>
                            <Text style={styles.statLabel}>DOMINIO</Text>
                        </View>
                    </View>

                    <Text style={styles.primaryDesc}>
                        {primary.description} Te preparamos un test de refuerzo a medida para ayudarte a mejorar.
                    </Text>

                    <TouchableOpacity style={styles.surgicalBtn} onPress={startSurgical} activeOpacity={0.9}>
                        <IconTarget />
                        <Text style={styles.surgicalBtnText}>Iniciar test quirúrgico</Text>
                    </TouchableOpacity>
                </View>

                {/* Otras debilidades */}
                <Text style={styles.groupTitle}>OTRAS DEBILIDADES</Text>

                {others.map((item) => {
                    const color = getDomainColor(item.domain);
                    return (
                        <TouchableOpacity
                            key={item.id}
                            style={styles.weaknessCard}
                            onPress={() => navigation.navigate('SurgicalTestPreview', {
                                topicId: item.id,
                                topic: item.topic,
                                domain: item.domain,
                            })}
                            activeOpacity={0.85}
                        >
                            <View style={styles.weaknessHead}>
                                <Text style={styles.weaknessTopic}>{item.topic}</Text>
                                <View style={[styles.domainBadge, { backgroundColor: color }]}>
                                    <Text style={styles.domainBadgeText}>{item.domain}%</Text>
                                </View>
                            </View>

                            <View style={styles.progressTrack}>
                                <View style={[styles.progressFill, { width: `${item.domain}%`, backgroundColor: color }]} />
                            </View>

                            <Text style={styles.weaknessDesc}>{item.description}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 32 },

    // ── Card principal (patrón detectado) ─────────────────────────
    primaryCard: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: LAB_COLOR,
        borderRadius: 16,
        padding: 16,
        marginBottom: 22,
        marginTop: 4,
        shadowColor: LAB_COLOR,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 4,
    },
    primaryHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    primaryLabel: { fontSize: 10.5, fontWeight: '800', color: LAB_COLOR, letterSpacing: 0.6 },
    alertBadge: {
        width: 26,
        height: 26,
        borderRadius: 13,
        backgroundColor: LAB_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryTopic: { fontSize: 18, fontWeight: '800', color: '#0F1B33', marginBottom: 14 },

    statsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
    statItem: { flex: 1, alignItems: 'center' },
    statValue: { fontSize: 22, fontWeight: '800', lineHeight: 26 },
    statLabel: { fontSize: 10, fontWeight: '700', color: '#8A92A0', letterSpacing: 0.4, marginTop: 3 },
    statDivider: { width: 1, height: 34, backgroundColor: '#EEF1F7', marginHorizontal: 8 },

    primaryDesc: { fontSize: 12.5, color: '#5A6373', lineHeight: 18, marginBottom: 16 },

    surgicalBtn: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingVertical: 13,
    },
    surgicalBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '800' },

    // ── Otras debilidades ─────────────────────────────────────────
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 10 },

    weaknessCard: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 13,
        marginBottom: 10,
    },
    weaknessHead: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    weaknessTopic: { fontSize: 13, fontWeight: '800', color: '#0F1B33' },
    domainBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    domainBadgeText: { color: '#fff', fontSize: 11, fontWeight: '800' },

    progressTrack: {
        height: 6,
        borderRadius: 3,
        backgroundColor: '#F4F6FA',
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: { height: '100%', borderRadius: 3 },

    weaknessDesc: { fontSize: 11.5, color: '#5A6373', lineHeight: 16 },

    // ── Empty state (sin historial) ──────────────────
    emptyWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#0F1B33',
        marginTop: 14,
        marginBottom: 6,
    },
    emptyDesc: {
        fontSize: 12.5,
        color: '#5A6373',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    emptyBtn: {
        backgroundColor: '#FF6B4A',
        borderRadius: 12,
        paddingHorizontal: 22,
        paddingVertical: 12,
    },
    emptyBtnText: { color: '#fff', fontSize: 13.5, fontWeight: '700' },
});
