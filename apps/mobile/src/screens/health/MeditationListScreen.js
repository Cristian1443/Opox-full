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
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

const PURPLE = '#7B4BC4';

const SESSIONS = [
    {
        id: '1',
        title: 'Calma antes del examen',
        subtitle: '8 min · gestión de la ansiedad',
        duration: '8 min',
        type: 'recommended',
        icon: 'moon-outline',
        bg: PURPLE,
    },
    {
        id: '2',
        title: 'Respiración 4-7-8',
        subtitle: '5 min · relajación rápida',
        duration: '5 min',
        icon: 'moon-outline',
        bg: '#F0E9F7',
        iconColor: '#7B4BC4',
    },
    {
        id: '3',
        title: 'Bajar la activación',
        subtitle: '7 min · tras una sesión intensa',
        duration: '7 min',
        icon: 'pulse-outline',
        bg: '#EAF3FB',
        iconColor: '#2D6FB0',
    },
    {
        id: '4',
        title: 'Foco en 3 minutos',
        subtitle: 'antes de empezar a estudiar',
        duration: '3 min',
        icon: 'locate-outline',
        bg: '#E9F7EF',
        iconColor: '#1f9d6b',
    },
];

export default function MeditationListScreen({ navigation }) {
    const handlePlay = (session) => {
        navigation.navigate('MeditationPlayer', { session });
    };

    const recommended = SESSIONS[0];
    const others = SESSIONS.slice(1);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Meditación" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Recomendada del día — card morada grande */}
                <TouchableOpacity
                    style={styles.recommendedCard}
                    onPress={() => handlePlay(recommended)}
                    activeOpacity={0.9}
                >
                    <Text style={styles.recommendedTag}>RECOMENDADA HOY</Text>
                    <Text style={styles.recommendedTitle}>{recommended.title}</Text>
                    <Text style={styles.recommendedSubtitle}>{recommended.subtitle}</Text>
                </TouchableOpacity>

                {/* Resto de sesiones */}
                {others.map((session) => (
                    <TouchableOpacity
                        key={session.id}
                        style={styles.sessionCard}
                        onPress={() => handlePlay(session)}
                        activeOpacity={0.85}
                    >
                        <View style={[styles.sessionIcon, { backgroundColor: session.bg }]}>
                            <Ionicons name={session.icon} size={22} color={session.iconColor} />
                        </View>
                        <View style={styles.sessionText}>
                            <Text style={styles.sessionTitle}>{session.title}</Text>
                            <Text style={styles.sessionSubtitle}>{session.subtitle}</Text>
                        </View>
                    </TouchableOpacity>
                ))}

                <View style={{ height: spacing.lg }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.md,
    },
    recommendedCard: {
        backgroundColor: PURPLE,
        borderRadius: 20,
        padding: spacing.lg,
        marginBottom: spacing.md,
    },
    recommendedTag: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: spacing.sm,
    },
    recommendedTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 4,
    },
    recommendedSubtitle: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: 14,
        fontWeight: '500',
    },
    sessionCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    sessionIcon: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    sessionText: {
        flex: 1,
    },
    sessionTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    sessionSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
});
