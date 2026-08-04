import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, ActivityIndicator, Alert } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import TrainingHeader from '../../components/TrainingHeader';
import { colors, spacing } from '../../theme';
import { trainingApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// Iconos para las condiciones del simulacro
function IconList({ color = colors.primary }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={5} cy={7} r={1.5} fill={color} />
            <Circle cx={5} cy={12} r={1.5} fill={color} />
            <Circle cx={5} cy={17} r={1.5} fill={color} />
            <Path d="M10 7h11M10 12h11M10 17h8" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconTimer({ color = colors.primary }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Circle cx={12} cy={13} r={8} stroke={color} strokeWidth={1.7} />
            <Path d="M12 8v5l3 2M9 3h6" stroke={color} strokeWidth={1.7} strokeLinecap="round" />
        </Svg>
    );
}

function IconWarning({ color = colors.primary }) {
    return (
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M12 3l9 16H3z" stroke={color} strokeWidth={1.7} strokeLinejoin="round" />
            <Path d="M12 9v4M12 16v.3" stroke={color} strokeWidth={1.9} strokeLinecap="round" />
        </Svg>
    );
}

// Icono documento+medalla grande para la cabecera
function IconDocMedalBig({ color = colors.primary }) {
    return (
        <Svg width={44} height={44} viewBox="0 0 24 24" fill="none">
            <Path d="M6 3h9l4 4v10H6z" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <Path d="M14 3v5h5" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
            <Circle cx={12} cy={17} r={3} stroke={color} strokeWidth={1.3} />
            <Path d="M11 20l-.5 2M13 20l.5 2" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
        </Svg>
    );
}

// ─── Pantalla 6.7 · Simulacro · Instrucciones ────────────────────────────────
export default function MockInstructionsScreen({ navigation, route }) {
    const { exam } = route.params ?? {};

    const safeExam = exam ?? {
        id: 'demo',
        year: '2023',
        title: 'Examen 2023',
        category: 'Justicia · Tramitación',
        questions: 100,
        minutes: 90,
        status: 'pending',
    };

    const [loading, setLoading] = useState(false);

    const startExam = async () => {
        if (loading) return;
        setLoading(true);
        const { data, error } = await trainingApi.getMockQuestions(safeExam.id);
        setLoading(false);
        if (error || !Array.isArray(data) || data.length === 0) {
            Alert.alert(
                'Simulacro no disponible',
                'Este examen no tiene preguntas cargadas todavía. Prueba con otro año o con el Generador Infinito.',
            );
            return;
        }
        // Reparto uniforme del tiempo total del examen entre preguntas — el
        // temporizador de la sesión funciona por-pregunta, no global.
        const secondsPerQuestion = Math.max(
            30,
            Math.round((safeExam.minutes * 60) / data.length),
        );
        navigation.navigate('TrainingSession', {
            source: 'official',
            questions: adaptGeneratedQuestions(data),
            examTitle: safeExam.title,
            timedMode: true,
            secondsPerQuestion,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

            <TrainingHeader
                eyebrow="Simulacro"
                title={`Examen oficial ${safeExam.year}`}
                onBack={() => navigation.goBack()}
                onSettings={() => navigation.navigate('Settings')}
            />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

                {/* Cabecera visual centrada — icono compacto, título grande */}
                <View style={styles.heroCard}>
                    <IconDocMedalBig />
                    <Text style={styles.examTitle}>{safeExam.title}</Text>
                    <Text style={styles.examCategory}>{safeExam.category}</Text>
                </View>

                {/* Condiciones */}
                <Text style={styles.groupTitle}>CONDICIONES</Text>

                <View style={styles.conditionItem}>
                    <IconList />
                    <Text style={styles.conditionText}>{safeExam.questions} preguntas tipo test</Text>
                </View>

                <View style={styles.conditionItem}>
                    <IconTimer />
                    <Text style={styles.conditionText}>{safeExam.minutes} minutos · contrarreloj</Text>
                </View>

                <View style={styles.conditionItem}>
                    <IconWarning />
                    <Text style={styles.conditionText}>Cada 3 fallos resta 1 acierto</Text>
                </View>
            </ScrollView>

            <View style={styles.btnRow}>
                <TouchableOpacity
                    style={[styles.btn, loading && { opacity: 0.7 }]}
                    onPress={startExam}
                    activeOpacity={0.85}
                    disabled={loading}
                >
                    {loading ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator color="#fff" size="small" />
                            <Text style={styles.btnText}>Cargando examen…</Text>
                        </View>
                    ) : (
                        <Text style={styles.btnText}>Comenzar examen</Text>
                    )}
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.white },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: 120 },

    heroCard: {
        backgroundColor: '#F1F3F7',
        borderRadius: 14,
        paddingVertical: 20,
        paddingHorizontal: spacing.lg,
        alignItems: 'center',
        marginBottom: spacing.lg,
    },
    examTitle: {
        fontSize: 22,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginTop: 8,
        marginBottom: 4,
        textAlign: 'center',
    },
    examCategory: { fontSize: 12, fontFamily: 'Poppins-Regular', color: colors.textDark, textAlign: 'center' },

    groupTitle: {
        fontSize: 16,
        fontFamily: 'Poppins-SemiBold',
        color: colors.textDark,
        marginBottom: spacing.md,
    },
    conditionItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 14,
    },
    conditionText: {
        fontSize: 14,
        color: colors.textDark,
        fontFamily: 'Poppins-Light',
    },

    btnRow: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.lg,
        paddingTop: spacing.sm,
        backgroundColor: colors.white,
    },
    btn: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 14,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    btnText: { color: colors.white, fontSize: 16, fontFamily: 'Poppins-SemiBold' },
});
