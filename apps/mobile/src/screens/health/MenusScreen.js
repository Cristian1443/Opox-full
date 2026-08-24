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
import { colors, spacing } from '../../theme';
import HealthScreenHeader from '../../components/HealthScreenHeader';

// Colores confirmados contra Figma (frame MENUS EQUILIBRADOS, Bloque 3)
// sin equivalente exacto en theme.js. El gris del tab inactivo es el mismo
// que en AlimentacionScreen (no es el morado-muted de otros controles).
const FIGMA = {
    tabInactive: 'rgba(52,58,61,0.5)',
    cardBorderNormal: 'rgba(65,41,80,0.3)',
    textBody: 'rgba(52,58,61,0.5)',
};

// El Figma solo muestra 3 tabs (Todos/Concentración/Energía) — "Día de
// examen" es un filtro real que ya existía en el código, se mantiene con
// el mismo lenguaje visual del resto de tabs.
const FILTERS = ['Todos', 'Concentración', 'Energía', 'Día de examen'];

// bodyLines: mismo bloque de texto que en Figma (comidas o info del
// dietista, una línea por elemento, unidas con salto de línea al pintar).
const MENUS_DATA = [
    {
        id: 'm1',
        title: 'Día de concentración máxima',
        badgeLabel: 'IA',
        highlighted: true,
        bodyLines: [
            'Desayuno · Avena con arándanos y nueces',
            'Comida · Salmón, quinoa y verduras',
            'Cena · Tortilla y aguacate',
        ],
        filterKey: 'Concentración',
    },
    {
        id: 'm2',
        title: 'Energía sostenida',
        badgeLabel: 'Dietista',
        highlighted: false,
        bodyLines: ['Por Laura M., dietista col. nº 1234'],
        filterKey: 'Energía',
    },
    {
        id: 'm3',
        title: 'Recuperación post-examen',
        badgeLabel: 'Dietista',
        highlighted: false,
        bodyLines: ['Por Carlos R., dietista col. nº 5678'],
        filterKey: 'Día de examen',
    },
];

function MenuCardItem({ menu, onViewRecipe }) {
    return (
        <View style={[styles.card, menu.highlighted ? styles.cardHighlighted : styles.cardNormal]}>
            <View style={styles.cardHeaderRow}>
                <Text style={styles.cardTitle}>{menu.title}</Text>
                <Text style={styles.cardBadge}>{menu.badgeLabel}</Text>
            </View>
            <Text style={styles.cardBody}>{menu.bodyLines.join('\n')}</Text>
            <TouchableOpacity activeOpacity={0.7} onPress={() => onViewRecipe?.(menu)}>
                <Text style={styles.cardLink}>Ver receta y lista de la compra ›</Text>
            </TouchableOpacity>
        </View>
    );
}

export default function MenusScreen({ navigation }) {
    const [activeFilter, setActiveFilter] = useState('Todos');

    const filteredMenus = activeFilter === 'Todos'
        ? MENUS_DATA
        : MENUS_DATA.filter((m) => m.filterKey === activeFilter);

    return (
        <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
            <HealthScreenHeader title="MENÚS" onBack={() => navigation.goBack()} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.tabsRow}>
                    {FILTERS.map((filter) => {
                        const active = filter === activeFilter;
                        return (
                            <TouchableOpacity
                                key={filter}
                                activeOpacity={0.7}
                                onPress={() => setActiveFilter(filter)}
                                style={active ? styles.tabActive : styles.tabInactive}
                            >
                                <Text style={active ? styles.tabActiveText : styles.tabInactiveText}>{filter}</Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                <View style={styles.menusList}>
                    {filteredMenus.map((menu) => (
                        <MenuCardItem
                            key={menu.id}
                            menu={menu}
                            onViewRecipe={(m) => navigation.navigate('MenuDetail', { menu: m })}
                        />
                    ))}
                </View>

                {filteredMenus.length === 0 && (
                    <Text style={styles.emptyText}>No hay menús para este filtro.</Text>
                )}

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
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 20,
    },
    tabActive: {
        borderWidth: 1.3,
        borderColor: colors.textDark,
        borderRadius: 9.8,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabActiveText: {
        fontFamily: 'Poppins-SemiBold',
        fontSize: 15.5,
        color: colors.textDark,
    },
    tabInactive: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    tabInactiveText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 15.5,
        color: FIGMA.tabInactive,
    },
    menusList: {
        gap: 16,
    },
    card: {
        padding: 16,
    },
    cardHighlighted: {
        borderWidth: 2.2,
        borderColor: colors.ctaGreen,
    },
    cardNormal: {
        borderWidth: 0.44,
        borderColor: FIGMA.cardBorderNormal,
    },
    cardHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cardTitle: {
        flex: 1,
        fontFamily: 'Poppins-SemiBold',
        fontSize: 14.7,
        color: colors.textDark,
    },
    cardBadge: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13.3,
        color: colors.purple,
        marginLeft: 8,
    },
    cardBody: {
        marginTop: 6,
        fontFamily: 'Poppins-Regular',
        fontSize: 11.5,
        lineHeight: 18,
        color: FIGMA.textBody,
    },
    cardLink: {
        marginTop: 10,
        fontFamily: 'Poppins-Medium',
        fontSize: 9.8,
        color: colors.accentOrange,
    },
    emptyText: {
        fontFamily: 'Poppins-Regular',
        fontSize: 13,
        color: FIGMA.textBody,
        textAlign: 'center',
        paddingVertical: spacing.xl,
    },
});
