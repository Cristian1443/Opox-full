// Bloque 3 · Salud — Pantalla 3.8b · Menús equilibrados (listado completo)
import React, { useState } from 'react';
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

const FILTERS = ['Todos', 'Concentración', 'Energía', 'Día de examen'];

const MENUS_DATA = [
    {
        id: 'm1',
        title: 'Día de concentración máxima',
        type: 'AI',
        author: 'IA',
        authorId: null,
        description: 'Optimizado para mantener la glucosa estable y mejorar el flujo sanguíneo al cerebro.',
        calories: '1800 kcal',
        meals: ['Desayuno', 'Comida', 'Cena'],
        time: 'Generado hoy',
    },
    {
        id: 'm2',
        title: 'Energía sostenida',
        type: 'Human',
        author: 'Dietista',
        authorId: 'Laura M. (col. nº 1234)',
        description: 'Diseñado para deportistas y sesiones largas de estudio que requieren resistencia.',
        calories: '2100 kcal',
        meals: ['Desayuno', 'Media mañana', 'Comida', 'Merienda', 'Cena'],
        time: 'Por Laura M.',
    },
    {
        id: 'm3',
        title: 'Recuperación post-examen',
        type: 'Human',
        author: 'Dietista',
        authorId: 'Carlos R. (col. nº 5678)',
        description: 'Menú relajante y antiinflamatorio para después de un periodo de estrés intenso.',
        calories: '1950 kcal',
        meals: ['Desayuno', 'Comida', 'Cena'],
        time: 'Por Carlos R.',
    },
];

const getAuthorBadge = (type, author, id) => (
    <View style={[styles.authorBadge, { borderColor: type === 'AI' ? colors.primary : colors.success }]}>
        {type === 'AI' ? (
            <Ionicons name="sparkles" size={14} color={colors.primary} />
        ) : (
            <Ionicons name="person" size={14} color={colors.success} />
        )}
        <Text style={[styles.authorText, { color: type === 'AI' ? colors.primary : colors.success }]}>
            {author}
        </Text>
        {type === 'Human' && id && (
            <Text style={styles.authorIdText}>({id})</Text>
        )}
    </View>
);

export default function MenusScreen({ navigation }) {
    const [activeFilter, setActiveFilter] = useState('Todos');

    const filteredMenus = activeFilter === 'Todos'
        ? MENUS_DATA
        : MENUS_DATA.filter((m) =>
            (activeFilter === 'Concentración' && m.title.includes('concentración')) ||
            (activeFilter === 'Energía' && m.title.includes('Energía')) ||
            (activeFilter === 'Día de examen' && m.title.includes('examen'))
        );

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Menús" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.filterContainer}>
                    {FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter}
                            style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
                            onPress={() => setActiveFilter(filter)}
                        >
                            <Text
                                style={[
                                    styles.filterChipText,
                                    activeFilter === filter && styles.filterChipTextActive,
                                ]}
                            >
                                {filter}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.listContainer}>
                    {filteredMenus.map((menu) => (
                        <TouchableOpacity
                            key={menu.id}
                            style={styles.menuCard}
                            onPress={() => navigation.navigate('MenuDetail', { menu })}
                        >
                            <View style={styles.cardHeader}>
                                {getAuthorBadge(menu.type, menu.author, menu.authorId)}
                                <View style={styles.cardMeta}>
                                    <Text style={styles.cardMetaText}>{menu.time}</Text>
                                    <Text style={styles.cardMetaText}>{menu.calories}</Text>
                                </View>
                            </View>

                            <Text style={styles.menuTitle}>{menu.title}</Text>
                            <Text style={styles.menuDescription}>{menu.description}</Text>

                            <View style={styles.mealsRow}>
                                {menu.meals.map((meal, index) => (
                                    <View key={index} style={styles.mealTag}>
                                        <Text style={styles.mealTagText}>{meal}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.actionButton}>
                                <Text style={styles.actionButtonText}>
                                    Ver receta y lista de la compra ›
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>

                {filteredMenus.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                        <Text style={styles.emptyText}>No hay menús para este filtro.</Text>
                    </View>
                )}

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
    filterContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.sm,
        rowGap: spacing.sm,
        marginBottom: spacing.lg,
    },
    filterChip: {
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
    },
    filterChipTextActive: {
        color: '#FFFFFF',
    },
    listContainer: {
        gap: spacing.md,
    },
    menuCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    authorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderWidth: 1,
    },
    authorText: {
        fontSize: 12,
        fontWeight: '700',
        marginLeft: 4,
    },
    authorIdText: {
        fontSize: 10,
        color: colors.textSecondary,
        marginLeft: 2,
    },
    cardMeta: {
        alignItems: 'flex-end',
    },
    cardMetaText: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    menuTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    menuDescription: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    mealsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginBottom: spacing.md,
    },
    mealTag: {
        backgroundColor: colors.background,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    mealTagText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
    actionButton: {
        alignItems: 'center',
        paddingVertical: 10,
        borderRadius: 12,
        backgroundColor: colors.primary + '10',
        borderWidth: 1,
        borderColor: colors.primary,
    },
    actionButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        marginTop: spacing.md,
    },
});
