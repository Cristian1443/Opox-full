// Bloque 3 · Salud — Pantalla 3.9 · Meditación (listado)
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Colores confirmados contra Figma (frame "DETALLE MENÚ/RECETA" #1, cuyo
// contenido real es la pantalla de Meditación, Bloque 3) sin equivalente
// exacto en theme.js.
const FIGMA = {
    cardBorder: 'rgba(255,255,255,0.15)',
    cardLabel: '#F5F5F5',
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
};

function CheckMarkIcon({ size = 16, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 13l5 5L20 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

const RECOMMENDED = { id: '1', title: 'Calma antes del examen', note: 'gestión de la ansiedad', duration: '8 min' };

const EXERCISES = [
    { id: '2', title: 'Respiración 4-7-8', note: 'relajación rápida', duration: '5 min' },
    { id: '3', title: 'Bajar la activación', note: 'tras una sesión intensa', duration: '7 min' },
    { id: '4', title: 'Foco en 3 minutos', note: 'antes de empezar a estudiar', duration: '3 min' },
];

export default function MeditationListScreen({ navigation }) {
    const handlePlay = (session) => {
        navigation.navigate('MeditationPlayer', { session: { title: session.title, subtitle: session.note, duration: session.duration } });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Meditación" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <TouchableOpacity style={styles.featuredCard} activeOpacity={0.9} onPress={() => handlePlay(RECOMMENDED)}>
                    <Text style={styles.featuredEyebrow}>RECOMENDADA HOY</Text>
                    <Text style={styles.featuredTitle}>{RECOMMENDED.title}</Text>
                    <Text style={styles.featuredSubtitle}>{RECOMMENDED.duration} · {RECOMMENDED.note}</Text>
                </TouchableOpacity>

                <View style={styles.exercisesList}>
                    {EXERCISES.map((exercise, index) => (
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
        paddingVertical: 14,
    },
    exerciseRowSeparator: {
        borderTopWidth: 0.44,
        borderTopColor: FIGMA.separator,
    },
    badge: {
        width: 29,
        height: 29,
        borderRadius: 2.7,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    exerciseTextWrap: {
        flex: 1,
    },
    exerciseTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    exerciseNote: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: FIGMA.textNote,
    },
});
