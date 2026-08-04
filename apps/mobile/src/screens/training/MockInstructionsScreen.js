import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Dimensions,
    SafeAreaView,
    StatusBar,
    ScrollView,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { trainingApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// ------------------------------------------------------------------
// Escalado proporcional 1:1 respecto al frame original de Figma
// (905px de ancho).
// ------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DESIGN_WIDTH = 905;
const scale = (value) => (SCREEN_WIDTH / DESIGN_WIDTH) * value;

const COLORS = {
    purple900: colors.textDark,
    orange: colors.accentOrange,
    green: colors.ctaGreen,
    white: colors.white,
};

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
        <SafeAreaView style={styles.safe}>
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* ---------- HEADER ---------- */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7} onPress={() => navigation.goBack()}>
                    <Ionicons name="chevron-back" size={scale(28)} color={COLORS.purple900} />
                </TouchableOpacity>

                <Text style={styles.headerTitle} numberOfLines={1}>
                    Simulacro
                </Text>

                <TouchableOpacity style={styles.iconCircle} activeOpacity={0.7} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={scale(34)} color={COLORS.purple900} />
                </TouchableOpacity>
            </View>

            <Text style={styles.headerSubtitle}>Examen oficial {safeExam.year}</Text>

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* ---------- TARJETA "EXAMEN 2023" ---------- */}
                <View style={styles.examCard}>
                    <MaterialCommunityIcons
                        name="file-certificate-outline"
                        size={scale(110)}
                        color={COLORS.orange}
                    />
                    <Text style={styles.examTitle}>{safeExam.title}</Text>
                    <Text style={styles.examSubtitle}>{safeExam.category}</Text>
                </View>

                {/* ---------- CONDICIONES ---------- */}
                <Text style={styles.conditionsTitle}>CONDICIONES</Text>

                <View style={styles.conditionsList}>
                    <View style={styles.conditionRow}>
                        <Ionicons name="reader-outline" size={scale(44)} color={COLORS.orange} style={styles.conditionIcon} />
                        <Text style={styles.conditionText}>{safeExam.questions} preguntas tipo test</Text>
                    </View>

                    <View style={styles.conditionRow}>
                        <Ionicons name="time-outline" size={scale(52)} color={COLORS.orange} style={styles.conditionIcon} />
                        <Text style={styles.conditionText}>{safeExam.minutes} minutos · contrarreloj</Text>
                    </View>

                    <View style={styles.conditionRow}>
                        <Ionicons name="warning-outline" size={scale(54)} color={COLORS.orange} style={styles.conditionIcon} />
                        <Text style={styles.conditionText}>Cada 3 fallos resta 1 acierto</Text>
                    </View>
                </View>
            </ScrollView>

            {/* ---------- BOTÓN ---------- */}
            <TouchableOpacity
                style={[styles.startButton, loading && { opacity: 0.7 }]}
                activeOpacity={0.85}
                onPress={startExam}
                disabled={loading}
            >
                {loading ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <ActivityIndicator color={COLORS.white} size="small" />
                        <Text style={styles.startButtonText}>Cargando examen…</Text>
                    </View>
                ) : (
                    <Text style={styles.startButtonText}>Comenzar examen</Text>
                )}
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: COLORS.white,
        paddingTop: scale(189),
    },
    scrollContent: {
        flexGrow: 1,
    },

    /* ---------- HEADER ---------- */
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: scale(56),
        height: scale(54.03),
    },
    iconCircle: {
        width: scale(54.04),
        height: scale(54.04),
        borderRadius: scale(27.02),
        backgroundColor: 'rgba(65,41,80,0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(48),
        lineHeight: scale(48) * 1.547,
        color: COLORS.purple900,
    },
    headerSubtitle: {
        textAlign: 'center',
        fontFamily: 'Poppins-Light',
        fontSize: scale(48),
        lineHeight: scale(48) * 1.547,
        color: COLORS.purple900,
        marginTop: scale(-2),
    },

    /* ---------- TARJETA EXAMEN ---------- */
    examCard: {
        marginTop: scale(76.5),
        marginHorizontal: scale(60),
        minHeight: scale(300.19),
        borderWidth: scale(1.4),
        borderColor: 'rgba(65,41,80,0.3)',
        borderRadius: scale(24),
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: scale(20),
    },
    examTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(48),
        color: COLORS.purple900,
        marginTop: scale(10),
        textAlign: 'center',
    },
    examSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: scale(20),
        color: COLORS.purple900,
        marginTop: scale(6),
        textAlign: 'center',
    },

    /* ---------- CONDICIONES ---------- */
    conditionsTitle: {
        marginTop: scale(71.5),
        marginLeft: scale(61),
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(36),
        color: COLORS.purple900,
    },
    conditionsList: {
        marginTop: scale(22),
        marginLeft: scale(61),
        marginRight: scale(56),
    },
    conditionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: scale(38),
    },
    conditionIcon: {
        width: scale(52),
        textAlign: 'center',
    },
    conditionText: {
        marginLeft: scale(20),
        fontFamily: 'Poppins-Light',
        fontSize: scale(31),
        lineHeight: scale(31) * 1.2,
        color: COLORS.purple900,
    },

    /* ---------- BOTÓN ---------- */
    startButton: {
        marginTop: scale(24),
        marginHorizontal: scale(90),
        marginBottom: scale(40),
        height: scale(138),
        borderRadius: scale(32),
        backgroundColor: COLORS.green,
        alignItems: 'center',
        justifyContent: 'center',
    },
    startButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(36),
        color: COLORS.white,
    },
});
