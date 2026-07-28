import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    StatusBar,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import ScreenHeader from '../../components/ScreenHeader';
import { colors, spacing } from '../../theme';
import { tutorApi } from '../../api';

// ─── Colores semánticos por sección ──────────────────────────────────────────
// Se mantienen 3 tonos distintos para diferenciar tipos de contenido.
// Mapeados a tokens del proyecto siempre que aplica.
const SECTION_COLORS = {
    principles: colors.purple,          // #7B4BC4 — identidad IA/tutor
    structure:  '#1f9d6b',              // verde — estructura/planificación
    reminder:   colors.warning,         // #FF9F0A — ámbar de atención
};

// ─── Mock data — se sustituirá por tutorApi.getSummary(topicId) ──────────────
const MOCK_SUMMARY = {
    title: 'Constitución · Título I',
    sections: [
        {
            id: 'principles',
            type: 'principles',
            title: 'PRINCIPIOS CLAVE',
            icon: 'star-outline',
            content: [
                'Igualdad ante la ley',
                'Dignidad de la persona',
                'Derechos fundamentales como base del Estado',
            ],
        },
        {
            id: 'structure',
            type: 'structure',
            title: 'ESTRUCTURA',
            icon: 'layers-outline',
            content: [
                'Derechos y deberes (cap. I–II)',
                'Garantías (cap. IV)',
                'Suspensión de derechos (cap. V)',
            ],
        },
        {
            id: 'reminder',
            type: 'reminder',
            title: 'A RECORDAR',
            icon: 'alert-circle-outline',
            content: [
                'El art. 14 abre la sección: igualdad sin discriminación.',
                'Suele caer en examen.',
            ],
        },
    ],
};

// ─── Subcomponentes ───────────────────────────────────────────────────────────
function SectionCard({ section }) {
    const color = SECTION_COLORS[section.type] ?? colors.purple;
    return (
        <View style={styles.card}>
            <View style={[styles.cardHeader, { borderBottomColor: color + '33' }]}>
                <Ionicons name={section.icon} size={18} color={color} />
                <Text style={[styles.cardTitle, { color }]}>{section.title}</Text>
            </View>
            <View style={styles.cardBody}>
                {section.content.map((item, idx) => (
                    <View key={idx} style={styles.bulletRow}>
                        <View style={[styles.bullet, { backgroundColor: color }]} />
                        <Text style={styles.bulletText}>{item}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
}

function MoreButton({ navigation, topicTitle, topicId, oposicion }) {
    return (
        <TouchableOpacity
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityLabel="Más opciones"
            onPress={() =>
                Alert.alert('Opciones', null, [
                    { text: 'Compartir resumen', onPress: () => {} },
                    {
                        text: 'Generar flashcards',
                        onPress: () => navigation.navigate('TutorFlashcardsLoading', {
                            topicId,
                            topicTitle,
                            oposicion,
                        }),
                    },
                    {
                        text: 'Escuchar en podcast',
                        onPress: () => navigation.navigate('TutorPodcast', { title: topicTitle }),
                    },
                    { text: 'Cancelar', style: 'cancel' },
                ])
            }
        >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.dark} />
        </TouchableOpacity>
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
    const insets = useSafeAreaInsets();

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

    if (isLoading) {
        return (
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <StatusBar barStyle="dark-content" backgroundColor={colors.card} />
                <ScreenHeader title="Resumen" onBack={() => navigation.goBack()} />
                <View style={styles.loadingCenter}>
                    <ActivityIndicator color={colors.purple} size="large" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <StatusBar barStyle="dark-content" backgroundColor={colors.card} />

            <ScreenHeader
                title="Resumen"
                subtitle={displayTitle}
                onBack={() => navigation.goBack()}
                right={<MoreButton navigation={navigation} topicTitle={displayTitle} topicId={topicId} oposicion={oposicion} />}
            />

            <ScrollView
                contentContainerStyle={[
                    styles.scrollBody,
                    { paddingBottom: 96 + insets.bottom },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {displaySections.map((section) => (
                    <SectionCard key={section.id} section={section} />
                ))}
            </ScrollView>

            {/* FABs flotantes — parte inferior derecha */}
            <View style={[styles.fabRow, { bottom: 24 + insets.bottom }]}>
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: '#2D6FB0' }]}
                    onPress={() => navigation.navigate('TutorPodcast', { title: displayTitle })}
                    activeOpacity={0.85}
                    accessibilityLabel="Escuchar en modo podcast"
                >
                    <Ionicons name="headset" size={20} color="#fff" />
                    <Text style={styles.fabText}>Escuchar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: colors.purple }]}
                    onPress={() => navigation.navigate('TutorFlashcardsLoading', {
                        topicId,
                        topicTitle: displayTitle,
                        oposicion,
                    })}
                    activeOpacity={0.85}
                    accessibilityLabel="Generar flashcards"
                >
                    <Ionicons name="layers-outline" size={20} color="#fff" />
                    <Text style={styles.fabText}>Flashcards</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    scrollBody: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
    },

    // Tarjeta de sección
    card: {
        backgroundColor: colors.card,
        borderRadius: 14,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 11,
        borderBottomWidth: 1,
        backgroundColor: colors.background,
    },
    cardTitle: {
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.6,
    },
    cardBody: {
        padding: spacing.md,
    },
    bulletRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: spacing.sm,
    },
    bullet: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginTop: 6,
        marginRight: 10,
        flexShrink: 0,
    },
    bulletText: {
        fontSize: 14,
        color: colors.text,
        lineHeight: 21,
        flex: 1,
    },

    // FABs
    fabRow: {
        position: 'absolute',
        right: spacing.md,
        flexDirection: 'row',
        gap: spacing.sm,
    },
    fab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.md,
        paddingVertical: 11,
        borderRadius: 22,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 6,
    },
    fabText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
});
