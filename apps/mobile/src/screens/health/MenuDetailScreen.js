// Bloque 3 · Salud — Pantalla 3.8c · Detalle de menú / receta
import React, { useState } from 'react';
import { localDateISO } from '../../utils/localDate';
import {
    View,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    Share,
    ActivityIndicator,
} from 'react-native';
import Text from '../../components/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import { planningApi } from '../../api';
import AlertCardModal from '../../components/AlertCardModal';
import { HeaderBackButton, HEADER_SIDE, HEADER_CONTENT_GAP } from '../../components/AppHeader';

// Colores confirmados contra Figma (frame DETALLE MENÚ/RECETA, Bloque 3)
// sin equivalente exacto en theme.js.
const FIGMA = {
    textNote: 'rgba(52,58,61,0.5)',
    buttonsRowDivider: 'rgba(65,41,80,0.15)',
};

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

    const [addingToPlan, setAddingToPlan] = useState(false);
    const [feedback, setFeedback] = useState(null); // 'success' | 'error' | null

    const handleAddToCart = async () => {
        // Genera la lista de ingredientes/comidas y la comparte vía Share nativo.
        const lines = data.meals.map((m) => `• ${m.label}: ${m.name}${m.note ? ` (${m.note})` : ''}`);
        const message = `🥗 ${data.title}\n\n${lines.join('\n')}`;
        try {
            await Share.share({ message, title: data.title });
        } catch {
            // El usuario canceló el share — no es un error.
        }
    };

    const handleAddToPlan = async () => {
        if (addingToPlan) return;
        setAddingToPlan(true);
        try {
            const today = localDateISO(); // YYYY-MM-DD en TZ local
            const subtitle = data.meals.map((m) => m.name).join(' · ');
            const res = await planningApi.createTask({
                taskDate: today,
                title: `🥗 ${data.title}`,
                subtitle: subtitle.slice(0, 160),
                kind: 'other',
            });
            if (res?.error) throw new Error(res.error);
            setFeedback('success');
        } catch {
            setFeedback('error');
        } finally {
            setAddingToPlan(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <HeaderBackButton onPress={() => navigation.goBack()} />
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
                <TouchableOpacity
                    style={[styles.outlineButton, addingToPlan && styles.outlineButtonDisabled]}
                    activeOpacity={0.7}
                    onPress={handleAddToPlan}
                    disabled={addingToPlan}
                >
                    {addingToPlan
                        ? <ActivityIndicator size="small" color={colors.textDark} />
                        : <Text style={styles.outlineButtonText}>Añadir al plan</Text>
                    }
                </TouchableOpacity>
            </View>

            <AlertCardModal
                visible={feedback === 'success'}
                iconBg="transparent"
                iconSize={64}
                icon={<Ionicons name="checkmark-circle" size={56} color={colors.ctaGreen} />}
                title="¡Añadido!"
                description="El menú está en tu plan de hoy."
                primaryLabel="OK"
                primaryColor={colors.ctaGreen}
                onPrimaryPress={() => setFeedback(null)}
            />
            <AlertCardModal
                visible={feedback === 'error'}
                iconBg="transparent"
                iconSize={64}
                icon={<Ionicons name="close-circle" size={56} color={colors.statRed} />}
                title="Error"
                description="No se pudo añadir al plan. Inténtalo de nuevo."
                primaryLabel="OK"
                primaryColor={colors.statRed}
                onPrimaryPress={() => setFeedback(null)}
            />
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
    // Mismas medidas que AppHeader; a mano por el badge "IA" junto al subtítulo.
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.sm,
        marginBottom: HEADER_CONTENT_GAP,
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
        width: HEADER_SIDE,
        height: HEADER_SIDE,
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
    outlineButtonDisabled: {
        opacity: 0.6,
    },
    outlineButtonText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
});
