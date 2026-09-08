// Bloque 3 · Salud — Pantalla 3.9 · Meditación (listado)
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';
import { MEDITATIONS } from '../../data/healthContent';
import { healthApi } from '../../api';
import { FATIGUE_LEVEL_KEY } from './FatigueEngineScreen';

const TIPOS = [
    { key: 'pre_examen', label: 'Pre-examen' },
    { key: 'post_estudio', label: 'Post-estudio' },
    { key: 'pausa', label: 'Pausa' },
    { key: 'foco', label: 'Foco' },
];
const DURACIONES = [3, 5, 7, 8];

// Colores confirmados contra Figma (frame "DETALLE MENÚ/RECETA" #1, cuyo
// contenido real es la pantalla de Meditación, Bloque 3) sin equivalente
// exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(255,255,255,0.15)',
    cardLabel: '#F5F5F5',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
};

function CheckMarkIcon({ size = 22, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 13l5 5L20 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

export default function MeditationListScreen({ navigation }) {
    const [tipo, setTipo] = useState('foco');
    const [duracion, setDuracion] = useState(5);
    const [loadingAi, setLoadingAi] = useState(false);

    const handlePlay = (session) => {
        navigation.navigate('MeditationPlayer', {
            session: { title: session.title, audioKey: session.audioKey, subtitle: session.note, duration: session.duration },
        });
    };

    const handleGenerateSession = async () => {
        setLoadingAi(true);
        const fatigueLevel = (await AsyncStorage.getItem(FATIGUE_LEVEL_KEY).catch(() => null)) ?? 'bajo';
        const res = await healthApi.generateMeditation({ tipo, duracion, fatigueLevel }).catch(() => null);
        setLoadingAi(false);
        if (!res?.error && res?.data) {
            navigation.navigate('MeditationPlayer', {
                session: {
                    title: res.data.titulo ?? 'Sesión personalizada',
                    subtitle: res.data.subtitulo ?? '',
                    duration: `${duracion}:00`,
                    phases: res.data.fases ?? [],
                },
            });
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Meditación" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                {/* Card: Sesión personalizada con IA */}
                <View style={styles.aiCard}>
                    <Text style={styles.aiCardTitle}>Sesión personalizada</Text>
                    <Text style={styles.aiCardSub}>Generada para tu estado de hoy</Text>

                    <View style={styles.pillsRow}>
                        {TIPOS.map((t) => (
                            <TouchableOpacity
                                key={t.key}
                                style={[styles.pill, tipo === t.key && styles.pillActive]}
                                onPress={() => setTipo(t.key)}
                            >
                                <Text style={[styles.pillText, tipo === t.key && styles.pillActiveText]}>{t.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <View style={styles.pillsRow}>
                        {DURACIONES.map((d) => (
                            <TouchableOpacity
                                key={d}
                                style={[styles.pill, duracion === d && styles.pillActive]}
                                onPress={() => setDuracion(d)}
                            >
                                <Text style={[styles.pillText, duracion === d && styles.pillActiveText]}>{d} min</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity
                        style={[styles.createBtn, loadingAi && { opacity: 0.6 }]}
                        onPress={handleGenerateSession}
                        disabled={loadingAi}
                        activeOpacity={0.8}
                    >
                        {loadingAi
                            ? <ActivityIndicator color={colors.textDark} />
                            : <Text style={styles.createBtnText}>Crear sesión →</Text>}
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => handlePlay(MEDITATIONS.recommended)}>
                    <Text style={styles.featuredEyebrow}>RECOMENDADA HOY</Text>
                    <Text style={styles.featuredTitle}>{MEDITATIONS.recommended.title}</Text>
                    <Text style={styles.featuredSubtitle}>{MEDITATIONS.recommended.duration} · {MEDITATIONS.recommended.note}</Text>
                </TouchableOpacity>

                <View style={styles.exercisesList}>
                    {MEDITATIONS.exercises.map((exercise, index) => (
                        <TouchableOpacity
                            key={exercise.id}
                            style={[styles.exerciseRow, index > 0 && styles.exerciseRowSeparator]}
                            activeOpacity={0.7}
                            onPress={() => handlePlay(exercise)}
                        >
                            <View style={styles.badge}>
                                <CheckMarkIcon />
                            </View>
                            <View style={styles.exerciseTextWrap}>
                                <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                                <Text style={styles.exerciseNote}>{exercise.duration} · {exercise.note}</Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingTop: spacing.sm,
        paddingBottom: spacing.md,
    },
    featuredCard: {
        backgroundColor: colors.bannerPurple,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: FIGMA.cardBorder,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        marginBottom: 24,
    },
    featuredEyebrow: {
        fontFamily: 'Poppins-Light',
        fontSize: 14.3,
        color: FIGMA.cardLabel,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    featuredTitle: {
        marginTop: 6,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18.2,
        color: colors.white,
        textAlign: 'center',
    },
    featuredSubtitle: {
        marginTop: 4,
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: colors.accentOrange,
        textAlign: 'center',
    },
    exercisesList: {
        marginTop: 8,
    },
    exerciseRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 26,
    },
    exerciseRowSeparator: {
        borderTopWidth: 0.44,
        borderTopColor: FIGMA.separator,
    },
    badge: {
        width: 44,
        height: 44,
        borderRadius: 11,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 18,
    },
    exerciseTextWrap: {
        flex: 1,
    },
    exerciseTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 18,
        color: colors.textDark,
    },
    exerciseNote: {
        marginTop: 3,
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: FIGMA.textNote,
    },
    aiCard: {
        backgroundColor: '#F7F4FB',
        borderRadius: 20,
        padding: 16,
        marginBottom: 20,
    },
    aiCardTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 2,
    },
    aiCardSub: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12,
        color: FIGMA.textNote,
        marginBottom: 14,
    },
    pillsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 12,
    },
    pill: {
        borderWidth: 1,
        borderColor: 'rgba(65,41,80,0.3)',
        borderRadius: 9.8,
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    pillActive: {
        borderColor: colors.purple,
        backgroundColor: colors.bannerPurple,
    },
    pillText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 12.5,
        color: colors.textDark,
    },
    pillActiveText: {
        color: colors.white,
    },
    createBtn: {
        backgroundColor: colors.ctaGreen,
        borderRadius: 10,
        paddingVertical: 11,
        alignItems: 'center',
        marginTop: 4,
    },
    createBtnText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14,
        color: colors.textDark,
    },
});
