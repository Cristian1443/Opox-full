// Bloque 3 · Salud — Pantalla 3.8c · Detalle de menú / receta
import React, { useState } from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Menú de demo con shape completo. Fallback si params.menu no trae recetas detalladas.
const MENU_DETAIL = {
    title: 'Día de concentración',
    author: 'IA',
    type: 'AI',
    description: 'Menú generado y revisado automáticamente para optimizar tu foco cognitivo.',
    totalCalories: '1380 kcal',
    meals: [
        {
            id: 'breakfast',
            name: 'Avena con arándanos y nueces',
            type: 'DESAYUNO',
            calories: 320,
            details: 'Omega-3 + Antioxidantes',
            ingredients: [
                '50g Avena integral',
                '50g Arándanos frescos',
                '15g Nueces troceadas',
                '1cda Chía',
                'Agua/Leche vegetal',
            ],
            steps: [
                'Cocinar la avena en agua o leche vegetal durante 5 minutos.',
                'Añadir los arándanos y las nueces en los últimos 2 minutos.',
                'Servir caliente y espolvorear con chía.',
            ],
        },
        {
            id: 'lunch',
            name: 'Salmón con quinoa y verduras',
            type: 'COMIDA',
            calories: 540,
            details: 'Proteína magra y carbohidratos complejos',
            ingredients: [
                '150g Lomo de salmón',
                '60g Quinoa (peso seco)',
                '100g Espárragos trigueros',
                '1cda Aceite de oliva',
                'Limón y eneldo',
            ],
            steps: [
                'Cocinar la quinoa según instrucciones del paquete.',
                'Sellar el salmón en una sartén con un poco de aceite.',
                'Vaporizar las verduras y aliñar todo con limón.',
            ],
        },
        {
            id: 'dinner',
            name: 'Tortilla de espinacas y aguacate',
            type: 'CENA',
            calories: 520,
            details: 'Ligera y rica en grasas saludables',
            ingredients: [
                '2 Huevos',
                '50g Espinacas baby',
                '1/2 Aguacate',
                '1cda Aceite de oliva',
                'Sal y pimienta',
            ],
            steps: [
                'Saltear las espinacas con un poco de aceite.',
                'Batir los huevos y añadir a la sartén.',
                'Servir con el aguacate en rodajas encima.',
            ],
        },
    ],
};

