// Bloque 3 · Salud — Pantalla 3.7 · Consejos de Estudio
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

const STUDY_TECHNIQUES = [
    {
        id: '1',
        title: 'Técnica Pomodoro',
        subtitle: '25 min foco / 5 descanso',
        icon: 'time-outline',
        bg: '#EAF3FB',
        iconColor: '#2D6FB0',
    },
    {
        id: '2',
        title: 'Repetición espaciada',
        subtitle: 'Repasa justo antes de olvidar',
        icon: 'repeat-outline',
        bg: '#FEEDE4',
        iconColor: colors.primary,
    },
    {
        id: '3',
        title: 'Active recall',
        subtitle: 'Recupera de memoria, no releas',
        icon: 'checkbox-outline',
        bg: '#E9F7EF',
        iconColor: '#1f9d6b',
    },
    {
        id: '4',
        title: 'Curva del olvido',
        subtitle: 'Por qué repasar a las 24h',
        icon: 'trending-down-outline',
        bg: '#F0E9F7',
        iconColor: '#7B4BC4',
    },
];

export default function StudyTipsScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Cómo estudiar mejor" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {STUDY_TECHNIQUES.map((tech) => (
                    <View key={tech.id} style={styles.card}>
                        <View style={[styles.iconBox, { backgroundColor: tech.bg }]}>
                            <Ionicons name={tech.icon} size={22} color={tech.iconColor} />
                        </View>
                        <View style={styles.cardText}>
                            <Text style={styles.cardTitle}>{tech.title}</Text>
                            <Text style={styles.cardSubtitle}>{tech.subtitle}</Text>
                        </View>
                    </View>
                ))}

                {/* CTA final al Tutor IA (fondo navy + botón naranja pill) */}
                <View style={styles.ctaCard}>
                    <View style={styles.ctaText}>
                        <Text style={styles.ctaTitle}>¿Lo aplicamos a tu temario?</Text>
                        <Text style={styles.ctaSubtitle}>
                            El Tutor IA te hace un plan con estas técnicas.
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={styles.ctaButton}
                        onPress={() => navigation.navigate('AITutor')}
                    >
                        <Text style={styles.ctaButtonText}>Tutor IA</Text>
                    </TouchableOpacity>
                </View>

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
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    iconBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    cardText: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    ctaCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.dark,
        borderRadius: 16,
        padding: spacing.md,
        marginTop: spacing.md,
        gap: spacing.md,
    },
    ctaText: {
        flex: 1,
    },
    ctaTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    ctaSubtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.7)',
        lineHeight: 18,
    },
    ctaButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.md,
        paddingVertical: 10,
        borderRadius: 999,
    },
    ctaButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
