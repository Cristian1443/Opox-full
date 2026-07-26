import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Animated, ActivityIndicator, Alert } from 'react-native';
import Svg, { Path, Circle, Rect } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';
import { api, trainingApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// Punto naranja para bullets
function Bullet() {
    return (
        <Svg width={10} height={10} viewBox="0 0 10 10">
            <Circle cx={5} cy={5} r={4} fill={colors.primary} />
        </Svg>
    );
}

// Ilustración: clipboard con checks + diana verde + chispas moradas
function IllustrationSurgical() {
    return (
        <Svg width={130} height={130} viewBox="0 0 130 130" fill="none">
            {/* Chispas moradas */}
            <Path d="M18 22 l0 8 M14 26 l8 0" stroke={colors.purple} strokeWidth={2.2} strokeLinecap="round" />
            <Path d="M112 30 l0 6 M109 33 l6 0" stroke={colors.purple} strokeWidth={2} strokeLinecap="round" />
            <Circle cx={110} cy={90} r={2.5} fill={colors.purple} />
            <Circle cx={22} cy={98} r={2} fill={colors.purple} />

            {/* Clipboard */}
            <Rect x={30} y={30} width={54} height={70} rx={6} stroke={colors.dark} strokeWidth={2} fill="#FFFFFF" />
            <Rect x={44} y={24} width={26} height={12} rx={3} stroke={colors.dark} strokeWidth={2} fill="#FFFFFF" />

            {/* Checks verdes */}
            <Path d="M40 50 l3 3 l6 -6" stroke={colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M56 50 h20" stroke={colors.dark} strokeWidth={2} strokeLinecap="round" />
            <Path d="M40 64 l3 3 l6 -6" stroke={colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M56 64 h20" stroke={colors.dark} strokeWidth={2} strokeLinecap="round" />
            <Path d="M40 78 l3 3 l6 -6" stroke={colors.success} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M56 78 h16" stroke={colors.dark} strokeWidth={2} strokeLinecap="round" />

            {/* Diana verde con check */}
            <Circle cx={95} cy={72} r={20} fill="#DCFCE7" stroke={colors.success} strokeWidth={2.5} />
            <Circle cx={95} cy={72} r={12} fill="#FFFFFF" stroke={colors.success} strokeWidth={2} />
            <Circle cx={95} cy={72} r={5} fill={colors.success} />
            <Path d="M91 72 l3 3 l7 -7" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ─── Pantalla 6.9 · Test Quirúrgico · Preview ────────────────────────────────
export default function SurgicalTestPreviewScreen({ navigation, route }) {
    const params = route.params ?? {};
    const topic = params.topic ?? 'Plazos y recursos';

    const subtopics = [
        { id: 'plazos', label: 'Plazos administrativos', count: 8 },
        { id: 'recursos', label: 'Recursos', count: 7 },
    ];
    const total = subtopics.reduce((acc, s) => acc + s.count, 0);

    const [generating, setGenerating] = useState(false);

    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
    }, []);

    const startTest = async () => {
        if (generating) return;
        setGenerating(true);
        const session = await api.loadSession();
        const oposicion =
            session?.user?.oposicion ??
            session?.user?.user_metadata?.oposicion ??
            'justicia-tramitacion';
        // El backend calcula los errorPatterns del usuario y pide el test
        // quirúrgico a la IA (siempre difficulty hard).
        const { data, error } = await trainingApi.generateSurgical(oposicion, 10);
        setGenerating(false);
        if (error || !data?.questions || data.questions.length === 0) {
            Alert.alert(
                'No se pudo generar el test',
                'La IA no devolvió preguntas. Inténtalo de nuevo en un momento.',
            );
            return;
        }
        navigation.navigate('TrainingSession', {
            source: 'surgical',
            questions: adaptGeneratedQuestions(data.questions),
            examTitle: 'Test quirúrgico',
            timedMode: true,
            oposicion,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScreenHeader title="Test quirúrgico" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fade }}>
                    <View style={styles.illustration}>
                        <IllustrationSurgical />
                    </View>

                    <Text style={styles.heroTitle}>Test de refuerzo a medida</Text>
                    <Text style={styles.heroSub}>{total} preguntas centradas en tus fallos</Text>

                    <Text style={styles.groupTitle}>QUÉ INCLUYE</Text>

                    {subtopics.map((s) => (
                        <View key={s.id} style={styles.bulletItem}>
                            <Bullet />
                            <Text style={styles.bulletText}>
                                <Text style={styles.bulletLabel}>{s.label}</Text>
                                {' · '}{s.count} preguntas
                            </Text>
                        </View>
                    ))}

                    <TouchableOpacity
                        style={[styles.btn, generating && { opacity: 0.7 }]}
                        onPress={startTest}
                        activeOpacity={0.85}
                        disabled={generating}
                    >
                        {generating ? (
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                                <ActivityIndicator color="#fff" size="small" />
                                <Text style={styles.btnText}>Generando preguntas…</Text>
                            </View>
                        ) : (
                            <Text style={styles.btnText}>Empezar</Text>
                        )}
                    </TouchableOpacity>

                    <View style={styles.aiChip}>
                        <Text style={styles.aiChipText}>
                            Tras este test, la IA volverá a medir tu dominio del tema para ver si has mejorado.
                        </Text>
                    </View>
                </Animated.View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: spacing.xl },

    illustration: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: spacing.md,
        marginBottom: spacing.sm,
    },
    heroTitle: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.dark,
        textAlign: 'center',
        marginBottom: 4,
    },
    heroSub: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: spacing.lg,
    },

    groupTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.dark,
        letterSpacing: 0.5,
        marginBottom: spacing.md,
        marginTop: spacing.sm,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 10,
    },
    bulletText: { fontSize: 14, color: colors.dark },
    bulletLabel: { fontWeight: '700' },

    btn: {
        backgroundColor: colors.success,
        borderRadius: 14,
        paddingVertical: spacing.md,
        alignItems: 'center',
        marginTop: spacing.lg,
    },
    btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

    aiChip: {
        backgroundColor: colors.purpleBg,
        borderRadius: 12,
        padding: 12,
        marginTop: spacing.md,
    },
    aiChipText: {
        fontSize: 12,
        color: colors.purple,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 17,
    },
});