export default function MenuDetailScreen({ navigation, route }) {
    const [addedMeals, setAddedMeals] = useState(() => new Set());

    // Si params.menu no trae shape completo (viene del preview de 3.8b), usar mock.
    const paramsMenu = route?.params?.menu;
    const hasFullDetail = Array.isArray(paramsMenu?.meals) && paramsMenu.meals[0]?.ingredients;
    const data = hasFullDetail ? paramsMenu : MENU_DETAIL;

    const handleAddToCart = (mealId) => {
        setAddedMeals((prev) => {
            const next = new Set(prev);
            next.add(mealId);
            return next;
        });
        Alert.alert('Éxito', 'Ingredientes añadidos a tu lista de la compra.');
    };

    const handleAddToPlan = () => {
        Alert.alert('Planificado', 'Este menú se ha añadido a tu planificación semanal.');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Detalles" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Cabecera de la receta */}
                <View style={styles.recipeHeader}>
                    <View style={styles.authorBadge}>
                        <Ionicons
                            name={data.type === 'AI' ? 'sparkles' : 'person'}
                            size={14}
                            color={data.type === 'AI' ? colors.primary : colors.success}
                        />
                        <Text style={styles.authorText}>{data.author}</Text>
                    </View>
                    <Text style={styles.recipeTitle}>{data.title}</Text>
                    <Text style={styles.recipeDesc}>{data.description}</Text>
                    <View style={styles.caloriesBadge}>
                        <Text style={styles.caloriesText}>{data.totalCalories}</Text>
                    </View>
                </View>

                <Text style={styles.sectionTitle}>El Plan</Text>

                {data.meals.map((meal) => {
                    const isAdded = addedMeals.has(meal.id);
                    return (
                        <View key={meal.id} style={styles.mealCard}>
                            <View style={styles.mealHeader}>
                                <View style={[styles.mealIcon, { backgroundColor: colors.primary + '15' }]}>
                                    <Ionicons name="restaurant" size={20} color={colors.primary} />
                                </View>
                                <View style={styles.mealHeaderText}>
                                    <Text style={styles.mealType}>{meal.type}</Text>
                                    <Text style={styles.mealName}>{meal.name}</Text>
                                </View>
                                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                            </View>

                            <Text style={styles.mealDetail}>{meal.details}</Text>

                            <View style={styles.sectionDivider}>
                                <Text style={styles.sectionLabel}>Ingredientes</Text>
                            </View>
                            <View style={styles.ingredientsList}>
                                {meal.ingredients.map((ing, i) => (
                                    <View key={i} style={styles.ingredientRow}>
                                        <Ionicons name="checkmark-circle" size={14} color={colors.success} />
                                        <Text style={styles.ingredientText}>{ing}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.sectionDivider}>
                                <Text style={styles.sectionLabel}>Preparación</Text>
                            </View>
                            <View style={styles.stepsList}>
                                {meal.steps.map((step, i) => (
                                    <View key={i} style={styles.stepRow}>
                                        <Text style={styles.stepNumber}>{i + 1}.</Text>
                                        <Text style={styles.stepText}>{step}</Text>
                                    </View>
                                ))}
                            </View>

                            <View style={styles.actionRow}>
                                <TouchableOpacity
                                    style={[styles.actionBtn, isAdded && styles.actionBtnDisabled]}
                                    onPress={() => handleAddToCart(meal.id)}
                                    disabled={isAdded}
                                >
                                    <Ionicons
                                        name={isAdded ? 'checkmark' : 'cart-outline'}
                                        size={18}
                                        color={isAdded ? colors.success : '#FFFFFF'}
                                    />
                                    <Text style={[styles.actionBtnText, isAdded && { color: colors.success }]}>
                                        {isAdded ? 'Añadido' : 'Lista de la compra'}
                                    </Text>
                                </TouchableOpacity>

                                <TouchableOpacity style={styles.planBtn} onPress={handleAddToPlan}>
                                    <Text style={styles.planBtnText}>Añadir al plan</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    );
                })}

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
    recipeHeader: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        borderWidth: 1,
        borderColor: colors.separator,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    authorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary + '10',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.primary,
    },
    authorText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        marginLeft: 4,
    },
    recipeTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    recipeDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
        marginBottom: spacing.md,
    },
    caloriesBadge: {
        backgroundColor: colors.successBg,
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    caloriesText: {
        color: colors.success,
        fontWeight: '700',
        fontSize: 14,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
    },
    mealCard: {
        backgroundColor: colors.card,
        borderRadius: 16,
        padding: spacing.md,
        marginBottom: spacing.md,
        borderWidth: 1,
        borderColor: colors.separator,
    },
    mealHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    mealIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    mealHeaderText: {
        flex: 1,
    },
    mealType: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
    },
    mealName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    mealCalories: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textSecondary,
        marginLeft: spacing.sm,
    },
    mealDetail: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        marginBottom: spacing.md,
    },
    sectionDivider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    ingredientsList: {
        marginBottom: spacing.md,
    },
    ingredientRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ingredientText: {
        fontSize: 14,
        color: colors.textSecondary,
        marginLeft: 8,
        flex: 1,
    },
    stepsList: {
        marginBottom: spacing.lg,
    },
    stepRow: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        width: 24,
    },
    stepText: {
        fontSize: 14,
        color: colors.textSecondary,
        flex: 1,
        lineHeight: 20,
    },
    actionRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginTop: spacing.sm,
    },
    actionBtn: {
        flex: 1,
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    actionBtnDisabled: {
        backgroundColor: colors.successBg,
        borderWidth: 1,
        borderColor: colors.success,
    },
    actionBtnText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
    planBtn: {
        flex: 1,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.separator,
        paddingVertical: 12,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    planBtnText: {
        color: colors.text,
        fontSize: 15,
        fontWeight: '600',
    },
});
