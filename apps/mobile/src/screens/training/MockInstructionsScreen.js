import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView } from 'react-native';
import Svg, { Path, Circle } from 'react-native-svg';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';

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
        <Svg width={56} height={56} viewBox="0 0 24 24" fill="none">
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

    const startExam = () => {
        navigation.navigate('TrainingSession', {
            source: 'official',
            examId: safeExam.id,
            questionsCount: safeExam.questions,
            minutes: safeExam.minutes,
            timerMode: true,
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

            <ScreenHeader title="Simulacro" onBack={() => navigation.goBack()} />

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>

                {/* Cabecera visual centrada */}
                <View style={styles.heroCard}>
                    <View style={styles.heroIcon}>
                        <IconDocMedalBig />
                    </View>
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
                <TouchableOpacity style={styles.btn} onPress={startExam} activeOpacity={0.85}>
                    <Text style={styles.btnText}>Comenzar examen</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    body: { paddingHorizontal: spacing.md, paddingBottom: 120 },

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
    heroIcon: {
        width: 80,
        height: 80,
        borderRadius: 20,
        backgroundColor: colors.grayLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    examTitle: { fontSize: 20, fontWeight: '800', color: colors.dark, marginBottom: 4, textAlign: 'center' },
    examCategory: { fontSize: 12, color: colors.textSecondary, textAlign: 'center' },

    groupTitle: {
        fontSize: 10.5,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 0.5,
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
        color: colors.dark,
        fontWeight: '500',
    },

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
    btn: {
        backgroundColor: colors.success,
        borderRadius: 14,
        paddingVertical: spacing.md,
        alignItems: 'center',
    },
    btnText: { color: colors.white, fontSize: 16, fontWeight: '700' },
});
