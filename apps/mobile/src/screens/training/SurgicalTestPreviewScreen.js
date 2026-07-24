import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Animated } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';

// Icono target para los items del listado
function IconDot({ color = colors.primary }) {
    return (
        <Svg width={10} height={10} viewBox="0 0 10 10">
            <Circle cx={5} cy={5} r={4} fill={color} />
        </Svg>
    );
}

function IconBrain({ color = colors.white }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
                d="M9 3a4 4 0 0 0-4 4 4 4 0 0 0-1 7 4 4 0 0 0 4 5 3 3 0 0 0 4 1 3 3 0 0 0 4-1 4 4 0 0 0 4-5 4 4 0 0 0-1-7 4 4 0 0 0-4-4 3 3 0 0 0-5 0z"
                stroke={color} strokeWidth={1.6}
            />
            <Path d="M12 6v13" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
        </Svg>
    );
}

// Ilustración SVG simplificada del test quirúrgico
function IllustrationSurgical() {
    return (
        <Svg width={100} height={100} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v14H6z" stroke={colors.primary} strokeWidth={1.2} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={colors.primary} strokeWidth={1.2} strokeLinejoin="round" />
            <Path d="M9 10h7M9 13h5" stroke={colors.primary} strokeWidth={1.2} strokeLinecap="round" />
            <Circle cx={17} cy={17} r={5} fill={colors.success} />
            <Path d="M14.5 17l1.5 1.5 3-3" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const ICON_BY_TOPIC = {};

// ─── Pantalla 6.9 · Test Quirúrgico · Preview ────────────────────────────────
export default function SurgicalTestPreviewScreen({ navigation, route }) {
    const params = route.params ?? {};
    const topic = params.topic ?? 'Plazos y recursos';
    const domain = params.domain ?? 36;

    // mock — reemplazar con dato real del backend
    const subtopics = [
        { id: 'plazos', label: 'Plazos administrativos', count: 8 },
        { id: 'recursos', label: 'Recursos administrativos', count: 7 },
    ];
    const total = subtopics.reduce((acc, s) => acc + s.count, 0);

    const fade = useRef(new Animated.Value(0)).current;
    useEffect(() => {
        Animated.timing(fade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
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
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScreenHeader title="Test quirúrgico" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                <Animated.View style={{ opacity: fade }}>
                    {/* Ilustración + título hero */}
                    <View style={styles.heroCard}>
                        <View style={styles.illustration}>
                            <IllustrationSurgical />
                        </View>
                        <Text style={styles.heroTitle}>Test de refuerzo a medida</Text>
                        <Text style={styles.heroSub}>{total} preguntas centradas en tus fallos</Text>
                    </View>

                    {/* Qué incluye */}
                    <Text style={styles.groupTitle}>QUÉ INCLUYE</Text>

                    {subtopics.map((s) => (
                        <View key={s.id} style={styles.bulletItem}>
                            <IconDot />
                            <Text style={styles.bulletText}>
                                <Text style={styles.bulletLabel}>{s.label}</Text>
                                {' · '}{s.count} preguntas
                            </Text>
                        </View>
                    ))}

                    {/* Banner IA morado */}
                    <View style={styles.aiBanner}>
                        <IconBrain />
                        <Text style={styles.aiText}>
                            Tras este test, la IA volverá a medir tu dominio del tema para ver si has mejorado.
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
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: 100 },

    heroCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    illustration: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    heroTitle: { fontSize: 18, fontWeight: '800', color: colors.dark, textAlign: 'center', marginBottom: 4 },
    heroSub: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },

    groupTitle: {
        fontSize: 10.5,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.5,
        marginBottom: spacing.md,
    },
    bulletItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },
    bulletText: { fontSize: 14, color: colors.dark },
    bulletLabel: { fontWeight: '700' },

    aiBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.purple,
        borderRadius: 14,
        padding: spacing.md,
        marginTop: spacing.md,
    },
    aiText: { flex: 1, fontSize: 13, color: colors.white, lineHeight: 19 },

    btnRow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        backgroundColor: colors.background,
    },
    btn: { backgroundColor: colors.success, borderRadius: 14, paddingVertical: spacing.md, alignItems: 'center' },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
