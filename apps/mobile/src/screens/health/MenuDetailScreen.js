// Bloque 3 · Salud — Pantalla 3.8c · Detalle de menú / receta
import React from 'react';
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../../theme';

// Colores confirmados contra Figma (frame DETALLE MENÚ/RECETA, Bloque 3)
// sin equivalente exacto en theme.js.
const FIGMA = {
    textNote: 'rgba(52,58,61,0.5)',
    buttonsRowDivider: 'rgba(65,41,80,0.15)',
};

function ChevronLeftIcon({ size = 20, color = colors.textDark }) {
    const Svg = require('react-native-svg').default;
    const { Path } = require('react-native-svg');
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M15 5L8 12L15 19" stroke={color} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// ⚠️ Solo 2 comidas existen en el frame de Figma inspeccionado (Desayuno,
// Comida) — no hay sección "Cena", aunque el resumen en MenusScreen sí la
// lista para este menú. Documentado tal cual está en Figma; se deja
// data-driven para añadir "Cena" fácilmente en cuanto el diseño la incluya.
const MENU_DETAIL = {
    title: 'Día de concentración',
    type: 'AI',
    subtitle: 'Menú generado y revisado automáticamente',
    meals: [
        { id: 'desayuno', label: 'DESAYUNO', name: 'Avena con arándanos y nueces', note: '320 kcal · omega-3 + antioxidantes' },
        { id: 'comida', label: 'COMIDA', name: 'Salmón con quinoa y verduras', note: '540 kcal' },
    ],
};

export default function MenuDetailScreen({ navigation, route }) {
    // Si params.menu no trae el shape simple esperado, usar el mock.
    const paramsMenu = route?.params?.menu;
    const hasDetail = Array.isArray(paramsMenu?.meals) && paramsMenu.meals[0]?.label;
    const data = hasDetail ? paramsMenu : MENU_DETAIL;

    const handleAddToCart = () => {
        Alert.alert('Éxito', 'Ingredientes añadidos a tu lista de la compra.');
    };

    const handleAddToPlan = () => {
        Alert.alert('Planificado', 'Este menú se ha añadido a tu planificación semanal.');
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        activeOpacity={0.7}
                        onPress={() => navigation.goBack()}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                        <ChevronLeftIcon />
                    </TouchableOpacity>
                    <View style={styles.headerTextWrap}>
                        <Text style={styles.headerTitle}>{data.title}</Text>
                        <View style={styles.subtitleRow}>
                            <Text style={styles.headerSubtitle}>{data.subtitle}</Text>
                            {data.type === 'AI' && (
                                <View style={styles.aiBadge}>
                                    <Text style={styles.aiBadgeText}>IA</Text>
                                </View>
                            )}
                        </View>
                    </View>
                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.mealsList}>
                    {data.meals.map((meal) => (
                        <View key={meal.id} style={styles.mealSection}>
                            <Text style={styles.mealLabel}>{meal.label}</Text>
                            <Text style={styles.mealName}>{meal.name}</Text>
                            <Text style={styles.mealNote}>{meal.note}</Text>
                        </View>
                    ))}
                </View>
            </ScrollView>

            <View style={styles.buttonsRow}>
                <TouchableOpacity style={styles.filledButton} activeOpacity={0.85} onPress={handleAddToCart}>
                    <Text style={styles.filledButtonText}>Lista de la compra</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.outlineButton} activeOpacity={0.7} onPress={handleAddToPlan}>
                    <Text style={styles.outlineButtonText}>Añadir al plan</Text>
                </TouchableOpacity>
            </View>
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
        paddingBottom: 24,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 28,
    },
    backButton: {
        width: 36,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTextWrap: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 21,
        color: colors.textDark,
        textAlign: 'center',
    },
    subtitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 6,
    },
    headerSubtitle: {
        fontFamily: 'Poppins-Regular',
        fontSize: 10.5,
        color: 'rgba(65,41,80,0.5)',
    },
    headerSpacer: {
        width: 36,
        height: 36,
    },
    aiBadge: {
        borderWidth: 0.4,
        borderColor: colors.selectionBorder,
        borderRadius: 10,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    aiBadgeText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 9.8,
        color: colors.selectionBorder,
    },
    mealsList: {
        gap: 24,
    },
    mealSection: {
        gap: 2,
    },
    mealLabel: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    mealName: {
        marginTop: 2,
        fontFamily: 'Poppins-Light',
        fontSize: 16,
        lineHeight: 22.4,
        color: colors.textDark,
    },
    mealNote: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        lineHeight: 18.2,
        color: FIGMA.textNote,
    },
    buttonsRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 14,
        paddingHorizontal: spacing.md,
        paddingVertical: 16,
        borderTopWidth: 0.4,
        borderTopColor: FIGMA.buttonsRowDivider,
    },
    filledButton: {
        width: 189,
        height: 61,
        borderRadius: 14,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filledButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.white,
    },
    outlineButton: {
        width: 149,
        height: 61,
        borderRadius: 14,
        borderWidth: 0.44,
        borderColor: colors.textDark,
        alignItems: 'center',
        justifyContent: 'center',
    },
    outlineButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
});
