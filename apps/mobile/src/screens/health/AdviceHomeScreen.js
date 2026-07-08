// Bloque 3 · Salud — Pantalla 3.6 · Home de Consejos
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

// Cada categoría con su fondo pastel y color de icono al estilo del mockup 3.6.
const CATEGORIES = [
    {
        id: 'study',
        title: 'Cómo estudiar mejor',
        subtitle: 'Técnicas, memoria y concentración',
        icon: 'reader-outline',
        bg: '#E3F2FD',
        iconColor: '#1976D2',
    },
    {
        id: 'food',
        title: 'Alimentación',
        subtitle: 'Comer para potenciar la memoria',
        icon: 'restaurant-outline',
        bg: '#E8F5E9',
        iconColor: '#2E7D32',
    },
    {
        id: 'meditation',
        title: 'Meditación y relajación',
        subtitle: 'Calma antes del examen',
        icon: 'moon-outline',
        bg: '#F3E5F5',
        iconColor: '#7B1FA2',
    },
];

export default function AdviceHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Consejos" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.intro}>Cuida tu rendimiento dentro y fuera del estudio.</Text>

                <View style={styles.categoriesContainer}>
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={[styles.categoryCard, { backgroundColor: cat.bg }]}
                            onPress={() => {
                                const routes = {
                                    study: 'StudyTips',
                                    food: 'FoodHome',
                                    meditation: 'MeditationList',
                                };
                                const target = routes[cat.id];
                                if (target) navigation.navigate(target);
                            }}
                            activeOpacity={0.9}
                        >
                            <View style={styles.iconContainer}>
                                <Ionicons name={cat.icon} size={26} color={cat.iconColor} />
                            </View>

                            <View style={styles.textContainer}>
                                <Text style={styles.cardTitle}>{cat.title}</Text>
                                <Text style={styles.cardSubtitle}>{cat.subtitle}</Text>
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
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.md,
    },
    intro: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        lineHeight: 22,
    },
    categoriesContainer: {
        gap: spacing.md,
    },
    categoryCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 18,
        padding: spacing.md,
    },
    iconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    textContainer: {
        flex: 1,
    },
    cardTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 2,
    },
    cardSubtitle: {
        fontSize: 14,
        color: colors.textSecondary,
    },
});
