// Bloque 3 · Salud — Pantalla 3.8 · Alimentación (home)
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

const { width } = Dimensions.get('window');

// Alimentos que potencian la memoria (mock hasta backend real).
const MEMORY_BOOSTERS = [
    {
        id: '1',
        name: 'Pescado azul',
        emoji: '🐟',
        benefit: 'Omega-3',
        detail: 'Función cognitiva y neuroprotección.',
    },
    {
        id: '2',
        name: 'Arándanos',
        emoji: '🫐',
        benefit: 'Antioxidantes',
        detail: 'Mejora la memoria y el aprendizaje.',
    },
    {
        id: '3',
        name: 'Frutos secos',
        emoji: '🥜',
        benefit: 'Vitamina E',
        detail: 'Concentración y salud cerebral.',
    },
    {
        id: '4',
        name: 'Chocolate negro',
        emoji: '🍫',
        benefit: 'Flavonoides',
        detail: 'Flujo sanguíneo al cerebro y foco.',
    },
];

export default function FoodHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Alimentación" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Tabs: Alimentos activa, Menús navega a 3.8b (la lista completa vive allí) */}
                <View style={styles.tabsContainer}>
                    <View style={[styles.tabButton, styles.tabButtonActive]}>
                        <Text style={[styles.tabText, styles.tabTextActive]}>Alimentos</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.tabButton}
                        onPress={() => navigation.navigate('Menus')}
                    >
                        <Text style={styles.tabText}>Menús</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionTitle}>POTENCIAN LA MEMORIA</Text>

                <View style={styles.foodGrid}>
                    {MEMORY_BOOSTERS.map((food) => (
                        <View key={food.id} style={styles.foodCard}>
                            <Text style={styles.foodEmoji}>{food.emoji}</Text>
                            <Text style={styles.foodName}>{food.name}</Text>
                            <Text style={styles.foodBenefit}>{food.benefit}</Text>
                            <Text style={styles.foodDetail}>{food.detail}</Text>
                        </View>
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
    tabsContainer: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: 4,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 8,
    },
    tabButtonActive: {
        backgroundColor: colors.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    foodGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    foodCard: {
        width: (width - spacing.md * 3) / 2,
        backgroundColor: colors.card,
        borderRadius: 12,
        padding: spacing.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.separator,
        alignItems: 'center',
    },
    foodEmoji: {
        fontSize: 32,
        marginBottom: spacing.xs,
    },
    foodName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 2,
    },
    foodBenefit: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 4,
    },
    foodDetail: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 16,
    },
});
