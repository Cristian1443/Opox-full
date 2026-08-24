// Bloque 3 · Salud — Pantalla 3.8 · Alimentación (home)
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

// Colores confirmados contra Figma (frame ALIMENTACION, Bloque 3) sin
// equivalente exacto en theme.js. El gris del tab inactivo es distinto al
// morado @50% que usan otros segmented controls del sistema.
const FIGMA = {
    separator: 'rgba(65,41,80,0.5)',
    textNote: '#343A3D',
    tabInactive: 'rgba(52,58,61,0.5)',
};

function CheckMarkIcon({ size = 16, color = colors.white }) {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24">
            <Path d="M4 13l5 5L20 6" stroke={color} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
    );
}

// Alimentos que potencian la memoria (mock hasta backend real).
const MEMORY_BOOSTERS = [
    { id: '1', name: 'Pescado azul', note: 'Omega-3 · función cognitiva' },
    { id: '2', name: 'Arándanos', note: 'Antioxidantes · memoria' },
    { id: '3', name: 'Frutos secos', note: 'Vitamina E · concentración' },
    { id: '4', name: 'Chocolate negro', note: 'Flavonoides · foco' },
];

export default function FoodHomeScreen({ navigation }) {
    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="Alimentación" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                {/* Tabs: Alimentos es esta misma pantalla, Menús navega a 3.8b */}
                <View style={styles.tabsRow}>
                    <View style={styles.tabActive}>
                        <Text style={styles.tabActiveText}>Alimentos</Text>
                    </View>
                    <TouchableOpacity
                        style={styles.tabInactive}
                        activeOpacity={0.7}
                        onPress={() => navigation.navigate('Menus')}
                    >
                        <Text style={styles.tabInactiveText}>Menús</Text>
                    </TouchableOpacity>
                </View>

                <Text style={styles.sectionHeader}>POTENCIAN LA MEMORIA</Text>

                <View style={styles.foodsList}>
                    {MEMORY_BOOSTERS.map((food, index) => (
                        <View key={food.id} style={[styles.foodRow, index > 0 && styles.foodRowSeparator]}>
                            <View style={styles.badge}>
                                <CheckMarkIcon />
                            </View>
                            <View style={styles.foodTextWrap}>
                                <Text style={styles.foodName}>{food.name}</Text>
                                <Text style={styles.foodNote}>{food.note}</Text>
                            </View>
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
        backgroundColor: colors.white,
    },
    scrollContent: {
        paddingHorizontal: spacing.md,
        paddingBottom: spacing.md,
    },
    tabsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    tabActive: {
        borderWidth: 1.3,
        borderColor: colors.textDark,
        borderRadius: 9.8,
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    tabActiveText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15.5,
        color: colors.textDark,
    },
    tabInactive: {
        paddingHorizontal: 20,
        paddingVertical: 8,
    },
    tabInactiveText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15.5,
        color: FIGMA.tabInactive,
    },
    sectionHeader: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
        marginBottom: 4,
    },
    foodsList: {
        marginBottom: 8,
    },
    foodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
    },
    foodRowSeparator: {
        borderTopWidth: 0.4,
        borderTopColor: FIGMA.separator,
    },
    badge: {
        width: 29,
        height: 29,
        borderRadius: 8,
        backgroundColor: colors.ctaGreen,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 14,
    },
    foodTextWrap: {
        flex: 1,
    },
    foodName: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 16,
        color: colors.textDark,
    },
    foodNote: {
        marginTop: 2,
        fontFamily: 'Poppins-Regular',
        fontSize: 9,
        color: FIGMA.textNote,
    },
});
