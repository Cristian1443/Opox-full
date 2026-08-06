import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, StatusBar, ScrollView, Dimensions, ActivityIndicator, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../../theme';
import { api, trainingApi } from '../../api';
import { adaptGeneratedQuestions } from '../../utils/questionAdapter';

// ------------------------------------------------------------------
// Escalado proporcional 1:1 respecto al frame original de Figma
// (905px de ancho).
// ------------------------------------------------------------------
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DESIGN_WIDTH = 905;
const scale = (value) => (SCREEN_WIDTH / DESIGN_WIDTH) * value;

const COLORS = {
    primary: colors.textDark,
    green: colors.ctaGreen,
    orange: colors.accentOrange,
    purple: colors.selectionBorder, // #9F6EE4
    white: colors.white,
};

// ─── Pantalla 6.9 · Test Quirúrgico · Preview ────────────────────────────────
export default function SurgicalTestPreviewScreen({ navigation, route }) {
    const subtopics = [
        { id: 'plazos', label: 'Plazos administrativos', count: 8 },
        { id: 'recursos', label: 'Recursos', count: 7 },
    ];
    const total = subtopics.reduce((acc, s) => acc + s.count, 0);

    const [generating, setGenerating] = useState(false);

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
            <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

            {/* NAV */}
            <View style={styles.nav}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={scale(28)} color={COLORS.primary} />
                </TouchableOpacity>
                <Text style={styles.navTitle}>Test quirúrgico</Text>
                <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('Settings')}>
                    <Ionicons name="settings-outline" size={scale(26)} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
                {/* Ilustración */}
                <View style={styles.iconWrapper}>
                    <MaterialCommunityIcons name="clipboard-check-outline" size={scale(140)} color={COLORS.primary} />
                    <View style={styles.targetBadge}>
                        <MaterialCommunityIcons name="target" size={scale(60)} color={COLORS.green} />
                    </View>
                </View>

                {/* Título + subtítulo */}
                <View style={styles.titleBlock}>
                    <Text style={styles.title}>Test de refuerzo a medida</Text>
                    <Text style={styles.subtitle}>{total} preguntas centradas en tus fallos</Text>
                </View>

                {/* QUÉ INCLUYE */}
                <Text style={styles.sectionHeader}>QUÉ INCLUYE</Text>

                <View style={styles.list}>
                    {subtopics.map((s) => (
                        <View key={s.id} style={styles.listRow}>
                            <View style={styles.bullet} />
                            <Text style={styles.listText}>{s.label} · {s.count} preguntas</Text>
                        </View>
                    ))}
                </View>

                {/* Botón */}
                <TouchableOpacity
                    style={[styles.button, generating && { opacity: 0.7 }]}
                    activeOpacity={0.85}
                    onPress={startTest}
                    disabled={generating}
                >
                    {generating ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <ActivityIndicator color={COLORS.white} size="small" />
                            <Text style={styles.buttonText}>Generando preguntas…</Text>
                        </View>
                    ) : (
                        <Text style={styles.buttonText}>Empezar</Text>
                    )}
                </TouchableOpacity>

                {/* Caja destacada */}
                <View style={styles.highlightBox}>
                    <Text style={styles.highlightText}>
                        Tras este test, la IA volverá a medir tu dominio del tema para ver si has mejorado.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.white },
    scroll: { flex: 1 },
    body: { paddingBottom: scale(60) },

    nav: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: scale(56),
        height: scale(54.03),
    },
    navButton: {
        width: scale(54),
        height: scale(54),
        alignItems: 'center',
        justifyContent: 'center',
    },
    navTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(48),
        color: COLORS.primary,
        textAlign: 'center',
    },

    iconWrapper: {
        marginTop: scale(40),
        alignSelf: 'center',
        width: scale(422.34),
        height: scale(200),
        alignItems: 'center',
        justifyContent: 'center',
    },
    targetBadge: {
        position: 'absolute',
        bottom: scale(10),
        right: scale(70),
        backgroundColor: COLORS.white,
        borderRadius: scale(40),
    },

    titleBlock: {
        width: scale(640),
        alignSelf: 'center',
        alignItems: 'center',
        marginTop: scale(10),
    },
    title: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(48),
        color: COLORS.primary,
        textAlign: 'center',
    },
    subtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: scale(20),
        color: COLORS.primary,
        textAlign: 'center',
        marginTop: scale(4),
    },

    sectionHeader: {
        marginLeft: scale(61),
        marginTop: scale(40),
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(36),
        color: COLORS.primary,
    },
    list: {
        marginTop: scale(20),
        marginLeft: scale(61),
    },
    listRow: {
        flexDirection: 'row',
        alignItems: 'center',
        height: scale(50),
    },
    bullet: {
        width: scale(17),
        height: scale(17),
        borderRadius: scale(4),
        backgroundColor: COLORS.orange,
        marginRight: scale(20),
    },
    listText: {
        fontFamily: 'Poppins-Medium',
        fontSize: scale(31),
        color: COLORS.primary,
    },

    button: {
        width: scale(725),
        height: scale(138),
        borderRadius: scale(32),
        backgroundColor: COLORS.green,
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: scale(30),
    },
    buttonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: scale(36),
        color: COLORS.white,
    },

    highlightBox: {
        width: scale(560.76),
        minHeight: scale(185.35),
        borderRadius: scale(20),
        backgroundColor: COLORS.purple,
        opacity: 0.75,
        alignSelf: 'center',
        justifyContent: 'center',
        paddingHorizontal: scale(30),
        marginTop: scale(17),
    },
    highlightText: {
        fontFamily: 'Poppins-Regular',
        fontSize: scale(26),
        color: COLORS.white,
        textAlign: 'center',
    },
});
