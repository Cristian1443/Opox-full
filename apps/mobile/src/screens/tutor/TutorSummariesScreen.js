import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// Colores confirmados contra Figma (frame RESUMEN INTELIGENTE, Bloque 8)
// sin equivalente exacto en theme.js.
const FIGMA = {
    subtitleMuted: 'rgba(65,41,80,0.5)',
    bulletStroke: '#D9D9D9',
};

// ─── Mock data — se sustituirá por tutorApi.getSummary(topicId) ──────────────
const MOCK_SUMMARY = {
    title: 'Constitución · Título I',
    sections: [
        {
            id: 'principles',
            title: 'PRINCIPIOS CLAVE',
            content: [
                'Igualdad ante la ley',
                'Dignidad de la persona',
                'Derechos fundamentales como base del Estado',
            ],
        },
        {
            id: 'structure',
            title: 'ESTRUCTURA',
            content: [
                'Derechos y deberes (cap. I–II)',
                'Garantías (cap. IV)',
                'Suspensión de derechos (cap. V)',
            ],
        },
        {
            id: 'reminder',
            title: 'A RECORDAR',
            content: [
                'El art. 14 abre la sección: igualdad sin discriminación.',
                'Suele caer en examen.',
            ],
        },
    ],
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function SectionBlock({ section }) {
    return (
        <View style={styles.section}>
            <Text style={styles.sectionHeading}>{section.title}</Text>
            {section.content.map((item, idx) => (
                <View key={idx} style={styles.bulletRow}>
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{item}</Text>
                </View>
            ))}
        </View>
    );
}

// ─── Pantalla ─────────────────────────────────────────────────────────────────
export default function TutorSummariesScreen({ navigation, route }) {
    // topicId + oposicion llegan cuando se navega desde un selector de temas
    const topicId   = route?.params?.topicId   ?? null;
    const oposicion = route?.params?.oposicion  ?? 'aux-adm-estado';
    // title y sections son el fallback cuando no hay topicId (o mientras carga)
    const paramTitle    = route?.params?.title    ?? MOCK_SUMMARY.title;
    const paramSections = route?.params?.sections ?? null;

    const [summary, setSummary]     = useState(null);
    const [isLoading, setIsLoading] = useState(!!topicId && !paramSections);

    useEffect(() => {
        if (!topicId) return;
        setIsLoading(true);
        tutorApi.getSummary(topicId, oposicion)
            .then((res) => {
                if (!res?.error && res?.data) setSummary(res.data);
            })
            .catch(() => {})
            .finally(() => setIsLoading(false));
    }, [topicId, oposicion]);

    const displayTitle    = summary?.topicTitle ?? paramTitle;
    const displaySections = summary?.sections   ?? paramSections ?? MOCK_SUMMARY.sections;

    const Header = () => (
        <View style={styles.header}>
            <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.iconBtn}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
                <Ionicons name="chevron-back" size={24} color={colors.textDark} />
            </TouchableOpacity>
            <View style={styles.headerTextWrap}>
                <Text style={styles.headerTitle}>Resumen</Text>
                {!isLoading && <Text style={styles.headerSubtitle}>{displayTitle}</Text>}
            </View>
            <View style={styles.iconBtn} />
        </View>
    );

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <Header />
                <View style={styles.loadingCenter}>
                    <ActivityIndicator color={colors.accentOrange} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <Header />

            <ScrollView contentContainerStyle={styles.scrollBody} showsVerticalScrollIndicator={false}>
                {displaySections.map((section) => (
                    <SectionBlock key={section.id} section={section} />
                ))}
            </ScrollView>

            <View style={styles.buttonsRow}>
                <TouchableOpacity
                    style={styles.primaryButton}
                    activeOpacity={0.85}
                    onPress={() => navigation.navigate('TutorFlashcardsLoading', {
                        topicId,
                        topicTitle: displayTitle,
                        oposicion,
                    })}
                >
                    <Text style={styles.primaryButtonText}>Flashcards</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.secondaryButton}
                    activeOpacity={0.7}
                    onPress={() => navigation.navigate('TutorPodcast', { title: displayTitle })}
                >
                    <Text style={styles.secondaryButtonText}>Escuchar</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    iconBtn: { width: 32, padding: 4 },
    headerTextWrap: { flex: 1, alignItems: 'center' },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21.3,
        color: colors.textDark,
        textAlign: 'center',
    },
    headerSubtitle: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 10.7,
        color: FIGMA.subtitleMuted,
        textAlign: 'center',
    },
    loadingCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollBody: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.xs,
        paddingBottom: spacing.lg,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeading: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 8,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    bullet: {
        width: 6.2,
        height: 6.2,
        borderRadius: 3.1,
        backgroundColor: colors.accentOrange,
        borderWidth: 0.44,
        borderColor: FIGMA.bulletStroke,
        marginTop: 6,
        marginRight: 10,
        flexShrink: 0,
    },
    bulletText: {
        flex: 1,
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        lineHeight: 22.4,
        color: colors.textDark,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    primaryButton: {
        width: 167,
        height: 61,
        borderRadius: 14.2,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    primaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    secondaryButton: {
        width: 167,
        height: 61,
        borderRadius: 14.2,
        borderWidth: 0.44,
        borderColor: colors.textDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    secondaryButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
});
