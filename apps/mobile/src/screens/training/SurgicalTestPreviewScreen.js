import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';

// Acentos: rojo del Lab (6.8) + morado del refuerzo IA
const LAB_COLOR = '#E2483D';
const LAB_BG = '#FDEBE9';
const AI_COLOR = '#7B4BC4';
const AI_BG = '#F1ECFA';

// ─── Iconos SVG ──────────────────────────────────────────────────────────────

function IconTarget({ color = LAB_COLOR }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={5} stroke={color} strokeWidth={1.7} />
            <Circle cx={12} cy={12} r={1.5} fill={color} />
        </Svg>
    );
}

function IconClock({ color = LAB_COLOR }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.7} />
            <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconScale({ color = LAB_COLOR }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3v18M4 21h16" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
            <Path d="M4 6h16M6 6l-3 5h6zM18 6l-3 5h6z" stroke={color} strokeWidth={1.6} strokeLinejoin="round" />
        </Svg>
    );
}

function IconBrain({ color = AI_COLOR }) {
    return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7 4 4 0 0 0 4 5 3 3 0 0 0 4 1 3 3 0 0 0 4-1 4 4 0 0 0 4-5 4 4 0 0 0-1-7 4 4 0 0 0-4-4 3 3 0 0 0-5 0z"
                stroke={color}
                strokeWidth={1.6}
            />
            <Path d="M12 6v13" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
    );
}

// Icono por sub-tema. En el backend real vendrá con el topic.
const ICON_BY_TOPIC = {
    plazos: IconClock,
    recursos: IconScale,
};

// ─── Pantalla 6.9 · Test Quirúrgico · Preview ────────────────────────────────
export default function SurgicalTestPreviewScreen({ navigation, route }) {
    const params = route.params ?? {};
    const topic = params.topic ?? 'Plazos y recursos';
    const domain = params.domain ?? 36;

    // Mock del desglose. En backend real: /training/surgical/preview?topicId=X
    const subtopics = [
        { id: 'plazos', label: 'Plazos administrativos', count: 8 },
        { id: 'recursos', label: 'Recursos administrativos', count: 7 },
    ];
    const total = subtopics.reduce((acc, s) => acc + s.count, 0);

    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, []);

    const startTest = () => {
        navigation.navigate('TrainingSession', {
            source: 'surgical',
            topicId: params.topicId,
            topic,
            questionsCount: total,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#F4F6FA" />
            <View style={styles.statusBar}><Text style={styles.statusBarTime}>9:41</Text></View>

            <ScreenHeader title="Test quirúrgico" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fade }}>
                    {/* Diagnóstico */}
                    <View style={styles.diagCard}>
                        <View style={styles.diagHead}>
                            <IconTarget />
                            <Text style={styles.diagTitle}>Test de refuerzo a medida</Text>
                        </View>
                        <Text style={styles.diagText}>
                            Generado específicamente para tus fallos en{' '}
                            <Text style={styles.highlight}>{topic}</Text>.
                        </Text>
                        <View style={styles.diagStat}>
                            <Text style={styles.diagStatLabel}>Dominio actual del tema</Text>
                            <Text style={styles.diagStatValue}>{domain}%</Text>
                        </View>
                    </View>

                    {/* Qué incluye */}
                    <Text style={styles.groupTitle}>QUÉ INCLUYE</Text>

                    {subtopics.map((s, i) => {
                        const Icon = ICON_BY_TOPIC[s.id] ?? IconTarget;
                        return (
                            <View
                                key={s.id}
                                style={[
                                    styles.subtopicItem,
                                    i === subtopics.length - 1 && { marginBottom: 14 },
                                ]}
                            >
                                <View style={styles.subtopicIcon}>
                                    <Icon />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.subtopicTitle}>{s.label}</Text>
                                    <Text style={styles.subtopicCount}>{s.count} preguntas</Text>
                                </View>
                            </View>
                        );
                    })}

                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total de preguntas</Text>
                        <Text style={styles.totalValue}>{total}</Text>
                    </View>

                    {/* Beneficio IA */}
                    <View style={styles.benefitCard}>
                        <IconBrain />
                        <Text style={styles.benefitText}>
                            Al terminar este test, la IA volverá a medir tu dominio del tema para ver si has mejorado.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>

            <View style={styles.btnRow}>
                <TouchableOpacity style={styles.btn} onPress={startTest} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Empezar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F4F6FA' },
    statusBar: { height: 30, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 16 },
    statusBarTime: { fontSize: 10, fontWeight: '700', color: '#1B2A4A', marginRight: 'auto' },
    scroll: { flex: 1 },
    body: { paddingHorizontal: 16, paddingBottom: 100 },

    // ── Diagnóstico ────────────────────────────────
    diagCard: {
        backgroundColor: LAB_BG,
        borderWidth: 1.5,
        borderColor: LAB_COLOR,
        borderRadius: 16,
        padding: 14,
        marginTop: 4,
        marginBottom: 18,
    },
    diagHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
    diagTitle: { fontSize: 13.5, fontWeight: '800', color: '#0F1B33' },
    diagText: { fontSize: 12.5, color: '#5A6373', lineHeight: 18, marginBottom: 12 },
    highlight: { color: LAB_COLOR, fontWeight: '800' },
    diagStat: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(226,72,61,0.2)',
    },
    diagStatLabel: { fontSize: 11.5, color: '#7A5A56' },
    diagStatValue: { fontSize: 18, fontWeight: '800', color: LAB_COLOR },

    // ── Grupo "qué incluye" ────────────────────────
    groupTitle: { fontSize: 10.5, fontWeight: '700', color: '#5A6373', letterSpacing: 0.4, marginBottom: 10 },

    subtopicItem: {
        backgroundColor: '#fff',
        borderWidth: 1.5,
        borderColor: '#EEF1F7',
        borderRadius: 14,
        padding: 13,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 8,
    },
    subtopicIcon: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: LAB_BG,
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtopicTitle: { fontSize: 13, fontWeight: '700', color: '#1B2A4A' },
    subtopicCount: { fontSize: 11.5, color: '#7A8290', marginTop: 2 },

    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        marginBottom: 18,
        paddingHorizontal: 4,
    },
    totalLabel: { fontSize: 12, color: '#5A6373', fontWeight: '600' },
    totalValue: { fontSize: 18, fontWeight: '800', color: '#0F1B33' },

    // ── Beneficio IA ────────────────────────────────
    benefitCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        backgroundColor: AI_BG,
        borderWidth: 1.5,
        borderColor: '#D9CFEF',
        borderRadius: 14,
        padding: 13,
    },
    benefitText: { flex: 1, fontSize: 12, color: '#3F2E5C', lineHeight: 17, fontWeight: '500' },

    // ── CTA fijo ────────────────────────────────────
    btnRow: { position: 'absolute', bottom: 16, left: 18, right: 18 },
    btn: { backgroundColor: '#FF6B4A', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
    btnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
